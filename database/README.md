# Inventory Genie Reports Database

This directory contains the database files and API handlers for the Inventory Genie reports system.

## Overview

The reports database provides a simple JSON-based storage system for inventory and sales reports. It includes:

- A JSON file (`reports.json`) that stores all report data
- A database handler module (`db.js`) that provides CRUD operations
- API endpoints integrated into the main server

## Database Structure

Reports are stored in the following format:

```json
{
  "reports": [
    {
      "id": "1687452300000",
      "title": "Monthly Inventory Summary",
      "type": "inventory",
      "timestamp": "2023-06-22T15:45:00.000Z",
      "data": {
        // Report-specific data structure
      },
      "createdBy": "admin"
    }
  ]
}
```

## Report Types

The system supports various report types:

1. **Inventory Reports** (`type: "inventory"`)
   - Total items count
   - Total inventory value
   - Low stock items
   - Expiring items
   - Category breakdown

2. **Sales Reports** (`type: "sales"`)
   - Total sales
   - Transaction count
   - Average order value
   - Top selling items

3. **Custom Reports** (any other type)
   - Flexible data structure based on needs

## API Usage

See the `API_DOCS.md` file for detailed API documentation.

## Testing

You can test the API using the `test-reports-api.js` script:

```
node test-reports-api.js [PORT]
```

Where `[PORT]` is the port number your server is running on.

## Deployment

The reports API is automatically deployed when you run the ngrok deployment script:

```
node deploy-ngrok.js
```

or use the batch file:

```
deploy-with-reports.bat
```