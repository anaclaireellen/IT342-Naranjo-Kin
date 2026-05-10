import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { appTheme } from '../../shared/theme';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const colors = { 
    primaryTeal: appTheme.primary, 
    mintAccent: appTheme.accent, 
    softBg: '#F0F9F8',
    border: '#D1E5E2'
  };

  return (
    <div style={{ background: appTheme.shellBackground, minHeight: '100vh', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => navigate('/borrow')} style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1A5F7A', marginBottom: '2rem', fontWeight: '700', padding: '12px 16px', borderRadius: '18px', backdropFilter: 'blur(16px)' }}>
          <ArrowLeft size={18} /> Back to Hub
        </button>

        <div style={{ background: appTheme.card, padding: '3rem', borderRadius: '32px', border: `1px solid ${colors.border}`, boxShadow: '0 15px 35px rgba(26, 95, 122, 0.12)' }}>
          <h1 style={{ color: colors.primaryTeal, fontSize: '2.2rem', marginBottom: '0.5rem' }}>Item Details</h1>
          <p style={{ color: '#6A8E8A', marginBottom: '2rem' }}>Requesting Item ID: #{id}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '2.5rem' }}>
            <div style={{ padding: '1.5rem', background: colors.softBg, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Clock color={colors.primaryTeal} />
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6A8E8A' }}>Borrow Period</p>
                <p style={{ margin: 0, fontWeight: '700', color: colors.primaryTeal }}>3 Days Max</p>
              </div>
            </div>
            <div style={{ padding: '1.5rem', background: colors.softBg, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <MapPin color={colors.primaryTeal} />
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6A8E8A' }}>Pickup Point</p>
                <p style={{ margin: 0, fontWeight: '700', color: colors.primaryTeal }}>Property Office</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => alert('Borrow request sent to Admin!')}
            style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: appTheme.button, color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 16px 30px rgba(15,76,129,0.18)' }}
          >
            <ShieldCheck size={20} /> INITIATE BORROW REQUEST
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
