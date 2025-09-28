import { createApp, prisma } from "./app.js";
export const createServer = createApp;
import { env } from "./config/env.js";
import { initializeSchedulers } from "./scheduler/index.js";

const port = env.PORT;

const app = createApp();

// Connect to database
prisma
  .$connect()
  .then(() => {
    console.log("✅ Connected to database");

    app.listen(port, () => {
      console.log(`🚀 Backend server running on port ${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🏥 Health check: http://localhost:${port}/api/health`);
      
      // Initialize schedulers after server starts
      initializeSchedulers();
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});
