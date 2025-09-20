const { exec } = require('child_process');

// Function to find and kill processes on specific ports
function killProcessOnPort(port) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} | grep LISTEN | awk '{print $2}'`;
    
    exec(command, (error, stdout) => {
      if (error) {
        console.log(`No process found on port ${port}`);
        resolve();
        return;
      }
      
      if (process.platform === 'win32') {
        // Parse Windows output
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[4];
            console.log(`Killing process ${pid} on port ${port}`);
            exec(`taskkill /F /PID ${pid}`, (err) => {
              if (err) {
                console.error(`Failed to kill process ${pid}: ${err.message}`);
              } else {
                console.log(`Successfully terminated process ${pid}`);
              }
              resolve();
            });
          }
        }
      } else {
        // Parse Unix output
        const pids = stdout.trim().split('\n');
        if (pids.length > 0 && pids[0]) {
          console.log(`Killing process ${pids[0]} on port ${port}`);
          exec(`kill -9 ${pids[0]}`, (err) => {
            if (err) {
              console.error(`Failed to kill process ${pids[0]}: ${err.message}`);
            } else {
              console.log(`Successfully terminated process ${pids[0]}`);
            }
            resolve();
          });
        } else {
          resolve();
        }
      }
    });
  });
}



async function cleanup() {
  console.log('Cleaning up processes...');
  
  // Kill processes on common ports
  await killProcessOnPort(4002); // start-server-only.js
  await killProcessOnPort(3000); // React development server
  
  console.log('Cleanup complete!');
}

// Run cleanup
cleanup().then(() => {
  console.log('All tasks have been terminated.');
});

// Handle script termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Cleaning up before exit...');
  cleanup().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Cleaning up before exit...');
  cleanup().then(() => process.exit(0));
});

// If this script is run directly
if (require.main === module) {
  cleanup().then(() => process.exit(0));
}