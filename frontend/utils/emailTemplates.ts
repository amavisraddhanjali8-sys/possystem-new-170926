import { Quotation, Product, SystemUser } from '../../shared/types';
import { formatSystemDateTime, getSystemTimezone } from './timezoneEngine';

export interface EmailAutomationConfig {
  autoEmailRecoveryOtp: boolean;
  autoEmailValidatedQuotations: boolean;
  autoEmailCriticalAccessAlerts: boolean;
  autoEmailLoginAlerts: boolean;
  autoEmailAccountActivity: boolean;
  autoEmailAdminSecurityAlerts: boolean;
  autoEmailPriceRevisions: boolean;
  autoEmailUserManagement: boolean;
  adminAlertRecipients: string;
  senderDisplayName: string;
  defaultCcEmail: string;
  companyContactFooter: string;
}

const STORAGE_KEY_AUTOMATIONS = 'innovista_email_automations_config';

export const DEFAULT_AUTOMATIONS_CONFIG: EmailAutomationConfig = {
  autoEmailRecoveryOtp: true,
  autoEmailValidatedQuotations: true,
  autoEmailCriticalAccessAlerts: true,
  autoEmailLoginAlerts: true,
  autoEmailAccountActivity: true,
  autoEmailAdminSecurityAlerts: true,
  autoEmailPriceRevisions: true,
  autoEmailUserManagement: true,
  adminAlertRecipients: 'admin@innovistapos.lk, superadmin@innovista.lk, innovista.itdep@gmail.com',
  senderDisplayName: 'INNOVISTA Enterprise ERP Notifications',
  defaultCcEmail: '',
  companyContactFooter: 'INNOVISTA Enterprise ERP • Central Headquarters • Colombo, Sri Lanka • support@innovista.lk'
};

export function getEmailAutomationsConfig(): EmailAutomationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTOMATIONS);
    if (raw) {
      return { ...DEFAULT_AUTOMATIONS_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error loading email automations config', e);
  }
  return DEFAULT_AUTOMATIONS_CONFIG;
}

export function saveEmailAutomationsConfig(config: EmailAutomationConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_AUTOMATIONS, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('innovista_email_automations_changed', { detail: config }));
  } catch (e) {
    console.error('Error saving email automations config', e);
  }
}

/**
 * 1. Generate HTML & Plain text for Account Password Recovery OTP
 */
export function generateRecoveryOtpEmail(params: {
  userName: string;
  userEmail: string;
  employeeId?: string;
  otpCode: string;
  expiresInMins?: number;
}): { subject: string; html: string; text: string } {
  const expiresIn = params.expiresInMins || 10;
  const subject = `[INNOVISTA ERP] Security Passcode: ${params.otpCode} for Password Recovery`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0F203C; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 12px; color: #73A5CA; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 32px 24px; color: #1e293b; }
    .salutation { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0F203C; }
    .otp-box { background: #FEFDDF; border: 2px dashed #FFC81E; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #854d0e; letter-spacing: 1px; margin-bottom: 8px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #0F203C; letter-spacing: 8px; }
    .expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .details-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 35%; }
    .advisory { background: #fff1f2; border-left: 4px solid #f43f5e; padding: 12px 16px; font-size: 12px; color: #9f1239; border-radius: 4px; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>INNOVISTA ENTERPRISE ERP</h1>
      <p>Identity & Access Management Security Portal</p>
    </div>
    <div class="content">
      <div class="salutation">Hello ${params.userName || 'Authorized Staff Member'},</div>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        A request has been initiated to reset the login credentials for your enterprise staff account. Use the one-time verification code below to authorize this password reset.
      </p>

      <div class="otp-box">
        <div class="otp-label">One-Time Recovery Security Code</div>
        <div class="otp-code">${params.otpCode}</div>
        <div class="expiry">Valid for <strong>${expiresIn} minutes</strong> from issuance</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Staff Name:</td>
          <td>${params.userName}</td>
        </tr>
        <tr>
          <td class="label">Registered Email:</td>
          <td>${params.userEmail}</td>
        </tr>
        ${params.employeeId ? `<tr><td class="label">Employee ID:</td><td>${params.employeeId}</td></tr>` : ''}
        <tr>
          <td class="label">Request Time:</td>
          <td>${new Date().toLocaleString()}</td>
        </tr>
      </table>

      <div class="advisory">
        <strong>Security Advisory:</strong> If you did not initiate this password recovery request, your account may be subject to unauthorized access attempts. Do not share this PIN with anyone. Please inform your System Administrator immediately.
      </div>
    </div>
    <div class="footer">
      This is an automated security transmission generated by INNOVISTA Enterprise ERP.<br>
      Colombo Central Command • All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const text = `
INNOVISTA ENTERPRISE ERP - Account Password Recovery
------------------------------------------------------
Hello ${params.userName},

A request was made to reset the password for your account (${params.userEmail}).

Your One-Time Recovery Passcode: ${params.otpCode}
(Valid for ${expiresIn} minutes)

Staff Name: ${params.userName}
Registered Email: ${params.userEmail}
Timestamp: ${new Date().toLocaleString()}

SECURITY ADVISORY: If you did not request this, please notify your Super Admin immediately.
  `.trim();

  return { subject, html, text };
}

/**
 * 2. Generate HTML & Plain text for Customer Quotation / Proforma Invoice Dispatch
 */
export function generateQuotationEmail(params: {
  quotation: Quotation;
  senderName: string;
  senderBranchName?: string;
  additionalNotes?: string;
}): { subject: string; html: string; text: string } {
  const { quotation } = params;
  const subject = `Official Quotation ${quotation.quotation_number} - ${quotation.customer_name} | INNOVISTA ERP`;

  const itemsHtml = quotation.items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
      <td style="padding: 10px 8px; color: #64748b;">${idx + 1}</td>
      <td style="padding: 10px 8px;">
        <strong style="color: #0F203C;">${item.product_name}</strong><br>
        <span style="font-size: 11px; color: #64748b; font-family: monospace;">${item.product_code}</span>
      </td>
      <td style="padding: 10px 8px; text-align: center;">${item.quantity} ${item.unit}</td>
      <td style="padding: 10px 8px; text-align: right; font-family: monospace;">Rs. ${Number(item.unit_price).toLocaleString()}</td>
      <td style="padding: 10px 8px; text-align: right; font-family: monospace; font-weight: 600; color: #0F203C;">
        Rs. ${Number(item.total_price).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0F203C; padding: 24px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { margin: 0; font-size: 20px; font-weight: 800; color: #FFC81E; }
    .header-left p { margin: 4px 0 0 0; font-size: 11px; color: #73A5CA; text-transform: uppercase; }
    .quote-badge { background: #E87F24; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; text-align: right; }
    .content { padding: 28px 24px; }
    .meta-grid { display: table; width: 100%; margin-bottom: 24px; font-size: 13px; }
    .meta-col { display: table-cell; width: 50%; vertical-align: top; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
    .summary-box { background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-top: 20px; font-size: 13px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .total-row { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 2px solid #0F203C; font-size: 16px; font-weight: 800; color: #0F203C; }
    .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="header-left">
        <h1>INNOVISTA ENTERPRISE</h1>
        <p>Architectural Aluminium & Commercial Glazing Solutions</p>
      </div>
      <div class="quote-badge">
        QUOTE #${quotation.quotation_number}
      </div>
    </div>
    <div class="content">
      <div class="meta-grid">
        <div class="meta-col">
          <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Billed To:</strong><br>
          <strong style="font-size: 15px; color: #0F203C;">${quotation.customer_name}</strong><br>
          ${quotation.customer_phone ? `<span>Phone: ${quotation.customer_phone}</span><br>` : ''}
          ${quotation.customer_email ? `<span>Email: ${quotation.customer_email}</span><br>` : ''}
          ${quotation.site_address ? `<span>Site: ${quotation.site_address}</span>` : ''}
        </div>
        <div class="meta-col" style="text-align: right;">
          <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Quotation Details:</strong><br>
          <span>Date: <strong>${new Date(quotation.created_at).toLocaleDateString()}</strong></span><br>
          <span>Status: <strong style="color: #E87F24;">${quotation.status}</strong></span><br>
          <span>Delivery Destination: <strong>${quotation.site_location_name || 'Standard Regional Node'}</strong></span><br>
          ${params.senderBranchName ? `<span>Branch: <strong>${params.senderBranchName}</strong></span>` : ''}
        </div>
      </div>

      ${params.additionalNotes ? `
        <div style="background: #FEFDDF; border-left: 4px solid #FFC81E; padding: 12px 16px; font-size: 13px; color: #854d0e; border-radius: 4px; margin-bottom: 20px;">
          <strong>Executive Remarks:</strong> ${params.additionalNotes}
        </div>
      ` : ''}

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th>Item & Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Rate</th>
            <th style="text-align: right;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="summary-box">
        <div class="summary-row">
          <span style="color: #64748b;">Subtotal (Materials & Glazing):</span>
          <span style="font-family: monospace; font-weight: 600;">Rs. ${Number(quotation.subtotal).toLocaleString()}</span>
        </div>
        ${quotation.discount_amount > 0 ? `
          <div class="summary-row" style="color: #16a34a;">
            <span>Commercial Discount Applied:</span>
            <span style="font-family: monospace; font-weight: 600;">- Rs. ${Number(quotation.discount_amount).toLocaleString()}</span>
          </div>
        ` : ''}
        ${quotation.transport_cost > 0 ? `
          <div class="summary-row">
            <span style="color: #64748b;">Logistics & Transport Freight (${quotation.vehicle_type || 'Commercial Fleet'}):</span>
            <span style="font-family: monospace; font-weight: 600;">+ Rs. ${Number(quotation.transport_cost).toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="total-row">
          <span>Net Payable Total:</span>
          <span>Rs. ${Number(quotation.net_total ?? (quotation as any).total_amount ?? 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <strong>Terms & Conditions:</strong><br>
      • Quotation valid for 14 days from date of issuance based on prevailing raw aluminium ingot index.<br>
      • 50% advance upon order validation, balance prior to dispatch or delivery.<br>
      • Dispatch from Central Plant / Regional Depot with verified road freight compliance.<br>
      For inquiries or confirmation, please reply directly to this email or contact your representative.
    </div>
  </div>
</body>
</html>
  `;

  const text = `
INNOVISTA ENTERPRISE - Quotation #${quotation.quotation_number}
-------------------------------------------------------------
Customer: ${quotation.customer_name}
Date: ${new Date(quotation.created_at || quotation.date || Date.now()).toLocaleDateString()}
Site Location: ${quotation.site_location_name || 'Standard'}
Status: ${quotation.status}

ITEMS BREAKDOWN:
${quotation.items.map((it, idx) => `${idx + 1}. ${it.product_name} (${it.product_code}) - Qty: ${it.quantity} ${it.unit} @ Rs. ${it.unit_price} = Rs. ${it.total_price}`).join('\n')}

Subtotal: Rs. ${Number(quotation.subtotal || 0).toLocaleString()}
Discount: - Rs. ${Number(quotation.discount_amount || 0).toLocaleString()}
Transport Cost: + Rs. ${Number(quotation.transport_cost || 0).toLocaleString()}
TOTAL AMOUNT: Rs. ${Number(quotation.net_total ?? (quotation as any).total_amount ?? 0).toLocaleString()}

Thank you for choosing INNOVISTA Enterprise!
  `.trim();

  return { subject, html, text };
}

/**
 * 3. Generate Security Audit Alert for Critical Circumstances PIN Access
 */
export function generateCriticalPinAlertEmail(params: {
  superAdminName: string;
  superAdminEmail: string;
  ipAddress?: string;
  timestamp: string;
  notes?: string;
}): { subject: string; html: string; text: string } {
  const subject = `[CRITICAL SECURITY ALERT] Super Admin Emergency PIN Invocation Detected`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; background-color: #f8fafc; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 2px solid #dc2626; overflow: hidden; }
    .header { background: #991b1b; padding: 20px; color: #ffffff; text-align: center; }
    .content { padding: 24px; color: #1e293b; font-size: 13px; line-height: 1.6; }
    .badge { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: 800; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0;">CRITICAL ACCESS NOTIFICATION</h2>
      <p style="margin:4px 0 0 0; font-size: 12px;">Enterprise Security Governance Portal</p>
    </div>
    <div class="content">
      <p>This automated priority transmission records that the <strong>Super Admin Emergency Critical Circumstances PIN</strong> was authenticated in the system:</p>
      <p>
        <strong>Actor:</strong> ${params.superAdminName} (${params.superAdminEmail})<br>
        <strong>Timestamp:</strong> ${params.timestamp}<br>
        <strong>Authorization Type:</strong> <span class="badge">CRITICAL_CIRCUMSTANCE_EMERGENCY_PIN</span><br>
        ${params.notes ? `<strong>Notes:</strong> ${params.notes}<br>` : ''}
      </p>
      <p style="color: #64748b; font-size: 11px;">This event has been permanently cataloged in the Enterprise Governance & Security Ledger.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
CRITICAL SECURITY ALERT: Super Admin Emergency PIN Invoked
Actor: ${params.superAdminName} (${params.superAdminEmail})
Timestamp: ${params.timestamp}
  `.trim();

  return { subject, html, text };
}

/**
 * 4. Generate Security Alert Email for Account Sign-In (Sent to User Account)
 */
export function generateLoginAlertEmail(params: {
  user: SystemUser;
  authMethod?: string;
  ipAddress?: string;
  userAgent?: string;
  branchName?: string;
  timestamp?: string;
}): { subject: string; html: string; text: string } {
  const timeFormatted = params.timestamp || formatSystemDateTime(new Date(), true);
  const timezone = getSystemTimezone();
  const subject = `[Security Notice] New Sign-in to your Innovista ERP Account (${params.user.name})`;

  const authMethodLabel = params.authMethod || 'Standard Password Verification';
  const isElevated = params.user.role === 'Super Admin' || params.user.role === 'HO Admin';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0F203C; padding: 22px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 19px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 11px; color: #73A5CA; text-transform: uppercase; letter-spacing: 1.2px; }
    .content { padding: 28px 24px; color: #1e293b; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-info { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-alert { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .details-table td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 38%; }
    .details-table td.val { font-weight: 500; color: #0f172a; }
    .notice-box { background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 16px; border-radius: 6px; margin: 20px 0; font-size: 12px; line-height: 1.6; color: #334155; }
    .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>INNOVISTA ENTERPRISE ERP</h1>
      <p>Identity & Access Management Security Portal</p>
    </div>
    <div class="content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 16px; font-weight: 700; color: #0F203C;">Sign-in Security Notification</span>
        <span class="badge ${isElevated ? 'badge-alert' : 'badge-info'}">${params.user.role}</span>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 4px;">
        Hello <strong>${params.user.name}</strong>, this automated message confirms that a successful sign-in was recorded for your enterprise account.
      </p>

      <table class="details-table">
        <tr>
          <td class="label">Account Email:</td>
          <td class="val">${params.user.email}</td>
        </tr>
        <tr>
          <td class="label">Employee ID:</td>
          <td class="val">${params.user.employee_id || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Assigned Branch:</td>
          <td class="val">${params.branchName || params.user.branch_name || 'Central Head Office'}</td>
        </tr>
        <tr>
          <td class="label">Timestamp:</td>
          <td class="val">${timeFormatted} <span style="font-size: 11px; color: #64748b;">(${timezone})</span></td>
        </tr>
        <tr>
          <td class="label">Auth Verification:</td>
          <td class="val"><strong>${authMethodLabel}</strong></td>
        </tr>
        <tr>
          <td class="label">Device Platform:</td>
          <td class="val" style="font-size: 11px; font-family: monospace; color: #475569;">${params.userAgent || 'Desktop Web Client'}</td>
        </tr>
      </table>

      <div class="notice-box">
        <strong>Security Advisory:</strong> If you initiated this session, no further action is required. If you did not log in or do not recognize this activity, your credentials may be compromised. Please reset your password immediately or contact your System Administrator.
      </div>
    </div>
    <div class="footer">
      INNOVISTA Enterprise ERP • Central Headquarters • Colombo, Sri Lanka<br>
      Automated Security Monitoring Service • This email was dispatched to ${params.user.email}
    </div>
  </div>
</body>
</html>
  `;

  const text = `
INNOVISTA ENTERPRISE ERP - Sign-in Security Notification
---------------------------------------------------------
Hello ${params.user.name},

A successful sign-in was recorded for your account.

Account: ${params.user.name} (${params.user.email})
Role: ${params.user.role}
Branch: ${params.branchName || params.user.branch_name || 'Central Head Office'}
Timestamp: ${timeFormatted} (${timezone})
Auth Method: ${authMethodLabel}
Device Platform: ${params.userAgent || 'Desktop Web Client'}

If this was you, you can disregard this email. If you did not log in, contact your System Administrator immediately.
  `.trim();

  return { subject, html, text };
}

/**
 * 5. Generate Password Changed Security Alert (Sent to User and Admins)
 */
export function generatePasswordChangedEmail(params: {
  user: SystemUser;
  changedByAdmin?: boolean;
  adminName?: string;
  timestamp?: string;
}): { subject: string; html: string; text: string } {
  const timeFormatted = params.timestamp || formatSystemDateTime(new Date(), true);
  const timezone = getSystemTimezone();
  const subject = `[Security Alert] Your Innovista ERP Account Password was Changed`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 2px solid #f59e0b; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0F203C; padding: 22px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 19px; font-weight: 700; }
    .content { padding: 28px 24px; color: #1e293b; }
    .alert-banner { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; margin: 16px 0; }
    .details-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .details-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 35%; }
    .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>INNOVISTA ENTERPRISE ERP</h1>
      <p style="margin:4px 0 0 0; font-size:11px; color:#FFC81E; text-transform:uppercase; letter-spacing:1px;">Security & Credentials Notice</p>
    </div>
    <div class="content">
      <div class="alert-banner">
        ⚠️ Password Updated Successfully
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Hello <strong>${params.user.name}</strong>,<br>
        The access passphrase for your account (${params.user.email}) has been updated.
      </p>

      <table class="details-table">
        <tr>
          <td class="label">Account Name:</td>
          <td>${params.user.name}</td>
        </tr>
        <tr>
          <td class="label">Role:</td>
          <td>${params.user.role}</td>
        </tr>
        <tr>
          <td class="label">Action Type:</td>
          <td>${params.changedByAdmin ? `Password Reset by Admin (${params.adminName || 'HO Administration'})` : 'User-Initiated Password Change'}</td>
        </tr>
        <tr>
          <td class="label">Timestamp:</td>
          <td>${timeFormatted} (${timezone})</td>
        </tr>
      </table>

      <p style="font-size: 12px; color: #b45309; line-height: 1.6; background: #fef3c7; padding: 12px; border-radius: 6px;">
        <strong>Important:</strong> If you did NOT initiate or authorize this change, someone else may have gained unauthorized access to your credentials. Contact your Head Office Super Administrator immediately to lock the account.
      </p>
    </div>
    <div class="footer">
      INNOVISTA Enterprise ERP • Central Headquarters • Colombo, Sri Lanka
    </div>
  </div>
</body>
</html>
  `;

  const text = `
INNOVISTA ENTERPRISE ERP - Password Changed Notification
---------------------------------------------------------
Hello ${params.user.name},

Your account password has been changed successfully.
Timestamp: ${timeFormatted} (${timezone})
Action: ${params.changedByAdmin ? 'Admin Reset' : 'User Changed'}

If you did not make this change, contact your System Administrator immediately.
  `.trim();

  return { subject, html, text };
}

/**
 * 6. Generate MFA / Two-Factor Settings Updated Alert
 */
export function generateMfaSecurityUpdatedEmail(params: {
  user: SystemUser;
  action: 'enabled' | 'disabled' | 'backup_codes_regenerated';
  details?: string;
  timestamp?: string;
}): { subject: string; html: string; text: string } {
  const timeFormatted = params.timestamp || formatSystemDateTime(new Date(), true);
  const timezone = getSystemTimezone();
  const actionLabels: Record<string, string> = {
    enabled: 'Two-Factor Authentication (2FA) Activated',
    disabled: 'Two-Factor Authentication (2FA) Deactivated',
    backup_codes_regenerated: 'Fresh Emergency Backup Recovery Keys Generated'
  };

  const subject = `[Security Notification] Multi-Factor Authentication (MFA) Settings Updated (${params.user.name})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0F203C; padding: 20px; text-align: center; color: #ffffff; }
    .content { padding: 24px; color: #1e293b; font-size: 13px; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 12px; }
    .badge-enabled { background: #dcfce7; color: #15803d; }
    .badge-disabled { background: #fee2e2; color: #b91c1c; }
    .badge-regen { background: #fef3c7; color: #b45309; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0; font-size:18px;">INNOVISTA ENTERPRISE ERP</h2>
      <p style="margin:4px 0 0 0; font-size:11px; color:#73A5CA;">Multi-Factor Authentication Security Portal</p>
    </div>
    <div class="content">
      <p>Hello <strong>${params.user.name}</strong>,</p>
      <p>Security preferences for your account (${params.user.email}) were updated:</p>
      <p>
        <strong>Event:</strong> <span class="badge ${params.action === 'enabled' ? 'badge-enabled' : params.action === 'disabled' ? 'badge-disabled' : 'badge-regen'}">${actionLabels[params.action] || params.action}</span><br>
        <strong>Timestamp:</strong> ${timeFormatted} (${timezone})<br>
        ${params.details ? `<strong>Details:</strong> ${params.details}<br>` : ''}
      </p>
      <p style="color: #64748b; font-size: 12px;">If you authorized this action, no further response is needed. If unauthorized, please notify your Super Admin immediately.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
INNOVISTA ENTERPRISE ERP - MFA Settings Updated
------------------------------------------------
Hello ${params.user.name},
Your MFA settings were updated: ${actionLabels[params.action] || params.action}
Timestamp: ${timeFormatted} (${timezone})
  `.trim();

  return { subject, html, text };
}

/**
 * 7. Generate Admin Alert: Master Price Revision / Bulk Adjustment
 */
export function generateAdminPriceRevisionAlertEmail(params: {
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
  timestamp?: string;
}): { subject: string; html: string; text: string } {
  const timeFormatted = params.timestamp || formatSystemDateTime(new Date(), true);
  const timezone = getSystemTimezone();
  const subject = `[ADMIN ALERT] Master Price Revision Applied: ${params.direction || ''} ${params.value} (${params.category || 'All Categories'})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 2px solid #ea580c; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #ea580c; padding: 20px; text-align: center; color: #ffffff; }
    .content { padding: 24px; color: #1e293b; font-size: 13px; line-height: 1.6; }
    .metric-box { background: #fff7ed; border: 1px solid #ffedd5; padding: 14px; border-radius: 8px; margin: 16px 0; }
    .details-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .details-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 35%; }
    .footer { background: #f8fafc; padding: 14px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0; font-size:18px;">INNOVISTA HEAD OFFICE PRICING AUDIT</h2>
      <p style="margin:4px 0 0 0; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#ffedd5;">Master Catalog Price Revision Alert</p>
    </div>
    <div class="content">
      <div class="metric-box">
        <strong style="color: #9a3412; font-size: 14px;">Price Adjustment Directive Executed</strong><br>
        <span>Magnitude: <strong>${params.direction || ''} ${params.value}</strong></span> | 
        <span>Type: <strong>${params.revisionType}</strong></span>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Authorized Operator:</td>
          <td><strong>${params.operatorName}</strong> (${params.operatorRole})</td>
        </tr>
        <tr>
          <td class="label">Target Category:</td>
          <td>${params.category || 'All Master Categories'} ${params.subCategory ? `» ${params.subCategory}` : ''}</td>
        </tr>
        <tr>
          <td class="label">Effective Date:</td>
          <td><strong>${params.effectiveDate}</strong></td>
        </tr>
        <tr>
          <td class="label">Catalog Records Updated:</td>
          <td><strong>${params.affectedCount !== undefined ? params.affectedCount : 'Multiple'} Products</strong></td>
        </tr>
        <tr>
          <td class="label">Revision Justification:</td>
          <td><em>${params.reason || 'Routine Catalog Rate Index Adjustment'}</em></td>
        </tr>
        <tr>
          <td class="label">Execution Timestamp:</td>
          <td>${timeFormatted} (${timezone})</td>
        </tr>
      </table>

      <p style="color: #64748b; font-size: 11px; line-height: 1.5;">
        This alert has been automatically delivered to all registered Head Office Super Admin and Pricing Manager accounts for financial audit compliance.
      </p>
    </div>
    <div class="footer">
      INNOVISTA Central ERP Pricing Governance • Colombo Headquarters
    </div>
  </div>
</body>
</html>
  `;

  const text = `
[ADMIN ALERT] Master Price Revision Applied
-------------------------------------------
Operator: ${params.operatorName} (${params.operatorRole})
Adjustment: ${params.direction || ''} ${params.value} (${params.revisionType})
Category: ${params.category || 'All'} ${params.subCategory ? `» ${params.subCategory}` : ''}
Effective Date: ${params.effectiveDate}
Affected Products: ${params.affectedCount || 'Multiple'}
Reason: ${params.reason || 'N/A'}
Timestamp: ${timeFormatted} (${timezone})
  `.trim();

  return { subject, html, text };
}

/**
 * 8. Generate Admin Alert: User Account Management (Creation, Role Escalation, Deletion)
 */
export function generateAdminUserManagementAlertEmail(params: {
  operatorName: string;
  operatorRole: string;
  action: 'created' | 'role_changed' | 'status_changed' | 'deleted' | 'password_reset';
  targetUser: SystemUser;
  oldRole?: string;
  newRole?: string;
  oldStatus?: string;
  newStatus?: string;
  timestamp?: string;
}): { subject: string; html: string; text: string } {
  const timeFormatted = params.timestamp || formatSystemDateTime(new Date(), true);
  const timezone = getSystemTimezone();
  const actionDescriptions: Record<string, string> = {
    created: 'New Enterprise User Account Created',
    role_changed: `User Role Privileges Changed (${params.oldRole || ''} ➔ ${params.newRole || params.targetUser.role})`,
    status_changed: `User Account Status Changed (${params.oldStatus || ''} ➔ ${params.newStatus || params.targetUser.status})`,
    deleted: 'User Account Terminated / Removed from System',
    password_reset: 'Admin Emergency Password Reset Executed'
  };

  const subject = `[ADMIN SECURITY ALERT] User Management Event: ${actionDescriptions[params.action] || params.action} (${params.targetUser.name})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 2px solid #4338ca; overflow: hidden; }
    .header { background: #312e81; padding: 20px; text-align: center; color: #ffffff; }
    .content { padding: 24px; color: #1e293b; font-size: 13px; line-height: 1.6; }
    .details-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .details-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 35%; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0; font-size:18px;">INNOVISTA USER ACCESS AUDIT</h2>
      <p style="margin:4px 0 0 0; font-size:11px; color:#c7d2fe;">Privilege & Account Management Event</p>
    </div>
    <div class="content">
      <p>An administrative user management event was completed in the system:</p>
      <table class="details-table">
        <tr>
          <td class="label">Event Type:</td>
          <td><strong>${actionDescriptions[params.action] || params.action}</strong></td>
        </tr>
        <tr>
          <td class="label">Target User:</td>
          <td><strong>${params.targetUser.name}</strong> (${params.targetUser.email})</td>
        </tr>
        <tr>
          <td class="label">Employee ID:</td>
          <td>${params.targetUser.employee_id || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Target Role:</td>
          <td>${params.newRole || params.targetUser.role}</td>
        </tr>
        <tr>
          <td class="label">Branch:</td>
          <td>${params.targetUser.branch_name || 'All Branches'}</td>
        </tr>
        <tr>
          <td class="label">Authorized By:</td>
          <td><strong>${params.operatorName}</strong> (${params.operatorRole})</td>
        </tr>
        <tr>
          <td class="label">Timestamp:</td>
          <td>${timeFormatted} (${timezone})</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
[ADMIN ALERT] User Management Event
-----------------------------------
Event: ${actionDescriptions[params.action] || params.action}
Target: ${params.targetUser.name} (${params.targetUser.email})
Role: ${params.newRole || params.targetUser.role}
Authorized By: ${params.operatorName} (${params.operatorRole})
Timestamp: ${timeFormatted} (${timezone})
  `.trim();

  return { subject, html, text };
}

/**
 * 9. Generate Admin Security Incident Alert (Lockouts, Emergency Keys, Critical PINs)
 */
export function generateAdminSecurityIncidentAlertEmail(params: {
  incidentType: string;
  actorName: string;
  actorEmail?: string;
  targetUser?: string;
  details: string;
  severity?: 'HIGH' | 'CRITICAL' | 'WARNING';
  timestamp?: string;
}): { subject: string; html: string; text: string } {
  const timeFormatted = params.timestamp || formatSystemDateTime(new Date(), true);
  const timezone = getSystemTimezone();
  const severity = params.severity || 'HIGH';
  const isCritical = severity === 'CRITICAL';

  const subject = `[${severity} SECURITY ALERT] Innovista ERP: ${params.incidentType}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 2px solid ${isCritical ? '#dc2626' : '#ea580c'}; overflow: hidden; }
    .header { background: ${isCritical ? '#991b1b' : '#c2410c'}; padding: 20px; text-align: center; color: #ffffff; }
    .content { padding: 24px; color: #1e293b; font-size: 13px; line-height: 1.6; }
    .details-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .details-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 35%; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0; font-size:18px;">${severity} SECURITY ADVISORY</h2>
      <p style="margin:4px 0 0 0; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#ffedd5;">Enterprise Governance & Threat Prevention</p>
    </div>
    <div class="content">
      <p>A high-priority security occurrence requires administrative attention:</p>
      <table class="details-table">
        <tr>
          <td class="label">Incident:</td>
          <td><strong style="color: ${isCritical ? '#b91c1c' : '#c2410c'};">${params.incidentType}</strong></td>
        </tr>
        <tr>
          <td class="label">Actor / Account:</td>
          <td><strong>${params.actorName}</strong> ${params.actorEmail ? `(${params.actorEmail})` : ''}</td>
        </tr>
        ${params.targetUser ? `<tr><td class="label">Target Account:</td><td>${params.targetUser}</td></tr>` : ''}
        <tr>
          <td class="label">Details:</td>
          <td>${params.details}</td>
        </tr>
        <tr>
          <td class="label">Timestamp:</td>
          <td>${timeFormatted} (${timezone})</td>
        </tr>
      </table>
      <p style="font-size: 11px; color: #64748b;">
        This alert was dispatched immediately to all Super Admin & Head Office Security contacts.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
[${severity} SECURITY ALERT] ${params.incidentType}
--------------------------------------------------
Actor: ${params.actorName} ${params.actorEmail ? `(${params.actorEmail})` : ''}
${params.targetUser ? `Target: ${params.targetUser}\n` : ''}
Details: ${params.details}
Timestamp: ${timeFormatted} (${timezone})
  `.trim();

  return { subject, html, text };
}
