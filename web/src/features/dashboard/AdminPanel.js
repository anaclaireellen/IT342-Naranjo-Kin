import React from 'react';
import { ShieldCheck, Users, BellRing, ArrowRight } from 'lucide-react';
import { appTheme } from '../../shared/theme';
import { getStoredProfile } from '../profile/profileHelpers';

const AdminPanel = () => {
  const { greetingName, displayName, userName } = getStoredProfile();
  const adminName = greetingName || displayName || userName || 'Admin';

  const cards = [
    {
      title: 'What people see',
      copy: 'This gives you a quick read on how the borrowing space feels for students using it day to day.',
    },
    {
      title: 'Trust stuff',
      copy: 'Profiles make requests and chats feel more real, so it is easier to tell who you are dealing with.',
    },
    {
      title: 'Heads up',
      copy: 'This screen looks ready to go, but it still needs backend hooks before live moderation data can show up here.',
    },
  ];

  const cardStyle = {
    background: appTheme.card,
    borderRadius: '28px',
    padding: '22px',
    border: '1px solid rgba(255,255,255,0.86)',
    boxShadow: '0 12px 26px rgba(15,23,42,0.06)',
  };

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', padding: '8px 0 24px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <div style={{ background: appTheme.button, color: 'white', borderRadius: '30px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 24px 48px rgba(15,76,129,0.2)', border: '1px solid rgba(255,255,255,0.16)' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.76)' }}>Admin space</p>
          <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: '800', color: 'white' }}>Hey, {adminName}!</h1>
          <p style={{ margin: '12px 0 0', lineHeight: 1.7, maxWidth: '640px', color: 'rgba(255,255,255,0.88)' }}>
            You've got the admin view here. It matches the rest of the dashboard and is set up for moderation tools later on.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '18px' }}>
          <div style={cardStyle}>
            <ShieldCheck size={24} color="#1A5F7A" />
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0F172A', marginTop: '10px' }}>1</div>
            <p style={{ margin: '6px 0 0', color: '#64748B' }}>Admin account active</p>
          </div>
          <div style={cardStyle}>
            <Users size={24} color="#1A5F7A" />
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0F172A', marginTop: '10px' }}>Live</div>
            <p style={{ margin: '6px 0 0', color: '#64748B' }}>Same feel as the student side</p>
          </div>
          <div style={cardStyle}>
            <BellRing size={24} color="#1A5F7A" />
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0F172A', marginTop: '10px' }}>Ready</div>
            <p style={{ margin: '6px 0 0', color: '#64748B' }}>Ready for backend tools</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          {cards.map((card) => (
            <div key={card.title} style={{ ...cardStyle, borderRadius: '30px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 10px', color: '#0F172A' }}>{card.title}</h3>
              <p style={{ margin: 0, color: '#64748B', lineHeight: 1.7 }}>{card.copy}</p>
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, marginTop: '18px', borderRadius: '30px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: '#94A3B8' }}>What's next</p>
              <h3 style={{ margin: 0, color: '#0F172A' }}>Next up, this can be connected to real admin data.</h3>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#1A5F7A' }}>
              Hook up admin tools <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
