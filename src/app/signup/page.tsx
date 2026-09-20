'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessConfirmation, setIsSuccessConfirmation] = useState(false);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Please choose a stronger password (minimum 6 characters).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      if (!configured) {
        setErrorMessage(
          'Supabase credentials not detected in .env.local. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live registration.'
        );
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            name: cleanName,
            household_name: `${cleanName}'s Household`,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        if (error.message.includes('User already registered') || error.message.includes('already exists')) {
          setErrorMessage('An account with this email already exists.');
        } else {
          setErrorMessage(error.message || 'Registration failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // If Supabase has email confirmation enabled, user is not immediately authenticated
      if (data.user && (!data.session || data.user.identities?.length === 0)) {
        setIsSuccessConfirmation(true);
      } else if (data.session) {
        // Immediate session granted
        router.push(redirectTo);
        router.refresh();
      } else {
        setIsSuccessConfirmation(true);
      }
    } catch {
      setErrorMessage('Something went wrong. Please check your connection and try again.');
    } finally {
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
            Give your stuff a memory.
          </span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#181C19] py-8 px-6 sm:px-8 border border-[#28302A] rounded-xs shadow-2xs">
          {isSuccessConfirmation ? (
            /* Email Confirmation Required State */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-xs bg-[#16261B] text-[#86EFAC] border border-[#23432B] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h1 className="font-serif font-bold text-2xl text-[#EFF1EC]">
                Check your email
              </h1>
              <p className="text-xs sm:text-sm text-[#8E968F] max-w-sm mx-auto leading-relaxed">
                We sent a confirmation link to <strong className="text-[#EFF1EC]">{email}</strong>. Check your email to confirm your account before logging in.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xs bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider border border-[#4E805B]/30 shadow-2xs transition-colors"
                >
                  <span>Return to Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Sign Up Form */
            <>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#EFF1EC] mb-2">
                Create your account
              </h1>
              <p className="text-xs sm:text-sm text-[#8E968F] mb-6">
                Start tracking what you own, save money, and cut waste.
              </p>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xs bg-[#2D1915] border border-[#4D241D] flex items-start gap-2.5 text-xs text-[#F87171]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#F87171]" />
                  <div className="flex-1 leading-relaxed font-mono">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-[10px] font-mono uppercase tracking-widest text-[#8E968F] mb-1.5"
                  >
                    Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8E968F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Aarav Sharma"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#141715] border border-[#28302A] rounded-xs focus:bg-[#161A17] focus:border-[#4B7A58] focus:outline-none text-[#EFF1EC] placeholder:text-[#5A635B]"
                    />
                  </div>
                </div>

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
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-mono uppercase tracking-widest text-[#8E968F] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8E968F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#141715] border border-[#28302A] rounded-xs focus:bg-[#161A17] focus:border-[#4B7A58] focus:outline-none text-[#EFF1EC] placeholder:text-[#5A635B]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-[10px] font-mono uppercase tracking-widest text-[#8E968F] mb-1.5"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8E968F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
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
                    <span>{isLoading ? 'Creating account…' : 'Create account'}</span>
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-[#28302A] text-center text-xs text-[#8E968F]">
                <span>Already have an account? </span>
                <Link
                  href={redirectTo !== '/' ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login'}
                  className="text-[#86EFAC] font-mono hover:underline ml-1"
                >
                  Log in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#121513] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#28302A] border-t-[#86EFAC] animate-spin" />
        </div>
      }
    >
      <SignUpForm />
    </React.Suspense>
  );
}

