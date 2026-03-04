import { getVideos, getDetectionTemplates, type GetVideosParams } from '@/lib/api';
import Link from 'next/link';

export default async function Home() {
  // Fetch videos from backend - Server Component (automatic caching)
  let videos = null;
  let error = null;

  try {
    const params: GetVideosParams = {
      pageable: {
        page: 0,
        size: 10,
        sort: ['uploadDate,desc']
      }
    };
    
    videos = await getVideos(params);
  } catch (err: any) {
    error = err?.message || 'Failed to fetch videos';
    console.error('Error fetching videos:', err);
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Activity Detection</h1>
      
      <div style={{ marginTop: '20px' }}>
        <Link href="/api-docs" style={{ color: 'blue', textDecoration: 'underline' }}>
          View API Documentation
        </Link>
      </div>

      <h2 style={{ marginTop: '30px' }}>Videos</h2>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}

      {videos && (
        <pre style={{ marginTop: '10px', background: '#f5f5f5', padding: '10px' }}>
          {JSON.stringify(videos, null, 2)}
        </pre>
      )}
    </div>
  );
}
