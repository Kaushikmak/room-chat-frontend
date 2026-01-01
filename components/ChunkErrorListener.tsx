'use client';

import { useEffect } from 'react';

export default function ChunkErrorListener() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (msg.includes('Loading chunk') || msg.includes('Failed to load chunk')) {
        console.warn('Chunk load error detected. Reloading...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  return null;
}