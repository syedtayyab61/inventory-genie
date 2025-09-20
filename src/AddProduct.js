import React, { useState } from 'react';

const AddProduct = ({ onAdd }) => {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    quantity: '',
    expiryDate: '',
    category: 'general'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (product.name && product.price && product.quantity) {
      onAdd({
        ...product,
        price: parseFloat(product.price),
        quantity: parseInt(product.quantity)
      });
      setProduct({
        name: '',
        price: '',
        quantity: '',
        expiryDate: '',
        category: 'general'
      });
    }
  };

  return (
    <div className="add-product">
      <h3>Add New Product</h3>
      <form onSubmit={handleSubmit} className="product-form">
        <input
          type="text"
          placeholder="Product Name"
          value={product.name}
          onChange={(e) => setProduct({...product, name: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={product.price}
          onChange={(e) => setProduct({...product, price: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          value={product.quantity}
          onChange={(e) => setProduct({...product, quantity: e.target.value})}
          required
        />
        <input
          type="date"
          placeholder="Expiry Date"
          value={product.expiryDate}
          onChange={(e) => setProduct({...product, expiryDate: e.target.value})}
        />
        <select
          value={product.category}
          onChange={(e) => setProduct({...product, category: e.target.value})}
        >
          <option value="general">General</option>
          <option value="medicine">Medicine</option>
          <option value="food">Food</option>
          <option value="cosmetics">Cosmetics</option>
        </select>
        <button type="submit">Add Product</button>
      </form>
    </div>
  );
};

export default AddProduct;