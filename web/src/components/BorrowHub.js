import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Trash2, Clock3, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { fetchProfilesByUsernames, getCachedProfileByUsername, getStoredProfile } from '../utils/profileHelpers';
import { appTheme } from '../theme';
import ConfirmDialog from './ConfirmDialog';
import { getCounterparty, getDealKey, getRequestKey, isUserInDeal, parseDealMessage } from '../utils/dealMessages';

const BorrowHub = () => {
  const navigate = useNavigate();
  const [communityRequests, setCommunityRequests] = useState([]);
  const [requestStatuses, setRequestStatuses] = useState({});
  const [messageNotifications, setMessageNotifications] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [requestPendingDelete, setRequestPendingDelete] = useState(null);
  const { userName: activeUser, profilePic: activeProfilePic } = getStoredProfile();

  const colors = {
    bg: '#F8FAFC',
    primary: appTheme.primary,
    accent: appTheme.accent,
    white: '#FFFFFF',
    text: '#334155'
  };
  const getFirstNameLabel = (username) => {
    if (!username) return 'User';
    if (username === activeUser) {
      return getStoredProfile().firstName || username;
    }

    const profile = profiles[username] || getCachedProfileByUsername(username) || {};
    return profile.firstName || username;
  };

  const parseRequestMeta = (value) => {
    const raw = (value || '').trim();
    if (!raw) {
      return { extraDetails: '', tokenOfThanks: '' };
    }

    const parts = raw.split('|').map((part) => part.trim()).filter(Boolean);
    let extraDetails = '';
    let tokenOfThanks = '';

    parts.forEach((part) => {
      if (/^details:/i.test(part)) {
        extraDetails = part.replace(/^details:\s*/i, '').trim();
        return;
      }

      if (/^thanks:/i.test(part)) {
        tokenOfThanks = part.replace(/^thanks:\s*/i, '').trim();
        return;
      }

      if (!extraDetails) {
        extraDetails = part;
        return;
      }

      if (!tokenOfThanks) {
        tokenOfThanks = part;
      }
    });

    if (!extraDetails && !tokenOfThanks && raw) {
      tokenOfThanks = raw;
    }

    return { extraDetails, tokenOfThanks };
  };

  const loadData = async () => {
    const [{ data, error }, { data: messageData, error: messageError }] = await Promise.all([
      supabase.from('Kin').select('*').order('created_at', { ascending: false }),
      supabase
        .from('messages')
        .select('content, created_at, sender_username, receiver_username')
        .order('created_at', { ascending: false }),
    ]);
    if (error) return;
    if (messageError) {
      console.error('Could not load deal updates', messageError);
    }

    const requests = data || [];

    const latestDeals = new Map();
    const latestIncomingMessages = new Map();
    const nextRequestStatuses = {};
    (messageData || []).forEach((entry) => {
      const deal = parseDealMessage(entry.content);

      if (!deal && entry.receiver_username === activeUser) {
        const key = entry.sender_username;
        const currentMessage = latestIncomingMessages.get(key);
        if (!currentMessage || new Date(entry.created_at) > new Date(currentMessage.created_at)) {
          latestIncomingMessages.set(key, entry);
        }
      }

      if (!deal?.requestId) return;

      const requestKey = getRequestKey(deal);
      const currentRequestStatus = nextRequestStatuses[requestKey];
      if (!currentRequestStatus || new Date(entry.created_at) > new Date(currentRequestStatus.created_at)) {
        nextRequestStatuses[requestKey] = { ...deal, created_at: entry.created_at };
      }

      if (!isUserInDeal(deal, activeUser)) return;

      const key = getDealKey(deal);
      const current = latestDeals.get(key);
      if (!current || new Date(entry.created_at) > new Date(current.created_at)) {
        latestDeals.set(key, { ...deal, created_at: entry.created_at });
      }
    });

    setMessageNotifications(
      [...latestIncomingMessages.values()]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
    );
    setRequestStatuses(nextRequestStatuses);
    setCommunityRequests(
      [...requests].sort((a, b) => {
        const aLocked = Boolean(nextRequestStatuses[String(a.id)]);
        const bLocked = Boolean(nextRequestStatuses[String(b.id)]);
        if (aLocked !== bLocked) {
          return aLocked ? 1 : -1;
        }
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      })
    );

    try {
      const nextProfiles = await fetchProfilesByUsernames([
        ...requests.map((req) => req.username),
        ...[...latestDeals.values()].map((deal) => getCounterparty(deal, activeUser)),
        ...[...latestIncomingMessages.keys()],
        ...Object.values(nextRequestStatuses).flatMap((deal) => [deal.proposer, deal.confirmer, deal.requestOwner]),
      ]);
      setProfiles((current) => ({ ...current, ...nextProfiles }));
    } catch (profileError) {
      console.error('Could not load profiles', profileError);
    }
  };

  useEffect(() => {
    loadData();
    const sub = supabase.channel('public:Kin').on('postgres_changes', { event: '*', schema: 'public', table: 'Kin' }, loadData).subscribe();
    const messageSub = supabase.channel('public:messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadData).subscribe();
    return () => {
      supabase.removeChannel(sub);
      supabase.removeChannel(messageSub);
    };
  }, [activeUser]);

  const handleLendHand = async (req) => {
    if (!activeUser || req.username === activeUser) return;

    const { extraDetails } = parseRequestMeta(req.gratitude);
    const starterMessage = `Hey ${getFirstNameLabel(req.username)}! I saw your BorrowHub post for ${req.need}${req.duration ? ` (${req.duration})` : ''}${extraDetails ? `. ${extraDetails}` : ''} I can lend a hand if you still need it.`;
    const messagePayload = {
      content: starterMessage,
      sender_username: activeUser,
      receiver_username: req.username,
    };
    const messagePayloadWithProfile = activeProfilePic ? { ...messagePayload, sender_profile_pic: activeProfilePic } : messagePayload;

    let { error } = await supabase.from('messages').insert([messagePayloadWithProfile]);
    const shouldRetryWithoutAvatar = error?.message?.toLowerCase().includes('sender_profile_pic')
      || error?.details?.toLowerCase().includes('sender_profile_pic')
      || error?.hint?.toLowerCase().includes('sender_profile_pic');

    if (shouldRetryWithoutAvatar) {
      ({ error } = await supabase.from('messages').insert([messagePayload]));
    }

    if (error) {
      alert('Could not send your message right now.');
      console.error('BorrowHub starter message failed', error);
      return;
    }

    navigate(`/dashboard?tab=messages&user=${encodeURIComponent(req.username)}&requestId=${encodeURIComponent(req.id)}&requestNeed=${encodeURIComponent(req.need || '')}&requestOwner=${encodeURIComponent(req.username)}`);
  };

  const handleDeleteRequest = async () => {
    if (!requestPendingDelete?.id || requestPendingDelete.username !== activeUser || deletingId === requestPendingDelete.id) return;

    const targetRequest = requestPendingDelete;
    setDeletingId(targetRequest.id);

    const previousRequests = communityRequests;
    setCommunityRequests((current) => current.filter((entry) => entry.id !== targetRequest.id));

    const { error } = await supabase
      .from('Kin')
      .delete()
      .eq('id', targetRequest.id)
      .eq('username', activeUser);

    if (error) {
      console.error('Could not delete request', error);
      setCommunityRequests(previousRequests);
      alert('Could not delete your post right now.');
    }

    setDeletingId(null);
    setRequestPendingDelete(null);
  };

  return (
    <div className="kin-scrollbar" style={{ background: appTheme.background, minHeight: '100vh', padding: '2rem', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: `1px solid ${appTheme.border}`, color: colors.primary, fontWeight: '700', marginBottom: '1.5rem', cursor: 'pointer', padding: '12px 16px', borderRadius: '14px' }}>
          <ArrowLeft size={20} /> Dashboard
        </button>

        <div style={{ background: appTheme.card, borderRadius: '24px', padding: '24px', color: appTheme.text, marginBottom: '20px', boxShadow: appTheme.shadow, border: `1px solid ${appTheme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '12px', color: appTheme.textSoft, fontWeight: '700' }}>Borrow hub</p>
              <h1 style={{ fontSize: '2.3rem', fontWeight: '700', margin: 0 }}>Current requests</h1>
              <p style={{ margin: '12px 0 0', maxWidth: '620px', lineHeight: 1.7, color: appTheme.textMuted }}>Review active requests and open a direct conversation when needed.</p>
            </div>
            <div style={{ minWidth: '200px', padding: '16px 18px', borderRadius: '16px', background: '#f8fafc', border: `1px solid ${appTheme.border}` }}>
              <div style={{ fontSize: '12px', color: appTheme.textSoft, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '700' }}>Requests</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: appTheme.text, marginTop: '6px' }}>{communityRequests.length}</div>
            </div>
          </div>
        </div>

        {messageNotifications.length > 0 && (
          <div style={{ marginBottom: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {messageNotifications.slice(0, 4).map((entry) => (
                <button
                  key={`${entry.sender_username}-${entry.created_at}`}
                  type="button"
                  onClick={() => navigate(`/dashboard?tab=messages&user=${encodeURIComponent(entry.sender_username)}`)}
                  style={{ border: `1px solid ${appTheme.border}`, background: '#ffffff', color: appTheme.text, borderRadius: '999px', padding: '10px 14px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: appTheme.primary }} />
                  {getFirstNameLabel(entry.sender_username)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {communityRequests.map((req) => {
            const isOwn = req.username === activeUser;
            const isDeleting = deletingId === req.id;
            const { extraDetails, tokenOfThanks } = parseRequestMeta(req.gratitude);
            const cachedProfile = getCachedProfileByUsername(req.username);
            const requestProfilePic = profiles[req.username]?.profilePic || req.profile_pic || cachedProfile?.profilePic || '';
            const requestStatus = requestStatuses[String(req.id)];
            const isDealInvolved = Boolean(requestStatus && isUserInDeal(requestStatus, activeUser));
            const isLocked = Boolean(requestStatus);
            const isConfirmed = requestStatus?.type === 'deal_confirmed';
            const counterparty = isDealInvolved ? getCounterparty(requestStatus, activeUser) : '';
            const canOpenDealChat = Boolean(requestStatus && isDealInvolved && counterparty);
            const canLend = !isOwn && (!isLocked || isDealInvolved);
            const buttonLabel = isOwn
              ? canOpenDealChat
                ? 'Open deal chat'
                : "Manage Post"
              : isLocked
                ? isDealInvolved
                  ? 'Open deal chat'
                  : 'Unavailable'
                : 'Lend a Hand';

            return (
              <div key={req.id} style={{ background: appTheme.card, padding: '24px', borderRadius: '22px', boxShadow: appTheme.shadowSoft, position: 'relative', border: `1px solid ${appTheme.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '18px', overflow: 'hidden', background: '#E2E8F0', border: '1px solid rgba(148,163,184,0.16)' }}>
                      {requestProfilePic ? <img src={requestProfilePic} alt={getFirstNameLabel(req.username)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><User size={20} color={colors.primary} /></div>}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: colors.text }}>{getFirstNameLabel(req.username)}</div>
                      <div style={{ fontSize: '12px', color: appTheme.textSoft, display: 'flex', alignItems: 'center', gap: '6px' }}><Clock3 size={12} />{requestStatus && !isDealInvolved ? 'Unavailable' : requestStatus ? 'Active deal' : 'Open request'}</div>
                    </div>
                  </div>
                  {isOwn && (
                    <button
                      type="button"
                      onClick={() => setRequestPendingDelete(req)}
                      disabled={isDeleting}
                      aria-label={`Delete request for ${req.need}`}
                      style={{
                        border: 'none',
                        background: isDeleting ? '#FFE4E6' : '#FFF1F2',
                        color: isDeleting ? '#FB7185' : '#F43F5E',
                        width: '36px',
                        height: '36px',
                        borderRadius: '12px',
                        cursor: isDeleting ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <h2 style={{ fontSize: '1.32rem', margin: '0 0 10px 0', color: colors.primary }}>{req.need}</h2>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', background: '#f8fafc', padding: '4px 12px', borderRadius: '20px', color: appTheme.textMuted, border: `1px solid ${appTheme.border}` }}>{req.duration}</span>
                  {!requestStatus && (
                    <span style={{ fontSize: '11px', background: '#eef2f7', padding: '5px 10px', borderRadius: '999px', color: appTheme.primary, fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Current
                    </span>
                  )}
                </div>

                {extraDetails && (
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', marginBottom: '12px', border: `1px solid ${appTheme.border}` }}>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: appTheme.textSoft, fontWeight: '700' }}>Details</p>
                    <p style={{ margin: 0, fontSize: '14px', color: appTheme.textMuted, fontWeight: '600', lineHeight: 1.6 }}>{extraDetails}</p>
                  </div>
                )}

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', marginBottom: '1.5rem', border: `1px solid ${appTheme.border}` }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: appTheme.textSoft, fontWeight: '700' }}>Thanks</p>
                  <p style={{ margin: 0, fontSize: '14px', color: appTheme.textMuted, fontWeight: '600', lineHeight: 1.6 }}>{tokenOfThanks || 'A kind favor in return'}</p>
                </div>

                <button
                  disabled={isOwn ? !canOpenDealChat : !canLend}
                  onClick={() => {
                    if (isOwn && canOpenDealChat) {
                      navigate(`/dashboard?tab=messages&user=${encodeURIComponent(counterparty)}&requestId=${encodeURIComponent(req.id)}&requestNeed=${encodeURIComponent(req.need || '')}&requestOwner=${encodeURIComponent(req.username)}`);
                      return;
                    }

                    if (!isOwn && canLend) {
                      handleLendHand(req);
                    }
                  }}
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: ((isOwn && !canOpenDealChat) || (!isOwn && !canLend)) ? '#e5e7eb' : appTheme.button, color: ((isOwn && !canOpenDealChat) || (!isOwn && !canLend)) ? '#94A3B8' : 'white', fontWeight: '700', cursor: ((isOwn && !canOpenDealChat) || (!isOwn && !canLend)) ? 'default' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <MessageCircle size={18} /> {buttonLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(requestPendingDelete)}
        title="Delete this request?"
        message={requestPendingDelete ? `Your post for "${requestPendingDelete.need}" will be removed from the hub.` : ''}
        confirmLabel="Delete post"
        cancelLabel="Keep post"
        onConfirm={handleDeleteRequest}
        onCancel={() => !deletingId && setRequestPendingDelete(null)}
        tone="danger"
        icon={Trash2}
        busy={Boolean(requestPendingDelete && deletingId === requestPendingDelete.id)}
      />
    </div>
  );
};

export default BorrowHub;
