import React, { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  // LineElement,
  // PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, 
  ArcElement, Title, Tooltip, Legend
);

const SalesReport = ({ sales, products, onReset, onGenerateShare }) => {
  
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const monthlySales = sales.filter(sale => 
    isWithinInterval(new Date(sale.date), { start: monthStart, end: monthEnd })
  );

  const totalRevenue = monthlySales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = monthlySales.reduce((sum, sale) => sum + sale.quantity, 0);

  // Daily sales chart
  const dailySalesData = () => {
    const dailyTotals = {};
    monthlySales.forEach(sale => {
      const day = format(new Date(sale.date), 'dd/MM');
      dailyTotals[day] = (dailyTotals[day] || 0) + sale.total;
    });

    return {
      labels: Object.keys(dailyTotals),
      datasets: [{
        label: 'Daily Revenue',
        data: Object.values(dailyTotals),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };
  };

  // Top products chart
  const topProductsData = () => {
    const productSales = {};
    monthlySales.forEach(sale => {
      productSales[sale.productName] = (productSales[sale.productName] || 0) + sale.quantity;
    });

    const sortedProducts = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      labels: sortedProducts.map(([name]) => name),
      datasets: [{
        label: 'Units Sold',
        data: sortedProducts.map(([,quantity]) => quantity),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ]
      }]
    };
  };

  // Category distribution
  const categoryData = () => {
    const categoryTotals = {};
    monthlySales.forEach(sale => {
      const product = products.find(p => p.id === sale.productId);
      const category = product?.category || 'general';
      categoryTotals[category] = (categoryTotals[category] || 0) + sale.total;
    });

    return {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ]
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true }
    }
  };

  // Excel export function
  const exportToExcel = () => {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['Sales Report Summary'],
        [''],
        ['Report Period:', `${format(monthStart, 'MMMM yyyy')}`],
        ['Generated On:', format(new Date(), 'dd/MM/yyyy HH:mm')],
        [''],
        ['Total Revenue:', `$${totalRevenue.toFixed(2)}`],
        ['Total Items Sold:', totalItems],
        ['Number of Transactions:', monthlySales.length],
        ['Average Transaction Value:', `$${monthlySales.length > 0 ? (totalRevenue / monthlySales.length).toFixed(2) : '0.00'}`]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Sales Data Sheet
      const salesData = [
        ['Date', 'Product Name', 'Category', 'Quantity', 'Unit Price', 'Total Amount', 'Product ID']
      ];
      
      monthlySales.forEach(sale => {
        const product = products.find(p => p._id === sale.productId);
        salesData.push([
          format(new Date(sale.date), 'dd/MM/yyyy HH:mm'),
          product?.name || 'Unknown Product',
          product?.category || 'General',
          sale.quantity,
          `$${(sale.total / sale.quantity).toFixed(2)}`,
          `$${sale.total.toFixed(2)}`,
          sale.productId
        ]);
      });
      
      const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales Data');
      
      // Product Performance Sheet
      const productTotals = {};
      monthlySales.forEach(sale => {
        const product = products.find(p => p._id === sale.productId);
        const productName = product?.name || 'Unknown Product';
        if (!productTotals[productName]) {
          productTotals[productName] = {
            quantity: 0,
            revenue: 0,
            transactions: 0,
            category: product?.category || 'General'
          };
        }
        productTotals[productName].quantity += sale.quantity;
        productTotals[productName].revenue += sale.total;
        productTotals[productName].transactions += 1;
      });
      
      const productData = [
        ['Product Name', 'Category', 'Total Quantity Sold', 'Total Revenue', 'Number of Transactions', 'Average per Transaction']
      ];
      
      Object.entries(productTotals)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .forEach(([productName, data]) => {
          productData.push([
            productName,
            data.category,
            data.quantity,
            `$${data.revenue.toFixed(2)}`,
            data.transactions,
            `$${(data.revenue / data.transactions).toFixed(2)}`
          ]);
        });
      
      const productSheet = XLSX.utils.aoa_to_sheet(productData);
      XLSX.utils.book_append_sheet(workbook, productSheet, 'Product Performance');
      
      // Daily Sales Sheet
      const dailyTotals = {};
      monthlySales.forEach(sale => {
        const day = format(new Date(sale.date), 'dd/MM/yyyy');
        dailyTotals[day] = (dailyTotals[day] || 0) + sale.total;
      });
      
      const dailyData = [
        ['Date', 'Daily Revenue']
      ];
      
      Object.entries(dailyTotals)
        .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')))
        .forEach(([date, revenue]) => {
          dailyData.push([date, `$${revenue.toFixed(2)}`]);
        });
      
      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Sales');
      
      // Export file
      const fileName = `Inventory_Sales_Report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert(`Excel report exported successfully!\nFile: ${fileName}\n\nThe report includes:\n• Summary overview\n• Detailed sales data\n• Product performance analysis\n• Daily sales breakdown`);
      
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Failed to export Excel report. Please try again.');
    }
  };

  return (
    <div className="sales-report">
      <div className="report-header">
        <h2>📊 Sales Reports</h2>
        <div className="report-actions">
          <button 
            className="excel-btn"
            onClick={exportToExcel}
            title="Download detailed Excel report with multiple sheets"
          >
            📊 Export to Excel
          </button>
          <button 
            className="share-btn"
            onClick={() => {
              const reportId = onGenerateShare();
              const shareUrl = `${window.location.origin}${window.location.pathname}?report=${reportId}`;
              navigator.clipboard.writeText(shareUrl);
              alert(`Report link copied to clipboard!\n\nShare this link: ${shareUrl}\n\nThe report will auto-update with new sales data.`);
            }}
          >
            🔗 Share Live Report
          </button>
          <button 
            className="reset-btn"
            onClick={() => {
              if (window.confirm('Reset all sales data? This cannot be undone.')) {
                onReset();
              }
            }}
          >
            🔄 Reset Data
          </button>
        </div>
      </div>
      
      <div className="report-summary">
        <div className="summary-card">
          <h3>Monthly Revenue</h3>
          <p className="amount">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Items Sold</h3>
          <p className="amount">{totalItems}</p>
        </div>
        <div className="summary-card">
          <h3>Transactions</h3>
          <p className="amount">{monthlySales.length}</p>
        </div>
        <div className="summary-card">
          <h3>Avg. Sale</h3>
          <p className="amount">
            ₹{monthlySales.length ? (totalRevenue / monthlySales.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section">
          <h3>Daily Sales Trend</h3>
          <Bar data={dailySalesData()} options={{...chartOptions, plugins: {...chartOptions.plugins, title: {display: true, text: 'Daily Revenue'}}}} />
        </div>

        <div className="chart-section">
          <h3>Top Products</h3>
          <Bar data={topProductsData()} options={{...chartOptions, plugins: {...chartOptions.plugins, title: {display: true, text: 'Best Selling Products'}}}} />
        </div>

        <div className="chart-section">
          <h3>Sales by Category</h3>
          <Doughnut data={categoryData()} options={{...chartOptions, plugins: {...chartOptions.plugins, title: {display: true, text: 'Revenue by Category'}}}} />
        </div>
      </div>

      <div className="recent-sales">
        <h3>Recent Sales</h3>
        <div className="sales-list">
          {sales.slice(-10).reverse().map(sale => (
            <div key={sale.id} className="sale-item">
              <span className="product">{sale.productName}</span>
              <span className="quantity">Qty: {sale.quantity}</span>
              <span className="total">₹{sale.total.toFixed(2)}</span>
              <span className="date">{format(new Date(sale.date), 'dd/MM HH:mm')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesReport;