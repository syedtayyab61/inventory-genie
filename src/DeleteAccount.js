import React, { useState } from 'react';
import API_BASE_URL from './config';
import './Auth.css';

const DeleteAccount = ({ onDeleteAccount, user }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteClick = () => {
    setShowConfirmation(true);
    setError('');
  };

  const handleConfirmDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete my account') {
      setError('Please type "delete my account" to confirm');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Account deleted successfully! Goodbye ${data.deletedUser.username}!`);
        onDeleteAccount();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setConfirmText('');
    setError('');
  };

  if (!showConfirmation) {
    return (
      <div className="delete-account-section">
        <h3>🗑️ Danger Zone</h3>
        <p>Once you delete your account, there is no going back. All your data will be permanently removed.</p>
        <button 
          className="delete-account-btn" 
          onClick={handleDeleteClick}
        >
          Delete My Account
        </button>
      </div>
    );
  }

  return (
    <div className="delete-confirmation-modal">
      <div className="modal-content">
        <h3>⚠️ Confirm Account Deletion</h3>
        <div className="warning-message">
          <p><strong>This action cannot be undone!</strong></p>
          <p>This will permanently delete:</p>
          <ul>
            <li>Your account ({user?.email})</li>
            <li>All your inventory items</li>
            <li>All your sales records</li>
            <li>All associated data</li>
          </ul>
        </div>
        
        <div className="confirmation-input">
          <label>
            Type <strong>"delete my account"</strong> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete my account"
            className="confirm-input"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <button 
            className="cancel-btn" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="confirm-delete-btn" 
            onClick={handleConfirmDelete}
            disabled={loading || confirmText.toLowerCase() !== 'delete my account'}
          >
            {loading ? 'Deleting...' : 'Delete My Account Forever'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;