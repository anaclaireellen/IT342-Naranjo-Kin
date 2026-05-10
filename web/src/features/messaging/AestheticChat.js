import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Search,
  MessageSquare,
  UserPlus,
  X,
  Smile,
  ChevronRight,
  User,
  ShieldCheck,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../shared/lib/supabaseClient';
import { fetchProfilesByUsernames, getCachedProfileByUsername, getStoredProfile } from '../profile/profileHelpers';
import { appTheme } from '../../shared/theme';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import { createDealMessageContent, formatDealPreview, getDealKey, parseDealMessage } from './dealMessages';
import { SearchStrategies } from './searchStrategies';

const AestheticChat = ({ colors, userName, initialRecipient = '', requestContext = {} }) => {
  const [selected, setSelected] = useState(null);
  const [typedMessage, setTypedMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [processingDealKey, setProcessingDealKey] = useState('');
  const [onlineUsers, setOnlineUsers] = useState({});
  const [showDeleteConversationDialog, setShowDeleteConversationDialog] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [showDealConfirmedDialog, setShowDealConfirmedDialog] = useState(false);
  const scrollRef = useRef(null);
  const { profilePic: activeProfilePic } = getStoredProfile();
  const currentUserProfile = getStoredProfile();
  const activeRequestId = requestContext.requestId || '';
  const activeRequestNeed = requestContext.requestNeed || '';
  const activeRequestOwner = requestContext.requestOwner || initialRecipient || '';

  const buildContact = (name, preview = 'Start a conversation', avatarPic = '', attentionLabel = '') => ({
    id: name,
    name,
    initial: name?.[0]?.toUpperCase() || '?',
    preview,
    avatarPic,
    attentionLabel,
  });

  const getDisplayNameLabel = (username) => {
    if (!username) return 'User';
    if (username === userName) {
      return currentUserProfile.displayName || currentUserProfile.greetingName || username;
    }

    const profile = profileMap[username] || getCachedProfileByUsername(username) || {};
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    return fullName || profile.firstName || username;
  };

  const loadProfiles = async (names) => {
    try {
      const nextProfiles = await fetchProfilesByUsernames(names);
      setProfileMap((current) => ({ ...current, ...nextProfiles }));
      setContacts((current) => current.map((contact) => ({
        ...contact,
        avatarPic: nextProfiles[contact.name]?.profilePic || contact.avatarPic || '',
      })));
      setSelected((current) => {
        if (!current?.name) return current;
        return {
          ...current,
          avatarPic: nextProfiles[current.name]?.profilePic || current.avatarPic || '',
        };
      });
    } catch (error) {
      console.error('Could not load chat profiles', error);
    }
  };

  const queryContacts = async () => {
    let response = await supabase
      .from('messages')
      .select('sender_username, receiver_username, content, created_at, sender_profile_pic')
      .or(`sender_username.eq.${userName},receiver_username.eq.${userName}`)
      .order('created_at', { ascending: false });

    const missingAvatarColumn = response.error?.message?.toLowerCase().includes('sender_profile_pic')
      || response.error?.details?.toLowerCase().includes('sender_profile_pic')
      || response.error?.hint?.toLowerCase().includes('sender_profile_pic');

    if (missingAvatarColumn) {
      response = await supabase
        .from('messages')
        .select('sender_username, receiver_username, content, created_at')
        .or(`sender_username.eq.${userName},receiver_username.eq.${userName}`)
        .order('created_at', { ascending: false });
    }

    return response;
  };

  const fetchContacts = async () => {
    const { data, error } = await queryContacts();

    if (error) {
      console.error('Could not load chat contacts', error);
      return;
    }

    const seen = new Set();
    const nextContacts = [];

    (data || []).forEach((entry) => {
      const contactName = entry.sender_username === userName
        ? entry.receiver_username
        : entry.sender_username;

      if (!contactName || seen.has(contactName)) return;
      seen.add(contactName);
      const latestDeal = parseDealMessage(entry.content);
      const isIncoming = entry.sender_username === contactName;
      const attentionLabel = latestDeal?.type === 'deal_request' && latestDeal.confirmer === userName && isIncoming
        ? 'Borrower confirm'
        : isIncoming
          ? 'Current message'
          : '';

      nextContacts.push(buildContact(
        contactName,
        formatDealPreview(entry.content) || 'Start a conversation',
        entry.sender_username === contactName ? entry.sender_profile_pic || '' : '',
        attentionLabel
      ));
    });

    if (initialRecipient && initialRecipient !== userName && !seen.has(initialRecipient)) {
      nextContacts.unshift(buildContact(initialRecipient));
    }

    setContacts(nextContacts);
    setProfileMap((current) => {
      const next = { ...current };
      nextContacts.forEach((contact) => {
        const cachedProfile = getCachedProfileByUsername(contact.name);
        if (cachedProfile?.profilePic && !next[contact.name]?.profilePic) {
          next[contact.name] = { ...(next[contact.name] || {}), username: contact.name, profilePic: cachedProfile.profilePic };
        }
      });
      return next;
    });
    loadProfiles(nextContacts.map((contact) => contact.name));
  };

  const fetchMessages = async (contactName) => {
    if (!contactName) {
      setMessages([]);
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_username.eq.${userName},receiver_username.eq.${contactName}),and(sender_username.eq.${contactName},receiver_username.eq.${userName})`)
      .order('created_at', { ascending: true });

    if (!error) {
      setMessages(data || []);
      setProfileMap((current) => {
        const next = { ...current };
        [contactName, userName, ...(data || []).map((message) => message.sender_username)].forEach((name) => {
          const cachedProfile = getCachedProfileByUsername(name);
          if (cachedProfile?.profilePic && !next[name]?.profilePic) {
            next[name] = { ...(next[name] || {}), username: name, profilePic: cachedProfile.profilePic };
          }
        });
        return next;
      });
      loadProfiles([contactName, userName, ...(data || []).map((message) => message.sender_username)]);
      setSelected((current) => {
        if (!current || current.name !== contactName) return current;
        const rowPic = (data || []).find((message) => message.sender_username === contactName)?.sender_profile_pic || '';
        const cachedPic = getCachedProfileByUsername(contactName)?.profilePic || '';
        return { ...current, avatarPic: current.avatarPic || rowPic || cachedPic || '' };
      });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [userName, initialRecipient]);

  useEffect(() => {
    if (!userName) return undefined;

    const presenceChannel = supabase.channel('kin-online-status', {
      config: { presence: { key: userName } },
    });

    const syncPresence = () => {
      const state = presenceChannel.presenceState();
      const nextOnlineUsers = Object.keys(state).reduce((acc, key) => {
        if (Array.isArray(state[key]) && state[key].length > 0) {
          acc[key] = true;
        }
        return acc;
      }, {});
      setOnlineUsers(nextOnlineUsers);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userName,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [userName]);

  useEffect(() => {
    if (!selected && initialRecipient && initialRecipient !== userName) {
      setSelected(buildContact(initialRecipient));
    }
  }, [initialRecipient, selected, userName]);

  useEffect(() => {
    fetchMessages(selected?.name);

    if (!selected?.name) return undefined;

    const channel = supabase
      .channel(`messages:${userName}:${selected.name}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages(selected.name);
        fetchContacts();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selected?.name, userName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      return;
    }

    setSearchResults(SearchStrategies.byUsername(contacts, query));
  }, [contacts, searchQuery]);

  const latestDealMessage = [...messages]
    .reverse()
    .find((message) => {
      const deal = parseDealMessage(message.content);
      if (!deal) return false;
      if (!activeRequestId) return true;
      return String(deal.requestId || '') === String(activeRequestId);
    });

  const latestDeal = latestDealMessage ? parseDealMessage(latestDealMessage.content) : null;

  const insertMessage = async (content) => {
    const messagePayload = {
      content,
      sender_username: userName,
      receiver_username: selected.name,
    };
    const messagePayloadWithProfile = activeProfilePic ? { ...messagePayload, sender_profile_pic: activeProfilePic } : messagePayload;

    let { error } = await supabase.from('messages').insert([messagePayloadWithProfile]);
    const shouldRetryWithoutAvatar = error?.message?.toLowerCase().includes('sender_profile_pic')
      || error?.details?.toLowerCase().includes('sender_profile_pic')
      || error?.hint?.toLowerCase().includes('sender_profile_pic');

    if (shouldRetryWithoutAvatar) {
      ({ error } = await supabase.from('messages').insert([messagePayload]));
    }

    return error;
  };

  const handleSend = async () => {
    if (!typedMessage.trim() || !selected) return;

    const error = await insertMessage(typedMessage.trim());

    if (!error) {
      setTypedMessage("");
      fetchMessages(selected.name);
      fetchContacts();
      return;
    }

    console.error('Message send failed', error);
    alert('Could not send your message right now.');
  };

  const handleRequestDealConfirmation = async () => {
    if (!selected) return;

    const summaryInput = window.prompt('What deal should be confirmed?', latestDeal?.summary || activeRequestNeed || 'Borrowing deal');
    if (summaryInput === null) return;

    const summary = summaryInput.trim() || 'Borrowing deal';
    const error = await insertMessage(createDealMessageContent({
      type: 'deal_request',
      proposer: userName,
      confirmer: selected.name,
      summary,
      requestId: activeRequestId,
      requestOwner: activeRequestOwner,
      requestNeed: activeRequestNeed,
    }));

    if (error) {
      console.error('Deal request failed', error);
      alert('Could not send the deal confirmation request right now.');
      return;
    }

    setShowDealDialog(false);
    fetchMessages(selected.name);
    fetchContacts();
  };

  const handleConfirmDeal = async (deal) => {
    if (!selected || !deal) return;

    const dealKey = getDealKey(deal);
    setProcessingDealKey(dealKey);

    const error = await insertMessage(createDealMessageContent({
      type: 'deal_confirmed',
      proposer: deal.proposer,
      confirmer: deal.confirmer,
      summary: deal.summary,
      requestId: deal.requestId,
      requestOwner: deal.requestOwner,
      requestNeed: deal.requestNeed,
    }));

    setProcessingDealKey('');

    if (error) {
      console.error('Deal confirmation failed', error);
      alert('Could not confirm the deal right now.');
      return;
    }

    setShowDealConfirmedDialog(true);
    fetchMessages(selected.name);
    fetchContacts();
  };

  const handleDeleteConversation = async () => {
    if (!selected?.name || deletingConversation) return;

    const conversationUser = selected.name;
    setDeletingConversation(true);

    const { error } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_username.eq.${userName},receiver_username.eq.${conversationUser}),and(sender_username.eq.${conversationUser},receiver_username.eq.${userName})`);

    if (error) {
      console.error('Conversation delete failed', error);
      alert('Could not delete this conversation right now.');
      setDeletingConversation(false);
      return;
    }

    setContacts((current) => current.filter((contact) => contact.name !== conversationUser));
    setMessages([]);
    setSelected(null);
    setShowDeleteConversationDialog(false);
    setDeletingConversation(false);
    fetchContacts();
  };

  const isDealFlowAvailable = Boolean(activeRequestId && selected?.name && activeRequestOwner === selected.name);
  const isSelectedOnline = Boolean(selected?.name && onlineUsers[selected.name]);

  const modernStyles = {
    container: {
      display: 'flex',
      height: '100%',
      minHeight: 0,
      background: appTheme.card,
      borderRadius: '24px',
      overflow: 'hidden',
      border: `1px solid ${appTheme.border}`,
      boxShadow: appTheme.shadow
    },
    sidebar: {
      width: '340px',
      minHeight: 0,
      background: '#f8fafc',
      borderRight: `1px solid ${appTheme.border}`,
      display: 'flex',
      flexDirection: 'column'
    },
    avatar: (bg) => ({
      width: '46px',
      height: '46px',
      borderRadius: '14px',
      background: bg || colors.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      overflow: 'hidden',
      boxShadow: 'none'
    }),
    inputWrapper: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      background: '#FFFFFF',
      borderRadius: '14px',
      padding: '0 15px',
      height: '52px',
      border: `1px solid ${appTheme.border}`
    },
    inputField: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontSize: '14px',
      color: '#1E293B',
      padding: '0 10px'
    }
  };

  return (
    <div style={modernStyles.container}>
      <div style={modernStyles.sidebar}>
        <div style={{ padding: '28px 24px 22px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: appTheme.textSoft }}>Direct messages</p>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: appTheme.text }}>Messages</h2>
            </div>
            <button onClick={() => setIsSearching(!isSearching)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: colors.primary }}>
              {isSearching ? <X size={18} /> : <UserPlus size={20} />}
            </button>
          </div>

          <div style={modernStyles.inputWrapper}>
            <Search size={16} color="#94A3B8" />
            <input
              placeholder={isSearching ? "Search by username..." : "Search..."}
              value={isSearching ? searchQuery : ""}
              onChange={(e) => isSearching && setSearchQuery(e.target.value)}
              style={modernStyles.inputField}
            />
          </div>

          {isSearching && searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '126px', width: '292px', background: 'white', borderRadius: '14px', boxShadow: '0 16px 24px rgba(15,23,42,0.08)', zIndex: 10, overflow: 'hidden', border: `1px solid ${appTheme.border}` }}>
              {searchResults.map((contact) => (
                <div key={contact.id} onClick={() => { setSelected(contact); setIsSearching(false); }} style={{ padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #F8FAFC' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{getDisplayNameLabel(contact.name)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="kin-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          {contacts.map((contact) => (
            <div key={contact.id} onClick={() => setSelected(contact)} style={{ padding: '14px 22px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', background: selected?.name === contact.name ? 'linear-gradient(90deg, rgba(22,121,133,0.12) 0%, rgba(89,208,198,0.14) 100%)' : 'transparent', borderLeft: selected?.name === contact.name ? `2px solid ${colors.primary}` : '2px solid transparent' }}>
              <div style={modernStyles.avatar(contact.name === 'Admin Office' ? colors.primary : colors.accent)}>
                {(profileMap[contact.name]?.profilePic || contact.avatarPic || getCachedProfileByUsername(contact.name)?.profilePic) ? <img src={profileMap[contact.name]?.profilePic || contact.avatarPic || getCachedProfileByUsername(contact.name)?.profilePic} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : contact.initial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>{getDisplayNameLabel(contact.name)}</span>
                  {contact.attentionLabel && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '999px', background: '#eef2f7', color: appTheme.primary, fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: appTheme.primary }} />
                      {contact.attentionLabel}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: onlineUsers[contact.name] ? '#10B981' : '#CBD5E1', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '12px', color: appTheme.textSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.preview}</p>
                </div>
              </div>
              <ChevronRight size={16} color="#CBD5E1" />
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {selected ? (
          <>
            <header style={{ minHeight: '82px', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${appTheme.border}`, background: appTheme.card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={modernStyles.avatar(colors.primary)}>
                  {(profileMap[selected.name]?.profilePic || selected.avatarPic || getCachedProfileByUsername(selected.name)?.profilePic) ? <img src={profileMap[selected.name]?.profilePic || selected.avatarPic || getCachedProfileByUsername(selected.name)?.profilePic} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selected.name[0]}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', color: appTheme.text }}>{getDisplayNameLabel(selected.name)}</h4>
                  <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: isSelectedOnline ? '#10B981' : '#CBD5E1' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => isDealFlowAvailable && setShowDealDialog(true)}
                  disabled={!isDealFlowAvailable}
                  style={{ border: `1px solid ${appTheme.border}`, background: isDealFlowAvailable ? '#f8fafc' : '#f3f4f6', color: isDealFlowAvailable ? colors.primary : '#94A3B8', borderRadius: '12px', padding: '10px 14px', cursor: isDealFlowAvailable ? 'pointer' : 'default', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <ShieldCheck size={16} /> Ask borrower to confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConversationDialog(true)}
                  style={{ border: `1px solid ${appTheme.border}`, background: '#ffffff', color: '#b42318', borderRadius: '12px', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="kin-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 26px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((message, i) => {
                const isMine = message.sender_username === userName;
                const senderPic = profileMap[message.sender_username]?.profilePic || message.sender_profile_pic || getCachedProfileByUsername(message.sender_username)?.profilePic || '';
                const deal = parseDealMessage(message.content);
                const dealKey = getDealKey(deal);

                if (deal) {
                  const isIncomingConfirmationRequest = deal.type === 'deal_request' && deal.confirmer === userName;
                  const isConfirmed = deal.type === 'deal_confirmed';
                  const isBorrower = deal.confirmer === userName;

                  return (
                    <div key={i} style={{ width: '100%', display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '76%', background: '#f8fafc', border: `1px solid ${appTheme.border}`, borderRadius: '18px', padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: isConfirmed ? '#166534' : appTheme.primary }}>
                          <ShieldCheck size={16} />
                          <span style={{ fontWeight: '800', fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {isConfirmed ? 'Deal confirmed' : 'Deal confirmation'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 8px', color: '#0F172A', fontWeight: '700' }}>{deal.summary}</p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>
                          {isConfirmed
                            ? `${getDisplayNameLabel(deal.confirmer)} confirmed that this borrowing deal pushed through.`
                            : `${getDisplayNameLabel(deal.proposer)} is asking the borrower, ${getDisplayNameLabel(deal.confirmer)}, to confirm this borrowing deal.`}
                        </p>
                        {!isConfirmed && (
                          <p style={{ margin: '10px 0 0', color: isBorrower ? appTheme.primary : '#64748B', fontSize: '12px', lineHeight: 1.5, fontWeight: '700' }}>
                            {isBorrower
                              ? 'Borrower action needed: confirm here once the item is already in your hands.'
                              : 'Lender reminder: send this only when the item has already been lent to the borrower.'}
                          </p>
                        )}
                        {isIncomingConfirmationRequest && (
                          <button
                            type="button"
                            onClick={() => handleConfirmDeal(deal)}
                            disabled={processingDealKey === dealKey}
                            style={{ marginTop: '14px', border: 'none', background: appTheme.button, color: 'white', borderRadius: '12px', padding: '10px 14px', fontWeight: '700', cursor: processingDealKey === dealKey ? 'default' : 'pointer' }}
                          >
                            {processingDealKey === dealKey ? 'Confirming...' : 'Borrower confirm deal'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={i} style={{ width: '100%', display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', maxWidth: '72%', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '12px', overflow: 'hidden', background: '#E2E8F0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {senderPic ? <img src={senderPic} alt={getDisplayNameLabel(message.sender_username)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={14} color="#475569" />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px', padding: '0 4px' }}>{getDisplayNameLabel(message.sender_username)}</span>
                        <div style={{
                          background: isMine ? appTheme.button : '#f8fafc',
                          color: isMine ? 'white' : '#1E293B',
                          padding: '12px 16px',
                          borderRadius: isMine ? '18px 18px 8px 18px' : '18px 18px 18px 8px',
                          fontSize: '14px',
                          lineHeight: 1.55,
                          border: isMine ? 'none' : `1px solid ${appTheme.border}`,
                        }}>
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderTop: `1px solid ${appTheme.border}`, background: appTheme.card }}>
              <div style={modernStyles.inputWrapper}>
                <input
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Message..."
                  style={modernStyles.inputField}
                />
                <Smile size={18} color="#94A3B8" style={{ cursor: 'pointer' }} />
              </div>

              <button
                onClick={handleSend}
                style={{
                  background: appTheme.button,
                  color: 'white',
                  border: 'none',
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: appTheme.textSoft, background: '#ffffff' }}>
            <div style={{ width: '84px', height: '84px', borderRadius: '24px', background: '#f8fafc', border: `1px solid ${appTheme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={34} color={appTheme.primary} />
            </div>
            <p style={{ marginTop: '18px', fontWeight: '700', fontSize: '20px', color: appTheme.text }}>Select a conversation</p>
            <p style={{ margin: '8px 0 0', maxWidth: '320px', textAlign: 'center', lineHeight: 1.7 }}>Choose a contact to view the thread.</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDealDialog}
        title="Ask borrower to confirm?"
        message={selected ? `This sends a borrower confirmation request to ${getDisplayNameLabel(selected.name)} for "${activeRequestNeed || 'this request'}". Use it only after the item has already been lent.` : ''}
        confirmLabel="Send request"
        cancelLabel="Cancel"
        onConfirm={handleRequestDealConfirmation}
        onCancel={() => setShowDealDialog(false)}
        tone="default"
        icon={ShieldCheck}
      />

      <ConfirmDialog
        open={showDeleteConversationDialog}
        title="Delete this conversation?"
        message={selected ? `All messages between you and ${getDisplayNameLabel(selected.name)} will be removed from this inbox.` : ''}
        confirmLabel="Delete conversation"
        cancelLabel="Keep conversation"
        onConfirm={handleDeleteConversation}
        onCancel={() => !deletingConversation && setShowDeleteConversationDialog(false)}
        tone="danger"
        icon={Trash2}
        busy={deletingConversation}
      />

      <ConfirmDialog
        open={showDealConfirmedDialog}
        title="Borrower confirmed"
        message={selected ? `${getDisplayNameLabel(selected.name)} has confirmed this borrowing deal. The request can now be cleared from the hub by the borrower.` : 'The borrower has confirmed this deal.'}
        confirmLabel="Nice"
        cancelLabel="Close"
        onConfirm={() => setShowDealConfirmedDialog(false)}
        onCancel={() => setShowDealConfirmedDialog(false)}
        tone="success"
        icon={CheckCircle2}
      />
    </div>
  );
};

export default AestheticChat;
