# Job Portal — Integration API Reference

> **Base URL:** `http://localhost:5000/api/integration`  
> **Production:** replace with your deployed domain.

---

## Authentication

Write operations require an API key sent in the request **header**:

```
x-api-key: jp-integration-key-2026-secure
```

Read operations are **public** — no key required.

---

## Endpoints

### 🟢 GET `/health`
Check if the Integration API is running.

**No auth required.**

```bash
curl http://localhost:5000/api/integration/health
```

Response:
```json
{
  "success": true,
  "message": "Integration API is up",
  "timestamp": "2026-04-01T00:00:00.000Z",
  "endpoints": { ... }
}
```

---

### 🟢 GET `/jobs`
Fetch all published jobs. Supports **pagination** and **filtering**.

**No auth required.**

| Query Param | Example | Description |
|-------------|---------|-------------|
| `source` | `?source=company-xyz` | Filter by who posted |
| `category` | `?category=Programming` | Filter by job category |
| `level` | `?level=Entry` | Filter by experience level |
| `location` | `?location=Delhi` | Case-insensitive partial match |
| `companyEmail` | `?companyEmail=hr@abc.com` | Filter by company |
| `page` | `?page=2` | Page number (default: 1) |
| `limit` | `?limit=10` | Results per page (default: 20, max: 100) |

```bash
curl "http://localhost:5000/api/integration/jobs?source=company-xyz&category=Programming&page=1&limit=10"
```

Response:
```json
{
  "success": true,
  "total": 45,
  "page": 1,
  "pages": 5,
  "count": 10,
  "jobs": [ { ... } ]
}
```

---

### 🟢 GET `/jobs/:externalJobId`
Fetch a single job by its `externalJobId`.

**No auth required.**

| Query Param | Description |
|-------------|-------------|
| `source` | Optional — scope lookup to a specific source |

```bash
curl "http://localhost:5000/api/integration/jobs/JOB-001?source=company-xyz"
```

Response:
```json
{ "success": true, "job": { ... } }
```

---

### 🔒 POST `/jobs`
Create a new job. **Requires `x-api-key` header.**

**Request body:**
```json
{
  "title": "Backend Developer",
  "description": "Node.js + MongoDB role",
  "location": "Delhi",
  "salary": 900000,
  "level": "Mid",
  "category": "Programming",
  "source": "company-xyz",
  "externalJobId": "JOB-001",
  "company": {
    "name": "ABC Technologies",
    "email": "hr@abctech.com"
  }
}
```

| Field | Required | Valid values |
|-------|----------|-------------|
| `title` | ✅ | Any string |
| `description` | ✅ | Any string |
| `location` | ✅ | Any string |
| `salary` | ✅ | Positive number (annual, INR) |
| `level` | ✅ | `Entry`, `Mid`, `Senior`, `Lead`, `Manager` |
| `category` | ✅ | `Programming`, `Data Science`, `Designing`, `Networking`, `Management`, `Marketing`, `Cybersecurity` |
| `company.name` | ✅ | Any string |
| `company.email` | ✅ | Valid email |
| `source` | ❌ | Your system's identifier, e.g. `"company-xyz"` |
| `externalJobId` | ❌ | Your internal job ID, e.g. `"JOB-001"` |

```bash
curl -X POST http://localhost:5000/api/integration/jobs \
  -H "Content-Type: application/json" \
  -H "x-api-key: jp-integration-key-2026-secure" \
  -d '{ "title":"Backend Dev", "description":"Node.js role", "location":"Delhi", "salary":900000, "level":"Mid", "category":"Programming", "source":"company-xyz", "externalJobId":"JOB-001", "company":{"name":"ABC Tech","email":"hr@abctech.com"} }'
```

Response `201`:
```json
{ "success": true, "message": "Job created successfully", "job": { ... } }
```

---

### 🔒 PATCH `/jobs/:externalJobId`
Update fields of an existing job. **Requires `x-api-key` header.**

| Query Param | Description |
|-------------|-------------|
| `source` | Optional — scope lookup to a specific source |

**Updatable fields:** `title`, `description`, `location`, `salary`, `level`, `category`, `visible`

```bash
curl -X PATCH "http://localhost:5000/api/integration/jobs/JOB-001?source=company-xyz" \
  -H "Content-Type: application/json" \
  -H "x-api-key: jp-integration-key-2026-secure" \
  -d '{ "salary": 1200000, "level": "Senior" }'
```

Response `200`:
```json
{ "success": true, "message": "Job updated successfully", "job": { ... } }
```

---

### 🔒 DELETE `/jobs/:externalJobId`
Permanently remove a job. **Requires `x-api-key` header.**

| Query Param | Description |
|-------------|-------------|
| `source` | Optional — scope lookup to a specific source |

```bash
curl -X DELETE "http://localhost:5000/api/integration/jobs/JOB-001?source=company-xyz" \
  -H "x-api-key: jp-integration-key-2026-secure"
```

Response `200`:
```json
{ "success": true, "message": "Job deleted successfully", "deletedJobId": "JOB-001" }
```

---

## Rate Limits

| Endpoint type | Limit |
|---------------|-------|
| GET (read) | 300 requests / 15 minutes per IP |
| POST / PATCH / DELETE (write) | 60 requests / 15 minutes per IP |

Exceeding the limit returns HTTP `429 Too Many Requests`.

---

## Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| `200` | Success |
| `201` | Job created |
| `400` | Validation error (check `message` field) |
| `401` | Missing or invalid `x-api-key` |
| `404` | Job not found |
| `409` | Duplicate `externalJobId` for this `source` |
| `429` | Rate limit exceeded |
| `500` | Server error |
| `503` | `INTEGRATION_API_KEY` not set in `.env` |

---

## Frontend Embed Example

Paste this in any HTML file to show your portal's jobs:

```html
<div id="jobs"></div>
<script>
  fetch("http://localhost:5000/api/integration/jobs?source=company-xyz")
    .then(r => r.json())
    .then(({ jobs }) => {
      document.getElementById("jobs").innerHTML = jobs.map(j => `
        <div style="border:1px solid #ddd;padding:16px;margin:8px;border-radius:8px">
          <h3>${j.title} — ${j.companyId?.name}</h3>
          <p>📍 ${j.location} &nbsp;|&nbsp; 💼 ${j.level} &nbsp;|&nbsp; 💰 ₹${j.salary.toLocaleString('en-IN')}</p>
          <p>${j.description}</p>
        </div>
      `).join("");
    });
</script>
```

## Backend Push Example (Node.js)

```js
// Run this on YOUR company's server — NEVER in the browser
const res = await fetch("http://localhost:5000/api/integration/jobs", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "jp-integration-key-2026-secure"
  },
  body: JSON.stringify({
    title: "React Developer",
    description: "Build amazing UIs with React",
    location: "Mumbai",
    salary: 800000,
    level: "Entry",
    category: "Programming",
    source: "company-xyz",
    externalJobId: "XYZ-2026-001",
    company: { name: "XYZ Corp", email: "hr@xyz.com" }
  })
});
const data = await res.json();
console.log(data); // { success: true, job: { ... } }
```

---

## Security Notes

- ✅ Keep `INTEGRATION_API_KEY` **server-side only** — never expose in browser code
- ✅ For production, rotate the key periodically and update your partners
- ✅ Use HTTPS in production so the key travels encrypted
- ✅ Add your partner's frontend domain to `CORS_ORIGINS` in `.env`
