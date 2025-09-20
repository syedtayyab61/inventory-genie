# Inventory Genie Reports API

This document describes the API endpoints available for managing reports in the Inventory Genie application.

## Base URL

When deployed with ngrok, your base URL will be the ngrok URL provided (e.g., `https://abc123.ngrok.io`).

## Endpoints

### Get All Reports

```
GET /api/reports
```

Returns an array of all reports.

**Response Example:**
```json
[
  {
    "id": "1687452300000",
    "title": "Monthly Inventory Summary",
    "type": "inventory",
    "timestamp": "2023-06-22T15:45:00.000Z",
    "data": {
      "totalItems": 156,
      "totalValue": 12450.75,
      "lowStockItems": 8,
      "expiringItems": 3,
      "categories": {
        "electronics": 42,
        "clothing": 68,
        "food": 24,
        "other": 22
      }
    },
    "createdBy": "admin"
  }
]
```

### Get Report by ID

```
GET /api/reports/{id}
```

Returns a single report with the specified ID.

**Response Example:**
```json
{
  "id": "1687452300000",
  "title": "Monthly Inventory Summary",
  "type": "inventory",
  "timestamp": "2023-06-22T15:45:00.000Z",
  "data": {
    "totalItems": 156,
    "totalValue": 12450.75,
    "lowStockItems": 8,
    "expiringItems": 3,
    "categories": {
      "electronics": 42,
      "clothing": 68,
      "food": 24,
      "other": 22
    }
  },
  "createdBy": "admin"
}
```

### Create New Report

```
POST /api/reports
```

Creates a new report.

**Request Body Example:**
```json
{
  "title": "Weekly Sales Report",
  "type": "sales",
  "data": {
    "totalSales": 3245.50,
    "transactions": 47,
    "averageOrderValue": 69.05,
    "topSellingItems": [
      {"name": "Wireless Headphones", "quantity": 8, "revenue": 559.92},
      {"name": "T-shirt (Medium)", "quantity": 12, "revenue": 239.88},
      {"name": "Coffee Beans (1kg)", "quantity": 6, "revenue": 119.94}
    ]
  },
  "createdBy": "manager"
}
```

**Response:** The created report with generated ID and timestamp.

### Update Report

```
PUT /api/reports/{id}
```

Updates an existing report.

**Request Body Example:**
```json
{
  "title": "Updated Weekly Sales Report",
  "data": {
    "totalSales": 3500.75,
    "transactions": 52
  }
}
```

**Response:** The updated report.

### Delete Report

```
DELETE /api/reports/{id}
```

Deletes a report.

**Response Example:**
```json
{
  "message": "Report deleted successfully"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Server Error

Error responses include a JSON object with an error message:

```json
{
  "error": "Report not found"
}
```