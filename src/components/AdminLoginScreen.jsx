import React, { useEffect, useState } from 'react';
import { LockKeyhole, ShieldCheck, ArrowLeft } from 'lucide-react';
import { signInStaff } from '../utils/staffAuth';

export default function AdminLoginScreen({ onLoggedIn, onBackToSite }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await signInStaff(pin);
    if (!result.ok) {
      setError(result.message || 'Unable to sign in.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onLoggedIn();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-noir-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-gold-500/30 bg-noir-900/95 p-6 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl border border-gold-500/30 bg-gold-500/10 flex items-center justify-center text-gold-300">
              <LockKeyhole className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-gold-400">Staff access</p>
              <h2 className="font-serif text-2xl text-white">Admin login</h2>
            </div>
          </div>
          {onBackToSite && (
            <button
              type="button"
              onClick={onBackToSite}
              className="rounded-full border border-white/10 bg-noir-850 p-2 text-stone-300 hover:text-white"
              aria-label="Back to public site"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-noir-950/60 p-4 text-sm text-stone-300">
          <div className="flex items-center gap-2 text-gold-300 font-semibold uppercase tracking-wider text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Restricted</span>
          </div>
          <p className="mt-2 text-stone-300">
            Enter the restaurant staff PIN to access the saved order log and source-of-truth records.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400">PIN</span>
            <input
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Enter staff PIN"
              inputMode="numeric"
              autoComplete="off"
              className="w-full rounded-2xl border border-white/10 bg-noir-950 px-4 py-3 text-base text-white placeholder:text-stone-500 outline-none ring-0 focus:border-gold-500/50"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !pin.trim()}
            className="w-full rounded-2xl bg-gradient-to-r from-gold-500 via-amber-500 to-gold-600 px-4 py-3 text-sm font-bold uppercase tracking-wider text-noir-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Verifying...' : 'Access order log'}
          </button>
        </form>
      </div>
    </div>
  );
}
