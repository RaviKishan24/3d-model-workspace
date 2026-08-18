require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;

// Required environment variables for the application
const REQUIRED_ENV = [
  'MONGODB_URI',
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_STORAGE_BUCKET',
];

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function start() {
  assertEnv();
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  // Graceful shutdown so the ALB can drain connections during a deploy or scale-in.
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };

  ['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => shutdown(sig)));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });
}

start();