const ngrok = require('ngrok');
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./database/db');
const { exec } = require('child_process');

const AUTH_TOKEN = '2ymQTenVBX7xztqdWlB13yo83Nt_3Ge7uX4n8N4h4srN1qGXf';

// Find available port
const getAvailablePort = () => {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
};

// Kill any existing ngrok processes
function killNgrokProcesses() {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' ? 'taskkill /F /IM ngrok.exe' : 'pkill -f ngrok';
    exec(command, () => resolve());
  });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.ico': 'image/x-icon'
};

async function startServer() {
  // Get a random available port
  const PORT = await getAvailablePort();
  
  const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    // Handle API requests
    if (req.url.startsWith('/api/')) {
      handleApiRequest(req, res);
      return;
    }
    
    // Serve static files
    let filePath = path.join(__dirname, 'build', req.url === '/' ? 'index.html' : req.url);
    
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, 'build', 'index.html');
    }

    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });

  server.listen(PORT, async () => {
    console.log(`🚀 Local server started on port ${PORT}`);
    
    try {
      // Kill any existing ngrok processes first
      await killNgrokProcesses();
      
      // Wait a moment for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set auth token and connect
      await ngrok.authtoken(AUTH_TOKEN);
      const url = await ngrok.connect({
        addr: PORT,
        authtoken: AUTH_TOKEN
      });
      
      console.log(`\n✅ Inventory Genie is live at: ${url}`);
      console.log('\n📱 Share this URL with anyone worldwide!');
      
      console.log('\n📊 Reports API:');
      console.log(`   GET    ${url}/api/reports       - Get all reports`);
      console.log(`   GET    ${url}/api/reports/{id}  - Get report by ID`);
      console.log(`   POST   ${url}/api/reports       - Create new report`);
      console.log(`   PUT    ${url}/api/reports/{id}  - Update report`);
      console.log(`   DELETE ${url}/api/reports/{id}  - Delete report`);
      console.log('   See database/API_DOCS.md for more details');
      
      console.log('\n🎯 Features available:');
      console.log('   ✓ Inventory management');
      console.log('   ✓ Product management');
      console.log('   ✓ Sales tracking');
      console.log('   ✓ Live reports');
      console.log('   ✓ Team collaboration');
      console.log('   ✓ Demo mode');
      console.log('\n⚠️  Keep this window open');
      console.log('   Press Ctrl+C to stop\n');
      
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the auth token is correct');
      console.log('3. Make sure no other ngrok instances are running');
      process.exit(1);
    }
  });

  // Handle termination signals
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await ngrok.kill();
    process.exit(0);
  });
}

// Function to handle API requests
async function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const endpoint = url.pathname;
  
  // Set JSON content type for API responses
  res.setHeader('Content-Type', 'application/json');
  
  // Reports API endpoints
  if (endpoint === '/api/reports') {
    // GET all reports
    if (req.method === 'GET') {
      const reports = db.getAllReports();
      res.writeHead(200);
      res.end(JSON.stringify(reports));
      return;
    }
    
    // POST new report
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const report = JSON.parse(body);
          const savedReport = db.addReport(report);
          res.writeHead(201);
          res.end(JSON.stringify(savedReport));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid report data' }));
        }
      });
      return;
    }
  }
  
  // Single report endpoints
  if (endpoint.match(/^\/api\/reports\/[\w-]+$/)) {
    const id = endpoint.split('/').pop();
    
    // GET report by ID
    if (req.method === 'GET') {
      const report = db.getReportById(id);
      if (report) {
        res.writeHead(200);
        res.end(JSON.stringify(report));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Report not found' }));
      }
      return;
    }
    
    // PUT/UPDATE report
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const updatedData = JSON.parse(body);
          const updatedReport = db.updateReport(id, updatedData);
          
          if (updatedReport) {
            res.writeHead(200);
            res.end(JSON.stringify(updatedReport));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Report not found' }));
          }
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid report data' }));
        }
      });
      return;
    }
    
    // DELETE report
    if (req.method === 'DELETE') {
      const success = db.deleteReport(id);
      if (success) {
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Report deleted successfully' }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Report not found' }));
      }
      return;
    }
  }
  
  // If no API endpoint matched
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'API endpoint not found' }));
}

startServer();