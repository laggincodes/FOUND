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
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* FOUND Wordmark */}
        <Link href="/" className="inline-block group focus-visible:outline-none">
          <span className="font-serif font-extrabold text-3xl sm:text-4xl text-[#191C1B] tracking-tight group-hover:text-primary transition-colors block">
            FOUND
          </span>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#727972] uppercase block mt-1">
            Give your stuff a memory.
          </span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#E2E5E1] rounded-2xl shadow-2xs">
          {isSuccessConfirmation ? (
            /* Email Confirmation Required State */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E3F2E9] text-primary flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h1 className="font-serif font-bold text-2xl text-[#191C1B]">
                Check your email
              </h1>
              <p className="text-xs sm:text-sm text-[#5F6762] max-w-sm mx-auto leading-relaxed">
                We sent a confirmation link to <strong className="text-[#191C1B]">{email}</strong>. Check your email to confirm your account before logging in.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs transition-colors"
                >
                  <span>Return to Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Sign Up Form */
            <>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#191C1B] mb-2">
                Create your account
              </h1>
              <p className="text-xs sm:text-sm text-[#5F6762] mb-6">
                Start tracking what you own, save money, and cut waste.
              </p>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#FFF0ED] border border-[#F5C2B4] flex items-start gap-2.5 text-xs text-[#97472E]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#97472E]" />
                  <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-[#191C1B] mb-1.5 uppercase tracking-wider"
                  >
                    Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#727972] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Aarav Sharma"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#FAFBF9] border border-[#E2E5E1] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-[#191C1B]"
                    />
                  </div>
                </div>

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
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-[#191C1B] mb-1.5 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#727972] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#FAFBF9] border border-[#E2E5E1] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-[#191C1B]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold text-[#191C1B] mb-1.5 uppercase tracking-wider"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#727972] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
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
                    <span>{isLoading ? 'Creating account…' : 'Create account'}</span>
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-[#F2F4F1] text-center text-xs text-[#5F6762]">
                <span>Already have an account? </span>
                <Link
                  href={redirectTo !== '/' ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login'}
                  className="text-primary font-bold hover:underline"
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
        <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#E2E5E1] border-t-primary animate-spin" />
        </div>
      }
    >
      <SignUpForm />
    </React.Suspense>
  );
}

