'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/axiosInstance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // API call to register endpoint
      await api.post('/users/register/', formData);
      
      // Redirect to Login with success flag
      router.push('/login?registered=true');
    } catch (err: any) {
      console.error(err);
      // Extract specific error message if available
      const msg = err.response?.data?.username?.[0] || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg px-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-neo p-8">
        <h1 className="text-4xl font-heading mb-2 text-center">REGISTER</h1>
        <p className="text-center mb-8 font-base text-gray-600">Create a new account.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-black text-red-600 font-bold text-sm">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input 
            label="USERNAME" 
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          
          <Input 
            label="EMAIL" 
            name="email"
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <Input 
            label="PASSWORD" 
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'PROCESSING...' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-base">
          Existing user?{' '}
          <Link href="/login" className="underline font-bold hover:text-main">
            Login Here
          </Link>
        </p>
      </div>
    </div>
  );
}