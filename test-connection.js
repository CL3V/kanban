const { Client } = require("pg");
require("dotenv").config();

async function testConnection() {
  console.log("Testing AWS DSQL connection...");
  console.log("Endpoint:", process.env.DSQL_ENDPOINT);
  console.log("Database:", process.env.DSQL_DATABASE);
  console.log("User:", process.env.DSQL_USER);
  console.log("Region:", process.env.AWS_REGION);

  const config = {
    host: process.env.DSQL_ENDPOINT,
    port: parseInt(process.env.DSQL_PORT || "5432"),
    database: process.env.DSQL_DATABASE || "postgres",
    user: process.env.DSQL_USER || "admin",
    password:
      process.env.DSQL_PASSWORD === "use_iam_token"
        ? ""
        : process.env.DSQL_PASSWORD,
    ssl: { rejectUnauthorized: false },
  };

  const client = new Client(config);

  try {
    console.log("Connecting to DSQL...");
    await client.connect();
    console.log("✅ Successfully connected to AWS DSQL!");

    // Test a simple query
    const result = await client.query("SELECT version()");
    console.log("Database version:", result.rows[0].version);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);

    // Show helpful troubleshooting info
    if (error.code === "ENOTFOUND") {
      console.log("\n🔍 DNS resolution failed. Check if:");
      console.log("- Your DSQL endpoint is correct");
      console.log("- Your internet connection is working");
    } else if (error.code === "ECONNREFUSED") {
      console.log("\n🔍 Connection refused. Check if:");
      console.log("- DSQL cluster is running");
      console.log("- Port 5432 is accessible");
    } else if (error.message.includes("authentication")) {
      console.log("\n🔍 Authentication failed. You need to:");
      console.log("- Set AWS_ACCESS_KEY_ID in your .env file");
      console.log("- Set AWS_SECRET_ACCESS_KEY in your .env file");
      console.log("- Ensure your AWS credentials have DSQL permissions");
    }
  } finally {
    await client.end();
  }
}

testConnection();
