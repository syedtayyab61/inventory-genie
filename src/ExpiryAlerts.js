import React from 'react';
import { format, isAfter, addDays, differenceInDays } from 'date-fns';

const ExpiryAlerts = ({ products }) => {
  const today = new Date();
  
  const expiredProducts = products.filter(p => 
    p.expiryDate && isAfter(today, new Date(p.expiryDate))
  );
  
  const expiringProducts = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    const warning = addDays(today, 7);
    return isAfter(warning, expiry) && !isAfter(today, expiry);
  });
  
  const lowStockProducts = products.filter(p => p.quantity <= 5);

  return (
    <div className="alerts-container">
      <h2>🚨 Alerts & Notifications</h2>
      
      {expiredProducts.length > 0 && (
        <div className="alert-section expired">
          <h3>⚠️ Expired Products ({expiredProducts.length})</h3>
          {expiredProducts.map(product => (
            <div key={product.id} className="alert-item">
              <span className="product-name">{product.name}</span>
              <span className="alert-info">
                Expired {differenceInDays(today, new Date(product.expiryDate))} days ago
              </span>
              <span className="stock">Stock: {product.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {expiringProducts.length > 0 && (
        <div className="alert-section expiring">
          <h3>⏰ Expiring Soon ({expiringProducts.length})</h3>
          {expiringProducts.map(product => (
            <div key={product.id} className="alert-item">
              <span className="product-name">{product.name}</span>
              <span className="alert-info">
                Expires in {differenceInDays(new Date(product.expiryDate), today)} days
              </span>
              <span className="stock">Stock: {product.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="alert-section low-stock">
          <h3>📦 Low Stock ({lowStockProducts.length})</h3>
          {lowStockProducts.map(product => (
            <div key={product.id} className="alert-item">
              <span className="product-name">{product.name}</span>
              <span className="alert-info">Only {product.quantity} left</span>
              <span className="category">{product.category}</span>
            </div>
          ))}
        </div>
      )}

      {expiredProducts.length === 0 && expiringProducts.length === 0 && lowStockProducts.length === 0 && (
        <div className="no-alerts">
          <h3>✅ All Good!</h3>
          <p>No alerts at this time. Your inventory is well managed.</p>
        </div>
      )}
    </div>
  );
};

export default ExpiryAlerts;