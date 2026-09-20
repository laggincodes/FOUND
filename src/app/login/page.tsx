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
    <div className="min-h-screen bg-[#121513] bg-editorial-pattern flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* FOUND Wordmark */}
        <Link href="/" className="inline-block group focus-visible:outline-none">
          <span className="font-serif font-extrabold text-3xl sm:text-4xl text-[#EFF1EC] tracking-tight group-hover:text-[#86EFAC] transition-colors block">
            FOUND
          </span>
          <span className="text-[10px] sm:text-xs font-mono tracking-widest text-[#8E968F] uppercase block mt-1">
            Find what you have.
          </span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#181C19] py-8 px-6 sm:px-8 border border-[#28302A] rounded-xs shadow-2xs">
          <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#EFF1EC] mb-2">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-[#8E968F] mb-6">
            Log in to access your private pantry and durable inventory.
          </p>

          {/* Error banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xs bg-[#2D1915] border border-[#4D241D] flex items-start gap-2.5 text-xs text-[#F87171]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#F87171]" />
              <div className="flex-1 leading-relaxed font-mono">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] font-mono uppercase tracking-widest text-[#8E968F] mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8E968F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#141715] border border-[#28302A] rounded-xs focus:bg-[#161A17] focus:border-[#4B7A58] focus:outline-none text-[#EFF1EC] placeholder:text-[#5A635B]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[10px] font-mono uppercase tracking-widest text-[#8E968F]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-mono text-[#86EFAC] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8E968F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#141715] border border-[#28302A] rounded-xs focus:bg-[#161A17] focus:border-[#4B7A58] focus:outline-none text-[#EFF1EC] placeholder:text-[#5A635B]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xs bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider border border-[#4E805B]/30 shadow-2xs transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <span>{isLoading ? 'Logging in…' : 'Log in'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#28302A] text-center text-xs text-[#8E968F]">
            <span>Don&apos;t have an account? </span>
            <Link
              href={redirectTo !== '/' ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/signup'}
              className="text-[#86EFAC] font-mono hover:underline ml-1"
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
        <div className="min-h-screen bg-[#121513] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#28302A] border-t-[#86EFAC] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}

