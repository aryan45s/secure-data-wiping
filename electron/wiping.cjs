const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { exec } = require('child_process');

const RESTRICTED_DIRS = [
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\ProgramData',
];

function isRestricted(filePath) {
  const normalizedPath = path.normalize(filePath).toUpperCase();
  for (const restricted of RESTRICTED_DIRS) {
    if (normalizedPath.startsWith(path.normalize(restricted).toUpperCase())) {
      return true;
    }
  }
  if (normalizedPath.endsWith(':\\') && normalizedPath.length === 3) {
    return true;
  }
  return false;
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

function wipeFile(filePath) {
  return new Promise((resolve, reject) => {
    if (isRestricted(filePath)) {
      return reject(new Error(`Cannot wipe files in restricted directory: ${filePath}`));
    }

    fs.stat(filePath, (err, stats) => {
      if (err) return reject(err);

      if (stats.isDirectory()) {
        return reject(new Error(`Path is a directory, not a file: ${filePath}`));
      }

      const fileSize = stats.size;
      const bufferSize = 64 * 1024; // 64KB buffer
      const buffer = crypto.randomBytes(bufferSize);

      fs.open(filePath, 'r+', (err, fd) => {
        if (err) {
          // If we can't open for writing, it might be read-only or permission denied
          return reject(err);
        }

        let written = 0;

        function writeNextChunk() {
          if (written >= fileSize) {
            fs.close(fd, (err) => {
              if (err) return reject(err);

              // Now delete the file
              fs.unlink(filePath, (err) => {
                if (err) return reject(err);
                resolve({ filePath, status: 'wiped' });
              });
            });
            return;
          }

          const bytesToWrite = Math.min(bufferSize, fileSize - written);
          fs.write(fd, buffer, 0, bytesToWrite, written, (err, bytesWritten) => {
            if (err) {
              fs.close(fd, () => reject(err));
              return;
            }
            written += bytesWritten;
            setImmediate(writeNextChunk);
          });
        }

        writeNextChunk();
      });
    });
  });
}

function wipeFreeSpace(drive) {
  return new Promise((resolve, reject) => {
    if (!/^[A-Z]:$/i.test(drive)) {
      return reject(new Error('Invalid drive format. Expected format like "D:"'));
    }

    if (drive.toUpperCase() === 'C:') {
      return reject(new Error('Wiping free space on the C: drive is highly restricted and dangerous.'));
    }

    const command = `cipher /w:${drive}\\`;

    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve({ drive, status: 'wiped_free_space' });
    });
  });
}

module.exports = { wipeFile, wipeFreeSpace, isRestricted, getAllFiles };
