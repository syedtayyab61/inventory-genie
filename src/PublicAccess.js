import React, { useState } from 'react';

const PublicAccess = ({ onDataLoad }) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPublicData = () => {
    setLoading(true);
    
    // Try to load shared inventory data
    const publicData = localStorage.getItem(`public-inventory-${accessCode}`) ||
                      sessionStorage.getItem(`public-inventory-${accessCode}`);
    
    if (publicData) {
      const parsed = JSON.parse(publicData);
      onDataLoad(parsed);
    } else {
      alert('Access code not found. Please check the code and try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="public-access">
      <div className="access-form">
        <h2>🔓 Access Shared Inventory</h2>
        <p>Enter the access code to view shared inventory data</p>
        
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter access code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <button 
            onClick={loadPublicData}
            disabled={!accessCode || loading}
          >
            {loading ? 'Loading...' : 'Access'}
          </button>
        </div>
        
        <div className="demo-section">
          <h3>Or try the demo:</h3>
          <button 
            className="demo-btn"
            onClick={() => {
              const demoData = {
                products: [
                  { id: 1, name: 'Demo Medicine', price: 50, quantity: 10, category: 'medicine', expiryDate: '2024-12-31' },
                  { id: 2, name: 'Demo Food', price: 25, quantity: 5, category: 'food', expiryDate: '2024-11-30' }
                ],
                sales: [
                  { id: 1, productName: 'Demo Medicine', quantity: 2, total: 100, date: new Date().toISOString() }
                ]
              };
              onDataLoad(demoData);
            }}
          >
            🎮 Try Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicAccess;