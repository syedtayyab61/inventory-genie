const http = require('http');
const fs = require('fs');
const path = require('path');

// Track server instance for proper cleanup
let serverInstance = null;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.ico': 'image/x-icon'
};

const PORT = 4002;

const server = http.createServer((req, res) => {
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

serverInstance = server.listen(PORT, () => {
  console.log('🚀 Inventory Genie Server Started!');
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log('\n⚠️  Keep this terminal open');
  console.log('\n🎯 Your website features:');
  console.log('   ✓ Inventory management');
  console.log('   ✓ Product management');
  console.log('   ✓ Sales tracking');
  console.log('   ✓ Live reports');
  console.log('   ✓ Team collaboration');
  console.log('   ✓ Demo mode');
});

console.log('\n📋 Access Instructions:');
console.log('1. Keep this terminal running');
console.log('2. Access the app at the local URL above');
console.log('3. For network access, use your local IP address');
console.log('   Example: http://192.168.1.x:4002\n');

// Handle termination signals
function cleanup() {
  console.log('\n🛑 Shutting down server...');
  
  if (serverInstance) {
    try {
      serverInstance.close(() => {
        console.log('✓ Server stopped');
        process.exit(0);
      });
    } catch (err) {
      console.error('Failed to stop server:', err.message);
      process.exit(1);
    }
  } else {
    process.exit(0);
  }
}

// Handle termination signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);