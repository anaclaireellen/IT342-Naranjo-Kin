import React, { useState } from 'react';
import { Camera, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../../shared/lib/supabaseClient';
import { getStoredProfile, persistProfile } from './profileHelpers';
import { appTheme } from '../../shared/theme';

const buildUsernamePreview = (firstName, lastName) => {
  const normalize = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  const first = normalize((firstName || '').trim());
  const last = normalize((lastName || '').trim());

  if (!first || !last) return 'firstname.lastname';
  return `${first}.${last}`;
};

const Group = ({ title, children, textSecondary }) => (
  <div style={{ marginBottom: '26px' }}>
    <p style={{ fontSize: '12px', color: textSecondary, marginLeft: '16px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: '700' }}>{title}</p>
    <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.95) 100%)', borderRadius: '24px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(226,232,240,0.72)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}>
      {children}
    </div>
  </div>
);

const ProfileSettings = () => {
  const sessionProfile = getStoredProfile();
  const initialName = sessionProfile.userName || "";
  const [firstName, setFirstName] = useState(sessionProfile.firstName || "");
  const [lastName, setLastName] = useState(sessionProfile.lastName || "");
  const [email, setEmail] = useState(sessionProfile.userEmail || "");
  const [savedUsername, setSavedUsername] = useState(initialName);
  const [profilePic, setProfilePic] = useState(sessionProfile.profilePic || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSaving, setIsSaving] = useState(false);

  const colors = {
    primary: '#1A5F7A',
    accent: '#57C5B6',
    danger: '#FF3B30',
    groupBg: '#F2F2F7',
    textSecondary: '#8E8E93'
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setIsSaving(true);

    try {
      const response = await axios.put('http://localhost:8080/api/auth/user/update', {
        email: localStorage.getItem("userEmail"),
        newEmail: email,
        firstName,
        lastName,
        currentPassword,
        newPassword,
        profilePic
      });
      const nextUsername = response.data?.username || savedUsername;
      const nextEmail = response.data?.email || email;

      if (savedUsername !== nextUsername) {
        await Promise.all([
          supabase.from('Kin').update({ username: nextUsername }).eq('username', savedUsername),
          supabase.from('messages').update({ sender_username: nextUsername }).eq('sender_username', savedUsername),
          supabase.from('messages').update({ receiver_username: nextUsername }).eq('receiver_username', savedUsername),
        ]);
      }

      if (savedUsername !== nextUsername || profilePic !== (sessionProfile.profilePic || '')) {
        const kinAvatarUpdate = await supabase.from('Kin').update({ profile_pic: profilePic || '' }).eq('username', nextUsername);
        const messageAvatarUpdate = await supabase.from('messages').update({ sender_profile_pic: profilePic || '' }).eq('sender_username', nextUsername);
        const avatarColumnMissing = [kinAvatarUpdate.error, messageAvatarUpdate.error].some((entry) =>
          entry?.message?.toLowerCase().includes('profile_pic')
          || entry?.message?.toLowerCase().includes('sender_profile_pic')
          || entry?.details?.toLowerCase().includes('profile_pic')
          || entry?.hint?.toLowerCase().includes('profile_pic')
        );

        if (!avatarColumnMissing) {
          if (kinAvatarUpdate.error) throw kinAvatarUpdate.error;
          if (messageAvatarUpdate.error) throw messageAvatarUpdate.error;
        }
      }

      persistProfile({
        userName: nextUsername,
        firstName,
        lastName,
        userEmail: nextEmail,
        userRole: localStorage.getItem("userRole") || 'Student',
        profilePic: profilePic || '',
      });

      setSavedUsername(nextUsername);
      setEmail(nextEmail);
      setMessage({ text: "All set. Your profile was updated.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      const errorText = error.response?.data?.message || "Double-check your current password and try again.";
      setMessage({ text: errorText, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 0',
    border: 'none',
    background: 'transparent',
    fontSize: '16px',
    color: '#000',
    outline: 'none',
    borderBottom: '0.5px solid rgba(0,0,0,0.05)'
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px', padding: '38px', borderRadius: '36px', background: appTheme.button, color: 'white', boxShadow: '0 32px 68px rgba(15,76,129,0.2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(255,255,255,0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(255,255,255,0.12), transparent 24%)' }} />
        <div style={{ position: 'relative' }}>
        <div style={{ width: '112px', height: '112px', borderRadius: '38px', margin: '0 auto 16px', overflow: 'hidden', background: 'rgba(255,255,255,0.18)', position: 'relative', border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 34px rgba(0,0,0,0.12)' }}>
          {profilePic ? <img src={profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} color="white" style={{ marginTop: '30px' }} />}
          <label style={{ position: 'absolute', bottom: 0, right: 0, left: 0, background: 'rgba(0,0,0,0.4)', padding: '4px', cursor: 'pointer', textAlign: 'center' }}>
            <Camera size={14} color="white" />
            <input type="file" hidden accept="image/*" onChange={(e) => {
              if (!e.target.files?.[0]) return;
              const reader = new FileReader();
              reader.onload = () => setProfilePic(reader.result);
              reader.readAsDataURL(e.target.files[0]);
            }} />
          </label>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Your profile</h2>
        <p style={{ margin: '10px 0 0', opacity: 0.88, maxWidth: '520px', marginInline: 'auto', lineHeight: 1.7 }}>Change your name, photo, or password here and it'll show up across your posts and chats.</p>
        </div>
      </header>

      {message.text && (
        <div style={{ padding: '12px', borderRadius: '14px', background: message.type === 'success' ? '#34C759' : colors.danger, color: 'white', textAlign: 'center', fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdate} style={{ background: appTheme.card, borderRadius: '34px', padding: '30px', border: '1px solid rgba(255,255,255,0.86)', boxShadow: '0 24px 48px rgba(15,23,42,0.06)' }}>
        <Group title="Public profile" textSecondary={colors.textSecondary}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: colors.primary }}>FIRST NAME</label>
              <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: colors.primary }}>FAMILY NAME</label>
              <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: colors.primary }}>USERNAME</label>
            <input style={inputStyle} value={buildUsernamePreview(firstName, lastName)} readOnly />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: colors.primary }}>LOGIN EMAIL</label>
            <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </Group>

        <Group title="Password stuff" textSecondary={colors.textSecondary}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: colors.primary }}>CURRENT PASSWORD</label>
            <input type="password" placeholder="Needed before saving" style={inputStyle} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: colors.primary }}>NEW PASSWORD</label>
            <input type="password" placeholder="Leave this empty if you're keeping the same one" style={inputStyle} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </Group>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px', borderRadius: '22px', background: 'linear-gradient(180deg, #F8FAFC 0%, #F2F7FB 100%)', marginTop: '8px', marginBottom: '18px', border: '1px solid rgba(226,232,240,0.8)' }}>
          <ShieldCheck size={20} color={colors.primary} />
          <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>When you save here, your updated name and photo also carry over to your messages and community posts.</p>
        </div>

        <button type="submit" disabled={isSaving} style={{ width: '100%', padding: '17px', background: appTheme.button, color: 'white', border: 'none', borderRadius: '22px', fontSize: '17px', fontWeight: '700', cursor: isSaving ? 'default' : 'pointer', marginTop: '10px', boxShadow: '0 22px 40px rgba(15,76,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} /> {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;
