'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/axiosInstance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useGoogleLogin } from '@react-oauth/google';
import { Github, Mail } from 'lucide-react'; // Icons

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 1. GITHUB CONFIG ---
  const GITHUB_CLIENT_ID = "Ov23libTC9bolbUzZeBA"; 
  const REDIRECT_URI = "http://localhost:3000/login";

  // --- 2. HANDLE GITHUB CALLBACK ---
  useEffect(() => {
    const code = searchParams.get('code');
    // If we have a code and haven't processed it yet...
    if (code && !localStorage.getItem('auth_token')) {
      handleGithubLogin(code);
    }
    
    // Check for registration success message
    if (searchParams.get('registered')) {
      setSuccess('Account created! Please login.');
    }
  }, [searchParams]);

  const handleGithubLogin = async (code: string) => {
    setLoading(true);
    try {
      // Send the code to your backend
      const response = await api.post('/auth/github/', {
        code: code, // Your backend must handle the code exchange
      });
      handleAuthSuccess(response.data);
    } catch (err) {
      console.error(err);
      setError("GitHub login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. GOOGLE LOGIN HOOK ---
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Send access token to backend
        const response = await api.post('/auth/google/', {
          access_token: tokenResponse.access_token,
        });
        handleAuthSuccess(response.data);
      } catch (err) {
        console.error(err);
        setError("Google login failed.");
        setLoading(false);
      }
    },
    onError: () => setError("Google login failed."),
  });

  // --- SHARED SUCCESS LOGIC ---
  const handleAuthSuccess = (data: any) => {
    // Save Token (Adjust fields based on your exact API response)
    // Sometimes social login returns 'key' instead of 'token'
    const token = data.token || data.key; 
    localStorage.setItem('auth_token', token);
    
    // Sometimes social login doesn't return user details immediately. 
    // You might need to fetch profile after this. For now, we assume it does:
    if (data.user_id) localStorage.setItem('user_id', data.user_id);
    if (data.username) localStorage.setItem('username', data.username);

    router.push('/');
  };

  // --- STANDARD FORM HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/users/login/', formData);
      handleAuthSuccess(response.data);
    } catch (err: any) {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg px-4 py-10">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-neo p-8">
        
        <h1 className="text-4xl font-heading mb-2 text-center">WELCOME</h1>
        <p className="text-center mb-6 font-base text-gray-600">Login to continue.</p>

        {success && <div className="mb-4 p-3 bg-green-100 border-2 border-black text-green-800 font-bold text-sm">{success}</div>}
        {error && <div className="mb-4 p-3 bg-red-100 border-2 border-black text-red-600 font-bold text-sm">⚠️ {error}</div>}

        {/* --- SOCIAL BUTTONS --- */}
        <div className="flex flex-col gap-3 mb-6">
          <button 
            onClick={() => googleLogin()}
            className="flex items-center justify-center gap-3 w-full bg-white text-black font-bold border-2 border-black py-3 shadow-neo-sm hover:bg-gray-50 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <Mail className="w-5 h-5" /> Sign in with Google
          </button>

          <a 
            href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`}
            className="flex items-center justify-center gap-3 w-full bg-[#24292e] text-white font-bold border-2 border-black py-3 shadow-neo-sm hover:bg-gray-800 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <Github className="w-5 h-5" /> Sign in with GitHub
          </a>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-gray-300 flex-1"></div>
          <span className="font-bold text-gray-400 text-sm">OR</span>
          <div className="h-px bg-gray-300 flex-1"></div>
        </div>

        {/* --- STANDARD FORM --- */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input 
            label="Username" 
            name="username"
            placeholder="e.g. tastytaco"
            value={formData.username}
            onChange={handleChange}
            required
          />
          
          <Input 
            label="Password" 
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'LOGGING IN...' : 'LOGIN NOW'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-base">
          Don't have an account?{' '}
          <Link href="/register" className="underline font-bold hover:text-main">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}