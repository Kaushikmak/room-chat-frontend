'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/axiosInstance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toast from '@/components/ui/Toast';
import LoadingWave from '@/components/ui/LoadingWave';
import { useGoogleLogin } from '@react-oauth/google';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // STATE MANAGEMENT
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isAuthenticating, setIsAuthenticating] = useState(false); // Controls the Wave Animation
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'error' | 'success' }>({
    show: false,
    msg: '',
    type: 'error'
  });

  // CONFIGURATION
  const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "Ov23libTC9bolbUzZeBA"; 
  const REDIRECT_URI = "https://www.room-chat.com/login"; 

  // --- HELPERS ---
  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ show: true, msg, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  // --- HANDLE OAUTH CALLBACKS (GitHub & Params) ---
  useEffect(() => {
    // 1. Handle GitHub Code
    const code = searchParams.get('code');
    if (code && !localStorage.getItem('auth_token')) {
      handleGithubLogin(code);
    }
    
    // 2. Handle Registration Success
    if (searchParams.get('registered')) {
      showToast('Account created successfully. Please login.', 'success');
    }
  }, [searchParams]);

  // --- SHARED AUTH SUCCESS LOGIC ---
  // --- SHARED AUTH SUCCESS LOGIC ---
  const handleAuthSuccess = async (data: any) => {
    // 1. Save the Token first (Critical for the next API call)
    const token = data.token || data.key; 
    if (!token) {
      showToast("Login failed: No token received from server.");
      setIsAuthenticating(false);
      return;
    }
    localStorage.setItem('auth_token', token);

    // 2. Check if we need to fetch User Details manually
    // (Social Login often misses this, while Form Login usually has it)
    let username = data.username;
    let userId = data.user_id;

    if (!username) {
      try {
        // Fetch user profile using the token we just saved
        // Try the standard dj-rest-auth endpoint first
        const userRes = await api.get('/auth/user/');
        
        username = userRes.data.username;
        userId = userRes.data.pk || userRes.data.id;
        
      } catch (err) {
        console.warn("Could not fetch user details automatically.", err);
        // Fallback: If we really can't get a username, use 'User' so the app doesn't break
        username = 'User'; 
      }
    }

    // 3. Save User Data
    if (username) localStorage.setItem('username', username);
    if (userId) localStorage.setItem('user_id', userId);

    // 4. Hard Redirect to Home
    // We use window.location.href instead of router.push to force a full 
    // state refresh, ensuring the Home page sees the new localStorage.
    setTimeout(() => {
      window.location.href = '/'; 
    }, 800);
  };

  // --- GITHUB HANDLER ---
  const handleGithubLogin = async (code: string) => {
    setIsAuthenticating(true); // START ANIMATION
    try {
      const response = await api.post('/auth/github/', { code });
      handleAuthSuccess(response.data);
    } catch (err) {
      console.error(err);
      setIsAuthenticating(false); // STOP ANIMATION
      showToast("GitHub authentication failed.");
    }
  };

  // --- GOOGLE HANDLER ---
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsAuthenticating(true); // START ANIMATION
      try {
        const response = await api.post('/auth/google/', {
          access_token: tokenResponse.access_token,
        });
        handleAuthSuccess(response.data);
      } catch (err) {
        console.error(err);
        setIsAuthenticating(false); // STOP ANIMATION
        showToast("Google authentication failed.");
      }
    },
    onError: () => {
      setIsAuthenticating(false);
      showToast("Google Login Popup Closed or Failed.");
    },
  });

  // --- STANDARD FORM HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true); // START ANIMATION
    
    try {
      const response = await api.post('/users/login/', formData);
      handleAuthSuccess(response.data);
    } catch (err: any) {
      setIsAuthenticating(false); // STOP ANIMATION
      showToast('Invalid credentials provided.');
    }
  };

  return (
    <>
      {/* 1. FULL SCREEN LOADING ANIMATION */}
      {isAuthenticating && <LoadingWave />}

      {/* 2. WARNING POPUP (TOAST) */}
      <Toast 
        message={toast.msg} 
        isVisible={toast.show} 
        onClose={closeToast} 
        type={toast.type}
      />

      <div className="flex items-center justify-center min-h-screen bg-bg px-4 py-10">
        <div className="w-full max-w-md bg-white border-4 border-black shadow-neo p-8">
          
          <h1 className="text-4xl font-heading mb-2 text-center">LOGIN</h1>
          <p className="text-center mb-6 font-base text-gray-600">Enter credentials to access account.</p>

          {/* SOCIAL AUTH */}
          <div className="flex flex-col gap-3 mb-6">
            <button 
              onClick={() => googleLogin()}
              disabled={isAuthenticating}
              className="flex items-center justify-center gap-2 w-full bg-white text-black font-bold border-2 border-black py-3 shadow-neo-sm hover:bg-gray-50 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
            >
              GOOGLE SIGN IN
            </button>

            <a 
              href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`}
              className={`flex items-center justify-center gap-2 w-full bg-[#24292e] text-white font-bold border-2 border-black py-3 shadow-neo-sm hover:bg-gray-800 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${isAuthenticating ? 'pointer-events-none opacity-50' : ''}`}
            >
               GITHUB SIGN IN
            </a>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-gray-300 flex-1"></div>
            <span className="font-bold text-gray-400 text-sm">OR</span>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>

          {/* CREDENTIALS FORM */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input 
              label="USERNAME" 
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={isAuthenticating}
            />
            
            <Input 
              label="PASSWORD" 
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isAuthenticating}
            />

            <Button type="submit" disabled={isAuthenticating} className="w-full mt-2">
              LOGIN
            </Button>
          </form>

          <p className="mt-6 text-center text-sm font-base">
            No account?{' '}
            <Link href="/register" className="underline font-bold hover:text-main">
              Register New Account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading Interface...</div>}>
      <LoginContent />
    </Suspense>
  );
}