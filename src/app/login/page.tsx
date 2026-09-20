'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ArrowRight, Lock, Mail, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      if (!configured) {
        // Fallback for hackathon demo if Supabase keys aren't configured in .env.local yet
        setErrorMessage(
          'Supabase credentials not detected in .env.local. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live authentication.'
        );
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          setErrorMessage('Email or password is incorrect.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Please check your inbox and verify your email before logging in.');
        } else {
          setErrorMessage(error.message || 'Unable to sign in. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      setErrorMessage('Something went wrong. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* FOUND Wordmark */}
        <Link href="/" className="inline-block group focus-visible:outline-none">
          <span className="font-serif font-extrabold text-3xl sm:text-4xl text-[#191C1B] tracking-tight group-hover:text-primary transition-colors block">
            FOUND
          </span>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#727972] uppercase block mt-1">
            Find what you have.
          </span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#E2E5E1] rounded-2xl shadow-2xs">
          <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#191C1B] mb-2">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6762] mb-6">
            Log in to access your private pantry and durable inventory.
          </p>

          {/* Error banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FFF0ED] border border-[#F5C2B4] flex items-start gap-2.5 text-xs text-[#97472E]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#97472E]" />
              <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#191C1B] mb-1.5 uppercase tracking-wider"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#727972] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#FAFBF9] border border-[#E2E5E1] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-[#191C1B]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#191C1B] uppercase tracking-wider"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#727972] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#FAFBF9] border border-[#E2E5E1] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-[#191C1B]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <span>{isLoading ? 'Logging in…' : 'Log in'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#F2F4F1] text-center text-xs text-[#5F6762]">
            <span>Don&apos;t have an account? </span>
            <Link
              href={redirectTo !== '/' ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/signup'}
              className="text-primary font-bold hover:underline"
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#E2E5E1] border-t-primary animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}

