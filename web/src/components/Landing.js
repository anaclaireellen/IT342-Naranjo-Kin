import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessagesSquare, ShieldCheck } from 'lucide-react';
import { appTheme } from '../theme';

const Landing = () => {
  const navigate = useNavigate();

  const primaryButton = {
    background: appTheme.button,
    color: '#fff',
    border: 'none',
    padding: '14px 20px',
    borderRadius: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  };

  const secondaryButton = {
    background: '#fff',
    color: appTheme.primary,
    border: `1px solid ${appTheme.border}`,
    padding: '14px 20px',
    borderRadius: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  };

  const featureCard = {
    padding: '22px',
    borderRadius: '20px',
    background: '#fff',
    border: `1px solid ${appTheme.border}`,
    boxShadow: appTheme.shadowSoft,
  };

  return (
    <div style={{ minHeight: '100vh', background: appTheme.background, padding: '28px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <img src={process.env.PUBLIC_URL + '/citu-logo.png'} alt="Kin Logo" style={{ width: '110px', height: 'auto' }} />
        </div>

        <div style={{ background: '#ffffff', border: `1px solid ${appTheme.border}`, borderRadius: '28px', boxShadow: appTheme.shadow, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.85fr', gap: '0', minHeight: 'min(720px, calc(100vh - 160px))' }}>
            <section style={{ padding: '56px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'inline-flex', padding: '7px 12px', borderRadius: '999px', background: appTheme.cardAlt, color: appTheme.primary, fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '22px' }}>
                  Campus utility system
                </div>
                <h1 style={{ margin: 0, fontSize: '3.8rem', lineHeight: 1, letterSpacing: '-0.05em', color: appTheme.text, maxWidth: '720px' }}>
                  Borrowing and student support, handled with clarity.
                </h1>
                <p style={{ margin: '20px 0 0', maxWidth: '620px', fontSize: '18px', lineHeight: 1.7, color: appTheme.textMuted }}>
                  KIN gives students a focused space to request essentials, review active posts, and continue conversations without unnecessary friction.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '28px' }}>
                  <button onClick={() => navigate('/login')} style={primaryButton}>
                    Log In <ArrowRight size={18} />
                  </button>
                  <button onClick={() => navigate('/register')} style={secondaryButton}>
                    Create Account
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '32px' }}>
                <div style={featureCard}>
                  <MessagesSquare size={18} color={appTheme.primary} />
                  <h3 style={{ margin: '14px 0 8px', color: appTheme.text, fontSize: '1rem' }}>Focused conversations</h3>
                  <p style={{ margin: 0, color: appTheme.textMuted, lineHeight: 1.6 }}>Move from request to direct coordination in one place.</p>
                </div>
                <div style={featureCard}>
                  <ShieldCheck size={18} color={appTheme.primary} />
                  <h3 style={{ margin: '14px 0 8px', color: appTheme.text, fontSize: '1rem' }}>Clear identity</h3>
                  <p style={{ margin: 0, color: appTheme.textMuted, lineHeight: 1.6 }}>Profiles stay consistent across posts, messages, and settings.</p>
                </div>
              </div>
            </section>

            <aside style={{ background: '#f8fafc', borderLeft: `1px solid ${appTheme.border}`, padding: '48px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, color: appTheme.textSoft, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Why KIN
                </p>
                <h2 style={{ margin: '12px 0 0', fontSize: '2rem', lineHeight: 1.15, color: appTheme.text }}>
                  A more formal, organized way to ask and respond.
                </h2>
              </div>

              <div style={{ display: 'grid', gap: '12px', marginTop: '28px' }}>
                {[
                  'Requests remain readable and easy to scan.',
                  'The current activity is visible without extra clutter.',
                  'Messages stay connected to the original request.',
                ].map((text) => (
                  <div key={text} style={{ padding: '16px 18px', borderRadius: '18px', background: '#fff', border: `1px solid ${appTheme.border}`, color: appTheme.textMuted, lineHeight: 1.6 }}>
                    {text}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
