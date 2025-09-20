const fs = require('fs');
const path = require('path');

const reportsPath = path.join(__dirname, 'reports.json');

// Helper function to read the database
function readDatabase() {
  try {
    const data = fs.readFileSync(reportsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty database structure
    return { reports: [] };
  }
}

// Helper function to write to the database
function writeDatabase(data) {
  fs.writeFileSync(reportsPath, JSON.stringify(data, null, 2), 'utf8');
}

// Get all reports
function getAllReports() {
  const db = readDatabase();
  return db.reports;
}

// Get a specific report by ID
function getReportById(id) {
  const db = readDatabase();
  return db.reports.find(report => report.id === id);
}

// Add a new report
function addReport(report) {
  const db = readDatabase();
  
  // Generate a unique ID if not provided
  if (!report.id) {
    report.id = Date.now().toString();
  }
  
  // Add timestamp if not provided
  if (!report.timestamp) {
    report.timestamp = new Date().toISOString();
  }
  
  db.reports.push(report);
  writeDatabase(db);
  return report;
}

// Update an existing report
function updateReport(id, updatedData) {
  const db = readDatabase();
  const index = db.reports.findIndex(report => report.id === id);
  
  if (index === -1) {
    return null;
  }
  
  // Update the report
  db.reports[index] = { ...db.reports[index], ...updatedData };
  writeDatabase(db);
  return db.reports[index];
}

// Delete a report
function deleteReport(id) {
  const db = readDatabase();
  const initialLength = db.reports.length;
  db.reports = db.reports.filter(report => report.id !== id);
  
  if (db.reports.length === initialLength) {
    return false;
  }
  
  writeDatabase(db);
  return true;
}

module.exports = {
  getAllReports,
  getReportById,
  addReport,
  updateReport,
  deleteReport
};