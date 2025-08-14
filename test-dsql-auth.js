const { Client } = require("pg");
const { Signer } = require("@aws-sdk/rds-signer");
require("dotenv").config();

async function createDSQLConnection() {
  console.log("🔐 Generating AWS DSQL authentication token...");

  try {
    // Create RDS signer for DSQL
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

    // Generate authentication token
    const token = await signer.getAuthToken();
    console.log("✅ Generated authentication token");

    // Create PostgreSQL client with the token
    const client = new Client({
      host: process.env.DSQL_ENDPOINT,
      port: parseInt(process.env.DSQL_PORT || "5432"),
      database: process.env.DSQL_DATABASE || "postgres",
      user: process.env.DSQL_USER || "admin",
      password: token, // Use the generated token as password
      ssl: { rejectUnauthorized: false },
    });

    return client;
  } catch (error) {
    console.error("❌ Failed to create DSQL connection:", error);
    throw error;
  }
}

async function testDSQLConnection() {
  console.log("🚀 Testing AWS DSQL connection with proper authentication...");

  try {
    const client = await createDSQLConnection();

    console.log("🔌 Connecting to DSQL...");
    await client.connect();
    console.log("✅ Successfully connected to AWS DSQL!");

    // Test query
    const result = await client.query("SELECT version()");
    console.log("📊 Database version:", result.rows[0].version);

    // Close connection
    await client.end();
    console.log("✅ Connection test successful!");

    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);

    if (error.code === "ENOTFOUND") {
      console.log("\n💡 DNS resolution failed. Check your DSQL endpoint.");
    } else if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Connection refused. Check if DSQL cluster is running.");
    } else if (error.message.includes("authentication")) {
      console.log(
        "\n💡 Authentication failed. Check your AWS credentials and permissions."
      );
    }

    return false;
  }
}

testDSQLConnection();
