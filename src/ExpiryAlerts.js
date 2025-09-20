import React, { useMemo } from 'react';
import { format, isAfter, addDays, differenceInDays } from 'date-fns';

const ExpiryAlerts = ({ products }) => {
  const today = new Date();
  
  // Sort products to prioritize FIFO (First In, First Out) by expiry date
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
  }, [products]);
  
  const expiredProducts = sortedProducts.filter(p => 
    p.expiryDate && isAfter(today, new Date(p.expiryDate))
  );
  
  const expiringProducts = sortedProducts.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    const warning = addDays(today, 7);
    return isAfter(warning, expiry) && !isAfter(today, expiry);
  });
  
  const lowStockProducts = sortedProducts.filter(p => p.quantity <= 5);

  // Group products by base product name for better display
  const groupProductsByName = (products) => {
    return products.reduce((groups, product) => {
      const name = product.baseProductName || product.name || 'Unknown Product';
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(product);
      return groups;
    }, {});
  };

  const expiredGrouped = groupProductsByName(expiredProducts);
  const expiringGrouped = groupProductsByName(expiringProducts);
  const lowStockGrouped = groupProductsByName(lowStockProducts);

  const renderProductGroup = (groupName, products, alertType) => (
    <div key={groupName} className="product-group">
      <div className="group-name">{groupName}</div>
      {products.map(product => {
        const productId = product._id || product.id;
        const displayName = product.baseProductName || product.name || 'Unknown Product';
        const brand = (product.baseProductId && product.baseProductId.brand) || product.brand || '';
        
        return (
          <div key={productId} className="alert-item">
            <div className="product-info">
              <span className="product-name">
                {brand && `${brand} - `}{displayName}
              </span>
              {product.sku && <span className="sku">SKU: {product.sku}</span>}
              {product.batchNumber && <span className="batch">Batch: {product.batchNumber}</span>}
              {product.location && <span className="location">📍 {product.location}</span>}
            </div>
            
            <div className="alert-details">
              {alertType === 'expired' && (
                <span className="alert-info expired-info">
                  Expired {differenceInDays(today, new Date(product.expiryDate))} days ago
                  ({format(new Date(product.expiryDate), 'dd/MM/yyyy')})
                </span>
              )}
              {alertType === 'expiring' && (
                <span className="alert-info expiring-info">
                  Expires in {differenceInDays(new Date(product.expiryDate), today)} days
                  ({format(new Date(product.expiryDate), 'dd/MM/yyyy')})
                </span>
              )}
              {alertType === 'lowStock' && (
                <span className="alert-info low-stock-info">
                  Only {product.quantity} units left
                </span>
              )}
              <span className="stock">Stock: {product.quantity} units</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const totalAlerts = expiredProducts.length + expiringProducts.length + lowStockProducts.length;

  return (
    <div className="alerts-container">
      <h2>🚨 Inventory Alerts & Notifications</h2>
      
      {totalAlerts > 0 && (
        <div className="alerts-summary">
          <div className="summary-item">
            <span className="count expired">{expiredProducts.length}</span>
            <span className="label">Expired</span>
          </div>
          <div className="summary-item">
            <span className="count expiring">{expiringProducts.length}</span>
            <span className="label">Expiring Soon</span>
          </div>
          <div className="summary-item">
            <span className="count low-stock">{lowStockProducts.length}</span>
            <span className="label">Low Stock</span>
          </div>
        </div>
      )}
      
      {expiredProducts.length > 0 && (
        <div className="alert-section expired">
          <h3>⚠️ Expired Products ({expiredProducts.length} batches)</h3>
          <div className="fifo-note">
            💡 <strong>FIFO Reminder:</strong> Remove or discount these expired items first!
          </div>
          {Object.entries(expiredGrouped).map(([groupName, products]) =>
            renderProductGroup(groupName, products, 'expired')
          )}
        </div>
      )}

      {expiringProducts.length > 0 && (
        <div className="alert-section expiring">
          <h3>⏰ Expiring Soon ({expiringProducts.length} batches)</h3>
          <div className="fifo-note">
            💡 <strong>FIFO Suggestion:</strong> Prioritize selling these items to minimize waste!
          </div>
          {Object.entries(expiringGrouped).map(([groupName, products]) =>
            renderProductGroup(groupName, products, 'expiring')
          )}
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="alert-section low-stock">
          <h3>📦 Low Stock ({lowStockProducts.length} batches)</h3>
          <div className="fifo-note">
            💡 <strong>Reorder Note:</strong> Consider restocking these items soon!
          </div>
          {Object.entries(lowStockGrouped).map(([groupName, products]) =>
            renderProductGroup(groupName, products, 'lowStock')
          )}
        </div>
      )}

      {totalAlerts === 0 && (
        <div className="no-alerts">
          <h3>✅ All Good!</h3>
          <p>No alerts at this time. Your inventory is well managed.</p>
          <div className="success-tips">
            <h4>🎯 Pro Tips:</h4>
            <ul>
              <li>Keep monitoring expiry dates regularly</li>
              <li>Maintain optimal stock levels</li>
              <li>Use FIFO (First In, First Out) method for perishables</li>
              <li>Set up reorder points for critical items</li>
            </ul>
          </div>
        </div>
      )}

      <style jsx>{`
        .alerts-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }

        .alerts-summary {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          justify-content: center;
        }

        .summary-item {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .count {
          display: block;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .count.expired { color: #dc3545; }
        .count.expiring { color: #ffc107; }
        .count.low-stock { color: #17a2b8; }

        .label {
          font-size: 14px;
          color: #6c757d;
        }

        .alert-section {
          margin-bottom: 30px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .alert-section h3 {
          margin: 0;
          padding: 15px 20px;
          color: white;
        }

        .alert-section.expired h3 { background: #dc3545; }
        .alert-section.expiring h3 { background: #ffc107; color: #212529; }
        .alert-section.low-stock h3 { background: #17a2b8; }

        .fifo-note {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 10px 20px;
          font-size: 14px;
          color: #856404;
        }

        .product-group {
          background: white;
        }

        .group-name {
          background: #f8f9fa;
          padding: 10px 20px;
          font-weight: 600;
          border-bottom: 1px solid #dee2e6;
          color: #495057;
        }

        .alert-item {
          padding: 15px 20px;
          border-bottom: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .alert-item:last-child {
          border-bottom: none;
        }

        .product-info {
          flex: 1;
        }

        .product-name {
          font-weight: 500;
          display: block;
          margin-bottom: 5px;
          color: #333;
        }

        .sku, .batch, .location {
          display: inline-block;
          margin-right: 10px;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 3px;
          margin-bottom: 2px;
        }

        .sku {
          background: #e9ecef;
          color: #495057;
          font-family: monospace;
        }

        .batch {
          background: #d1ecf1;
          color: #0c5460;
        }

        .location {
          background: #d4edda;
          color: #155724;
        }

        .alert-details {
          text-align: right;
          min-width: 200px;
        }

        .alert-info {
          display: block;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .expired-info { color: #dc3545; font-weight: 500; }
        .expiring-info { color: #856404; font-weight: 500; }
        .low-stock-info { color: #0c5460; font-weight: 500; }

        .stock {
          font-size: 13px;
          color: #6c757d;
        }

        .no-alerts {
          text-align: center;
          padding: 40px 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .success-tips {
          margin-top: 30px;
          text-align: left;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .success-tips h4 {
          color: #28a745;
          margin-bottom: 15px;
        }

        .success-tips ul {
          list-style: none;
          padding: 0;
        }

        .success-tips li {
          padding: 5px 0;
          color: #6c757d;
        }

        .success-tips li:before {
          content: "✓ ";
          color: #28a745;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .alerts-summary {
            flex-direction: column;
            gap: 10px;
          }

          .alert-item {
            flex-direction: column;
            align-items: stretch;
          }

          .alert-details {
            text-align: left;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default ExpiryAlerts;