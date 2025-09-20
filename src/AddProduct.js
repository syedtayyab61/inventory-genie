import React, { useState } from 'react';

const AddProduct = ({ onAdd }) => {
  const [product, setProduct] = useState({
    name: '',
    category: 'general',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
    expiryDate: '',
    supplier: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (product.name && product.purchasePrice && product.sellingPrice && product.quantity && product.expiryDate) {
      onAdd({
        ...product,
        purchasePrice: parseFloat(product.purchasePrice),
        sellingPrice: parseFloat(product.sellingPrice),
        quantity: parseInt(product.quantity)
      });
      setProduct({
        name: '',
        category: 'general',
        quantity: '',
        purchasePrice: '',
        sellingPrice: '',
        expiryDate: '',
        supplier: '',
        description: ''
      });
    }
  };

  return (
    <div className="add-product">
      <h3>Add New Product</h3>
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-row">
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              placeholder="Enter product name"
              value={product.name}
              onChange={(e) => setProduct({...product, name: e.target.value})}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Quantity *</label>
            <input
              type="number"
              placeholder="Enter quantity"
              value={product.quantity}
              onChange={(e) => setProduct({...product, quantity: e.target.value})}
              required
              min="0"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={product.category}
              onChange={(e) => setProduct({...product, category: e.target.value})}
              className="form-input"
            >
              <option value="general">General</option>
              <option value="medicine">Medicine</option>
              <option value="food">Food</option>
              <option value="cosmetics">Cosmetics</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Purchase Price *</label>
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={product.purchasePrice}
              onChange={(e) => setProduct({...product, purchasePrice: e.target.value})}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Selling Price *</label>
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={product.sellingPrice}
              onChange={(e) => setProduct({...product, sellingPrice: e.target.value})}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Expiry Date *</label>
            <input
              type="date"
              value={product.expiryDate}
              onChange={(e) => setProduct({...product, expiryDate: e.target.value})}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Supplier</label>
            <input
              type="text"
              placeholder="Enter supplier name"
              value={product.supplier}
              onChange={(e) => setProduct({...product, supplier: e.target.value})}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group description-group">
            <label>Description</label>
            <textarea
              placeholder="Enter product description (optional)"
              value={product.description}
              onChange={(e) => setProduct({...product, description: e.target.value})}
              className="form-input"
              rows="3"
            />
          </div>
        </div>

        <button type="submit" className="submit-button">
          ➕ Add Product
        </button>
      </form>

      <style jsx>{`
        .add-product {
          max-width: 900px;
          margin: 0 auto;
          padding: 30px 20px;
        }

        .add-product h3 {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 30px;
          font-size: 28px;
          font-weight: 600;
        }

        .product-form {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 30px;
          border-radius: 12px;
          border: 1px solid #dee2e6;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .form-row {
          display: flex;
          gap: 20px;
          margin-bottom: 25px;
          align-items: stretch;
        }

        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .description-group {
          flex: 1;
          width: 100%;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #ced4da;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.3s ease;
          background-color: #ffffff;
          min-height: 20px;
          height: 48px;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
          transform: translateY(-1px);
        }

        .form-input:hover {
          border-color: #adb5bd;
        }

        .form-input::placeholder {
          color: #6c757d;
          font-style: italic;
        }

        select.form-input {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
        }

        textarea.form-input {
          resize: vertical;
          min-height: 48px;
          height: 60px;
          font-family: inherit;
          line-height: 1.4;
        }

        .submit-button {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 30px;
          transition: all 0.3s ease;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-button:hover {
          background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .submit-button:active {
          transform: translateY(0);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .add-product {
            padding: 20px 15px;
          }
          
          .product-form {
            padding: 20px;
          }
          
          .form-row {
            flex-direction: column;
            gap: 15px;
          }
          
          .add-product h3 {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .add-product {
            padding: 15px 10px;
          }
          
          .product-form {
            padding: 15px;
          }
          
          .form-input {
            padding: 12px 14px;
            font-size: 14px;
          }
          
          .submit-button {
            padding: 14px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default AddProduct;