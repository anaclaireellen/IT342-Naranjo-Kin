import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import ConfirmDialog from '../../shared/components/ConfirmDialog';

const buildUsernamePreview = (firstName, lastName) => {
  const normalize = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  const first = normalize(firstName.trim());
  const last = normalize(lastName.trim());

  if (!first || !last) return 'firstname.lastname';
  return `${first}.${last}`;
};

const buildEmailPreview = (firstName, lastName) => `${buildUsernamePreview(firstName, lastName)}@cit.edu`;

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [registeredUsername, setRegisteredUsername] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [errorText, setErrorText] = useState('');

  const colors = {
    primaryTeal: '#1A5F7A',
    mintAccent: '#57C5B6',
    softBg: '#F0F9F8',
    border: '#D1E5E2'
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorText('');

    if (formData.password !== formData.confirmPassword) {
      setErrorText('Passwords do not match.');
      return;
    }

    try {
      const generatedEmail = buildEmailPreview(formData.firstName, formData.lastName);
      const response = await axios.post('http://localhost:8080/api/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: generatedEmail,
        password: formData.password,
        role: 'STUDENT'
      });

      if (response.status === 200 || response.status === 201) {
        setRegisteredUsername(response.data?.username || buildUsernamePreview(formData.firstName, formData.lastName));
        setRegisteredEmail(response.data?.email || generatedEmail);
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error('Registration Error:', error);
      setErrorText(error.response?.data?.message || 'Connection failed. Is the server running?');
    }
  };

  const inputContainerStyle = { position: 'relative', width: '100%' };
  const inputStyle = {
    width: '100%',
    padding: '14px 14px 14px 45px',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    background: '#FFF',
    color: '#2D2D2D',
    outline: 'none',
    boxSizing: 'border-box',
    fontSize: '0.95rem'
  };
  const iconStyle = { position: 'absolute', left: '15px', top: '14px', color: colors.mintAccent };

  return (
    <div
      style={{
        background: 'linear-gradient(155deg, #0E456F 0%, #1B6B88 48%, #63CABB 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        padding: '24px'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.95) 100%)',
          padding: '2.5rem',
          borderRadius: '32px',
          width: '90%',
          maxWidth: '420px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 24px 48px rgba(26, 95, 122, 0.1)'
        }}
      >
        <h2 style={{ color: colors.primaryTeal, textAlign: 'center', fontSize: '1.8rem', fontWeight: '800', marginBottom: '1.5rem' }}>
          Join KIN
        </h2>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={inputContainerStyle}>
              <User size={18} style={iconStyle} />
              <input
                type="text"
                placeholder="First Name"
                style={inputStyle}
                required
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>

            <div style={inputContainerStyle}>
              <User size={18} style={iconStyle} />
              <input
                type="text"
                placeholder="Family Name"
                style={inputStyle}
                required
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div style={inputContainerStyle}>
            <User size={18} style={iconStyle} />
            <input
              type="text"
              placeholder="Username will be generated"
              style={inputStyle}
              value={buildUsernamePreview(formData.firstName, formData.lastName)}
              readOnly
            />
          </div>

          <div style={inputContainerStyle}>
            <Mail size={18} style={iconStyle} />
            <input
              type="email"
              placeholder="Email will be generated"
              style={inputStyle}
              value={buildEmailPreview(formData.firstName, formData.lastName)}
              readOnly
            />
          </div>

          <p style={{ margin: '-2px 4px 2px', fontSize: '12px', color: '#6B7B8F', lineHeight: 1.55 }}>
            Your login email is generated from your username in the format `username@cit.edu`.
          </p>

          <div style={inputContainerStyle}>
            <Lock size={18} style={iconStyle} />
            <input
              type="password"
              placeholder="Password"
              style={inputStyle}
              required
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div style={inputContainerStyle}>
            <Lock size={18} style={iconStyle} />
            <input
              type="password"
              placeholder="Confirm Password"
              style={inputStyle}
              required
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #0F4C81 0%, #1A5F7A 58%, #57C5B6 100%)',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              marginTop: '10px',
              boxShadow: '0 10px 24px rgba(26, 95, 122, 0.2)'
            }}
          >
            CREATE ACCOUNT
          </button>
        </form>

        {errorText && (
          <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '14px', background: '#FFF1F2', border: '1px solid rgba(251,113,133,0.22)', color: '#BE123C', fontSize: '13px', fontWeight: '600', lineHeight: 1.5 }}>
            {errorText}
          </div>
        )}

        <p onClick={() => navigate('/login')} style={{ color: '#6A8E8A', marginTop: '1.5rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.9rem' }}>
          Already a member? <span style={{ color: colors.primaryTeal, fontWeight: '700' }}>Log in</span>
        </p>

        <p
          onClick={() => navigate('/')}
          style={{
            color: '#999',
            marginTop: '1rem',
            cursor: 'pointer',
            textAlign: 'center',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <ArrowLeft size={12} /> Back to home
        </p>
      </div>

      <ConfirmDialog
        open={showSuccessDialog}
        title="Account ready"
        message={`You can now sign in with ${registeredEmail || (registeredUsername ? `${registeredUsername}@cit.edu` : 'your new CIT email')}.`}
        confirmLabel="Go to login"
        cancelLabel="Stay here"
        onConfirm={() => navigate('/login', { state: { identifier: registeredEmail || `${registeredUsername}@cit.edu` } })}
        onCancel={() => setShowSuccessDialog(false)}
        tone="success"
        icon={CheckCircle2}
      />
    </div>
  );
};

export default Register;
