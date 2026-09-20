'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      if (!configured) {
        setErrorMessage(
          'Supabase credentials not configured in .env.local. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable password resets.'
        );
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to send reset link. Please try again.');
      } else {
        setIsSubmitted(true);
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
          {isSubmitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E3F2E9] text-primary flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h1 className="font-serif font-bold text-2xl text-[#191C1B]">
                Check your inbox
              </h1>
              <p className="text-xs sm:text-sm text-[#5F6762] max-w-sm mx-auto leading-relaxed">
                If an account exists for <strong className="text-[#191C1B]">{email}</strong>, we have sent a password reset link.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#191C1B] mb-2">
                Forgot your password?
              </h1>
              <p className="text-xs sm:text-sm text-[#5F6762] mb-6">
                Enter your email address and we&apos;ll send you a secure link to reset your password.
              </p>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#FFF0ED] border border-[#F5C2B4] flex items-start gap-2.5 text-xs text-[#97472E]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#97472E]" />
                  <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    <span>{isLoading ? 'Sending link…' : 'Send reset link'}</span>
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-[#F2F4F1] text-center text-xs text-[#5F6762]">
                <Link href="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
