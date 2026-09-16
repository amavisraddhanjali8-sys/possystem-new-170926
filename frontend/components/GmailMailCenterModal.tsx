import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  LogOut, 
  Shield, 
  Settings, 
  FileText, 
  Users, 
  Lock, 
  Inbox, 
  Clock, 
  Check, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { 
  googleSignIn, 
  logoutGoogle, 
  isGmailConnected, 
  getGoogleUser, 
  sendGmailMessage, 
  listGmailMessages, 
  subscribeToGmailAuth 
} from '../services/gmailAuth';
import { 
  getEmailAutomationsConfig, 
  saveEmailAutomationsConfig, 
  EmailAutomationConfig 
} from '../utils/emailTemplates';
import { Customer, SystemUser, Quotation } from '../../shared/types';

interface GmailMailCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: Customer[];
  staffUsers?: SystemUser[];
  quotations?: Quotation[];
  initialRecipient?: string;
  initialSubject?: string;
  initialBody?: string;
}

export const GmailMailCenterModal: React.FC<GmailMailCenterModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  staffUsers = [],
  quotations = [],
  initialRecipient = '',
  initialSubject = '',
  initialBody = ''
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(isGmailConnected());
  const [googleUser, setGoogleUser] = useState<any>(getGoogleUser());
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'automations' | 'inbox'>('compose');

  // Compose State
  const [recipient, setRecipient] = useState<string>(initialRecipient);
  const [subject, setSubject] = useState<string>(initialSubject);
  const [body, setBody] = useState<string>(initialBody);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [sendErrorMsg, setSendErrorMsg] = useState<string | null>(null);

  // Destructive/Mutating Confirmation State (MANDATORY per Workspace Integration skill)
  const [showConfirmSendModal, setShowConfirmSendModal] = useState<boolean>(false);

  // Automations Config State
  const [automationsConfig, setAutomationsConfig] = useState<EmailAutomationConfig>(getEmailAutomationsConfig);
  const [configSavedToast, setConfigSavedToast] = useState<boolean>(false);

  // Inbox & Messages State
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Sync auth state
  useEffect(() => {
    const unsub = subscribeToGmailAuth((user, token) => {
      setGoogleUser(user);
      setIsConnected(!!(user && token));
    });
    return unsub;
  }, []);

  // Update compose fields when initial props change
  useEffect(() => {
    if (initialRecipient) setRecipient(initialRecipient);
    if (initialSubject) setSubject(initialSubject);
    if (initialBody) setBody(initialBody);
  }, [initialRecipient, initialSubject, initialBody]);

  // Load recent messages when tab is switched to inbox
  useEffect(() => {
    if (isOpen && isConnected && activeTab === 'inbox') {
      loadRecentMessages();
    }
  }, [isOpen, isConnected, activeTab]);

  const loadRecentMessages = async () => {
    setIsLoadingMessages(true);
    setMessagesError(null);
    try {
      const list = await listGmailMessages(12);
      setMessages(list);
    } catch (err: any) {
      setMessagesError(err?.message || 'Failed to fetch messages from Gmail');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsSigningIn(true);
    setSendErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setIsConnected(true);
        setGoogleUser(res.user);
      }
    } catch (err: any) {
      setSendErrorMsg(err?.message || 'Failed to authenticate with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (window.confirm('Disconnect your Google Account from this session?')) {
      await logoutGoogle();
      setIsConnected(false);
      setGoogleUser(null);
      setMessages([]);
    }
  };

  // Pre-validate before opening confirmation dialog
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSendErrorMsg(null);
    setSendSuccessMsg(null);

    const cleanTo = recipient.trim();
    if (!cleanTo || !cleanTo.includes('@')) {
      setSendErrorMsg('Please specify a valid recipient email address.');
      return;
    }

    if (!subject.trim()) {
      setSendErrorMsg('Please specify an email subject.');
      return;
    }

    if (!body.trim()) {
      setSendErrorMsg('Please enter email message content.');
      return;
    }

    // Open explicit confirmation dialog (MANDATORY REQUIREMENT)
    setShowConfirmSendModal(true);
  };

  // Confirmed Send via Gmail API
  const handleExecuteSend = async () => {
    setShowConfirmSendModal(false);
    setIsSending(true);
    setSendErrorMsg(null);
    setSendSuccessMsg(null);

    try {
      const res = await sendGmailMessage({
        to: recipient.trim(),
        subject: subject.trim(),
        bodyHtml: body,
        fromName: automationsConfig.senderDisplayName || 'INNOVISTA ERP'
      });

      setSendSuccessMsg(`✅ Email successfully transmitted via Gmail API! Message ID: ${res.id}`);
      // Clear form
      setSubject('');
      setBody('');
    } catch (err: any) {
      setSendErrorMsg(err?.message || 'Failed to send message via Gmail API');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAutomations = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailAutomationsConfig(automationsConfig);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  // Template pre-fill
  const handleApplyTemplate = (type: 'quote' | 'recovery' | 'payment_reminder') => {
    if (type === 'quote' && quotations.length > 0) {
      const q = quotations[0];
      setSubject(`Official Quotation #${q.quotation_number} - ${q.customer_name} | INNOVISTA ERP`);
      setBody(`
<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <h2 style="color: #0F203C;">INNOVISTA Enterprise Quotation Dispatch</h2>
  <p>Dear <strong>${q.customer_name}</strong>,</p>
  <p>Thank you for your business. Please find your itemized quotation details below:</p>
  <ul>
    <li><strong>Quotation Ref:</strong> ${q.quotation_number}</li>
    <li><strong>Site Location:</strong> ${q.site_location_name || 'Central'}</li>
    <li><strong>Total Amount:</strong> Rs. ${Number(q.total_amount).toLocaleString()}</li>
  </ul>
  <p>For any queries or formal confirmation, please reply to this transmission.</p>
</div>
      `.trim());
    } else if (type === 'recovery') {
      setSubject(`[SECURITY] Account Password Recovery PIN`);
      setBody(`
<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <h3 style="color: #0F203C;">Account Recovery Passcode</h3>
  <p>Your one-time authentication passcode is: <strong style="font-size: 20px; color: #E87F24;">749281</strong></p>
  <p>This code will expire in 10 minutes. If you did not initiate this request, please contact your Super Admin.</p>
</div>
      `.trim());
    } else if (type === 'payment_reminder') {
      setSubject(`Commercial Payment & Dispatch Notice - INNOVISTA ERP`);
      setBody(`
<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <h3 style="color: #0F203C;">Payment Confirmation & Delivery Notice</h3>
  <p>Dear Client,</p>
  <p>Your commercial order has been validated for regional factory fabrication. Please arrange the scheduled advance deposit to release logistics dispatch.</p>
  <p>Thank you for your ongoing partnership.</p>
</div>
      `.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#0F203C] text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Gmail & Enterprise Email Center
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Google Workspace API
                </span>
              </div>
              <p className="text-xs text-[#73A5CA]">
                Recovery emails, automated quotation dispatches & communications
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isConnected && googleUser && (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                    {(googleUser.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-slate-200 font-mono truncate max-w-[180px]">{googleUser.email}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex space-x-2 py-2">
            <button
              onClick={() => setActiveTab('compose')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-[#0F203C] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compose & Send</span>
            </button>

            <button
              onClick={() => setActiveTab('automations')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'automations'
                  ? 'bg-[#0F203C] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Automations & Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'inbox'
                  ? 'bg-[#0F203C] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Sent Messages Stream</span>
            </button>
          </div>

          <div>
            {isConnected ? (
              <button
                onClick={handleDisconnectGoogle}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 py-1 px-2 rounded hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Disconnect</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Connection Status Banner if not connected */}
          {!isConnected && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-amber-500/20 text-amber-800 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                  <Shield className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Google Workspace Gmail Account Required
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Connect your Google account with permission to dispatch real recovery emails, quotation PDFs, and customer communications directly through Gmail.
                  </p>
                </div>
              </div>

              {/* Official Google Sign In Button (Styled per workspace-integration skill) */}
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isSigningIn}
                className="inline-flex items-center justify-center bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 font-medium text-xs px-4 py-2 rounded-lg shadow-xs transition duration-150 ease-in-out cursor-pointer shrink-0 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}

          {/* Feedback alerts */}
          {sendSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sendSuccessMsg}</span>
            </div>
          )}
          {sendErrorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{sendErrorMsg}</span>
            </div>
          )}

          {/* TAB 1: COMPOSE */}
          {activeTab === 'compose' && (
            <form onSubmit={handleInitiateSend} className="space-y-4">
              {/* Quick Template Picker */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E87F24]" />
                  <span>Preset Templates</span>
                </span>
                <div className="flex space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('quote')}
                    className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded transition cursor-pointer"
                  >
                    Quotation Dispatch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('recovery')}
                    className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded transition cursor-pointer"
                  >
                    Recovery Code
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('payment_reminder')}
                    className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded transition cursor-pointer"
                  >
                    Commercial Notice
                  </button>
                </div>
              </div>

              {/* Recipient Field */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    To (Recipient Email Address) *
                  </label>
                  <input
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="client@innovista.lk or user@gmail.com"
                    required
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F203C] font-mono"
                  />
                </div>

                {/* Quick Select from system entities */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quick Select Contact
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setRecipient(e.target.value);
                    }}
                    defaultValue=""
                    className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F203C] bg-white cursor-pointer"
                  >
                    <option value="">-- Choose Customer / Staff --</option>
                    <optgroup label="Registered Customers">
                      {customers.filter(c => c.email).map(c => (
                        <option key={c.id} value={c.email}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Internal Staff Accounts">
                      {staffUsers.filter(u => u.email).map(u => (
                        <option key={u.id} value={u.email}>
                          {u.name} ({u.role} - {u.email})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Official Quotation / Enterprise Notification"
                  required
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F203C] font-medium"
                />
              </div>

              {/* Body Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Email Content (HTML / Text) *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Supports formatted HTML markup & styling
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter the body of your message here..."
                  required
                  className="w-full text-xs p-3.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F203C] font-mono leading-relaxed"
                ></textarea>
              </div>

              {/* Preview Box if content exists */}
              {body.includes('<') && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Message Preview:
                  </span>
                  <div 
                    className="text-xs p-3 bg-white border border-slate-200 rounded-lg max-h-48 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                </div>
              )}

              {/* Submit CTA */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-500">
                  {isConnected ? (
                    <span className="text-emerald-700 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready to send via authenticated Gmail account</span>
                    </span>
                  ) : (
                    <span className="text-amber-700">Sign in with Google required before sending</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSending || !isConnected}
                    className="bg-[#E87F24] hover:bg-[#d66f16] active:bg-[#c46210] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending via Gmail...' : 'Send Message'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: AUTOMATIONS & SETTINGS */}
          {activeTab === 'automations' && (
            <form onSubmit={handleSaveAutomations} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-[#0F203C] uppercase tracking-wider flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-[#E87F24]" />
                  <span>Enterprise Mailing Automation Triggers</span>
                </h3>

                <div className="space-y-3">
                  {/* Trigger 1 */}
                  <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300">
                    <input
                      type="checkbox"
                      checked={automationsConfig.autoEmailRecoveryOtp}
                      onChange={(e) => setAutomationsConfig({
                        ...automationsConfig,
                        autoEmailRecoveryOtp: e.target.checked
                      })}
                      className="mt-0.5 rounded text-[#0F203C] focus:ring-[#0F203C]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Automatic Recovery OTP Dispatch via Gmail
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Whenever an employee or administrator triggers an account password recovery on the login portal, immediately generate and email an official 6-digit verification code to their registered work email.
                      </span>
                    </div>
                  </label>

                  {/* Trigger 2 */}
                  <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300">
                    <input
                      type="checkbox"
                      checked={automationsConfig.autoEmailValidatedQuotations}
                      onChange={(e) => setAutomationsConfig({
                        ...automationsConfig,
                        autoEmailValidatedQuotations: e.target.checked
                      })}
                      className="mt-0.5 rounded text-[#0F203C] focus:ring-[#0F203C]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Customer Quotation Dispatch & PDF Notifications
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Enable one-click emailing of itemized quotation proposals, material specifications, and transport breakdowns directly to customers upon validation.
                      </span>
                    </div>
                  </label>

                  {/* Trigger 3 */}
                  <label className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300">
                    <input
                      type="checkbox"
                      checked={automationsConfig.autoEmailCriticalAccessAlerts}
                      onChange={(e) => setAutomationsConfig({
                        ...automationsConfig,
                        autoEmailCriticalAccessAlerts: e.target.checked
                      })}
                      className="mt-0.5 rounded text-[#0F203C] focus:ring-[#0F203C]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Super Admin Emergency Access Security Broadcast
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Send a high-priority security audit alert email whenever the Critical Circumstances Emergency PIN (A9HF-4K28@) is authenticated anywhere in the system.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Sender & Footer Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={automationsConfig.senderDisplayName}
                    onChange={(e) => setAutomationsConfig({
                      ...automationsConfig,
                      senderDisplayName: e.target.value
                    })}
                    placeholder="INNOVISTA Enterprise ERP Notifications"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F203C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Default Compliance CC Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={automationsConfig.defaultCcEmail}
                    onChange={(e) => setAutomationsConfig({
                      ...automationsConfig,
                      defaultCcEmail: e.target.value
                    })}
                    placeholder="compliance@innovista.lk"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F203C] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Standard Enterprise Contact Footer
                </label>
                <input
                  type="text"
                  value={automationsConfig.companyContactFooter}
                  onChange={(e) => setAutomationsConfig({
                    ...automationsConfig,
                    companyContactFooter: e.target.value
                  })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F203C]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {configSavedToast ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Automations configuration saved successfully!</span>
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="bg-[#0F203C] hover:bg-[#1A2E4E] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Save Automations Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: INBOX / RECENT MESSAGES */}
          {activeTab === 'inbox' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recent Gmail Outbox & Activity Log
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live messages synchronized directly from the connected Gmail account
                  </p>
                </div>

                <button
                  onClick={loadRecentMessages}
                  disabled={isLoadingMessages || !isConnected}
                  className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {messagesError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                  {messagesError}
                </div>
              )}

              {isLoadingMessages ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0F203C]" />
                  <p className="text-xs font-medium">Fetching messages from Gmail API...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No recent messages retrieved.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Emails sent through INNOVISTA ERP or your account will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-800 truncate">
                            {msg.subject || '(No Subject)'}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            ID: {msg.id.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          {msg.to && <span><strong>To:</strong> {msg.to}</span>}
                          {msg.from && <span><strong>From:</strong> {msg.from}</span>}
                          {msg.date && <span><strong>Date:</strong> {msg.date}</span>}
                        </div>
                        {msg.snippet && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                            "{msg.snippet}"
                          </p>
                        )}
                      </div>

                      <a
                        href={`https://mail.google.com/mail/u/0/#inbox/${msg.threadId || msg.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition shrink-0"
                        title="Open in Gmail Web"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MANDATORY CONFIRMATION MODAL FOR DESTRUCTIVE / MUTATING EMAIL OPERATIONS  */}
      {/* Required by workspace-integration skill for sending emails on user behalf */}
      {/* ========================================================================= */}
      {showConfirmSendModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 text-slate-900">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-800">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Confirm Email Transmission</h3>
                <p className="text-xs text-slate-500">Google Workspace Gmail API Dispatch</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-600">Recipient (To):</span>
                <p className="font-mono text-slate-900 font-semibold truncate">{recipient}</p>
              </div>
              <div>
                <span className="font-bold text-slate-600">Subject:</span>
                <p className="text-slate-900 font-medium">{subject}</p>
              </div>
              <div>
                <span className="font-bold text-slate-600">Sender Account:</span>
                <p className="text-slate-800 font-mono text-[11px]">{googleUser?.email || 'Authenticated User'}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to send this email on behalf of your connected Google account? This will dispatch a real email transmission via Gmail.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmSendModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSend}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0F203C] hover:bg-[#1A2E4E] rounded-lg shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#FFC81E]" />
                <span>Confirm & Send via Gmail</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
