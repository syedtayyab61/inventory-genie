import React, { useState, useMemo } from 'react';
import { format, isAfter, addDays } from 'date-fns';

const InventoryList = ({ products, onUpdate, onSell, onRemove }) => {
  const [filter, setFilter] = useState('all');
  const [sellQuantities, setSellQuantities] = useState({});
  const [sortBy, setSortBy] = useState('name');

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

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'expiry':
          if (!a.expiryDate && !b.expiryDate) return 0;
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate) - new Date(b.expiryDate);
        case 'quantity':
          return a.quantity - b.quantity;
        default:
          return 0;
      }
    });
  }, [filteredProducts, sortBy]);

  const handleSell = (productId) => {
    const quantity = parseInt(sellQuantities[productId] || 1);
    onSell(productId, quantity);
    setSellQuantities({...sellQuantities, [productId]: ''});
  };

  return (
    <div className="inventory-list">
      <div className="inventory-header">
        <h3>Inventory ({products.length} products)</h3>
        
        <div className="controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Products</option>
            <option value="low-stock">Low Stock</option>
            <option value="expired">Expired</option>
            <option value="expiring">Expiring Soon</option>
            <option value="medicine">Medicine</option>
            <option value="food">Food</option>
            <option value="cosmetics">Cosmetics</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Sort by Name</option>
            <option value="expiry">Sort by Expiry</option>
            <option value="quantity">Sort by Stock</option>
          </select>
        </div>
      </div>

      <div className="products-grid">
        {sortedProducts.map(product => {
          const expiryStatus = getExpiryStatus(product.expiryDate);
          const productId = product._id || product.id;
          
          return (
            <div key={productId} className={`product-card ${expiryStatus}`}>
              <div className="product-header">
                <h4>{product.name}</h4>
                <span className="category">{product.category}</span>
              </div>
              
              <div className="product-details">
                <p>Purchase: ₹{product.purchasePrice}</p>
                <p>Selling: ₹{product.sellingPrice}</p>
                <p className={product.quantity <= 5 ? 'low-stock' : ''}>
                  Stock: {product.quantity}
                </p>
                {product.expiryDate && (
                  <p className="expiry">
                    Expires: {format(new Date(product.expiryDate), 'dd/MM/yyyy')}
                  </p>
                )}
                {product.supplier && (
                  <p className="supplier">Supplier: {product.supplier}</p>
                )}
                {product.description && (
                  <p className="description">{product.description}</p>
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
                    className="sell-btn"
                  >
                    Sell
                  </button>
                </div>
                
                <input
                  type="number"
                  placeholder="Update stock"
                  className="update-input"
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
                  title="Remove this product"
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .inventory-list {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .inventory-header {
          margin-bottom: 20px;
        }

        .controls {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .controls select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .group-toggle {
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        }

        .product-group {
          margin-bottom: 30px;
        }

        .group-header {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px 8px 0 0;
          border: 1px solid #dee2e6;
          border-bottom: none;
        }

        .group-header h4 {
          margin: 0 0 5px 0;
          color: #495057;
        }

        .group-stats {
          color: #6c757d;
          font-size: 14px;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 10px;
        }

        .product-card {
          border: 2px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          background: white;
          transition: all 0.2s;
        }

        .product-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .product-card.expired {
          border-color: #dc3545;
          background: #fff5f5;
        }

        .product-card.warning {
          border-color: #ffc107;
          background: #fffdf0;
        }

        .product-card.good {
          border-color: #28a745;
          background: #f8fff8;
        }

        .product-header h4 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .product-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sku {
          font-family: monospace;
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
          color: #495057;
        }

        .category {
          background: #007bff;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          width: fit-content;
        }

        .product-details {
          margin: 15px 0;
        }

        .product-details p {
          margin: 5px 0;
          font-size: 14px;
        }

        .batch {
          font-weight: 500;
          color: #6f42c1;
        }

        .low-stock {
          color: #dc3545;
          font-weight: bold;
        }

        .location, .supplier {
          color: #6c757d;
          font-size: 13px;
        }

        .expiry {
          font-weight: 500;
        }

        .mfg-date {
          color: #6c757d;
        }

        .product-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sell-section {
          display: flex;
          gap: 8px;
        }

        .sell-section input {
          flex: 1;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          min-width: 0;
        }

        .sell-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .sell-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .update-input {
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .remove-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .remove-btn:hover {
          background: #c82333;
        }

        @media (max-width: 768px) {
          .controls {
            flex-direction: column;
            align-items: stretch;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default InventoryList;