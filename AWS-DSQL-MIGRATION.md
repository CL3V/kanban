# AWS DSQL Migration Guide

This document explains the migration from SQLite to AWS DSQL (PostgreSQL) for the Kanban Board application.

## What Changed

### 1. Database System

- **Before**: SQLite with `sqlite3` library
- **After**: AWS DSQL (PostgreSQL) with `pg` client library and AWS SDK

### 2. Package Dependencies

- **Added**:
  - `@aws-sdk/client-dsql`: AWS DSQL SDK client
  - `pg`: PostgreSQL client library
  - `@types/pg`: TypeScript types for pg
- **Removed**:
  - `sqlite3`: SQLite database library

### 3. Database Schema Changes

- **ID Fields**: Changed from TEXT to UUID with `gen_random_uuid()` default
- **Timestamps**: Changed from DATETIME to TIMESTAMP
- **SQL Syntax**: Updated from SQLite (`?` placeholders) to PostgreSQL (`$1, $2, ...` placeholders)
- **Functions**:
  - `CURRENT_TIMESTAMP` instead of manual timestamp strings
  - PostgreSQL-specific functions like `gen_random_uuid()`

### 4. Database Connection

- **Before**: Local file-based SQLite database
- **After**: Network-based AWS DSQL connection with authentication

## File Changes

### New Files Created:

1. `backend/database/postgres-db.ts` - New PostgreSQL database configuration
2. `backend/database/migrate.ts` - Migration utility with sample data
3. `.env.example` - Updated with AWS DSQL configuration

### Updated Files:

1. `package.json` - Updated dependencies
2. `backend/server.ts` - Updated to use async database initialization
3. All route files in `backend/routes/`:
   - `projects.ts`
   - `boards.ts`
   - `columns.ts`
   - `tasks.ts`
   - `members.ts`
4. `README.md` - Updated documentation

## Environment Variables Required

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# AWS DSQL Configuration
DSQL_ENDPOINT=your-dsql-endpoint.dsql.us-east-1.on.aws
DSQL_PORT=5432
DSQL_DATABASE=kanban
DSQL_USER=your_dsql_user
DSQL_PASSWORD=your_dsql_password
DSQL_CLUSTER_ARN=arn:aws:dsql:us-east-1:your-account:cluster/your-cluster-id
DSQL_SECRET_ARN=arn:aws:secretsmanager:us-east-1:your-account:secret:your-secret-name
```

## Key Technical Changes

### 1. Query Syntax

**Before (SQLite)**:

```javascript
db.run("INSERT INTO projects (id, name) VALUES (?, ?)", [id, name], callback);
```

**After (PostgreSQL)**:

```javascript
const result = await query(
  "INSERT INTO projects (id, name) VALUES ($1, $2) RETURNING *",
  [id, name]
);
```

### 2. Async/Await Pattern

- All database operations are now async/await instead of callback-based
- Better error handling with try/catch blocks
- Returning results directly instead of using callbacks

### 3. Database Initialization

- Tables are created with PostgreSQL-specific syntax
- Added indexes for better performance
- UUID generation handled by PostgreSQL

### 4. Transaction Handling

- PostgreSQL transactions using `BEGIN`, `COMMIT`, `ROLLBACK`
- Better transaction management in batch operations

## Benefits of Migration

1. **Scalability**: AWS DSQL provides better scalability than SQLite
2. **Concurrent Access**: PostgreSQL handles multiple connections better
3. **Advanced Features**: Access to PostgreSQL's advanced features
4. **Managed Service**: AWS handles backups, scaling, and maintenance
5. **Security**: Better authentication and encryption options
6. **Performance**: Optimized for cloud workloads

## Migration Steps for Existing Data

If you have existing SQLite data, you would need to:

1. Export data from SQLite
2. Transform data format (mainly UUID generation)
3. Import into AWS DSQL
4. Update application configuration

The `migrate.ts` file provides sample data insertion for testing the new setup.

## Testing the Migration

1. Set up your AWS DSQL instance
2. Configure environment variables
3. Run `npm install` to get new dependencies
4. Start the backend: `npm run backend`
5. The database tables will be created automatically
6. Optionally run the migration script to add sample data
7. Test all API endpoints to ensure functionality

## Rollback Plan

To rollback to SQLite if needed:

1. Restore original `package.json`
2. Restore original route files
3. Use `backend/database/db.ts` instead of `postgres-db.ts`
4. Remove AWS environment variables

The migration maintains the same API interface, so the frontend requires no changes.
