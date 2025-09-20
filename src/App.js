import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import API_BASE_URL from './config';
import InventoryList from './InventoryList';
import ExpiryAlerts from './ExpiryAlerts';
import SalesReport from './SalesReport';
import AddProduct from './AddProduct';
import ShareableReport from './ShareableReport';
import Login from './Login';
import Register from './Register';
import DeleteAccount from './DeleteAccount';
import './App.css';
import './Auth.css';

function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Check if this is a shared report view
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('report');
  
  if (reportId) {
    return <ShareableReport reportId={reportId} />;
  }

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        loadUserData(savedToken);
      } else {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Load user-specific data from backend
  const loadUserData = async (authToken) => {
    try {
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      // Load products
      const productsResponse = await fetch(`${API_BASE_URL}/api/products`, { headers });
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData);
      }

      // Load sales
      const salesResponse = await fetch(`${API_BASE_URL}/api/sales`, { headers });
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        setSales(salesData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    setLoading(false);
  };

  // Authentication handlers
  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    loadUserData(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setProducts([]);
    setSales([]);
    setShowLogin(true);
  };

  const handleDeleteAccount = () => {
    // Clear all local storage and state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setProducts([]);
    setSales([]);
    setShowLogin(true);
    setActiveTab('inventory'); // Reset to default tab
  };

  // API helper function
  const apiCall = async (url, method = 'GET', body = null) => {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        handleLogout(); // Token expired
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };

  const addProduct = async (product) => {
    try {
      const newProduct = await apiCall('/api/products', 'POST', product);
      if (newProduct) {
        setProducts([...products, newProduct]);
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const updateProduct = async (id, updates) => {
    try {
      const updatedProduct = await apiCall(`/api/products/${id}`, 'PUT', updates);
      if (updatedProduct) {
        setProducts(products.map(p => p._id === id ? updatedProduct : p));
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const removeProduct = async (id) => {
    try {
      await apiCall(`/api/products/${id}`, 'DELETE');
      setProducts(products.filter(p => p._id !== id));
    } catch (error) {
      console.error('Error removing product:', error);
    }
  };

  const sellProduct = async (productId, quantity) => {
    const product = products.find(p => p._id === productId);
    if (product && product.quantity >= quantity) {
      // Update product quantity
      await updateProduct(productId, { quantity: product.quantity - quantity });
      
      // Create sale record
      const saleData = {
        productId,
        productName: product.name,
        quantity,
        price: product.sellingPrice,
        total: product.sellingPrice * quantity
      };
      
      try {
        const newSale = await apiCall('/api/sales', 'POST', saleData);
        if (newSale) {
          setSales([...sales, newSale]);
        }
      } catch (error) {
        console.error('Error creating sale:', error);
      }
    }
  };

  const resetSales = async () => {
    try {
      await apiCall('/api/sales', 'DELETE');
      setSales([]);
    } catch (error) {
      console.error('Error resetting sales:', error);
    }
  };

  const generateShareableReport = () => {
    const reportId = Date.now().toString();
    const reportData = generateShareableReportData();
    
    // Save to both localStorage and sessionStorage for broader access
    localStorage.setItem(`shared-report-${reportId}`, JSON.stringify(reportData));
    sessionStorage.setItem(`shared-report-${reportId}`, JSON.stringify(reportData));
    
    // Also save to a public key for URL sharing
    const publicKey = btoa(reportId).slice(0, 8);
    localStorage.setItem(`public-report-${publicKey}`, JSON.stringify(reportData));
    
    return publicKey;
  };

  const updateSharedReports = () => {
    const sharedReports = JSON.parse(localStorage.getItem('shared-reports') || '[]');
    const updatedData = generateShareableReportData();
    
    sharedReports.forEach(reportId => {
      localStorage.setItem(`shared-report-${reportId}`, JSON.stringify(updatedData));
      sessionStorage.setItem(`shared-report-${reportId}`, JSON.stringify(updatedData));
      const publicKey = btoa(reportId).slice(0, 8);
      localStorage.setItem(`public-report-${publicKey}`, JSON.stringify(updatedData));
    });
  };

  const generateShareableReportData = () => {
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const monthlySales = sales.filter(sale => 
      isWithinInterval(new Date(sale.date), { start: monthStart, end: monthEnd })
    );

    const dailyTotals = {};
    const categoryTotals = {};
    
    monthlySales.forEach(sale => {
      const day = format(new Date(sale.date), 'dd/MM');
      dailyTotals[day] = (dailyTotals[day] || 0) + sale.total;
      
      const product = products.find(p => p.id === sale.productId);
      const category = product?.category || 'general';
      categoryTotals[category] = (categoryTotals[category] || 0) + sale.total;
    });

    return {
      sales: monthlySales,
      products,
      summary: {
        totalRevenue: monthlySales.reduce((sum, sale) => sum + sale.total, 0),
        totalItems: monthlySales.reduce((sum, sale) => sum + sale.quantity, 0),
        totalTransactions: monthlySales.length,
        dailyTotals,
        categoryTotals
      },
      lastUpdated: new Date().toISOString()
    };
  };

  useEffect(() => {
    updateSharedReports();
  }, [sales, products]);

  const addToSharedReports = (reportId) => {
    const sharedReports = JSON.parse(localStorage.getItem('shared-reports') || '[]');
    if (!sharedReports.includes(reportId)) {
      sharedReports.push(reportId);
      localStorage.setItem('shared-reports', JSON.stringify(sharedReports));
    }
  };



  // Show loading screen
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>📦 Inventory Genie</h2>
            <p>🔄 Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication if user is not logged in
  if (!user) {
    return showLogin ? (
      <Login 
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowLogin(false)}
      />
    ) : (
      <Register 
        onLogin={handleLogin}
        onSwitchToLogin={() => setShowLogin(true)}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="user-info">
          <h1>📦 Inventory Genie</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h3>Welcome, {user.username}!</h3>
            <button className="logout-button" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
        <nav className="nav-tabs">
          <button 
            className={activeTab === 'inventory' ? 'active' : ''}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button 
            className={activeTab === 'alerts' ? 'active' : ''}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts
          </button>
          <button 
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
          <button 
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>

        </nav>
      </header>

      <main className="main-content">
        {activeTab === 'inventory' && (
          <div>
            <AddProduct onAdd={addProduct} />
            <InventoryList 
              products={products} 
              onUpdate={updateProduct}
              onSell={sellProduct}
              onRemove={removeProduct}
            />
          </div>
        )}
        
        {activeTab === 'alerts' && (
          <ExpiryAlerts products={products} />
        )}
        
        {activeTab === 'reports' && (
          <SalesReport 
            sales={sales} 
            products={products} 
            onReset={resetSales}
            onGenerateShare={() => {
              const id = generateShareableReport();
              addToSharedReports(id);
              return id;
            }}
          />
        )}

        {activeTab === 'settings' && (
          <div className="settings-content">
            <h2>⚙️ Account Settings</h2>
            <div className="settings-section">
              <h3>👤 Account Information</h3>
              <div className="account-info">
                <p><strong>Username:</strong> {user?.username}</p>
                <p><strong>Member since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <DeleteAccount onDeleteAccount={handleDeleteAccount} user={user} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;