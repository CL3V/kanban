const { Client } = require("pg");
const { Signer } = require("@aws-sdk/rds-signer");
require("dotenv").config();

async function checkDatabaseConnection() {
  console.log("🔍 Checking AWS DSQL connection status...\n");

  // Check environment variables
  console.log("📋 Configuration Check:");
  console.log(
    `   DSQL_ENDPOINT: ${process.env.DSQL_ENDPOINT ? "✅ Set" : "❌ Missing"}`
  );
  console.log(
    `   AWS_ACCESS_KEY_ID: ${
      process.env.AWS_ACCESS_KEY_ID ? "✅ Set" : "❌ Missing"
    }`
  );
  console.log(
    `   AWS_SECRET_ACCESS_KEY: ${
      process.env.AWS_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Missing"
    }`
  );
  console.log(`   AWS_REGION: ${process.env.AWS_REGION || "Not set"}`);
  console.log(`   DSQL_DATABASE: ${process.env.DSQL_DATABASE || "postgres"}`);
  console.log(`   DSQL_USER: ${process.env.DSQL_USER || "admin"}\n`);

  if (
    !process.env.DSQL_ENDPOINT ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    console.log(
      "❌ Missing required configuration. Please check your .env file."
    );
    return false;
  }

  try {
    console.log("🔐 Generating IAM authentication token...");

    const signer = new Signer({
      region: process.env.AWS_REGION || "ap-northeast-1",
      hostname: process.env.DSQL_ENDPOINT,
      port: parseInt(process.env.DSQL_PORT || "5432"),
      username: process.env.DSQL_USER || "admin",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const token = await signer.getAuthToken();
    console.log("✅ IAM token generated successfully");

    console.log("🔌 Attempting database connection...");
    const client = new Client({
      host: process.env.DSQL_ENDPOINT,
      port: parseInt(process.env.DSQL_PORT || "5432"),
      database: process.env.DSQL_DATABASE || "postgres",
      user: process.env.DSQL_USER || "admin",
      password: token,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    console.log("✅ Successfully connected to AWS DSQL!");

    // Test basic query
    const result = await client.query("SELECT version()");
    console.log("📊 Database version:", result.rows[0].version);

    // Check if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log("\n📋 Existing tables:");
      tablesResult.rows.forEach((row) => {
        console.log(`   ✅ ${row.table_name}`);
      });
    } else {
      console.log(
        "\n📋 No tables found. Run setup-dsql-final.js to create schema."
      );
    }

    await client.end();
    console.log("\n🎉 Database connection successful!");
    console.log("🚀 Your application should work properly now.");

    return true;
  } catch (error) {
    console.log("\n❌ Database connection failed:");
    console.log(`   Error: ${error.message}`);

    if (error.code === "ENOTFOUND") {
      console.log("\n💡 Troubleshooting:");
      console.log("   - Check if your DSQL endpoint is correct");
      console.log("   - Verify internet connection");
    } else if (error.message.includes("access denied")) {
      console.log("\n💡 Troubleshooting:");
      console.log("   - Check if your AWS credentials are valid");
      console.log("   - Verify your IAM user has DSQL permissions");
      console.log("   - Ensure your DSQL cluster is running");
    } else if (error.message.includes("authentication")) {
      console.log("\n💡 Troubleshooting:");
      console.log("   - Your AWS credentials may be incorrect");
      console.log("   - Check if your IAM user has the required permissions");
    }

    return false;
  }
}

if (require.main === module) {
  checkDatabaseConnection().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkDatabaseConnection };
