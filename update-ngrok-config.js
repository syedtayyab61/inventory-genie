#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🌐 Ngrok URL Configuration Helper');
console.log('=====================================');
console.log('');
console.log('📋 Steps to configure ngrok URLs:');
console.log('');
console.log('1. Open http://localhost:4040 in your browser');
console.log('2. Copy the HTTPS URL for port 5001 (API server)');
console.log('3. Run this script: node update-ngrok-config.js <your-api-ngrok-url>');
console.log('');
console.log('Example:');
console.log('node update-ngrok-config.js https://abc123.ngrok-free.app');
console.log('');

if (process.argv.length < 3) {
  console.log('❌ Please provide the ngrok URL for your API server (port 5001)');
  console.log('Usage: node update-ngrok-config.js <ngrok-api-url>');
  process.exit(1);
}

const ngrokApiUrl = process.argv[2];

if (!ngrokApiUrl.startsWith('https://') || !ngrokApiUrl.includes('ngrok')) {
  console.log('❌ Please provide a valid ngrok HTTPS URL');
  console.log('Example: https://abc123.ngrok-free.app');
  process.exit(1);
}

const configFile = path.join(__dirname, 'src', 'config.js');

const newConfig = `// API Configuration - Updated for ngrok
const getApiBaseUrl = () => {
  // Ngrok API URL (automatically configured)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're running through ngrok
  const currentHost = window.location.hostname;
  
  if (currentHost.includes('ngrok-free.app') || currentHost.includes('ngrok.io')) {
    // Return the ngrok API URL
    return '${ngrokApiUrl}';
  }
  
  // Default to localhost for local development
  return 'http://localhost:5001';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Base URL:', API_BASE_URL);

export default API_BASE_URL;`;

try {
  fs.writeFileSync(configFile, newConfig);
  console.log('✅ Configuration updated successfully!');
  console.log('📝 Updated src/config.js with ngrok API URL:', ngrokApiUrl);
  console.log('');
  console.log('🔄 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Copy build files: xcopy build\\* public\\ /E /Y');
  console.log('3. Your app will be accessible via the ngrok URL for port 8080');
  console.log('');
} catch (error) {
  console.log('❌ Error updating configuration:', error.message);
}