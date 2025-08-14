# AWS DSQL Setup Guide

## Current Status

✅ Your Next.js application has been successfully migrated from SQLite to AWS DSQL (PostgreSQL)
✅ All backend routes are updated for PostgreSQL
✅ SQLite dependencies have been removed
✅ Environment configuration is ready

## What You Need to Do Next

### 1. Get Your AWS Credentials

1. **Open AWS Console**: Go to https://console.aws.amazon.com/
2. **Navigate to IAM**: Search for "IAM" and click on "Identity and Access Management"
3. **Find Your User**: Go to "Users" and click on your username
4. **Security Credentials**: Click on the "Security credentials" tab
5. **Create Access Key**:
   - Click "Create access key"
   - Select "Application running on AWS CLI"
   - Click "Create"
   - **IMPORTANT**: Copy both the Access Key ID and Secret Access Key

### 2. Update Your .env File

Replace these placeholders in your `.env` file:

```
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
```

### 3. Test Your Connection

Run the connection test script:

```bash
node test-connection.js
```

This will tell you if your DSQL connection is working properly.

### 4. Start Your Application

Once your credentials are set up, you can start your application:

**Option 1: Full Stack (Recommended)**

```bash
npm run dev:full
```

This starts both frontend (port 3000) and backend (port 3001)

**Option 2: Frontend Only**

```bash
npm run dev
```

**Option 3: Backend Only**

```bash
npm run backend
```

## AWS DSQL Permissions

Your IAM user needs these permissions:

- `dsql:DbConnect`
- `dsql:DbConnectAdmin`
- `dsql:CreateCluster`
- `dsql:DescribeCluster`

## Current Configuration

Your DSQL endpoint: `oiabuj3e7sqnfqazfn36stbg3y.dsql.ap-northeast-1.on.aws`

- Region: ap-northeast-1
- Database: postgres
- User: admin
- Authentication: IAM (no password needed)

## Troubleshooting

### Connection Issues

- **DNS Error**: Check your internet connection and DSQL endpoint
- **Connection Refused**: Ensure your DSQL cluster is running
- **Authentication Failed**: Verify your AWS credentials are correct and have DSQL permissions

### Build Issues

- Run `npm run build` to check for compilation errors
- Check that all environment variables are set

## Support

If you encounter issues:

1. Run the test script: `node test-connection.js`
2. Check AWS CloudWatch logs for your DSQL cluster
3. Verify your IAM permissions include DSQL access
