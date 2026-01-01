'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('username');
    
    if (token && user) {
      setUsername(user);
    }
    
    // authentication check complete
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    // 1. Clear Local Storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    
    // 2. Reset State
    setUsername(null);
    
    // 3. Redirect to Login
    router.push('/login');
  };

  // Prevent flicker while checking auth state
  if (isLoading) {
    return <div className="min-h-screen bg-bg"></div>; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-4">
      
      <div className="max-w-2xl w-full bg-white border-4 border-black shadow-neo p-8 text-center">
        
        {username ? (
          // --- AUTHENTICATED HOME PAGE ---
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-heading">DASHBOARD</h1>
            <div className="h-px bg-black w-full"></div>
            
            <p className="text-xl">
              User: <span className="font-bold text-main">{username}</span>
            </p>
            
            <div className="flex flex-col gap-4">
               <Button variant="primary">ENTER ROOMS</Button>
               <Button variant="outline" onClick={handleLogout}>LOGOUT</Button>
            </div>
          </div>
        ) : (
          // --- GUEST LANDING PAGE ---
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-heading">ROOM CHAT</h1>
            <div className="h-px bg-black w-full"></div>
            
            <p className="text-lg text-gray-600">
              Authentication required. Please login or register to access the application.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full">LOGIN</Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full">REGISTER</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}