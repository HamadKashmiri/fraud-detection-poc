import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state for button

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }
    setLoading(true); // Start loading animation
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(response.data.message);
      setVerificationData(response.data.verificationResult);
    } catch (error) {
      setMessage(error.response?.data?.message || 'File upload failed');
    } finally {
      setLoading(false); // Stop loading animation
    }
  };

  // Helper function to render fraud decision card
  const renderFraudCard = (fraud) => {
    return (
      <div className={`fraud-card ${fraud.color}`}>
        <h2>Fraud Detection Summary</h2>
        <p><strong>Decision:</strong> {fraud.decision}</p>
        <p><strong>Score:</strong> {fraud.score.toFixed(2)}</p>
        <p><strong>Attribution:</strong> {fraud.attribution}</p>
        <p><strong>Fraud Type:</strong> {fraud.types.join(', ')}</p>
        <div className="fraud-warnings">
          <h3>Fraud Warnings</h3>
          {fraud.warnings.map((warning, idx) => (
            <div key={idx} className="warning">
              <strong>{warning.type}</strong>: {warning.message}
            </div>
          ))}
        </div>
        <div className="fraud-review">
          <h3>Fraud Review Decision: {fraud.fraud_review.decision}</h3>
          <p><strong>Fraud Type:</strong> {fraud.fraud_review.types.join(', ')}</p>
        </div>
      </div>
    );
  };

  return (
    <div className='container'>
      <h1>Fraud Detection System</h1>

      {/* Image Preview */}
      {file && <div className="image-preview">
        <img src={URL.createObjectURL(file)} alt="Uploaded document" />
      </div>}

      <input type='file' onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading} className={`upload-button ${loading ? 'loading' : ''}`}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>

      <p>{message}</p>

      {verificationData && (
        <div className='result'>
          {renderFraudCard(verificationData.fraud)}
        </div>
      )}
    </div>
  );
}

export default App;
