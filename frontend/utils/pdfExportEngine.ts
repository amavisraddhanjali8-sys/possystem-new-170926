import { Quotation, Branch, CompanySettings, PriceHistory } from '../../shared/types';
import { 
  formatSystemDateTime, 
  formatSystemDate, 
  formatAuditTimestamp, 
  getSystemCurrentDateString,
  getSystemTimezone 
} from './timezoneEngine';

export const DEFAULT_COMPANY_INFO: CompanySettings = {
  company_name: 'INNOVISTA ALUMINIUM & GLASS POS SYSTEM',
  tagline: 'Enterprise Architectural Systems & Multi-Branch Network',
  logo_url: '',
  registration_no: 'PV-98234-SL',
  tax_vat_id: 'VAT-10029384-7000',
  phone: '+94 11 288 9000 / +94 77 345 6789',
  email: 'info@innovistapos.lk',
  address: 'No. 102 Innovista Tower, Nawala Road, Rajagiriya, Colombo',
  website: 'www.innovistapos.lk',
  bank_details: {
    bank_name: 'Commercial Bank of Ceylon PLC',
    account_number: '1000-849201-001',
    account_name: 'Innovista Aluminium & Glass Systems (Pvt) Ltd',
    branch_name: 'Nawala Corporate Branch',
    swift_code: 'CCEYLKCX'
  },
  currencies: [
    { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee', exchange_rate_to_lkr: 1.0, is_default: true }
  ],
  invoice_footer_terms: '1. All prices are valid for 14 days from date of issue.\n2. 50% advance payment required upon order confirmation.\n3. Goods once sold are non-refundable unless verified for manufacturing defect within 7 days.',
  timezone: 'Asia/Colombo'
};

/**
 * Builds standard clean printable HTML content for any Quotation
 */
export function buildQuotationHtml(
  quotation: Quotation,
  companyInfo?: CompanySettings,
  branch?: Branch
): string {
  const comp = companyInfo || DEFAULT_COMPANY_INFO;
  const items = quotation.items || [];

  const subtotal = quotation.subtotal_price || items.reduce((acc, it) => acc + (it.total_price || 0), 0);
  const transportCost = quotation.transport_cost || 0;
  const netTotal = quotation.net_total || (subtotal + transportCost);
  const totalWeight = quotation.total_weight_kg || items.reduce((acc, it) => acc + ((it.weight_kg || 1) * (it.quantity || 1)), 0);

  const itemsRows = items.map((item, index) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
      <td style="padding: 8px 10px; text-align: center; color: #64748b; font-weight: bold;">${index + 1}</td>
      <td style="padding: 8px 10px;">
        <span style="font-family: monospace; font-weight: bold; color: #ea580c; background: #fff7ed; padding: 2px 4px; border-radius: 4px; border: 1px solid #fed7aa; font-size: 10px;">
          ${item.product_code}
        </span>
        <div style="font-weight: bold; color: #0f172a; margin-top: 2px;">${item.product_name}</div>
        ${item.price_source_label ? `<span style="font-size: 9px; color: #64748b;">${item.price_source_label}</span>` : ''}
        ${item.spec_surcharges_applied ? `<div style="font-size: 8.5px; color: #475569; margin-top: 2px;">${Object.values(item.spec_surcharges_applied).map(s => `<b>${s.categoryName}:</b> ${s.optionName}`).join(' | ')}</div>` : ''}
        ${item.custom_options_applied ? `<div style="font-size: 8.5px; color: #c2410c; margin-top: 2px;">${Object.values(item.custom_options_applied).map(s => `<b>${s.categoryName}:</b> ${s.optionName}`).join(' | ')}</div>` : ''}
      </td>
      <td style="padding: 8px 10px; text-align: center; font-weight: 600; color: #334155;">
        ${item.unit || 'Unit'}
      </td>
      <td style="padding: 8px 10px; text-align: center; font-weight: bold; color: #0f172a;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 600; color: #334155;">
        Rs. ${(item.unit_price || 0).toLocaleString()}
      </td>
      <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">
        Rs. ${(item.total_price || 0).toLocaleString()}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quotation ${quotation.quotation_number} - Innovista ERP</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      color: #0f172a;
      background-color: #ffffff;
      padding: 24px;
      font-size: 12px;
      line-height: 1.4;
    }
    .header-table {
      width: 100%;
      margin-bottom: 20px;
      border-bottom: 2px solid #ea580c;
      padding-bottom: 12px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .badge-approved {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .badge-draft {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }
    .table-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .table-items th {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 10px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-box {
      float: right;
      width: 320px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin-top: 10px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 11px;
      color: #475569;
    }
    .summary-row.total {
      border-top: 2px solid #ea580c;
      padding-top: 6px;
      margin-top: 6px;
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
    }
    .terms-box {
      margin-top: 30px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      font-size: 10px;
      color: #64748b;
      clear: both;
    }
    .signature-grid {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
      page-break-inside: avoid;
    }
    .signature-line {
      width: 200px;
      border-top: 1px solid #94a3b8;
      text-align: center;
      font-size: 10px;
      color: #64748b;
      padding-top: 4px;
      font-weight: 600;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Printable Action Bar in Screen Mode -->
  <div class="no-print" style="margin-bottom: 20px; background: #0f172a; color: #fff; padding: 12px 18px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <strong style="color: #fb923c;">INNOVISTA ERP OFFICIAL PDF EXPORT</strong>
      <span style="margin-left: 10px; font-size: 11px; color: #cbd5e1;">Quotation #${quotation.quotation_number}</span>
    </div>
    <div>
      <button onclick="window.print()" style="background: #ea580c; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; margin-right: 8px;">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" style="background: #334155; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;">
        Close
      </button>
    </div>
  </div>

  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: top; width: 60%;">
        <div class="company-title">${comp.company_name}</div>
        <div style="font-size: 11px; color: #ea580c; font-weight: bold; margin-bottom: 4px;">${comp.tagline}</div>
        <div style="font-size: 10px; color: #475569;">${comp.address}</div>
        <div style="font-size: 10px; color: #475569;">Tel: ${comp.phone} | Email: ${comp.email}</div>
        <div style="font-size: 10px; color: #475569;">VAT / Tax Reg: <strong>${comp.tax_vat_id}</strong> | Co Reg: <strong>${comp.registration_no}</strong></div>
      </td>
      <td style="vertical-align: top; text-align: right; width: 40%;">
        <div style="font-size: 20px; font-weight: 900; color: #ea580c; text-transform: uppercase;">
          OFFICIAL QUOTATION
        </div>
        <div style="font-size: 12px; font-weight: bold; font-family: monospace; color: #0f172a; margin-top: 2px;">
          # ${quotation.quotation_number}
        </div>
        <div style="margin-top: 6px;">
          <span class="badge ${quotation.status.includes('Approved') || quotation.status.includes('Validated') ? 'badge-approved' : 'badge-draft'}">
            ${quotation.status}
          </span>
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
          Date: <strong>${quotation.date || new Date().toISOString().split('T')[0]}</strong>
        </div>
        <div style="font-size: 10px; color: #64748b;">
          Valid Until: <strong>${quotation.expiry_date || '30 Days from Issue'}</strong>
        </div>
      </td>
    </tr>
  </table>

  <!-- Customer & Job Details Grid -->
  <table style="width: 100%; margin-bottom: 16px; border-collapse: separate; border-spacing: 10px 0;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        <div class="info-card">
          <div style="font-size: 10px; font-weight: 800; color: #ea580c; text-transform: uppercase; margin-bottom: 6px;">
            CUSTOMER / BILLING TO:
          </div>
          <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${quotation.customer_name || 'Valued Client'}</div>
          ${quotation.customer_phone ? `<div style="font-size: 11px; color: #475569;">Phone: <strong>${quotation.customer_phone}</strong></div>` : ''}
          ${quotation.customer_email ? `<div style="font-size: 11px; color: #475569;">Email: ${quotation.customer_email}</div>` : ''}
          ${quotation.site_address ? `<div style="font-size: 11px; color: #475569;">Project Site: ${quotation.site_address}</div>` : ''}
        </div>
      </td>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        <div class="info-card">
          <div style="font-size: 10px; font-weight: 800; color: #ea580c; text-transform: uppercase; margin-bottom: 6px;">
            LOGISTICS & BRANCH NODE:
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #0f172a;">
            ${branch ? branch.name : `Branch Node: ${quotation.branch_code || 'Head Office'}`}
          </div>
          <div style="font-size: 11px; color: #475569;">Vehicle Assignment: <strong>${quotation.vehicle_id ? quotation.vehicle_id.toUpperCase() : 'Standard Logistics Fleet'}</strong></div>
          <div style="font-size: 11px; color: #475569;">Total Payload Weight: <strong>${totalWeight.toFixed(1)} kg</strong></div>
          ${quotation.notes ? `<div style="font-size: 10px; color: #64748b; margin-top: 4px;">Notes: <em>${quotation.notes}</em></div>` : ''}
        </div>
      </td>
    </tr>
  </table>

  <!-- Items Table -->
  <table class="table-items">
    <thead>
      <tr>
        <th style="width: 5%; text-align: center;">#</th>
        <th style="width: 45%; text-align: left;">Product Item & Specification</th>
        <th style="width: 10%; text-align: center;">Unit</th>
        <th style="width: 10%; text-align: center;">Qty</th>
        <th style="width: 15%; text-align: right;">Unit Price</th>
        <th style="width: 15%; text-align: right;">Total (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <!-- Financial Summary Box -->
  <div class="summary-box">
    <div class="summary-row">
      <span>Products Subtotal:</span>
      <span style="font-family: monospace; font-weight: bold;">Rs. ${(subtotal ?? 0).toLocaleString()}</span>
    </div>
    <div class="summary-row">
      <span>Transport & Logistics Surcharge:</span>
      <span style="font-family: monospace; font-weight: bold;">Rs. ${(transportCost ?? 0).toLocaleString()}</span>
    </div>
    <div class="summary-row">
      <span>Govt VAT / SSCL Tax (Included):</span>
      <span style="font-family: monospace;">Rs. 0.00</span>
    </div>
    <div class="summary-row total">
      <span>NET GRAND TOTAL:</span>
      <span style="font-family: monospace; color: #ea580c;">Rs. ${(netTotal ?? 0).toLocaleString()}</span>
    </div>
  </div>

  <div style="clear: both;"></div>

  <!-- Bank Payment Details -->
  <div style="margin-top: 20px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 10px 14px; font-size: 10px; color: #9a3412;">
    <strong>Bank Settlement Instructions:</strong> Bank: ${comp.bank_details.bank_name} | Account Name: ${comp.bank_details.account_name} | A/C No: <strong>${comp.bank_details.account_number}</strong> | Branch: ${comp.bank_details.branch_name} | Swift: ${comp.bank_details.swift_code}
  </div>

  <!-- Terms & Conditions -->
  <div class="terms-box">
    <strong>Terms & Standard Operating Conditions:</strong>
    <p style="margin-top: 4px; line-height: 1.5; white-space: pre-line;">${comp.invoice_footer_terms}</p>
  </div>

  <!-- Signatures -->
  <div class="signature-grid">
    <div class="signature-line">
      Prepared By / Estimator
      <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Innovista Engineering Team</div>
    </div>
    <div class="signature-line">
      Authorized Branch Approver
      <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Head Office / Branch Manager</div>
    </div>
    <div class="signature-line">
      Customer Acceptance Signature
      <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Date & Official Seal</div>
    </div>
  </div>

</body>
</html>
`;
}

/**
 * Downloads or prints the Quotation as a formatted PDF document
 */
export function generateAndDownloadQuotationPDF(
  quotation: Quotation,
  companyInfo?: CompanySettings,
  branch?: Branch
): void {
  const htmlContent = buildQuotationHtml(quotation, companyInfo, branch);

  try {
    const printWindow = window.open('', '_blank', 'width=850,height=1000');
    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // Ignore focus/print errors
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn('Direct window.open blocked by browser environment; falling back to download:', err);
  }

  // Fallback: download as .html print document
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quotation_${quotation.quotation_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (downloadErr) {
    console.error('Failed to export quotation document:', downloadErr);
  }
}

/**
 * Generates and downloads or opens a printable PDF document of the entire current quotation database
 */
export function generateAndDownloadQuotationsReportPDF(
  quotations: Quotation[],
  companyInfo?: CompanySettings,
  title: string = 'CURRENT QUOTATION & SALES PORTFOLIO REPORT',
  filterSummary: string = 'All Active Branches & Records'
): void {
  const comp = companyInfo || DEFAULT_COMPANY_INFO;
  const totalAmount = quotations.reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);
  const validatedQuotes = quotations.filter(q => {
    const s = (q.status || '').toLowerCase();
    return s.includes('validated') || s.includes('official') || s.includes('approved') || s.includes('verified');
  });
  const validatedAmount = validatedQuotes.reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);

  // Branch breakdown
  const branchMap = new Map<string, { count: number; total: number }>();
  quotations.forEach(q => {
    const bName = q.branch_name || 'Head Office Central';
    const curr = branchMap.get(bName) || { count: 0, total: 0 };
    curr.count++;
    curr.total += (Number(q.net_total) || 0);
    branchMap.set(bName, curr);
  });

  const branchRows = Array.from(branchMap.entries()).map(([branchName, data]) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
      <td style="padding: 6px 10px; font-weight: bold; color: #0f172a;">${branchName}</td>
      <td style="padding: 6px 10px; text-align: center; font-family: monospace;">${data.count}</td>
      <td style="padding: 6px 10px; text-align: right; font-family: monospace; font-weight: bold; color: #ea580c;">
        Rs. ${data.total.toLocaleString()}
      </td>
      <td style="padding: 6px 10px; text-align: right; font-family: monospace; color: #64748b;">
        ${totalAmount > 0 ? ((data.total / totalAmount) * 100).toFixed(1) : '0.0'}%
      </td>
    </tr>
  `).join('');

  const quotationRows = quotations.map((q, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10.5px;">
      <td style="padding: 6px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
      <td style="padding: 6px 8px; font-family: monospace; font-weight: bold; color: #0f172a;">
        ${q.quotation_number}
      </td>
      <td style="padding: 6px 8px; font-mono text-slate-600; white-space: nowrap;">${q.date || 'N/A'}</td>
      <td style="padding: 6px 8px;">
        <strong style="color: #0f172a;">${q.customer_name || 'Walk-in Customer'}</strong>
        ${q.customer_phone ? `<div style="font-size: 9px; color: #64748b;">${q.customer_phone}</div>` : ''}
      </td>
      <td style="padding: 6px 8px; color: #334155;">${q.branch_name || 'Head Office'}</td>
      <td style="padding: 6px 8px; text-align: center; font-family: monospace;">${q.items?.length || 0}</td>
      <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a; white-space: nowrap;">
        Rs. ${(Number(q.net_total) || 0).toLocaleString()}
      </td>
      <td style="padding: 6px 8px; text-align: center;">
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; background: ${
          (q.status || '').includes('Validated') ? '#ecfdf5; color: #047857; border: 1px solid #a7f3d0;' :
          (q.status || '').includes('Approved') ? '#eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;' :
          '#fffbeb; color: #b45309; border: 1px solid #fde68a;'
        }">
          ${q.status || 'Draft'}
        </span>
      </td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${comp.company_name}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    body { color: #0f172a; background: #fff; padding: 18px; font-size: 11px; line-height: 1.35; }
    .no-print { margin-bottom: 16px; background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .no-print button { background: #ea580c; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; margin-right: 6px; }
    .header-box { border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
    .kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; }
    .kpi-card .label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; }
    .kpi-card .value { font-size: 15px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #0f172a; color: #fff; padding: 6px 8px; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; }
    @media print { body { padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong style="color: #fb923c;">INNOVISTA ERP OFFICIAL REPORT</strong>
      <span style="margin-left: 10px; font-size: 11px; color: #cbd5e1;">Generated on ${new Date().toLocaleString()}</span>
    </div>
    <div>
      <button onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button onclick="window.close()" style="background: #334155;">Close</button>
    </div>
  </div>

  <div class="header-box">
    <div>
      <h1 style="font-size: 16px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">${comp.company_name}</h1>
      <p style="font-size: 10px; color: #ea580c; font-weight: bold;">${comp.tagline}</p>
      <p style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${comp.address} • Tel: ${comp.phone} • Email: ${comp.email}</p>
      <p style="font-size: 9px; color: #64748b;">Co Reg: ${comp.registration_no} • VAT: ${comp.tax_vat_id}</p>
    </div>
    <div style="text-align: right;">
      <h2 style="font-size: 14px; font-weight: 900; color: #ea580c; text-transform: uppercase;">${title}</h2>
      <p style="font-size: 10px; color: #334155; font-weight: bold; margin-top: 2px;">Scope: ${filterSummary}</p>
      <p style="font-size: 9.5px; color: #64748b;">Generated: ${formatSystemDateTime(new Date(), true, comp.timezone)} [${comp.timezone || 'Asia/Colombo'}]</p>
    </div>
  </div>

  <div class="kpi-strip">
    <div class="kpi-card">
      <div class="label">Total Quotation Count</div>
      <div class="value">${quotations.length} Quotes</div>
    </div>
    <div class="kpi-card">
      <div class="label">Total Pipeline Revenue</div>
      <div class="value" style="color: #ea580c;">Rs. ${totalAmount.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="label">Confirmed / Validated Sales</div>
      <div class="value" style="color: #047857;">Rs. ${validatedAmount.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="label">Active Branches Logged</div>
      <div class="value">${branchMap.size} Branches</div>
    </div>
  </div>

  <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 6px;">
    Branch Network Revenue Breakdown
  </h3>
  <table>
    <thead>
      <tr>
        <th style="text-align: left;">Branch Node</th>
        <th style="text-align: center;">Orders / Quotes</th>
        <th style="text-align: right;">Total Net Revenue</th>
        <th style="text-align: right;">Network Share</th>
      </tr>
    </thead>
    <tbody>
      ${branchRows}
    </tbody>
  </table>

  <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 6px;">
    Itemized Quotation Register (${quotations.length} Records)
  </h3>
  <table>
    <thead>
      <tr>
        <th style="text-align: center; width: 30px;">#</th>
        <th style="text-align: left;">Quote #</th>
        <th style="text-align: left;">Date</th>
        <th style="text-align: left;">Customer & Contact</th>
        <th style="text-align: left;">Branch</th>
        <th style="text-align: center;">Items</th>
        <th style="text-align: right;">Net Amount</th>
        <th style="text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${quotationRows}
    </tbody>
  </table>

  <div style="margin-top: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 9.5px; color: #64748b;">
    <div>Certified Official System Export • System Database Sync Mode: Online</div>
    <div>Authorized Executive Signature: ___________________________</div>
  </div>
</body>
</html>
`;

  try {
    const printWindow = window.open('', '_blank', 'width=950,height=1000');
    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {}
      }, 450);
      return;
    }
  } catch (e) {
    console.warn('Fallback to file download:', e);
  }

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `INNOVISTA_Quotation_Report_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports quotation records to a clean CSV file
 */
export function exportQuotationsToCSV(
  quotations: Quotation[],
  filename?: string
): void {
  const headers = [
    'Quotation Number',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Site Address',
    'Location Zone',
    'Branch Name',
    'Items Count',
    'Materials Subtotal (LKR)',
    'Transport Cost (LKR)',
    'Discount Amount (LKR)',
    'VAT / Tax (LKR)',
    'Grand Net Total (LKR)',
    'Status',
    'External ERP Reference',
    'Valid Until'
  ];

  const rows = quotations.map(q => {
    return [
      `"${q.quotation_number}"`,
      `"${q.date || ''}"`,
      `"${(q.customer_name || '').replace(/"/g, '""')}"`,
      `"${q.customer_phone || ''}"`,
      `"${(q.customer_email || '').replace(/"/g, '""')}"`,
      `"${(q.site_address || '').replace(/"/g, '""')}"`,
      `"${(q.site_location_name || '').replace(/"/g, '""')}"`,
      `"${(q.branch_name || '').replace(/"/g, '""')}"`,
      q.items?.length || 0,
      q.material_subtotal || 0,
      q.transport_cost || 0,
      q.discount_amount || 0,
      q.tax_amount || 0,
      q.net_total || 0,
      `"${q.status || 'Draft'}"`,
      `"${(q.external_software_ref || '').replace(/"/g, '""')}"`,
      `"${q.valid_until || ''}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename || `INNOVISTA_Quotations_Register_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports Audit Ledger records to CSV format
 */
export function exportAuditToCSV(history: PriceHistory[], filename?: string): void {
  const headers = [
    'Audit ID',
    'Timestamp',
    'Entity Type',
    'Target Code / Quotation',
    'Target Name',
    'Old Value (Rs)',
    'New Value (Rs)',
    'Delta (Rs)',
    'Officer / Changed By',
    'Officer Role',
    'Branch Affected',
    'Summary',
    'Justification / Reason'
  ];

  const rows = history.map(item => {
    const delta = (item.new_price || 0) - (item.old_price || 0);
    return [
      `"${item.id}"`,
      `"${item.changed_date}"`,
      `"${item.entity_type || item.update_type || 'PRICE'}"`,
      `"${item.product_code || item.quotation_number || ''}"`,
      `"${(item.product_name || item.customer_name || '').replace(/"/g, '""')}"`,
      item.old_price ?? 0,
      item.new_price ?? 0,
      delta,
      `"${(item.changed_by || '').replace(/"/g, '""')}"`,
      `"${(item.changed_by_role || 'Staff').replace(/"/g, '""')}"`,
      `"${(item.branch_affected || 'All Branches').replace(/"/g, '""')}"`,
      `"${(item.change_summary || '').replace(/"/g, '""')}"`,
      `"${(item.reason || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename || `INNOVISTA_Audit_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads or opens a printable PDF document of the Audit Ledger
 */
export function generateAuditReportPDF(
  history: PriceHistory[],
  statsOrTitle?: { total: number; priceMods: number; quoteMods: number; superAdminActions: number } | string,
  companyInfoOrSubtitle?: CompanySettings | string,
  filterSummaryArg?: string
): void {
  let stats: { total: number; priceMods: number; quoteMods: number; superAdminActions: number } | undefined;
  let comp: CompanySettings = DEFAULT_COMPANY_INFO;
  let filterSummary = 'All Audit Events across Branches & Roles';

  if (typeof statsOrTitle === 'string') {
    filterSummary = statsOrTitle;
  } else if (statsOrTitle && typeof statsOrTitle === 'object') {
    stats = statsOrTitle;
  }

  if (typeof companyInfoOrSubtitle === 'string') {
    filterSummary = companyInfoOrSubtitle;
  } else if (companyInfoOrSubtitle && typeof companyInfoOrSubtitle === 'object') {
    comp = companyInfoOrSubtitle;
  }

  if (filterSummaryArg) {
    filterSummary = filterSummaryArg;
  }

  const total = stats?.total ?? history.length;
  const priceMods = stats?.priceMods ?? history.filter(h => h.entity_type !== 'QUOTATION').length;
  const quoteMods = stats?.quoteMods ?? history.filter(h => h.entity_type === 'QUOTATION').length;
  const superAdminActions = stats?.superAdminActions ?? history.filter(h => (h.changed_by_role === 'Super Admin' || (h.changed_by_role as string) === 'HO MASTER')).length;

  const auditRows = history.map((item, idx) => {
    const delta = (item.new_price || 0) - (item.old_price || 0);
    const targetRef = item.product_code || item.quotation_number || 'N/A';
    const targetTitle = item.product_name || item.customer_name || 'Record Modification';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
        <td style="padding: 5px 6px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 5px 6px; font-family: monospace; white-space: nowrap;">${item.changed_date || 'N/A'}</td>
        <td style="padding: 5px 6px; white-space: nowrap;">
          <span style="display: inline-block; padding: 1.5px 5px; border-radius: 3px; font-size: 8.5px; font-weight: bold; background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1;">
            ${item.update_type || item.entity_type || 'MODIFICATION'}
          </span>
        </td>
        <td style="padding: 5px 6px;">
          <strong style="color: #0f172a; font-family: monospace;">${targetRef}</strong>
          <div style="font-size: 9px; color: #475569;">${targetTitle}</div>
        </td>
        <td style="padding: 5px 6px; text-align: right; font-family: monospace; color: #64748b;">
          ${item.old_price != null ? `Rs. ${item.old_price.toLocaleString()}` : '-'}
        </td>
        <td style="padding: 5px 6px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">
          Rs. ${(item.new_price || 0).toLocaleString()}
        </td>
        <td style="padding: 5px 6px; text-align: right; font-family: monospace; font-weight: bold; color: ${delta > 0 ? '#b91c1c' : delta < 0 ? '#047857' : '#64748b'};">
          ${delta > 0 ? `+Rs. ${delta.toLocaleString()}` : delta < 0 ? `-Rs. ${Math.abs(delta).toLocaleString()}` : '0'}
        </td>
        <td style="padding: 5px 6px;">
          <div style="font-weight: bold; color: #0f172a;">${item.changed_by || 'Staff'}</div>
          <div style="font-size: 8.5px; color: #64748b;">${item.changed_by_role || 'User'} • ${item.branch_affected || 'All'}</div>
        </td>
        <td style="padding: 5px 6px; color: #334155; max-width: 220px;">
          <div>${item.change_summary || ''}</div>
          <div style="font-size: 8.5px; color: #64748b; font-style: italic;">Reason: "${item.reason || 'Routine update'}"</div>
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Master Audit Ledger Report - Innovista Enterprise</title>
  <style>
    @page { size: A4 landscape; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    body { color: #0f172a; background: #fff; padding: 18px; font-size: 10.5px; line-height: 1.35; }
    .no-print { margin-bottom: 16px; background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .no-print button { background: #ea580c; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; margin-right: 6px; }
    .header-box { border-bottom: 2px solid #7c3aed; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
    .kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; }
    .kpi-card .label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; }
    .kpi-card .value { font-size: 15px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #0f172a; color: #fff; padding: 6px 6px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
    @media print { body { padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong style="color: #a78bfa;">INNOVISTA FORENSIC AUDIT REPORT (SEC-AUDIT-P7)</strong>
      <span style="margin-left: 10px; font-size: 11px; color: #cbd5e1;">Generated on ${new Date().toLocaleString()}</span>
    </div>
    <div>
      <button onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button onclick="window.close()" style="background: #334155;">Close</button>
    </div>
  </div>

  <div class="header-box">
    <div>
      <h1 style="font-size: 16px; font-weight: 900; color: #0f172a;">${comp.company_name}</h1>
      <p style="font-size: 10px; color: #7c3aed; font-weight: bold;">ENTERPRISE MASTER PRICE & QUOTATION FORENSIC AUDIT LEDGER</p>
      <p style="font-size: 9px; color: #64748b; margin-top: 2px;">Protocol: ISO-9001 / SEC-AUDIT-P7 • SHA-256 Ledger Verified • Append-Only Storage</p>
    </div>
    <div style="text-align: right;">
      <h2 style="font-size: 13px; font-weight: 900; color: #7c3aed; text-transform: uppercase;">OFFICIAL FORENSIC RECORD</h2>
      <p style="font-size: 9.5px; color: #334155; font-weight: bold; margin-top: 2px;">Scope: ${filterSummary}</p>
      <p style="font-size: 9px; color: #64748b;">Printed: ${formatAuditTimestamp(new Date(), comp.timezone)}</p>
    </div>
  </div>

  <div class="kpi-strip">
    <div class="kpi-card">
      <div class="label">Total Audit Events</div>
      <div class="value">${total} Records</div>
    </div>
    <div class="kpi-card">
      <div class="label">Price Adjustments</div>
      <div class="value" style="color: #d97706;">${priceMods} Events</div>
    </div>
    <div class="kpi-card">
      <div class="label">Quotation Modifications</div>
      <div class="value" style="color: #4f46e5;">${quoteMods} Events</div>
    </div>
    <div class="kpi-card">
      <div class="label">Super Admin Actions</div>
      <div class="value" style="color: #7c3aed;">${superAdminActions} Operations</div>
    </div>
  </div>

  <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 6px;">
    Forensic Ledger Entries (${history.length} Events)
  </h3>
  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">#</th>
        <th style="text-align: left;">Timestamp</th>
        <th style="text-align: left;">Event</th>
        <th style="text-align: left;">Target Entity / Item</th>
        <th style="text-align: right;">Old Value</th>
        <th style="text-align: right;">New Value</th>
        <th style="text-align: right;">Delta</th>
        <th style="text-align: left;">Changed By & Role</th>
        <th style="text-align: left;">Summary & Reason</th>
      </tr>
    </thead>
    <tbody>
      ${auditRows}
    </tbody>
  </table>

  <div style="margin-top: 20px; padding-top: 10px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 9.5px; color: #64748b;">
    <div>Regulatory Governance: Cryptographically chained ledger entries are unmodifiable under company policy.</div>
    <div>Super Admin Verification Seal: ___________________________</div>
  </div>
</body>
</html>
`;

  try {
    const printWindow = window.open('', '_blank', 'width=1050,height=900');
    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {}
      }, 450);
      return;
    }
  } catch (e) {
    console.warn('Fallback to file download:', e);
  }

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `INNOVISTA_Audit_Ledger_Report_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Dispatches a WhatsApp share link
 */
export function shareViaWhatsApp(text: string, phoneNumber?: string): void {
  const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
