'use client';

import { useState } from 'react';

interface APIResponse {
  success: boolean;
  query: string;
  analysis: string;
  symbol: string;
  spokenResponse: string;
  toolsUsed: number;
  dataPoints: number;
}

export function APITestComponent() {
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('What is the sentiment on Bitcoin?');

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('🚀 Testing API with query:', query);
      
      const startTime = Date.now();
      const result = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const endTime = Date.now();
      
      console.log(`📡 API Response in ${endTime - startTime}ms:`, result.status);
      
      if (!result.ok) {
        throw new Error(`API Error: ${result.status} ${result.statusText}`);
      }
      
      const data = await result.json();
      console.log('✅ API Response Data:', data);
      
      setResponse(data);
      
    } catch (err) {
      console.error('❌ API Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testQueries = [
    'What is the sentiment on Bitcoin?',
    'How is Ethereum trending?',
    'What is the price of Solana?',
    'Tell me about Cardano social metrics'
  ];

  return (
    <div className="card">
      <h2>API Connection Test</h2>
      <p>Your backend API is working! Let's test the frontend connection.</p>
      
      <div style={{ marginTop: '1rem' }}>
        <label htmlFor="query" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Test Query:
        </label>
        <input
          id="query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button 
          onClick={testAPI} 
          disabled={loading || !query.trim()}
          className="button"
        >
          {loading ? 'Testing API...' : 'Test API Connection'}
        </button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Quick Test Queries:</p>
        {testQueries.map((testQuery, index) => (
          <button
            key={index}
            onClick={() => setQuery(testQuery)}
            className="button"
            style={{ 
              background: '#6c757d', 
              fontSize: '0.875rem', 
              padding: '0.5rem 1rem',
              margin: '0.25rem'
            }}
          >
            {testQuery}
          </button>
        ))}
      </div>

      {loading && (
        <div className="status info">
          <strong>⏳ Testing API Connection...</strong>
          <br />This should take 10-30 seconds for real LunarCrush analysis.
        </div>
      )}

      {error && (
        <div className="status error">
          <strong>❌ API Connection Failed:</strong>
          <br />{error}
        </div>
      )}

      {response && (
        <div>
          <div className="status success">
            <strong>✅ API Connection Successful!</strong>
            <br />Query: "{response.query}"
            <br />Symbol: {response.symbol}
            <br />Tools Used: {response.toolsUsed}
            <br />Data Points: {response.dataPoints}
          </div>

          <div className="result-box">
            <strong>AI Analysis:</strong>
            <br /><br />
            {response.analysis}
          </div>

          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              🔍 Raw API Response (Click to expand)
            </summary>
            <div className="result-box">
              {JSON.stringify(response, null, 2)}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
