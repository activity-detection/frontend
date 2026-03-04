'use client';

import { useEffect, useState } from 'react';
import { getHealth } from '@/lib/api-client';

export default function Home() {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await getHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to backend');
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Activity Detection</h1>
      <h2>Backend Health Check</h2>
      
      {loading && <p>Checking backend...</p>}
      
      {error && (
        <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {health && (
        <div style={{ color: 'green', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
          <strong>Connected:</strong>
          <pre>{JSON.stringify(health, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
