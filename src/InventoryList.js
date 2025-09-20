import React, { useState } from 'react';
import { format, isAfter, addDays } from 'date-fns';

const InventoryList = ({ products, onUpdate, onSell, onRemove }) => {
  const [filter, setFilter] = useState('all');
  const [sellQuantities, setSellQuantities] = useState({});

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return 'none';
    const expiry = new Date(expiryDate);
    const today = new Date();
    const warning = addDays(today, 7);
    
    if (isAfter(today, expiry)) return 'expired';
    if (isAfter(warning, expiry)) return 'warning';
    return 'good';
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    if (filter === 'low-stock') return product.quantity <= 5;
    if (filter === 'expired') return getExpiryStatus(product.expiryDate) === 'expired';
    if (filter === 'expiring') return getExpiryStatus(product.expiryDate) === 'warning';
    return product.category === filter;
  });

  const handleSell = (productId) => {
    const quantity = parseInt(sellQuantities[productId] || 1);
    onSell(productId, quantity);
    setSellQuantities({...sellQuantities, [productId]: ''});
  };

  return (
    <div className="inventory-list">
      <div className="inventory-header">
        <h3>Inventory ({products.length} items)</h3>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Products</option>
          <option value="low-stock">Low Stock</option>
          <option value="expired">Expired</option>
          <option value="expiring">Expiring Soon</option>
          <option value="medicine">Medicine</option>
          <option value="food">Food</option>
          <option value="cosmetics">Cosmetics</option>
        </select>
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => {
          const expiryStatus = getExpiryStatus(product.expiryDate);
          const productId = product._id || product.id; // Support both MongoDB _id and client-side id
          return (
            <div key={productId} className={`product-card ${expiryStatus}`}>
              <div className="product-header">
                <h4>{product.name}</h4>
                <span className="category">{product.category}</span>
              </div>
              
              <div className="product-details">
                <p>Price: ₹{product.price}</p>
                <p>Stock: {product.quantity}</p>
                {product.expiryDate && (
                  <p className="expiry">
                    Expires: {format(new Date(product.expiryDate), 'dd/MM/yyyy')}
                  </p>
                )}
              </div>

              <div className="product-actions">
                <div className="sell-section">
                  <input
                    type="number"
                    min="1"
                    max={product.quantity}
                    placeholder="Qty"
                    value={sellQuantities[productId] || ''}
                    onChange={(e) => setSellQuantities({
                      ...sellQuantities,
                      [productId]: e.target.value
                    })}
                  />
                  <button 
                    onClick={() => handleSell(productId)}
                    disabled={product.quantity === 0}
                  >
                    Sell
                  </button>
                </div>
                
                <input
                  type="number"
                  placeholder="Update stock"
                  onBlur={(e) => {
                    if (e.target.value) {
                      onUpdate(productId, { quantity: parseInt(e.target.value) });
                      e.target.value = '';
                    }
                  }}
                />
                
                <button 
                  className="remove-btn"
                  onClick={() => onRemove(productId)}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryList;