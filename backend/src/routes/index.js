const express = require('express');
const { execFile } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const config = require('../config');

const router = express.Router();

const uploadDir = config.uploadDir;
const logsDir = config.logsDir;
const logsFilePath = path.join(logsDir, 'activity.log');

// Create the uploads folder automatically if it does not already exist.
fs.mkdirSync(uploadDir, { recursive: true });
// Create the logs folder automatically if it does not already exist.
fs.mkdirSync(logsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${uniquePrefix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
});

const previewableExtensions = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
  ['.ogg', 'video/ogg'],
  ['.pdf', 'application/pdf'],
]);

const ensureLogsFile = () => {
  if (!fs.existsSync(logsFilePath)) {
    fs.writeFileSync(logsFilePath, '', 'utf8');
  }
};

const writeLogEntry = (action, status, details = {}) => {
  ensureLogsFile();

  const entry = {
    timestamp: new Date().toISOString(),
    action,
    status,
    details,
  };

  fs.appendFileSync(logsFilePath, `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
};

const readLogEntries = () => {
  ensureLogsFile();

  const rawContent = fs.readFileSync(logsFilePath, 'utf8').trim();

  if (!rawContent) {
    return [];
  }

  return rawContent
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
};

const bytesToHuman = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return {
    value: Number(value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 2)),
    unit: units[unitIndex],
  };
};

// Preview a file inline in the browser for images, videos, and PDFs.
router.get('/preview/:filename', (req, res) => {
  const fileName = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, fileName);
  const extension = path.extname(fileName).toLowerCase();
  const contentType = previewableExtensions.get(extension);

  if (!contentType) {
    return res.status(400).json({
      success: false,
      message: 'This file type cannot be previewed',
    });
  }

  fs.access(filePath, fs.constants.F_OK, (error) => {
    if (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Accept-Ranges', 'bytes');

    return res.sendFile(filePath, (sendError) => {
      if (sendError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to preview file',
          error: sendError.message,
        });
      }

      return undefined;
    });
  });
});

const readStorageInfo = (callback) => {
  execFile('df', ['-kP', uploadDir], (error, stdout) => {
    if (error) {
      return callback(error);
    }

    const lines = stdout.trim().split('\n');
    const parts = lines[1] && lines[1].trim().split(/\s+/);

    if (!parts || parts.length < 6) {
      return callback(new Error('Unable to parse storage information'));
    }

    const totalKb = Number(parts[1]);
    const usedKb = Number(parts[2]);
    const freeKb = Number(parts[3]);

    if ([totalKb, usedKb, freeKb].some((value) => Number.isNaN(value))) {
      return callback(new Error('Invalid storage values returned by system utilities'));
    }

    const totalBytes = totalKb * 1024;
    const usedBytes = usedKb * 1024;
    const freeBytes = freeKb * 1024;

    return callback(null, {
      totalStorage: {
        bytes: totalBytes,
        ...bytesToHuman(totalBytes),
      },
      usedStorage: {
        bytes: usedBytes,
        ...bytesToHuman(usedBytes),
      },
      freeStorage: {
        bytes: freeBytes,
        ...bytesToHuman(freeBytes),
      },
    });
  });
};

const getCpuSnapshot = () => {
  const cpus = os.cpus();

  const idle = cpus.reduce((sum, cpu) => sum + cpu.times.idle, 0);
  const total = cpus.reduce((sum, cpu) => {
    const times = cpu.times;
    return sum + times.user + times.nice + times.sys + times.irq + times.idle;
  }, 0);

  return { idle, total };
};

const calculateCpuUsage = (startSnapshot, endSnapshot) => {
  const idleDelta = endSnapshot.idle - startSnapshot.idle;
  const totalDelta = endSnapshot.total - startSnapshot.total;

  if (totalDelta <= 0) {
    return 0;
  }

  return Number((((totalDelta - idleDelta) / totalDelta) * 100).toFixed(1));
};

// Return system activity logs.
router.get('/logs', (req, res) => {
  try {
    const logs = readLogEntries();

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to read logs',
      error: error.message,
    });
  }
});

// Health check route for the Personal Cloud server.
router.get('/', (req, res) => {
  res.send('Personal Cloud Server Running');
});

// Return a JSON list of all uploaded files.
router.get('/files', (req, res) => {
  fs.readdir(uploadDir, (error, files) => {
    if (error) {
      writeLogEntry('list_files', 'error', {
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to read uploads folder',
        error: error.message,
      });
    }

    const fileDetails = files.map((fileName) => {
      const filePath = path.join(uploadDir, fileName);
      const stats = fs.statSync(filePath);

      return {
        name: fileName,
        size: stats.size,
        uploadDate: stats.birthtime,
      };
    });

    return res.status(200).json({
      success: true,
      files: fileDetails,
    });
  });
});

// Return live storage information for the uploads volume.
router.get('/storage', (req, res) => {
  readStorageInfo((error, storageInfo) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to read storage information',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      totalStorage: storageInfo.totalStorage,
      usedStorage: storageInfo.usedStorage,
      freeStorage: storageInfo.freeStorage,
    });
  });
});

// Return live system information for the dashboard.
router.get('/system-info', (req, res) => {
  const startSnapshot = getCpuSnapshot();

  setTimeout(() => {
    const endSnapshot = getCpuSnapshot();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return res.status(200).json({
      success: true,
      cpuUsage: calculateCpuUsage(startSnapshot, endSnapshot),
      ramUsage: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percent: Number(((usedMemory / totalMemory) * 100).toFixed(1)),
      },
      uptime: os.uptime(),
      hostname: os.hostname(),
      platform: os.platform(),
    });
  }, 100);
});

// Download a previously uploaded file by its stored filename.
router.get('/download/:filename', (req, res) => {
  const fileName = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, fileName);

  fs.access(filePath, fs.constants.F_OK, (error) => {
    if (error) {
      writeLogEntry('download_file', 'error', {
        fileName,
        error: 'File not found',
      });
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Send the file as an attachment so the browser downloads it.
    return res.download(filePath, fileName, (downloadError) => {
      if (downloadError) {
        writeLogEntry('download_file', 'error', {
          fileName,
          error: downloadError.message,
        });
        return res.status(500).json({
          success: false,
          message: 'Failed to download file',
          error: downloadError.message,
        });
      }

      return undefined;
    });
  });
});

// Delete a previously uploaded file by its stored filename.
router.delete('/delete/:filename', (req, res) => {
  const fileName = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, fileName);

  fs.access(filePath, fs.constants.F_OK, (accessError) => {
    if (accessError) {
      console.log(`Delete failed: file not found - ${fileName}`);
      writeLogEntry('delete_file', 'error', {
        fileName,
        error: 'File not found',
      });
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    fs.unlink(filePath, (unlinkError) => {
      if (unlinkError) {
        console.log(`Delete failed: unable to remove - ${fileName}`);
        writeLogEntry('delete_file', 'error', {
          fileName,
          error: unlinkError.message,
        });
        return res.status(500).json({
          success: false,
          message: 'Failed to delete file',
          error: unlinkError.message,
        });
      }

      console.log(`File deleted: ${fileName}`);
      writeLogEntry('delete_file', 'success', {
        fileName,
      });
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        fileName,
      });
    });
  });
});

// Upload a single file from the form field named "file".
router.post('/upload', (req, res) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      writeLogEntry('upload_file', 'error', {
        originalName: req.file ? req.file.originalname : null,
        error: error.message,
      });
      return res.status(400).json({
        success: false,
        message: 'File upload failed',
        error: error.message,
      });
    }

    if (!req.file) {
      writeLogEntry('upload_file', 'error', {
        error: 'No file uploaded',
      });
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    writeLogEntry('upload_file', 'success', {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      size: req.file.size,
    });

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        path: req.file.path,
        size: req.file.size,
      },
    });
  });
});

// Log a login attempt for monitoring purposes.
router.post('/login', (req, res) => {
  const { username } = req.body || {};
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (!username) {
    writeLogEntry('login_attempt', 'error', {
      username: null,
      ipAddress,
      error: 'Username is required',
    });

    return res.status(400).json({
      success: false,
      message: 'Username is required',
    });
  }

  writeLogEntry('login_attempt', 'success', {
    username,
    ipAddress,
  });

  return res.status(200).json({
    success: true,
    message: 'Login attempt logged',
  });
});

// Central error handler for unexpected upload and route errors.
router.use((error, req, res, next) => {
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message,
  });
});

module.exports = router;