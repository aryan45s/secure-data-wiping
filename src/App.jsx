import { QRCodeSVG } from 'qrcode.react';

import React, { useState } from 'react';
import { Shield, FileWarning, HardDrive, Trash2, CheckCircle, File, Folder, AlertTriangle } from 'lucide-react';
import { saveCertificate } from './firebase/config';
import './App.css';

function App() {
  const [wipeMode, setWipeMode] = useState('file'); // 'file' or 'freespace'
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState('D:');
  const [isWiping, setIsWiping] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSelectFiles = async () => {
    if (window.api) {
      const paths = await window.api.selectFiles();
      if (paths && paths.length > 0) {
        setSelectedPaths(prev => [...new Set([...prev, ...paths])]);
        setErrorMsg(null);
      }
    }
  };

  const handleSelectDirectory = async () => {
    if (window.api) {
      const paths = await window.api.selectDirectory();
      if (paths && paths.length > 0) {
        setSelectedPaths(prev => [...new Set([...prev, ...paths])]);
        setErrorMsg(null);
      }
    }
  };

  const removePath = (pathToRemove) => {
    setSelectedPaths(prev => prev.filter(p => p !== pathToRemove));
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    try {
      const files = Array.from(e.dataTransfer.files);
      if (!files || files.length === 0) {
        setErrorMsg("No files detected in drop event. Make sure you are dragging actual files.");
        return;
      }
      
      const paths = files.map(file => file.path).filter(Boolean);
      if (paths.length === 0) {
        setErrorMsg("Could not retrieve absolute paths from the dragged files.");
        return;
      }
      
      setSelectedPaths(prev => [...new Set([...prev, ...paths])]);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg("Drag & Drop Error: " + err.message);
    }
  };

  const executeWipe = async () => {
    setShowConfirm(false);
    setIsWiping(true);
    setErrorMsg(null);
    setSuccessData(null);

    try {
      let wipeResult;
      let targetPaths = [];

      if (wipeMode === 'file') {
        if (selectedPaths.length === 0) throw new Error("No files selected.");
        targetPaths = selectedPaths;
        wipeResult = await window.api.wipeFiles(selectedPaths);
      } else {
        if (!selectedDrive) throw new Error("No drive selected.");
        targetPaths = [selectedDrive];
        wipeResult = await window.api.wipeFreeSpace(selectedDrive);
      }

      if (wipeResult && wipeResult.success) {
        // Generate Certificate
        const certResult = await window.api.generateCertificate({
          targetPaths,
          wipeMode: wipeMode === 'file' ? 'File Overwrite' : 'Free Space Wipe'
        });

        if (certResult.success) {
          const certData = {
            certificateId: certResult.path.certId || 'UNKNOWN',
            timestamp: new Date().toISOString(),
            wipeMode: wipeMode === 'file' ? 'File Overwrite' : 'Free Space Wipe',
            path: certResult.path.filePath
          };

          try {
            saveCertificate(certData).catch(e => console.warn("Firebase save delayed or failed:", e));
          } catch (e) {
            console.warn("Failed to save to Firebase, but local cert generated.");
          }

          setSuccessData(certData);
          setSelectedPaths([]);
        } else {
          throw new Error("Failed to generate certificate: " + certResult.error);
        }
      } else {
        throw new Error("Wipe operation failed: " + wipeResult.error);
      }
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsWiping(false);
    }
  };

  const drives = ['D:', 'E:', 'F:', 'G:', 'H:', 'I:', 'J:', 'K:', 'Z:'];

  return (
    <div className="app-container">
      <div className="header">
        <h1><Shield size={36} color="#60a5fa" /> Secure Data Wiping</h1>
        <p>Permanently erase your sensitive data beyond recovery.</p>
      </div>

      <div className="glass-panel">
        {errorMsg && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid var(--danger-color)' }}>
            <AlertTriangle size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            {errorMsg}
          </div>
        )}

        {isWiping ? (
          <div className="progress-container">
            <div className="radar-spinner"></div>
            <h2>Wiping Data Securely...</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {wipeMode === 'file'
                ? 'Scrubbing files with random bytes and permanently deleting...'
                : 'Scrubbing free space on disk. This may take a while...'}
            </p>
          </div>
        ) : successData ? (
          <div className="success-container">
            <CheckCircle size={64} className="success-icon" />
            <h2 className="success-title">Wipe Complete</h2>
            <p>Your data has been permanently erased.</p>

            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={`https://data-wiping-6bb65.web.app/verify?id=${successData.certificateId}`}
                size={128}
              />
            </div>
            <p className="qr-caption">Scan to verify certificate</p>

            <div className="certificate-info">
              <p><span>Certificate ID:</span> <strong>{successData.certificateId}</strong></p>
              <p><span>Mode:</span> <strong>{successData.wipeMode}</strong></p>
              <p><span>Time:</span> <strong>{new Date(successData.timestamp).toLocaleString()}</strong></p>
              <p style={{ flexDirection: 'column', alignItems: 'flex-start', color: 'var(--accent-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Saved locally to:</span>
                {successData.path}
              </p>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setSuccessData(null)}>
              Start New Wipe
            </button>
          </div>
        ) : (

          <>
            <div className="form-group">
              <label className="form-label">Select Wipe Mode</label>
              <div className="radio-group">
                <label className="radio-card">
                  <input
                    type="radio"
                    name="wipeMode"
                    value="file"
                    checked={wipeMode === 'file'}
                    onChange={() => setWipeMode('file')}
                  />
                  <div className="radio-content">
                    <FileWarning size={32} />
                    <span>File / Folder Wipe</span>
                  </div>
                </label>
                <label className="radio-card">
                  <input
                    type="radio"
                    name="wipeMode"
                    value="freespace"
                    checked={wipeMode === 'freespace'}
                    onChange={() => setWipeMode('freespace')}
                  />
                  <div className="radio-content">
                    <HardDrive size={32} />
                    <span>Free Space Wipe</span>
                  </div>
                </label>
              </div>
            </div>

            {wipeMode === 'file' ? (
              <div className="form-group">
                <label className="form-label">Target Data</label>
                <div 
                  className={`drop-zone ${isDragging ? 'active' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{ position: 'relative' }}
                >
                  {isDragging && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} />
                  )}
                  <p className="drop-zone-text">Drag & drop files or folders here</p>
                  <div className="btn-group">
                    <button className="btn btn-secondary" onClick={handleSelectFiles}><File size={18} /> Select Files</button>
                    <button className="btn btn-secondary" onClick={handleSelectDirectory}><Folder size={18} /> Select Folder</button>
                  </div>
                </div>

                {selectedPaths.length > 0 && (
                  <div className="selected-files" style={{ marginTop: '1rem' }}>
                    <p>{selectedPaths.length} item(s) selected:</p>
                    <ul className="file-list">
                      {selectedPaths.map((path, idx) => (
                        <li key={idx}>
                          <span><File size={14} color="var(--accent-color)" /> {path}</span>
                          <button className="remove-btn" onClick={() => removePath(path)} title="Remove from queue">
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Target Drive (Non-System Only)</label>
                <select
                  className="drive-selector"
                  value={selectedDrive}
                  onChange={(e) => setSelectedDrive(e.target.value)}
                >
                  {drives.map(drive => (
                    <option key={drive} value={drive}>{drive}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  System drive (C:) is restricted to prevent OS damage.
                </p>
              </div>
            )}

            <button
              className="btn btn-danger"
              onClick={() => setShowConfirm(true)}
              disabled={wipeMode === 'file' && selectedPaths.length === 0}
            >
              <Trash2 size={20} /> Secure Delete Now
            </button>
          </>
        )}
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2><AlertTriangle size={24} /> WARNING: Data Loss</h2>
            <p>
              This action is <strong>irreversible</strong>. The selected {wipeMode === 'file' ? 'files' : 'free space'} will be permanently overwritten and cannot be recovered by any software.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={executeWipe}>Yes, Wipe It</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
