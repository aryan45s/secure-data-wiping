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
      <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '2rem' }}>
          <Shield size={32} color="#60a5fa" /> Verification Portal
        </h1>
        
        {loading ? (
          <div>
            <div className="spinner"></div>
            <p>Searching database for certificate...</p>
          </div>
        ) : error ? (
          <div style={{ color: 'var(--danger-color)' }}>
            <XCircle size={64} style={{ margin: '0 auto 1rem' }} />
            <h2>Verification Failed</h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              This certificate ID is invalid, or the secure wiping was never recorded.
            </p>
          </div>
        ) : (
          <div style={{ color: 'var(--success-color)' }}>
            <CheckCircle size={64} style={{ margin: '0 auto 1rem' }} />
            <h2>Verified Authentic</h2>
            
            <div className="certificate-info" style={{ marginTop: '2rem', color: 'var(--text-primary)', textAlign: 'left' }}>
              <p><span>Certificate ID:</span> {certData.certificateId}</p>
              <p><span>Wipe Mode:</span> {certData.wipeMode}</p>
              <p><span>Completion Time:</span> {new Date(certData.timestamp).toLocaleString()}</p>
              <p><span>Status:</span> 100% Permanently Destroyed</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
