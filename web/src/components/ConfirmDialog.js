import React from 'react';
import { AlertCircle } from 'lucide-react';
import { appTheme } from '../theme';

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  tone = 'default',
  icon,
  busy = false,
}) => {
  if (!open) return null;

  const toneStyles = {
    default: {
      confirmBackground: appTheme.button,
      helperCopy: 'Please confirm before continuing.',
      helperColor: '#5B6B80',
    },
    danger: {
      confirmBackground: 'linear-gradient(180deg, #b42318 0%, #912018 100%)',
      helperCopy: 'This action takes effect immediately.',
      helperColor: '#9F1239',
    },
    success: {
      confirmBackground: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
      helperCopy: 'Everything is ready to move forward.',
      helperColor: '#065F46',
    },
  };
  const activeTone = toneStyles[tone] || toneStyles.default;
  const Icon = icon || AlertCircle;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.38)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: appTheme.card, borderRadius: '24px', overflow: 'hidden', border: '1px solid #d7dee8', boxShadow: '0 24px 48px rgba(15,23,42,0.14)' }}>
        <div style={{ padding: '24px 24px 18px', background: activeTone.confirmBackground, color: 'white' }}>
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Icon size={26} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '700' }}>{title}</h3>
            <p style={{ margin: '8px 0 0', lineHeight: 1.6, color: 'rgba(255,255,255,0.88)' }}>{message}</p>
          </div>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <p style={{ margin: 0, color: activeTone.helperColor, fontSize: '13px', lineHeight: 1.55, fontWeight: '600' }}>
              {activeTone.helperCopy}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              style={{ flex: 1, background: '#ffffff', color: '#1E293B', border: '1px solid #d7dee8', padding: '13px', borderRadius: '14px', fontWeight: '600', cursor: busy ? 'default' : 'pointer' }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              style={{ flex: 1, background: activeTone.confirmBackground, color: 'white', border: 'none', padding: '13px', borderRadius: '14px', fontWeight: '600', cursor: busy ? 'default' : 'pointer', boxShadow: 'none' }}
            >
              {busy ? 'Working...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
