import React, { useState } from 'react';
import { ShieldCheck, KeyRound, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StepUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contextMessage?: string;
}

export const StepUpModal: React.FC<StepUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contextMessage = 'Elevated session risk detected or new device enrollment requires verification.',
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit authenticator code.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    setTimeout(() => {
      // Accept demo code '849201' or any valid 6 digits for prototype ease
      if (code.length === 6) {
        setIsVerifying(false);
        onSuccess();
      } else {
        setIsVerifying(false);
        setError('Invalid TOTP verification token. Please check your authenticator.');
      }
    }, 600);
  };

  const handleFillDemoCode = () => {
    setCode('849201');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Step-Up MFA Challenge</h3>
            <p className="text-xs text-slate-400 font-mono">RFC 6238 Time-Based OTP</p>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
          {contextMessage}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter 6-Digit Authenticator Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 849201"
              autoFocus
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-center font-mono text-xl tracking-[0.3em] text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Registered to Authenticator App</span>
            <button
              type="button"
              onClick={handleFillDemoCode}
              className="text-cyan-400 hover:underline font-mono cursor-pointer"
            >
              Fill Demo Code (849201)
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isVerifying ? (
                <span>Validating...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Identity</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
