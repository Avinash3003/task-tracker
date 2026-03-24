import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { authAPI, userAPI } from '../api';
import DeleteAccountModal from './DeleteAccountModal';

export default function Header() {
  const { username, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    toast.info('Logged out successfully');
    logout();
  };



  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">
          <span className="title-icon">&#9889;</span>
          Task Tracker
        </h1>
      </div>
      <div className="header-right" ref={dropdownRef}>
        <button
          className="user-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className="user-name" style={{fontWeight: 700}}>{username}</span>
          <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>&#9660;</span>
        </button>
        <div className={`dropdown-panel ${dropdownOpen ? 'show' : ''}`}>
          <button className="dropdown-logout" onClick={handleLogout}>
            <span>&#9211;</span> Logout
          </button>
          <button className="dropdown-logout" style={{color: 'var(--danger)'}} onClick={() => { setDropdownOpen(false); setShowDeleteModal(true); }}>
             Delete Account
          </button>
        </div>
      </div>
      {showDeleteModal && (
        <DeleteAccountModal 
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async (password) => {
             try {
               await userAPI.deleteMe(password);
               toast.success("Account permanently deleted.");
               logout();
             } catch (err) {
               toast.error(err.response?.data?.detail || "Failed to delete account");
               throw err;
             }
          }}
        />
      )}
    </header>
  );
}
