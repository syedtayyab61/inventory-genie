const http = require('http');

// Replace with your ngrok URL when testing
const API_BASE_URL = 'http://localhost';
let PORT = 4001; // This will be overridden if you provide a command line argument

// Check if a port is provided as a command line argument
if (process.argv.length > 2) {
  PORT = parseInt(process.argv[2]);
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Reports API...');
  console.log(`🔗 Using port: ${PORT}`);
  console.log('-----------------------------------');
  
  try {
    // Test 1: Get all reports
    console.log('Test 1: Get all reports');
    const getAllResult = await makeRequest('GET', '/api/reports');
    console.log(`Status: ${getAllResult.statusCode}`);
    console.log(`Found ${getAllResult.data.length} reports`);
    console.log('-----------------------------------');
    
    // Test 2: Get a specific report
    if (getAllResult.data.length > 0) {
      const firstReportId = getAllResult.data[0].id;
      console.log(`Test 2: Get report by ID (${firstReportId})`);
      const getOneResult = await makeRequest('GET', `/api/reports/${firstReportId}`);
      console.log(`Status: ${getOneResult.statusCode}`);
      console.log(`Report title: ${getOneResult.data.title}`);
      console.log('-----------------------------------');
    }
    
    // Test 3: Create a new report
    console.log('Test 3: Create a new report');
    const newReport = {
      title: "Test Report",
      type: "test",
      data: {
        testValue: 100,
        testItems: ["item1", "item2"]
      },
      createdBy: "api-test"
    };
    
    const createResult = await makeRequest('POST', '/api/reports', newReport);
    console.log(`Status: ${createResult.statusCode}`);
    console.log(`Created report with ID: ${createResult.data.id}`);
    const createdReportId = createResult.data.id;
    console.log('-----------------------------------');
    
    // Test 4: Update the report
    console.log(`Test 4: Update report (${createdReportId})`);
    const updateData = {
      title: "Updated Test Report",
      data: {
        testValue: 200
      }
    };
    
    const updateResult = await makeRequest('PUT', `/api/reports/${createdReportId}`, updateData);
    console.log(`Status: ${updateResult.statusCode}`);
    console.log(`Updated title: ${updateResult.data.title}`);
    console.log('-----------------------------------');
    
    // Test 5: Delete the report
    console.log(`Test 5: Delete report (${createdReportId})`);
    const deleteResult = await makeRequest('DELETE', `/api/reports/${createdReportId}`);
    console.log(`Status: ${deleteResult.statusCode}`);
    console.log(`Result: ${JSON.stringify(deleteResult.data)}`);
    console.log('-----------------------------------');
    
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Error during tests:', error.message);
    console.log('\n💡 Make sure the server is running on the specified port');
  }
}

runTests();