'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/axiosInstance';
import { useAuth } from '@/context/AuthContext'; // Use Context
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toast from '@/components/ui/Toast';
import LoadingWave from '@/components/ui/LoadingWave';
import { useGoogleLogin } from '@react-oauth/google';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); // Get login function from context
  
  // STATE
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'error' | 'success' }>({
    show: false, msg: '', type: 'error'
  });

  const codeProcessed = useRef(false);

  // CONFIGURATION
  const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "Ov23libTC9bolbUzZeBA"; 
  const REDIRECT_URI = "https://www.room-chat.com/login"; 

  // HELPERS
  const showToast = (msg: string, type: 'error' | 'success' = 'error') => setToast({ show: true, msg, type });
  const closeToast = () => setToast(prev => ({ ...prev, show: false }));

  // OAUTH HANDLER
  useEffect(() => {
    const code = searchParams.get('code');
    const token = localStorage.getItem('auth_token');

    if (code && !codeProcessed.current && !token) {
      codeProcessed.current = true;
      handleGithubLogin(code);
    }
    
    if (searchParams.get('registered')) {
      showToast('Account created successfully. Terminal ready.', 'success');
    }
  }, [searchParams]);

  // HANDLERS
  const handleGithubLogin = async (code: string) => {
    setIsAuthenticating(true);
    try {
      const response = await api.post('/auth/github/', { code });
      const data = response.data;
      // Use Context Login
      login(data.token || data.key, data);
    } catch (err) {
      setIsAuthenticating(false);
      router.replace('/login');
      showToast("GitHub Access Denied.");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsAuthenticating(true);
      try {
        const response = await api.post('/auth/google/', {
          access_token: tokenResponse.access_token,
        });
        const data = response.data;
        // Use Context Login
        login(data.token || data.key, data);
      } catch (err) {
        setIsAuthenticating(false);
        showToast("Google Access Denied.");
      }
    },
    onError: () => showToast("Google Popup Closed."),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      const response = await api.post('/users/login/', formData);
      const data = response.data;
      // Use Context Login
      login(data.token || data.key, data);
    } catch (err: any) {
      setIsAuthenticating(false);
      showToast('Invalid Credentials.');
    }
  };

  return (
    <>
      {isAuthenticating && <LoadingWave />}

      <Toast message={toast.msg} isVisible={toast.show} onClose={closeToast} type={toast.type} />

      <div className="flex items-center justify-center min-h-screen bg-bg px-4 py-10">
        <div className="w-full max-w-md bg-white border-4 border-black shadow-neo p-8">
          
          <h1 className="text-4xl font-heading mb-2 text-center">ACCESS TERMINAL</h1>
          <p className="text-center mb-6 font-base text-gray-600">Authenticate to proceed.</p>

          <div className="flex flex-col gap-3 mb-6">
            <button 
              onClick={() => googleLogin()}
              disabled={isAuthenticating}
              className="flex items-center justify-center gap-2 w-full bg-white text-black font-bold border-2 border-black py-3 shadow-neo-sm hover:bg-gray-50 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              GOOGLE ACCESS
            </button>

            <a 
              href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`}
              className="flex items-center justify-center gap-2 w-full bg-[#24292e] text-white font-bold border-2 border-black py-3 shadow-neo-sm hover:bg-gray-800 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
               GITHUB ACCESS
            </a>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-gray-300 flex-1"></div>
            <span className="font-bold text-gray-400 text-sm">OR</span>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input label="USERNAME" name="username" placeholder="Identifier" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required disabled={isAuthenticating} />
            <Input label="PASSWORD" name="password" type="password" placeholder="Passcode" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required disabled={isAuthenticating} />

            <Button type="submit" disabled={isAuthenticating} className="w-full mt-2">
              INITIATE LOGIN
            </Button>
          </form>

          <p className="mt-6 text-center text-sm font-base">
            New User?{' '}
            <Link href="/register" className="underline font-bold hover:text-main">
              Initialize Registration
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingWave />}>
      <LoginContent />
    </Suspense>
  );
}