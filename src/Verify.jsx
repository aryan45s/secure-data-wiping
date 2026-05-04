import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { getCertificateById } from './firebase/config';
import './App.css';

export default function Verify() {
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }

    async function fetchCert() {
      const data = await getCertificateById(id);
      if (data) {
        setCertData(data);
      } else {
        setError(true);
      }
      setLoading(false);
    }

    fetchCert();
  }, []);

  return (
    <div className="app-container">
      <div className="glass-panel verify-container">
        <h1 className="verify-header">
          <Shield size={36} color="#60a5fa" /> Verification Portal
        </h1>
        
        {loading ? (
          <div className="verify-status-box">
            <div className="spinner"></div>
            <p>Searching database securely...</p>
          </div>
        ) : error ? (
          <div className="verify-status-box verify-status-error">
            <XCircle size={64} style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              This certificate ID is invalid, or the secure wiping was never recorded on our network.
            </p>
          </div>
        ) : (
          <div className="verify-status-box verify-status-success">
            <CheckCircle size={64} style={{ margin: '0 auto 1rem' }} />
            <h2>Verified Authentic</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>The data wiping operation has been confirmed.</p>
            
            <div className="certificate-info" style={{ marginTop: '2rem' }}>
              <p><span>Certificate ID:</span> <strong>{certData.certificateId}</strong></p>
              <p><span>Wipe Mode:</span> <strong>{certData.wipeMode}</strong></p>
              <p><span>Completion Time:</span> <strong>{new Date(certData.timestamp).toLocaleString()}</strong></p>
              <p><span>Status:</span> <strong style={{color: 'var(--success-color)'}}>100% Permanently Destroyed</strong></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
