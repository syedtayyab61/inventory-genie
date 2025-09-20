import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';

const ShareableReport = ({ reportId }) => {
  const [reportData, setReportData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const loadReport = () => {
      // Try multiple storage methods for universal access
      let data = localStorage.getItem(`public-report-${reportId}`) ||
                localStorage.getItem(`shared-report-${reportId}`) ||
                sessionStorage.getItem(`shared-report-${reportId}`);
      
      if (data) {
        const parsed = JSON.parse(data);
        setReportData(parsed);
        setLastUpdated(parsed.lastUpdated);
      }
    };

    loadReport();
    const interval = setInterval(loadReport, 2000);
    return () => clearInterval(interval);
  }, [reportId]);

  if (!reportData) {
    return <div className="loading">Loading report...</div>;
  }

  const { sales, products, summary } = reportData;

  const dailySalesData = {
    labels: Object.keys(summary.dailyTotals || {}),
    datasets: [{
      label: 'Daily Revenue',
      data: Object.values(summary.dailyTotals || {}),
      backgroundColor: 'rgba(54, 162, 235, 0.6)'
    }]
  };

  const categoryData = {
    labels: Object.keys(summary.categoryTotals || {}),
    datasets: [{
      data: Object.values(summary.categoryTotals || {}),
      backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 205, 86, 0.6)', 'rgba(75, 192, 192, 0.6)']
    }]
  };

  return (
    <div className="shareable-report">
      <div className="report-header">
        <h1>📊 Live Sales Report</h1>
        <div className="update-info">
          Last updated: {lastUpdated ? format(new Date(lastUpdated), 'dd/MM/yyyy HH:mm:ss') : 'Never'}
          <span className="live-indicator">🟢 LIVE</span>
        </div>
      </div>

      <div className="report-summary">
        <div className="summary-card">
          <h3>Monthly Revenue</h3>
          <p className="amount">₹{(summary.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Items Sold</h3>
          <p className="amount">{summary.totalItems || 0}</p>
        </div>
        <div className="summary-card">
          <h3>Transactions</h3>
          <p className="amount">{summary.totalTransactions || 0}</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section">
          <h3>Daily Sales Trend</h3>
          <Bar data={dailySalesData} options={{ responsive: true }} />
        </div>
        <div className="chart-section">
          <h3>Sales by Category</h3>
          <Doughnut data={categoryData} options={{ responsive: true }} />
        </div>
      </div>

      <div className="recent-sales">
        <h3>Recent Sales</h3>
        {(sales || []).slice(-5).reverse().map(sale => (
          <div key={sale.id} className="sale-item">
            <span>{sale.productName}</span>
            <span>Qty: {sale.quantity}</span>
            <span>₹{sale.total.toFixed(2)}</span>
            <span>{format(new Date(sale.date), 'dd/MM HH:mm')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShareableReport;