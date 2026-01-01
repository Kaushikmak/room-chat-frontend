'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  // Check login status on load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('username');
    if (token && user) {
      setUsername(user);
    }
  }, []);

  const handleLogout = () => {
    // 1. Clear Storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    
    // 2. Reset State
    setUsername(null);
    
    // 3. Refresh or Redirect
    router.push('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-4">
      
      <div className="max-w-2xl w-full bg-white border-4 border-black shadow-neo p-8 text-center">
        <h1 className="text-5xl font-heading mb-6">ROOM CHAT 💬</h1>
        
        {username ? (
          // VIEW FOR LOGGED IN USERS
          <div className="flex flex-col gap-4">
            <p className="text-xl">
              Welcome back, <span className="font-bold text-main">{username}</span>!
            </p>
            <div className="h-px bg-black w-full my-4"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <Button variant="primary">Enter Chat Rooms</Button>
               <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        ) : (
          // VIEW FOR GUESTS
          <div className="flex flex-col gap-4">
            <p className="text-lg text-gray-600">
              Join the conversation. Create rooms, chat with friends, and discuss topics.
            </p>
            <div className="h-px bg-black w-full my-4"></div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button variant="primary" className="w-full sm:w-auto">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" className="w-full sm:w-auto">Register</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}