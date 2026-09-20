'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to update password.');
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2500);
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121513] bg-editorial-pattern flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-xs bg-[#16261B] text-[#86EFAC] border border-[#23432B] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h1 className="font-serif font-bold text-2xl text-[#EFF1EC]">
                Password updated
              </h1>
              <p className="text-xs sm:text-sm text-[#8E968F] max-w-sm mx-auto leading-relaxed">
                Your password has been successfully reset. Redirecting you to login…
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xs bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider border border-[#4E805B]/30 shadow-2xs transition-colors"
                >
                  <span>Go to Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#EFF1EC] mb-2">
                Set new password
              </h1>
              <p className="text-xs sm:text-sm text-[#8E968F] mb-6">
                Enter your new password below.
              </p>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xs bg-[#2D1915] border border-[#4D241D] flex items-start gap-2.5 text-xs text-[#F87171]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#F87171]" />
                  <div className="flex-1 leading-relaxed font-mono">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-mono uppercase tracking-widest text-[#8E968F] mb-1.5"
                  >
                    New Password
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
                    Confirm New Password
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
                      placeholder="Re-enter new password"
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
                    <span>{isLoading ? 'Updating…' : 'Update password'}</span>
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
