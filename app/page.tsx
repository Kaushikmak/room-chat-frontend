'use client';

import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import LoadingWave from '@/components/ui/LoadingWave';

export default function Home() {
  const { user, isLoading, logout } = useAuth();

  // 1. LOADING STATE (Prevents Flash)
  if (isLoading) {
    return <LoadingWave />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-4">
      
      <div className="max-w-2xl w-full bg-white border-4 border-black shadow-neo p-8 text-center animate-in fade-in zoom-in duration-300">
        
        {user ? (
          // --- AUTHENTICATED DASHBOARD ---
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl font-heading tracking-tight">DASHBOARD</h1>
            <div className="h-1 bg-black w-full"></div>
            
            <div className="bg-gray-100 p-4 border-2 border-black">
              <p className="text-xl font-base">
                OPERATOR: <span className="font-bold text-main uppercase">{user.username}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
               <Button variant="primary" className="h-14 text-lg">ENTER ROOMS</Button>
               <Button variant="outline" className="h-14 text-lg" onClick={() => logout()}>LOGOUT</Button>
            </div>
          </div>
        ) : (
          // --- GUEST LANDING PAGE ---
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl font-heading tracking-tight">ROOM CHAT</h1>
            <div className="h-1 bg-black w-full"></div>
            
            <p className="text-xl text-gray-800 font-base">
              SECURE TERMINAL ACCESS REQUIRED.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full h-14 text-lg">LOGIN TERMINAL</Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full h-14 text-lg">NEW USER REGISTRY</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}