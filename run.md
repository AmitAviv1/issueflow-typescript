# IssueFlow – Setup and Run Guide

## Prerequisites
- Node.js v18+
- Docker Desktop

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Start the database
```bash
docker compose up -d
```
This starts a PostgreSQL database on port 5432 using the credentials in `compose.yml`.

### 3. Start the application
```bash
npm run start:dev
```
The app runs on http://localhost:3000

## API Overview

| Resource       | Base URL                          |
|----------------|-----------------------------------|
| Users          | /users                            |
| Auth           | /auth                             |
| Projects       | /projects                         |
| Tickets        | /tickets                          |
| Comments       | /tickets/:ticketId/comments       |
| Dependencies   | /tickets/:ticketId/dependencies   |
| Attachments    | /tickets/:ticketId/attachments    |
| Audit Logs     | /audit-logs                       |
| Mentions       | /users/:userId/mentions           |
| Workload       | /projects/:projectId/workload     |

## Run Tests
```bash
npm run test
```

## Run Tests with Coverage
```bash
npm run test:cov
```

## Build for Production
```bash
npm run build
npm run start:prod
```
