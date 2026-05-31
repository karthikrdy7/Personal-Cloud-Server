const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const rootDir = path.join(__dirname, '..', '..');

const parseCorsOrigins = (value) => {
  if (!value) {
    return true;
  }

  const trimmedValue = value.trim();

  if (trimmedValue === '*' || trimmedValue.toLowerCase() === 'true') {
    return true;
  }

  return trimmedValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

module.exports = {
  rootDir,
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  uploadDir: process.env.UPLOAD_DIR || path.join(rootDir, 'uploads'),
  logsDir: process.env.LOG_DIR || path.join(rootDir, 'logs'),
};