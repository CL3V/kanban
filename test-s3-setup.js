const {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
} = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "kanban-app-data-cl3v";

async function testS3Setup() {
  console.log(`Testing S3 setup with bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${process.env.AWS_REGION}`);

  try {
    // First try to check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log("✅ Bucket exists and is accessible");
    return true;
  } catch (error) {
    if (error.name === "NotFound") {
      console.log("🔧 Bucket doesn't exist, trying to create it...");

      try {
        await s3Client.send(
          new CreateBucketCommand({
            Bucket: BUCKET_NAME,
            CreateBucketConfiguration: {
              LocationConstraint: process.env.AWS_REGION,
            },
          })
        );
        console.log("✅ Bucket created successfully");
        return true;
      } catch (createError) {
        console.error("❌ Failed to create bucket:", createError.message);
        return false;
      }
    } else {
      console.error("❌ Error accessing bucket:", error.message);
      return false;
    }
  }
}

testS3Setup()
  .then((success) => {
    if (success) {
      console.log("🎉 S3 setup is working correctly!");
    } else {
      console.log(
        "💥 S3 setup failed. Please check your AWS credentials and permissions."
      );
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
