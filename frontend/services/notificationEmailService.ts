import { sendGmailMessage, isGmailConnected, subscribeToGmailAuth } from './gmailAuth';
import { 
  getEmailAutomationsConfig, 
  generateLoginAlertEmail, 
  generatePasswordChangedEmail, 
  generateMfaSecurityUpdatedEmail, 
  generateAdminPriceRevisionAlertEmail, 
  generateAdminUserManagementAlertEmail, 
  generateAdminSecurityIncidentAlertEmail 
} from '../utils/emailTemplates';
import { formatSystemDateTime, getSystemTimezone } from '../utils/timezoneEngine';
import { SystemUser } from '../../shared/types';
import { INITIAL_USERS } from '../data/initialData';

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  category: 'login_alert' | 'account_activity' | 'admin_security' | 'price_revision' | 'user_management' | 'recovery_otp' | 'quote_dispatch' | 'general';
  recipientName?: string;
  timestamp: string;
  status: 'sent' | 'queued' | 'failed';
  previewSnippet: string;
  bodyHtml: string;
  errorMessage?: string;
}

const STORAGE_KEY_LOGS = 'innovista_email_activity_log';

/**
 * Retrieve persistent outbound email activity logs from storage
 */
export function getEmailActivityLogs(): EmailLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse email activity logs:', err);
  }
  return [];
}

/**
 * Save new or updated log entry
 */
export function saveEmailActivityLog(entry: EmailLogEntry) {
  try {
    const logs = getEmailActivityLogs();
    const existingIdx = logs.findIndex(l => l.id === entry.id);
    if (existingIdx >= 0) {
      logs[existingIdx] = entry;
    } else {
      logs.unshift(entry);
    }
    // Cap at 150 entries for storage hygiene
    if (logs.length > 150) {
      logs.length = 150;
    }
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('innovista_email_activity_updated', { detail: entry }));
  } catch (err) {
    console.error('Failed to save email activity log:', err);
  }
}

/**
 * Update an existing log entry status
 */
export function updateEmailActivityLogStatus(id: string, status: 'sent' | 'failed', errorMessage?: string) {
  try {
    const logs = getEmailActivityLogs();
    const target = logs.find(l => l.id === id);
    if (target) {
      target.status = status;
      if (errorMessage) target.errorMessage = errorMessage;
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
      window.dispatchEvent(new CustomEvent('innovista_email_activity_updated', { detail: target }));
    }
  } catch (err) {
    console.error('Failed to update email log status:', err);
  }
}

/**
 * Clear activity logs
 */
export function clearEmailActivityLogs() {
  try {
    localStorage.removeItem(STORAGE_KEY_LOGS);
    window.dispatchEvent(new CustomEvent('innovista_email_activity_updated', { detail: null }));
  } catch (err) {
    console.error('Failed to clear email activity logs:', err);
  }
}

/**
 * Dynamically resolves all Admin & Super Admin notification recipients
 */
export function getAdminNotificationEmails(): string[] {
  const emailSet = new Set<string>();

  // 1. Check custom configured admin alert recipients from automations config
  const config = getEmailAutomationsConfig();
  if (config.adminAlertRecipients) {
    config.adminAlertRecipients
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e && e.includes('@'))
      .forEach(e => emailSet.add(e));
  }

  // 2. Add users with Super Admin or HO Admin role from local storage or INITIAL_USERS
  try {
    const storedUsers = localStorage.getItem('system_users');
    const users: SystemUser[] = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
    users
      .filter(u => (u.role === 'Super Admin' || u.role === 'HO Admin') && u.status === 'Active')
      .forEach(u => {
        if (u.email && u.email.includes('@')) {
          emailSet.add(u.email.trim().toLowerCase());
        }
      });
  } catch (e) {
    console.warn('Could not read users for admin emails:', e);
  }

  // 3. Add company settings email if present
  try {
    const rawComp = localStorage.getItem('company_settings');
    if (rawComp) {
      const comp = JSON.parse(rawComp);
      if (comp.email && comp.email.includes('@')) {
        emailSet.add(comp.email.trim().toLowerCase());
      }
    }
  } catch (e) {
    console.warn('Could not read company email:', e);
  }

  // 4. Guaranteed fallbacks
  emailSet.add('admin@innovistapos.lk');
  emailSet.add('superadmin@innovista.lk');
  emailSet.add('innovista.itdep@gmail.com');

  return Array.from(emailSet);
}

/**
 * Core notification dispatcher with resilient offline queuing
 */
export async function dispatchNotificationEmail(params: {
  to: string | string[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category: EmailLogEntry['category'];
  recipientName?: string;
}): Promise<EmailLogEntry> {
  const toAddresses = Array.isArray(params.to) ? params.to : [params.to];
  const primaryRecipient = toAddresses.filter(e => e && e.includes('@')).join(', ');

  if (!primaryRecipient) {
    console.warn('Cannot dispatch email: No valid recipient specified');
    const failedLog: EmailLogEntry = {
      id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      to: 'unspecified',
      subject: params.subject,
      category: params.category,
      recipientName: params.recipientName,
      timestamp: `${formatSystemDateTime(new Date(), true)} (${getSystemTimezone()})`,
      status: 'failed',
      previewSnippet: params.subject,
      bodyHtml: params.bodyHtml,
      errorMessage: 'No valid recipient address'
    };
    saveEmailActivityLog(failedLog);
    return failedLog;
  }

  const logId = `mail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = `${formatSystemDateTime(new Date(), true)} (${getSystemTimezone()})`;
  const previewSnippet = params.subject;

  // Check if Gmail is currently authorized
  const connected = isGmailConnected();

  const entry: EmailLogEntry = {
    id: logId,
    to: primaryRecipient,
    subject: params.subject,
    category: params.category,
    recipientName: params.recipientName,
    timestamp,
    status: connected ? 'sent' : 'queued',
    previewSnippet,
    bodyHtml: params.bodyHtml
  };

  if (connected) {
    try {
      const config = getEmailAutomationsConfig();
      await sendGmailMessage({
        to: primaryRecipient,
        subject: params.subject,
        bodyHtml: params.bodyHtml,
        bodyText: params.bodyText,
        fromName: config.senderDisplayName || 'INNOVISTA ERP Security'
      });
      entry.status = 'sent';
      saveEmailActivityLog(entry);
      console.log(`[Email Dispatcher] Dispatched ${params.category} to ${primaryRecipient}`);
    } catch (err: any) {
      console.warn(`[Email Dispatcher] Real-time send failed, queuing transmission:`, err);
      entry.status = 'queued';
      entry.errorMessage = err?.message || 'Send failed; queued for transmission';
      saveEmailActivityLog(entry);
    }
  } else {
    // Queued offline in outbox
    entry.status = 'queued';
    entry.errorMessage = 'Gmail session not connected; queued in outbox';
    saveEmailActivityLog(entry);
    console.log(`[Email Dispatcher] Queued ${params.category} transmission to ${primaryRecipient}`);
  }

  return entry;
}

/**
 * Flush all queued emails once Gmail is connected
 */
export async function flushQueuedEmails(): Promise<{ sent: number; failed: number }> {
  if (!isGmailConnected()) {
    return { sent: 0, failed: 0 };
  }

  const logs = getEmailActivityLogs();
  const queued = logs.filter(l => l.status === 'queued');
  if (queued.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const config = getEmailAutomationsConfig();

  for (const item of queued) {
    try {
      await sendGmailMessage({
        to: item.to,
        subject: item.subject,
        bodyHtml: item.bodyHtml,
        fromName: config.senderDisplayName || 'INNOVISTA ERP Security'
      });
      updateEmailActivityLogStatus(item.id, 'sent');
      sent++;
    } catch (err: any) {
      console.error(`Failed to flush queued email ${item.id}:`, err);
      updateEmailActivityLogStatus(item.id, 'failed', err?.message || 'Failed during queue flush');
      failed++;
    }
  }

  return { sent, failed };
}

// Auto-flush queued emails when Gmail signs in
if (typeof window !== 'undefined') {
  subscribeToGmailAuth((user, token) => {
    if (user && token) {
      flushQueuedEmails().then(res => {
        if (res.sent > 0) {
          console.log(`[Email Service] Automatically flushed ${res.sent} queued notification emails upon Gmail connection!`);
        }
      }).catch(e => console.warn('Error auto-flushing queued emails:', e));
    }
  });
}

// =========================================================================
// HIGH-LEVEL AUTOMATED WORKFLOW NOTIFIERS
// =========================================================================

/**
 * 1. Send Login Security Notification to User's Account (+ Admin Alert for Admin/Elevated Logins)
 */
export async function notifyAccountLogin(
  user: SystemUser,
  authMethod: string = 'Standard Password Verification',
  branchName?: string
) {
  const config = getEmailAutomationsConfig();
  if (!config.autoEmailLoginAlerts) return;

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Desktop Web Browser';
  const effectiveBranch = branchName || user.branch_name || 'Central Head Office';

  // 1. Dispatch email to the user's account
  if (user.email && user.email.includes('@')) {
    const { subject, html, text } = generateLoginAlertEmail({
      user,
      authMethod,
      userAgent,
      branchName: effectiveBranch
    });

    await dispatchNotificationEmail({
      to: user.email,
      subject,
      bodyHtml: html,
      bodyText: text,
      category: 'login_alert',
      recipientName: user.name
    });
  }

  // 2. If login is elevated (Super Admin, HO Admin) or an emergency override was used, notify admin accounts!
  const isElevated = user.role === 'Super Admin' || user.role === 'HO Admin';
  const isEmergency = authMethod.toLowerCase().includes('emergency') || authMethod.toLowerCase().includes('critical') || authMethod.toLowerCase().includes('override');

  if (config.autoEmailAdminSecurityAlerts && (isElevated || isEmergency)) {
    const adminEmails = getAdminNotificationEmails().filter(e => e !== user.email?.toLowerCase());
    if (adminEmails.length > 0) {
      const { subject: adminSubject, html: adminHtml, text: adminText } = generateAdminSecurityIncidentAlertEmail({
        incidentType: isEmergency ? 'EMERGENCY_ACCESS_OVERRIDE_LOGIN' : 'ELEVATED_ADMIN_SIGN_IN',
        actorName: user.name,
        actorEmail: user.email,
        details: `Account ${user.name} (${user.role}) successfully signed in via ${authMethod} from branch ${effectiveBranch}.`,
        severity: isEmergency ? 'CRITICAL' : 'HIGH'
      });

      await dispatchNotificationEmail({
        to: adminEmails,
        subject: adminSubject,
        bodyHtml: adminHtml,
        bodyText: adminText,
        category: 'admin_security',
        recipientName: 'Super Admin & Security Officers'
      });
    }
  }
}

/**
 * 2. Send Password Changed Notification to User & Admin Accounts
 */
export async function notifyAccountPasswordChanged(
  user: SystemUser,
  changedByAdmin: boolean = false,
  adminName?: string
) {
  const config = getEmailAutomationsConfig();
  if (!config.autoEmailAccountActivity) return;

  // 1. Dispatch to user's account
  if (user.email && user.email.includes('@')) {
    const { subject, html, text } = generatePasswordChangedEmail({
      user,
      changedByAdmin,
      adminName
    });

    await dispatchNotificationEmail({
      to: user.email,
      subject,
      bodyHtml: html,
      bodyText: text,
      category: 'account_activity',
      recipientName: user.name
    });
  }

  // 2. Dispatch security alert to Admin accounts
  if (config.autoEmailAdminSecurityAlerts) {
    const adminEmails = getAdminNotificationEmails().filter(e => e !== user.email?.toLowerCase());
    if (adminEmails.length > 0) {
      const { subject: adminSub, html: adminHtml, text: adminText } = generateAdminSecurityIncidentAlertEmail({
        incidentType: changedByAdmin ? 'ADMIN_PASSWORD_RESET' : 'USER_PASSWORD_CHANGE',
        actorName: changedByAdmin ? (adminName || 'HO Administrator') : user.name,
        actorEmail: changedByAdmin ? undefined : user.email,
        targetUser: `${user.name} (${user.email} - ${user.role})`,
        details: `Passphrase credentials were successfully updated for employee ${user.name} (${user.employee_id || 'N/A'}).`,
        severity: 'HIGH'
      });

      await dispatchNotificationEmail({
        to: adminEmails,
        subject: adminSub,
        bodyHtml: adminHtml,
        bodyText: adminText,
        category: 'admin_security',
        recipientName: 'Head Office Admin Center'
      });
    }
  }
}

/**
 * 3. Send MFA / 2FA Security Preferences Notification to User
 */
export async function notifyAccountMfaUpdated(
  user: SystemUser,
  action: 'enabled' | 'disabled' | 'backup_codes_regenerated',
  details?: string
) {
  const config = getEmailAutomationsConfig();
  if (!config.autoEmailAccountActivity) return;

  if (user.email && user.email.includes('@')) {
    const { subject, html, text } = generateMfaSecurityUpdatedEmail({
      user,
      action,
      details
    });

    await dispatchNotificationEmail({
      to: user.email,
      subject,
      bodyHtml: html,
      bodyText: text,
      category: 'account_activity',
      recipientName: user.name
    });
  }
}

/**
 * 4. Send Master Price Revision / Bulk Adjustment Alert to Admin Accounts
 */
export async function notifyAdminPriceRevision(params: {
  operatorName: string;
  operatorRole: string;
  revisionType: string;
  direction?: string;
  value: string;
  effectiveDate: string;
  category?: string;
  subCategory?: string;
  reason?: string;
  affectedCount?: number;
}) {
  const config = getEmailAutomationsConfig();
  if (!config.autoEmailPriceRevisions) return;

  const adminEmails = getAdminNotificationEmails();
  if (adminEmails.length === 0) return;

  const { subject, html, text } = generateAdminPriceRevisionAlertEmail(params);

  await dispatchNotificationEmail({
    to: adminEmails,
    subject,
    bodyHtml: html,
    bodyText: text,
    category: 'price_revision',
    recipientName: 'Master Pricing Governance Committee'
  });
}

/**
 * 5. Send User Management Event Alert (Create, Role Change, Status, Deletion)
 */
export async function notifyAdminUserManagement(params: {
  operatorName: string;
  operatorRole: string;
  action: 'created' | 'role_changed' | 'status_changed' | 'deleted' | 'password_reset';
  targetUser: SystemUser;
  oldRole?: string;
  newRole?: string;
  oldStatus?: string;
  newStatus?: string;
}) {
  const config = getEmailAutomationsConfig();
  if (!config.autoEmailUserManagement) return;

  const adminEmails = getAdminNotificationEmails();
  const { subject, html, text } = generateAdminUserManagementAlertEmail(params);

  // Send to admins
  if (adminEmails.length > 0) {
    await dispatchNotificationEmail({
      to: adminEmails,
      subject,
      bodyHtml: html,
      bodyText: text,
      category: 'user_management',
      recipientName: 'User Access Governance'
    });
  }

  // Also send notification directly to the target user if they have a valid email
  if (params.targetUser.email && params.targetUser.email.includes('@')) {
    await dispatchNotificationEmail({
      to: params.targetUser.email,
      subject: `[Innovista ERP] Account Notification: Your account status or privileges were updated`,
      bodyHtml: html,
      bodyText: text,
      category: 'account_activity',
      recipientName: params.targetUser.name
    });
  }
}

/**
 * 6. Send Critical Security Incident Alert to Admin Accounts
 */
export async function notifyAdminSecurityIncident(params: {
  incidentType: string;
  actorName: string;
  actorEmail?: string;
  targetUser?: string;
  details: string;
  severity?: 'HIGH' | 'CRITICAL' | 'WARNING';
}) {
  const config = getEmailAutomationsConfig();
  if (!config.autoEmailAdminSecurityAlerts) return;

  const adminEmails = getAdminNotificationEmails();
  if (adminEmails.length === 0) return;

  const { subject, html, text } = generateAdminSecurityIncidentAlertEmail(params);

  await dispatchNotificationEmail({
    to: adminEmails,
    subject,
    bodyHtml: html,
    bodyText: text,
    category: 'admin_security',
    recipientName: 'Super Admin & Security Operations'
  });
}
