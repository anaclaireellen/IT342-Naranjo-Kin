import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Heart, X, Save, Clock3, PencilLine, MessageSquare, CircleAlert, Coffee } from 'lucide-react';
import { supabase } from '../../shared/lib/supabaseClient';
import { getStoredProfile } from '../profile/profileHelpers';
import { appTheme } from '../../shared/theme';

const StudentPanel = ({ alerts = { unreadMessages: 0, currentPosts: 0 } }) => {
  const navigate = useNavigate();
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [duration, setDuration] = useState("");
  const [additionalNote, setAdditionalNote] = useState("");
  const [gratitude, setGratitude] = useState("");

  const { userName: username, greetingName, displayName, profilePic } = getStoredProfile();

  const durationOptions = [
    { label: '1 class', value: 'One class period' },
    { label: 'Few hrs', value: 'A few hours' },
    { label: 'Today', value: 'Until end of day' },
    { label: 'Overnight', value: 'Overnight' },
    { label: 'This week', value: 'This week' },
  ];

  const handlePostRequest = async (e) => {
    e.preventDefault();

    const gratitudeSummary = [
      additionalNote.trim() ? `Details: ${additionalNote.trim()}` : '',
      gratitude.trim() ? `Thanks: ${gratitude.trim()}` : '',
    ].filter(Boolean).join(' | ');

    const payload = { username, need: itemName, duration, gratitude: gratitudeSummary };
    const payloadWithProfile = profilePic ? { ...payload, profile_pic: profilePic } : payload;

    let { error } = await supabase.from('Kin').insert([payloadWithProfile]);

    const shouldRetryWithoutAvatar = error?.message?.toLowerCase().includes('profile_pic')
      || error?.details?.toLowerCase().includes('profile_pic')
      || error?.hint?.toLowerCase().includes('profile_pic');

    if (shouldRetryWithoutAvatar) {
      ({ error } = await supabase.from('Kin').insert([payload]));
    }

    if (error) {
      console.error("Error posting to Supabase:", error.message);
      alert('Could not post your request right now.');
      return;
    }

    setShowBorrowModal(false);
    setItemName("");
    setDuration("");
    setAdditionalNote("");
    setGratitude("");
    navigate('/borrow');
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '14px',
    border: `1px solid ${appTheme.border}`,
    outline: 'none',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    background: '#FFFFFF',
    color: appTheme.text,
  };

  const textAreaStyle = {
    ...inputStyle,
    minHeight: '96px',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.55,
  };

  const sectionCardStyle = {
    background: '#ffffff',
    border: `1px solid ${appTheme.border}`,
    borderRadius: '20px',
    padding: '18px',
    boxShadow: appTheme.shadowSoft,
  };

  const actionCardStyle = {
    ...sectionCardStyle,
    cursor: 'pointer',
    minHeight: '220px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  const compactBadge = (count) => ({
    minWidth: '24px',
    height: '24px',
    padding: '0 8px',
    borderRadius: '999px',
    background: appTheme.primaryStrong,
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
  });

  return (
    <div style={{ background: 'transparent', minHeight: '100%', padding: '8px 0 24px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {showBorrowModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.36)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ background: appTheme.card, borderRadius: '24px', width: '100%', maxWidth: '620px', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 48px rgba(15, 23, 42, 0.14)', border: `1px solid ${appTheme.border}`, overflow: 'hidden' }} className="kin-scrollbar">
            <div style={{ padding: '24px', borderBottom: `1px solid ${appTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: appTheme.textSoft, fontWeight: '700' }}>Borrow request</p>
                <h2 style={{ margin: '8px 0 0', fontSize: '1.7rem', fontWeight: '700', lineHeight: 1.1, color: appTheme.text }}>Create request</h2>
                <p style={{ margin: '8px 0 0', lineHeight: 1.6, color: appTheme.textMuted }}>Provide only the details needed for someone to respond.</p>
              </div>
              <button className="kin-interactive-button" onClick={() => setShowBorrowModal(false)} style={{ border: `1px solid ${appTheme.border}`, background: '#fff', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', color: appTheme.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostRequest} style={{ width: '100%', textAlign: 'left', padding: '24px', boxSizing: 'border-box' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: '700', color: appTheme.primary, fontSize: '13px' }}>
                    <Package size={16} /> Item
                  </label>
                  <input className="borrow-request-field" required style={inputStyle} placeholder="Calculator, charger, umbrella" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: '700', color: appTheme.primary, fontSize: '13px' }}>
                    <Clock3 size={16} /> Duration
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {durationOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDuration(option.value)}
                        style={{
                          border: `1px solid ${duration === option.value ? '#94a3b8' : appTheme.border}`,
                          background: duration === option.value ? '#eef2f7' : '#fff',
                          color: duration === option.value ? appTheme.text : appTheme.textMuted,
                          padding: '10px 14px',
                          borderRadius: '999px',
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: '700', color: appTheme.primary, fontSize: '13px' }}>
                    <PencilLine size={16} /> Details
                  </label>
                  <textarea className="borrow-request-field borrow-request-textarea" style={textAreaStyle} placeholder="Need it for a lab, report, or short activity." value={additionalNote} onChange={(e) => setAdditionalNote(e.target.value)} />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: '700', color: appTheme.primary, fontSize: '13px' }}>
                    <Coffee size={16} /> Thanks
                  </label>
                  <textarea className="borrow-request-field borrow-request-textarea" style={textAreaStyle} placeholder="Optional token of thanks." value={gratitude} onChange={(e) => setGratitude(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginTop: '22px' }}>
                <div style={{ color: appTheme.textMuted, fontSize: '13px' }}>
                  Posting as {displayName || username}
                </div>
                <button className="kin-interactive-button" type="submit" style={{ background: appTheme.button, color: '#fff', border: 'none', padding: '13px 18px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 12px 24px rgba(26,76,124,0.2)' }}>
                  <Save size={16} /> Post request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ ...sectionCardStyle, marginBottom: '20px', display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(15,117,128,0.12) 0%, rgba(255,255,255,1) 50%, rgba(49,214,200,0.22) 100%)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: appTheme.textSoft, fontWeight: '700' }}>Overview</p>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '700', margin: '10px 0 0', color: appTheme.text }}>Welcome, {greetingName || displayName || username}</h1>
            <p style={{ margin: '10px 0 0', lineHeight: 1.7, maxWidth: '560px', color: appTheme.textMuted }}>
              Post a request, review current activity, or continue a conversation.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="kin-interactive-chip"
              type="button"
              onClick={() => navigate('/dashboard?tab=messages')}
              style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(15,117,128,0.18)', border: '1px solid rgba(15,117,128,0.24)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <MessageSquare size={16} color={appTheme.primary} />
              <span style={{ color: appTheme.textMuted, fontSize: '13px', fontWeight: '600' }}>Messages</span>
              {alerts.unreadMessages > 0 && <span style={compactBadge(alerts.unreadMessages)}>{alerts.unreadMessages}</span>}
            </button>
            <button
              className="kin-interactive-chip"
              type="button"
              onClick={() => navigate('/borrow')}
              style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(49,214,200,0.22)', border: '1px solid rgba(49,214,200,0.28)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <CircleAlert size={16} color={appTheme.primary} />
              <span style={{ color: appTheme.textMuted, fontSize: '13px', fontWeight: '600' }}>Posts</span>
              {alerts.currentPosts > 0 && <span style={compactBadge(alerts.currentPosts)}>{alerts.currentPosts}</span>}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="kin-interactive-card kin-animate-in" style={{ ...actionCardStyle, background: 'linear-gradient(180deg, #ffffff 0%, rgba(15,117,128,0.14) 100%)', boxShadow: '0 14px 30px rgba(15,117,128,0.16)' }} onClick={() => setShowBorrowModal(true)}>
            <div>
              <Package size={34} color={appTheme.primary} />
              <h2 style={{ color: appTheme.text, margin: '18px 0 8px', fontSize: '1.35rem' }}>Create request</h2>
              <p style={{ margin: 0, color: appTheme.textMuted, lineHeight: 1.65 }}>Publish a concise request for the item you need.</p>
            </div>
            <div style={{ color: appTheme.primary, fontWeight: '700', fontSize: '14px' }}>Open form</div>
          </div>

          <div className="kin-interactive-card kin-animate-in" style={{ ...actionCardStyle, background: 'linear-gradient(180deg, #ffffff 0%, rgba(49,214,200,0.18) 100%)', boxShadow: '0 14px 30px rgba(49,214,200,0.18)' }} onClick={() => navigate('/borrow')}>
            <div>
              <Heart size={34} color={appTheme.accent} />
              <h2 style={{ color: appTheme.text, margin: '18px 0 8px', fontSize: '1.35rem' }}>Borrow hub</h2>
              <p style={{ margin: 0, color: appTheme.textMuted, lineHeight: 1.65 }}>Review current requests and respond where you can help.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: appTheme.primary, fontWeight: '700', fontSize: '14px' }}>Open hub</span>
              {alerts.currentPosts > 0 && <span style={compactBadge(alerts.currentPosts)}>{alerts.currentPosts}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPanel;
