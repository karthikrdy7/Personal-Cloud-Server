const app = require('./app');
const config = require('./config');

const { port: PORT, host: HOST, nodeEnv } = config;

// Bind to all network interfaces so Termux, LAN, and Tailscale access work.
const server = app.listen(PORT, HOST, () => {
  console.log(`Personal Cloud server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${nodeEnv}`);
});

const shutdown = (signal) => {
  console.log(`Received ${signal}, shutting down gracefully...`);

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown('unhandledRejection');
});