'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/utils/axiosInstance';
import { Room } from '@/types';
import RoomCard from '@/components/RoomCard';
import Button from '@/components/ui/Button';
import LoadingWave from '@/components/ui/LoadingWave';

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  
  // Local State for Rooms
  const [rooms, setRooms] = useState<Room[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Rooms on Mount
  useEffect(() => {
    // Only fetch if user is authenticated
    if (user) {
      fetchRooms();
    } else if (!authLoading) {
      // If not auth and not loading, stop fetching
      setFetchLoading(false);
    }
  }, [user, authLoading]);

  const fetchRooms = async () => {
    try {
      // LLM predicts the endpoint is '/rooms/' based on Django standards
      const response = await api.get('/rooms/'); 
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('System unable to retrieve room data.');
    } finally {
      setFetchLoading(false);
    }
  };

  // 1. Loading State (Auth or Data)
  if (authLoading || (user && fetchLoading)) {
    return <LoadingWave />;
  }

  // 2. Guest View
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-4">
        <div className="max-w-2xl w-full bg-white border-4 border-black shadow-neo p-8 text-center animate-in fade-in zoom-in duration-300">
          <h1 className="text-5xl font-heading tracking-tight mb-2">ROOM CHAT</h1>
          <p className="text-xl text-gray-800 font-base mb-6">SECURE TERMINAL ACCESS REQUIRED.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full h-14 text-lg">LOGIN TERMINAL</Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full h-14 text-lg">NEW USER REGISTRY</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Dashboard View
  return (
    <div className="min-h-screen bg-bg p-4 sm:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading uppercase">Dashboard</h1>
          <p className="font-base text-gray-600">
            Welcome back, <span className="font-bold text-main">{user.username}</span>.
          </p>
        </div>
        
        <div className="flex gap-4">
          <Link href="/create-room">
            <Button variant="primary" className="px-8">+ CREATE ROOM</Button>
          </Link>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="max-w-7xl mx-auto">
        
        {error && (
          <div className="mb-8 p-4 bg-red-100 border-2 border-black text-red-700 font-bold">
            ⚠ {error}
          </div>
        )}

        {/* Empty State */}
        {!fetchLoading && rooms.length === 0 && !error && (
          <div className="text-center py-20 bg-white border-4 border-black shadow-neo">
            <h2 className="text-2xl font-bold mb-4">NO ACTIVE SIGNALS DETECTED</h2>
            <p className="mb-6">There are no active rooms available.</p>
            <Link href="/create-room">
              <Button variant="primary">INITIALIZE FIRST ROOM</Button>
            </Link>
          </div>
        )}

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
}