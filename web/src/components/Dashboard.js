import React, { useState, useEffect } from 'react';
import { MessageSquare, LayoutDashboard, LogOut, Settings, User, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import StudentPanel from './StudentPanel';
import ProfileSettings from './ProfileSettings';
import AestheticChat from './AestheticChat';
import AdminPanel from './AdminPanel';
import { clearStoredSession, getStoredProfile, PROFILE_UPDATED_EVENT } from '../utils/profileHelpers';
import { appTheme } from '../theme';
import ConfirmDialog from './ConfirmDialog';
import { supabase } from '../supabaseClient';

const Dashboard = ({ setAuth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [sessionProfile, setSessionProfile] = useState(getStoredProfile());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(() => window.innerWidth <= 900);
  const [dashboardAlerts, setDashboardAlerts] = useState({ unreadMessages: 0, currentPosts: 0 });

  const { userName, displayName, greetingName, userRole, profilePic } = sessionProfile;

  useEffect(() => {
    const syncProfile = () => setSessionProfile(getStoredProfile());
    window.addEventListener('storage', syncProfile);
    window.addEventListener(PROFILE_UPDATED_EVENT, syncProfile);
    return () => {
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener(PROFILE_UPDATED_EVENT, syncProfile);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsCompactLayout(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedTab = params.get('tab');
    if (requestedTab) setActiveTab(requestedTab);
  }, [location.search]);

  useEffect(() => {
    if (!userName || userRole === 'ADMIN') return undefined;

    const loadAlerts = async () => {
      const [{ data: messageData, error: messageError }, { data: postData, error: postError }] = await Promise.all([
        supabase
          .from('messages')
          .select('sender_username, receiver_username, created_at')
          .eq('receiver_username', userName)
          .order('created_at', { ascending: false }),
        supabase
          .from('Kin')
          .select('id, username')
          .eq('username', userName),
      ]);

      if (!messageError) {
        const latestBySender = new Map();
        (messageData || []).forEach((entry) => {
          if (!entry.sender_username) return;
          if (!latestBySender.has(entry.sender_username)) {
            latestBySender.set(entry.sender_username, entry);
          }
        });
        setDashboardAlerts((current) => ({ ...current, unreadMessages: latestBySender.size }));
      }

      if (!postError) {
        setDashboardAlerts((current) => ({ ...current, currentPosts: (postData || []).length }));
      }
    };

    loadAlerts();
    const messageSub = supabase.channel(`dashboard-messages-${userName}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadAlerts).subscribe();
    const postSub = supabase.channel(`dashboard-posts-${userName}`).on('postgres_changes', { event: '*', schema: 'public', table: 'Kin' }, loadAlerts).subscribe();

    return () => {
      supabase.removeChannel(messageSub);
      supabase.removeChannel(postSub);
    };
  }, [userName, userRole]);

  const handleLogout = () => {
    clearStoredSession();
    setAuth(false);
    navigate('/login');
  };

  const badgeStyle = {
    minWidth: '22px',
    height: '22px',
    padding: '0 7px',
    borderRadius: '999px',
    background: '#111827',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
  };

  const navItemStyle = (tab) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '13px 14px',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: '0.2s ease',
    border: `1px solid ${activeTab === tab ? '#cbd5e1' : 'transparent'}`,
    width: '100%',
    textAlign: 'left',
    background: activeTab === tab ? '#f8fafc' : 'transparent',
    color: activeTab === tab ? appTheme.text : appTheme.textMuted,
    fontWeight: activeTab === tab ? '700' : '600',
    outline: 'none',
  });

  return (
    <div style={{ display: 'flex', flexDirection: isCompactLayout ? 'column' : 'row', minHeight: '100vh', background: appTheme.background, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: isCompactLayout ? '12px' : '18px', gap: '18px', boxSizing: 'border-box' }}>
      <aside style={{ width: isCompactLayout ? '100%' : '292px', background: '#ffffff', border: `1px solid ${appTheme.border}`, display: 'flex', flexDirection: 'column', padding: '18px', flexShrink: 0, borderRadius: '24px', boxShadow: appTheme.shadow }}>
        <div style={{ padding: '12px 12px 18px', borderBottom: `1px solid ${appTheme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: '#f8fafc', border: `1px solid ${appTheme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={process.env.PUBLIC_URL + '/citu-logo.png'} alt="CITU" style={{ width: '34px', height: '34px', objectFit: 'contain', cursor: 'pointer' }} onClick={() => setActiveTab('overview')} />
            </div>
            <div style={{ padding: '6px 10px', borderRadius: '999px', background: '#f8fafc', border: `1px solid ${appTheme.border}`, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '700', color: appTheme.textMuted }}>
              Student
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: appTheme.textSoft, fontWeight: '700' }}>Workspace</p>
          <h2 style={{ margin: '8px 0 0', fontSize: '1.7rem', fontWeight: '700', lineHeight: 1.1, color: appTheme.text }}>
            {greetingName || displayName || userName}
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: appTheme.textMuted, lineHeight: 1.6 }}>
            Requests, messages, and account settings in one place.
          </p>
        </div>

        <nav style={{ flex: 1, paddingTop: '16px' }}>
          <button onClick={() => setActiveTab('overview')} style={navItemStyle('overview')}>
            <LayoutDashboard size={18} />
            <span style={{ flex: 1, fontSize: '14px' }}>Overview</span>
          </button>
          <button onClick={() => setActiveTab('messages')} style={navItemStyle('messages')}>
            <MessageSquare size={18} />
            <span style={{ flex: 1, fontSize: '14px' }}>Messages</span>
            {dashboardAlerts.unreadMessages > 0 && <span style={badgeStyle}>{dashboardAlerts.unreadMessages}</span>}
          </button>
          <button onClick={() => setActiveTab('settings')} style={navItemStyle('settings')}>
            <Settings size={18} />
            <span style={{ flex: 1, fontSize: '14px' }}>Settings</span>
          </button>

          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${appTheme.border}` }}>
            <button onClick={() => setShowLogoutConfirm(true)} style={{ ...navItemStyle('logout'), color: '#b42318' }}>
              <LogOut size={18} />
              <span style={{ fontSize: '14px' }}>Log out</span>
            </button>
          </div>
        </nav>

        <div onClick={() => setActiveTab('settings')} style={{ marginTop: '10px', background: '#f8fafc', padding: '14px', borderRadius: '18px', border: `1px solid ${appTheme.border}`, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${appTheme.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profilePic ? <img src={profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="profile" /> : <User size={18} style={{ color: appTheme.primary }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: appTheme.text }}>{displayName || userName}</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: appTheme.textMuted }}>{userRole}</p>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: isCompactLayout ? '560px' : 0 }}>
        {activeTab === 'messages' ? (
          <AestheticChat
            colors={{ primary: appTheme.primary, accent: appTheme.accent }}
            userName={userName}
            initialRecipient={new URLSearchParams(location.search).get('user') || ''}
            requestContext={{
              requestId: new URLSearchParams(location.search).get('requestId') || '',
              requestNeed: new URLSearchParams(location.search).get('requestNeed') || '',
              requestOwner: new URLSearchParams(location.search).get('requestOwner') || '',
            }}
          />
        ) : (
          <div className="kin-scrollbar" style={{ flex: 1, overflow: 'auto', background: appTheme.card, borderRadius: '24px', border: `1px solid ${appTheme.border}`, boxShadow: appTheme.shadow, minHeight: 0 }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '22px' }}>
              {activeTab === 'overview' && userRole === 'ADMIN' && <AdminPanel />}
              {activeTab === 'overview' && userRole !== 'ADMIN' && <StudentPanel alerts={dashboardAlerts} />}
              {activeTab === 'settings' && <ProfileSettings />}
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Sign out?"
        message="You will be signed out of this session."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        tone="danger"
        icon={AlertCircle}
      />
    </div>
  );
};

export default Dashboard;
