import { useState } from 'react';

export default function DeleteAccountModal({ onClose, onConfirm }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
        await onConfirm(password);
    } catch {
        // Leave modal open if validation error occurs
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px'}}>
        <div className="modal-header">
          <h2>Delete Account</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
            This action is permanent and cannot be undone. Please enter your password to confirm deletion.
          </p>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter your password" 
              autoFocus
              required 
            />
          </div>
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glow)'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={loading || !password}>
              {loading ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
