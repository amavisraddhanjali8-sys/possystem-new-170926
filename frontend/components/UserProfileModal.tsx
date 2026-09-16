import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  X,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { SystemUser } from '../../shared/types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: SystemUser | null;
  onOpenChangePassword?: () => void;
  onOpenMfaSecurity?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenChangePassword,
  onOpenMfaSecurity
}) => {
  const [showPin, setShowPin] = useState<boolean>(false);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);

  if (!isOpen || !currentUser) return null;

  const isSuperAdmin = currentUser.role === 'Super Admin';
  // Critical Circumstances Super Admin PIN
  const superAdminCriticalPin = currentUser.critical_pin || 'A9HF-4K28@';

  const handleCopyPin = () => {
    navigator.clipboard.writeText(superAdminCriticalPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0F203C] to-[#1A2E4E] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-[#FFC81E]" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center space-x-2">
                <span>{currentUser.name}</span>
                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                  isSuperAdmin 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' 
                    : 'bg-[#FFC81E]/20 text-[#FFC81E] border border-[#FFC81E]/30'
                }`}>
                  {currentUser.role}
                </span>
              </h2>
              <p className="text-xs text-slate-300">User Account Profile & Security Authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Identity & Basic Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Employee ID</span>
                <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded inline-block mt-0.5">
                  {currentUser.employee_id || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Account Status</span>
                <span className="inline-flex items-center space-x-1 mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{currentUser.status || 'Active'}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</span>
                <span className="text-xs font-medium text-slate-800 flex items-center space-x-1 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{currentUser.email || 'N/A'}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contact Phone</span>
                <span className="text-xs font-medium text-slate-800 flex items-center space-x-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{currentUser.phone || 'N/A'}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Node / Branch</span>
                <span className="text-xs font-medium text-slate-800 flex items-center space-x-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{currentUser.branch_name || currentUser.branch_id || 'Head Office'}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Last Login Activity</span>
                <span className="text-xs font-medium text-slate-700 flex items-center space-x-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{currentUser.last_login || 'Active Session'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* SUPER ADMIN EXCLUSIVE: CRITICAL CIRCUMSTANCES EMERGENCY PIN */}
          {/* SECURITY POLICY: Viewable ONLY in the Super Admin profile. NEVER exposed outside. */}
          {isSuperAdmin ? (
            <div className="bg-gradient-to-br from-purple-50 via-purple-50/50 to-indigo-50 border-2 border-purple-300 rounded-xl p-4.5 space-y-3.5 shadow-xs relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-extrabold text-purple-950 uppercase tracking-wide">
                        Critical Circumstances Emergency PIN
                      </h3>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 border border-purple-300">
                        SUPER ADMIN ONLY
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-800 font-medium mt-0.5">
                      Disaster Recovery & Emergency System Access Key
                    </p>
                  </div>
                </div>
              </div>

              {/* PIN Box with Mask / Unmask Toggle & Copy */}
              <div className="bg-white border border-purple-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Emergency PIN Code:
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1 cursor-pointer transition"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPin ? 'Hide' : 'View PIN'}</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleCopyPin}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1 cursor-pointer transition"
                    >
                      {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPin ? 'Copied!' : 'Copy PIN'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 text-purple-300 p-3 rounded-lg font-mono font-extrabold text-base tracking-widest text-center select-all border border-purple-900 shadow-inner">
                  {showPin ? superAdminCriticalPin : '••••••••••••'}
                </div>
              </div>

              {/* Strict Security Policy Notice */}
              <div className="bg-purple-100/80 border border-purple-200/90 rounded-lg p-2.5 text-[11px] text-purple-950 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span>Strict Security Directive:</span>
                </div>
                <p className="text-purple-900 leading-relaxed">
                  Only a Super Admin can use this PIN for login to the system under critical circumstances (e.g. system lockout, lost MFA device, or disaster emergency). This code is strictly confidential, restricted exclusively to this Super Admin profile, and must not be exposed outside.
                </p>
              </div>
            </div>
          ) : null}

          {/* Quick Security Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
            <div className="flex items-center space-x-2">
              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChangePassword();
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-slate-600" />
                  <span>Change Password</span>
                </button>
              )}

              {onOpenMfaSecurity && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMfaSecurity();
                  }}
                  className="px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                  <span>2FA Security</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0F203C] hover:bg-[#1A2E4E] text-white font-bold rounded-lg transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
