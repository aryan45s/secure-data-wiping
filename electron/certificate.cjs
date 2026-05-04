const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

function generateCertificate(data) {
  return new Promise((resolve, reject) => {
    try {
      const { targetPaths, wipeMode } = data;
      const certId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const doc = new PDFDocument({ margin: 50 });
      const certDir = path.join(os.homedir(), 'Documents', 'SecureWipeCertificates');
      
      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
      }
      
      const fileName = `Certificate_${certId}.pdf`;
      const filePath = path.join(certDir, fileName);
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      // Header
      doc.fontSize(25).font('Helvetica-Bold').text('Certificate of Secure Data Wiping', { align: 'center' });
      doc.moveDown(2);
      
      doc.fontSize(14).font('Helvetica').text(`This document certifies that data wiping operations have been performed successfully in accordance with secure single-pass overwrite standards.`, { align: 'center' });
      doc.moveDown(2);
      
      // Details
      doc.fontSize(12).font('Helvetica-Bold').text('Certificate ID: ', { continued: true }).font('Helvetica').text(certId);
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Timestamp: ', { continued: true }).font('Helvetica').text(timestamp);
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Wipe Mode: ', { continued: true }).font('Helvetica').text(wipeMode);
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Target Paths: ');
      
      if (Array.isArray(targetPaths)) {
        targetPaths.forEach(p => {
          doc.font('Helvetica').text(`- ${p}`, { indent: 20 });
        });
      } else {
        doc.font('Helvetica').text(`- ${targetPaths}`, { indent: 20 });
      }
      
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica-Oblique').text('Note: This operation overwrites file content with random bytes and removes the file from the filesystem. If a free-space wipe was performed, it targeted the unallocated space on the drive.', { align: 'center' });
      
      doc.end();
      
      writeStream.on('finish', () => {
        resolve({ certId, filePath, timestamp, wipeMode, targetPaths });
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
      
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificate };
