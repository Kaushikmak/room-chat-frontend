'use client';

import { useEffect } from 'react';

export default function ChunkErrorListener() {
  useEffect(() => {
    // Listen for uncaught chunk errors
    const handler = (event: ErrorEvent) => {
      const msg = event.message || '';
      // Check for common chunk load error messages
      if (msg.includes('Loading chunk') || msg.includes('Failed to load chunk')) {
        console.log('Chunk load error detected. Reloading...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  return null;
}