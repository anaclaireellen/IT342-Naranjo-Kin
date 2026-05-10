import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { appTheme } from '../../shared/theme';
import { supabase } from '../../shared/lib/supabaseClient';
import { getStoredProfile } from '../profile/profileHelpers';

const RequestItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    need: '',
    duration: '',
    gratitude: ''
  });
  const { userName, profilePic } = getStoredProfile();

  const colors = { 
    primaryTeal: appTheme.primary, 
    mintAccent: appTheme.accent, 
    softBg: '#F0F9F8',
    border: '#D1E5E2' 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      username: userName || 'Guest',
      need: formData.need.trim(),
      duration: formData.duration.trim(),
      gratitude: formData.gratitude.trim(),
    };
    const payloadWithProfile = profilePic ? { ...payload, profile_pic: profilePic } : payload;

    let { error } = await supabase.from('Kin').insert([payloadWithProfile]);
    const shouldRetryWithoutAvatar = error?.message?.toLowerCase().includes('profile_pic')
      || error?.details?.toLowerCase().includes('profile_pic')
      || error?.hint?.toLowerCase().includes('profile_pic');

    if (shouldRetryWithoutAvatar) {
      ({ error } = await supabase.from('Kin').insert([payload]));
    }

    if (error) {
      console.error('Could not post request', error);
      alert('Could not post your request right now.');
      return;
    }

    alert("Request posted successfully!");
    navigate('/borrow');
  };

  return (
    <div style={{ background: appTheme.shellBackground, minHeight: '100vh', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '450px', margin: '0 auto', background: appTheme.card, padding: '2.5rem', borderRadius: '32px', boxShadow: '0 16px 38px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.86)' }}>
        
        <button onClick={() => navigate('/dashboard')} style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1A5F7A', marginBottom: '1.5rem', fontWeight: 'bold', padding: '12px 16px', borderRadius: '18px' }}>
          <ArrowLeft size={18} /> Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: '#FFFBEB', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Heart size={24} color="#F59E0B" />
          </div>
          <h2 style={{ color: colors.primaryTeal, fontWeight: '900', margin: 0 }}>Ask for Help</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            required 
            placeholder="What do you need?" 
            style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}
            onChange={(e) => setFormData({...formData, need: e.target.value})}
          />
          <input 
            required 
            placeholder="For how long?" 
            style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
          />
          <input 
            placeholder="Token of thanks (Optional)" 
            style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}
            onChange={(e) => setFormData({...formData, gratitude: e.target.value})}
          />
          <button type="submit" style={{ background: appTheme.button, color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', boxShadow: '0 14px 30px rgba(15,76,129,0.18)' }}>
            POST REQUEST
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestItem;
