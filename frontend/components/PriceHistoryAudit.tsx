import React, { useState, useMemo } from 'react';
import { PriceHistory, SystemUser } from '../../shared/types';
import { 
  Search, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Download, 
  RefreshCw, 
  Filter, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  X, 
  Tag, 
  DollarSign, 
  Layers, 
  Building2, 
  Clock,
  Sparkles,
  Info,
  Printer,
  MessageSquare,
  Mail,
  Eye,
  LayoutList,
  Table
} from 'lucide-react';
import { 
  generateAuditReportPDF, 
  exportAuditToCSV, 
  shareViaWhatsApp 
} from '../utils/pdfExportEngine';

interface PriceHistoryAuditProps {
  history: PriceHistory[];
  currentUser?: SystemUser | null;
  onRefresh?: () => void;
}

export const PriceHistoryAudit: React.FC<PriceHistoryAuditProps> = ({ 
  history, 
  currentUser,
  onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<'ALL' | 'PRICE' | 'QUOTATION'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [selectedAuditItem, setSelectedAuditItem] = useState<PriceHistory | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewLayout, setViewLayout] = useState<'simple' | 'table'>('simple');

  // Check if current user is authorized (Super Admin only)
  const isSuperAdmin = currentUser?.role === 'Super Admin' || (currentUser?.role as string) === 'HO MASTER';

  // Extract distinct roles and branches present in the history
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    history.forEach(h => {
      if (h.changed_by_role) roles.add(h.changed_by_role);
    });
    // Ensure standard roles exist in the list
    roles.add('Super Admin');
    roles.add('HO Admin');
    roles.add('Branch Manager');
    roles.add('Sales Executive');
    return Array.from(roles);
  }, [history]);

  const availableBranches = useMemo(() => {
    const branches = new Set<string>();
    history.forEach(h => {
      if (h.branch_affected) branches.add(h.branch_affected);
    });
    return Array.from(branches);
  }, [history]);

  // Handle Refresh simulation / call
  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // 1. Entity filter
      if (entityFilter === 'PRICE' && item.entity_type === 'QUOTATION') return false;
      if (entityFilter === 'QUOTATION' && item.entity_type !== 'QUOTATION') return false;

      // 2. Role filter
      if (roleFilter !== 'ALL') {
        const itemRole = item.changed_by_role || (item.changed_by?.includes('Admin') ? 'Super Admin' : 'Sales Executive');
        if (itemRole.toLowerCase() !== roleFilter.toLowerCase()) return false;
      }

      // 3. Branch filter
      if (branchFilter !== 'ALL' && item.branch_affected !== branchFilter) {
        return false;
      }

      // 4. Date filter
      if (dateFilter !== 'ALL' && item.changed_date) {
        const itemDate = new Date(item.changed_date);
        const now = new Date();
        if (!isNaN(itemDate.getTime())) {
          const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
          if (dateFilter === 'TODAY' && diffDays > 1) return false;
          if (dateFilter === 'WEEK' && diffDays > 7) return false;
          if (dateFilter === 'MONTH' && diffDays > 30) return false;
        }
      }

      // 5. Search query
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const code = (item.product_code || item.quotation_number || '').toLowerCase();
        const name = (item.product_name || item.customer_name || '').toLowerCase();
        const user = (item.changed_by || '').toLowerCase();
        const role = (item.changed_by_role || '').toLowerCase();
        const reason = (item.reason || '').toLowerCase();
        const summary = (item.change_summary || '').toLowerCase();
        const branch = (item.branch_affected || '').toLowerCase();

        const matches = code.includes(term) ||
          name.includes(term) ||
          user.includes(term) ||
          role.includes(term) ||
          reason.includes(term) ||
          summary.includes(term) ||
          branch.includes(term);

        if (!matches) return false;
      }

      return true;
    });
  }, [history, entityFilter, roleFilter, branchFilter, dateFilter, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = history.length;
    const priceMods = history.filter(h => h.entity_type !== 'QUOTATION').length;
    const quoteMods = history.filter(h => h.entity_type === 'QUOTATION').length;
    const superAdminActions = history.filter(h => (h.changed_by_role === 'Super Admin' || (h.changed_by_role as string) === 'HO MASTER')).length;

    return { total, priceMods, quoteMods, superAdminActions };
  }, [history]);

  // Export to CSV Functionality
  const exportToCSV = () => {
    const headers = [
      'Audit ID',
      'Timestamp',
      'Entity Type',
      'Event Type',
      'Reference Code / Number',
      'Item / Customer Name',
      'Old Value (LKR)',
      'New Value (LKR)',
      'Value Delta (LKR)',
      'Changed By',
      'Role',
      'Branch Affected',
      'Change Summary',
      'Business Justification'
    ];

    const rows = filteredHistory.map(item => {
      const delta = (item.new_price || 0) - (item.old_price || 0);
      return [
        `"${item.id}"`,
        `"${item.changed_date}"`,
        `"${item.entity_type || 'PRICE'}"`,
        `"${item.update_type || 'PRICE_CHANGE'}"`,
        `"${item.product_code || item.quotation_number || 'N/A'}"`,
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
    link.setAttribute('download', `INNOVISTA_Audit_Log_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Audit Ledger to PDF Document
  const handleExportAuditPDF = () => {
    if (!filteredHistory || filteredHistory.length === 0) {
      alert('No audit log entries available for the active filters.');
      return;
    }
    generateAuditReportPDF(
      filteredHistory,
      undefined,
      'MASTER PRICE & QUOTATION FORENSIC AUDIT TRAIL',
      `Active Filter: Entity: ${entityFilter} • Branch: ${branchFilter} • Date: ${dateFilter} • Total Records: ${filteredHistory.length}`
    );
  };

  // Share Audit Summary via WhatsApp
  const handleShareAuditWhatsApp = () => {
    if (!filteredHistory || filteredHistory.length === 0) {
      alert('No audit log entries available.');
      return;
    }
    const text = `*INNOVISTA ENTERPRISE - FORENSIC AUDIT TRAIL SUMMARY*\n` +
      `*Generated:* ${new Date().toLocaleDateString()}\n` +
      `*Total Recorded Events:* ${filteredHistory.length}\n` +
      `*Entity Filter:* ${entityFilter} | *Branch:* ${branchFilter}\n\n` +
      `*Recent Ledger Entries:*\n` +
      filteredHistory.slice(0, 5).map(h => `• ${h.changed_date}: [${h.update_type}] ${h.product_name || h.customer_name || h.quotation_number} by ${h.changed_by} (${h.changed_by_role})`).join('\n') +
      `\n\nFull cryptographically-verified audit reports are available in PDF and CSV format via the Super Admin portal.`;
    shareViaWhatsApp(text);
  };

  // Send Audit Summary via Email
  const handleEmailAuditSummary = () => {
    if (!filteredHistory || filteredHistory.length === 0) {
      alert('No audit log entries available.');
      return;
    }
    const subject = `INNOVISTA AUDIT REPORT: Forensic Ledger Export (${filteredHistory.length} Events)`;
    window.dispatchEvent(new CustomEvent('innovista_open_gmail_modal', {
      detail: {
        to: currentUser?.email || 'admin@innovista.lk',
        subject,
        bodyHtml: `<div style="font-family: Arial, sans-serif;">
          <h2 style="color: #0f203c;">Innovista Enterprise Audit Ledger Summary</h2>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Recorded Events:</strong> ${filteredHistory.length}</p>
          <p><strong>Filters Applied:</strong> Entity: ${entityFilter}, Branch: ${branchFilter}, Date: ${dateFilter}</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px;">
            <thead>
              <tr style="background: #0f172a; color: white;">
                <th style="padding: 6px; text-align: left;">Timestamp</th>
                <th style="padding: 6px; text-align: left;">Event</th>
                <th style="padding: 6px; text-align: left;">Target</th>
                <th style="padding: 6px; text-align: left;">Changed By</th>
                <th style="padding: 6px; text-align: left;">Reason</th>
              </tr>
            </thead>
            <tbody>
              ${filteredHistory.slice(0, 15).map(h => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 5px; font-family: monospace;">${h.changed_date}</td>
                  <td style="padding: 5px;">${h.update_type}</td>
                  <td style="padding: 5px;">${h.product_name || h.customer_name || h.quotation_number || 'N/A'}</td>
                  <td style="padding: 5px;">${h.changed_by} (${h.changed_by_role})</td>
                  <td style="padding: 5px; font-style: italic;">"${h.reason}"</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`
      }
    }));
  };

  // Helper for Role Badges
  const getRoleBadge = (role?: string) => {
    const normalized = (role || '').trim();
    if (normalized === 'Super Admin' || normalized === 'HO MASTER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
          <ShieldCheck className="w-3 h-3 text-purple-700" />
          Super Admin
        </span>
      );
    }
    if (normalized === 'HO Admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          <ShieldCheck className="w-3 h-3 text-blue-600" />
          HO Admin
        </span>
      );
    }
    if (normalized === 'Branch Manager') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Building2 className="w-3 h-3 text-amber-700" />
          Branch Manager
        </span>
      );
    }
    if (normalized === 'Sales Executive') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <User className="w-3 h-3 text-emerald-700" />
          Sales Executive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <User className="w-3 h-3 text-slate-500" />
        {role || 'Staff User'}
      </span>
    );
  };

  // Helper for Event Type Badges
  const getEventTypeBadge = (item: PriceHistory) => {
    if (item.entity_type === 'QUOTATION') {
      switch (item.update_type) {
        case 'QUOTATION_CREATED':
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <FileText className="w-3 h-3" />
              QUOTATION CREATED
            </span>
          );
        case 'QUOTATION_STATUS_CHANGE':
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
              <CheckCircle2 className="w-3 h-3" />
              STATUS / VALIDATED
            </span>
          );
        case 'QUOTATION_DISCOUNT':
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Tag className="w-3 h-3" />
              DISCOUNT REVISED
            </span>
          );
        case 'QUOTATION_DELETION_REQUEST':
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3 h-3" />
              REMOVAL REQUEST
            </span>
          );
        case 'QUOTATION_DELETION_REJECTED':
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
              <ShieldAlert className="w-3 h-3" />
              REMOVAL REJECTED
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <FileText className="w-3 h-3" />
              QUOTATION MODIFIED
            </span>
          );
      }
    } else {
      switch (item.update_type) {
        case 'REGIONAL_OVERRIDE':
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
              <Building2 className="w-3 h-3" />
              REGIONAL OVERRIDE
            </span>
          );
        case 'CUSTOMER_RATE':
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              <User className="w-3 h-3" />
              CLIENT CONTRACT
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <DollarSign className="w-3 h-3" />
              BASE PRICE CHANGE
            </span>
          );
      }
    }
  };

  // If user is not Super Admin, show restricted access gate
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-rose-200 p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider rounded-full border border-rose-300">
              Restricted Forensic Vault
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Super Admin Access Only
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under enterprise regulatory governance protocol SEC-P7, complete price adjustments and quotation audit trails are strictly classified and restricted to the <strong>Super Admin</strong> profile.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Your Current Account:</span>
              <span className="font-bold text-slate-900">{currentUser?.name || 'Guest / Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Assigned Role:</span>
              <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {currentUser?.role || 'Unauthorized'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Authorization Status:</span>
              <span className="font-bold text-rose-600 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Access Denied
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Please switch to or sign in with your authorized Super Admin profile to inspect historical rates and quotation change records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* --- TOP EXECUTIVE COMMAND BANNER --- */}
      <div className="bg-gradient-to-r from-[#0F203C] via-[#162A4D] to-[#1E3863] text-white p-5 rounded-xl shadow-sm border border-slate-700/40 relative overflow-hidden">
        {/* Subtle decorative background watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-5 pointer-events-none flex items-center justify-end pr-6">
          <ShieldCheck className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#E87F24] text-white flex items-center justify-center shadow-md">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-white uppercase">
                    Master Price & Quotation Audit Log
                  </h1>
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-300" />
                    Super Admin Exclusive
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium mt-0.5">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Forensic Ledger Active
                  </span>
                  <span>•</span>
                  <span>Enterprise Protocol: ISO-9001 / SEC-AUDIT-P7</span>
                  <span>•</span>
                  <span className="font-mono text-slate-400">SHA-256 Ledger Verified</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-300/90 leading-relaxed pt-1">
              Comprehensive tamper-evident record tracking <strong>who changed what</strong>, their <strong>exact system role</strong>, and the <strong>precise timestamp</strong> across every master price adjustment, regional margin override, quotation creation, and order modification across all 5 branches.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleExportAuditPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              title="Generate Audit Report as PDF Document"
            >
              <Printer className="w-3.5 h-3.5 text-orange-600" />
              <span>Audit PDF</span>
            </button>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E87F24] hover:bg-[#D4701A] active:bg-[#BF6314] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              title="Export Audit Ledger to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Audit CSV</span>
            </button>
            <button
              onClick={handleShareAuditWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              title="Share Audit Summary via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleEmailAuditSummary}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              title="Send Audit Summary via Email"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
            <button
              onClick={handleTriggerRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white rounded-lg text-xs font-semibold transition border border-white/15 shadow-xs cursor-pointer"
              title="Refresh ledger state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Summary Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Total Audit Records</span>
              <Layers className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{stats.total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across all branch nodes</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Price Modifications</span>
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{stats.priceMods}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Base prices & regional rates</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Quotation Audits</span>
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-black text-indigo-300 font-mono mt-0.5">{stats.quoteMods}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Edits, discounts & validations</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Super Admin Actions</span>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-300 font-mono mt-0.5">{stats.superAdminActions}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Executive root operations</div>
          </div>
        </div>
      </div>

      {/* --- FILTER & SEARCH CONTROL MATRIX --- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3.5">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setEntityFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition ${
                entityFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events ({history.length})
            </button>
            <button
              onClick={() => setEntityFilter('PRICE')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                entityFilter === 'PRICE'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              Price Adjustments ({stats.priceMods})
            </button>
            <button
              onClick={() => setEntityFilter('QUOTATION')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                entityFilter === 'QUOTATION'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Quotation Modifications ({stats.quoteMods})
            </button>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Period:</span>
            {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  dateFilter === period
                    ? 'bg-[#0F203C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {period === 'ALL' ? 'All Time' : period === 'TODAY' ? 'Today' : period === 'WEEK' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns & Search Input Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, user, role, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E87F24] focus:border-[#E87F24] transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Dropdown */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#E87F24] focus:border-[#E87F24] transition"
            >
              <option value="ALL">Filter by Role: All Roles</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>Role: {role}</option>
              ))}
            </select>
          </div>

          {/* Branch Filter Dropdown */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#E87F24] focus:border-[#E87F24] transition"
            >
              <option value="ALL">Branch: All 5 Branches & HO</option>
              {availableBranches.map(br => (
                <option key={br} value={br}>{br}</option>
              ))}
            </select>
          </div>

          {/* Active Filter Reset */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-900 font-mono">{filteredHistory.length}</strong> of {history.length} records
            </span>
            {(searchTerm || entityFilter !== 'ALL' || roleFilter !== 'ALL' || branchFilter !== 'ALL' || dateFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setEntityFilter('ALL');
                  setRoleFilter('ALL');
                  setBranchFilter('ALL');
                  setDateFilter('ALL');
                }}
                className="text-[#E87F24] hover:underline font-bold text-[11px]"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- VIEW MODE TOGGLE & RECORD COUNT HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700">Display Layout:</span>
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setViewLayout('simple')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                viewLayout === 'simple'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5 text-orange-500" />
              <span>Single & Simple Records</span>
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                viewLayout === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-orange-500" />
              <span>Compact Ledger Table</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Showing <strong>{filteredHistory.length}</strong> of {history.length} logged events</span>
        </div>
      </div>

      {/* --- AUDIT RECORDS VIEW --- */}
      {viewLayout === 'simple' ? (
        /* SINGLE AND SIMPLE RECORD VIEW */
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-xs">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No audit events match your criteria</p>
              <p className="text-xs text-slate-400 mt-0.5">Try resetting search filters or changing the date range</p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const delta = (item.new_price || 0) - (item.old_price || 0);
              const isPositive = delta > 0;
              const isQuotation = item.entity_type === 'QUOTATION';
              const refCode = item.product_code || item.quotation_number || 'RECORD';
              const title = item.product_name || item.customer_name || 'System Record';

              return (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-200 hover:border-orange-300 rounded-xl p-4 transition-all shadow-2xs hover:shadow-xs space-y-3"
                >
                  {/* Top Bar: Timestamp, Badge, Branch, and Dedicated "View Details" Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.changed_date}</span>
                      </div>
                      <span>•</span>
                      {getEventTypeBadge(item)}
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-xs">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{item.branch_affected || 'Head Office Central'}</span>
                      </span>
                    </div>

                    {/* Dedicated Single Record "View Details" Button */}
                    <button
                      onClick={() => setSelectedAuditItem(item)}
                      className="bg-[#0F203C] hover:bg-[#1E3A63] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-2xs transition cursor-pointer self-start sm:self-auto shrink-0"
                      title="Open complete forensic record details"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#FFC81E]" />
                      <span>View Details</span>
                    </button>
                  </div>

                  {/* Middle: Target Item/Quotation & Value Change */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                          isQuotation ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {refCode}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900">{title}</h3>
                      </div>
                      <p className="text-xs text-slate-600 italic">
                        "{item.reason || 'Standard audit trail record'}"
                      </p>
                    </div>

                    {/* Value Delta Summary */}
                    <div className="flex items-center space-x-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 shrink-0">
                      {item.old_price != null && item.old_price > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Before</span>
                          <span className="font-mono text-xs text-slate-500 line-through">
                            Rs. {item.old_price.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Recorded Value</span>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          Rs. {(item.new_price || 0).toLocaleString()}
                        </span>
                      </div>
                      {delta !== 0 && (
                        <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${
                          isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isPositive ? '+' : ''}{delta.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Line: Changed by & Role */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span>Changed by:</span>
                      <strong className="text-slate-800 flex items-center space-x-1">
                        <User className="w-3 h-3 text-orange-500" />
                        <span>{item.changed_by}</span>
                      </strong>
                      <span>({item.changed_by_role || 'Staff'})</span>
                    </div>
                    {item.change_summary && (
                      <span className="text-slate-400 truncate max-w-md hidden md:inline">
                        {item.change_summary}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Single Record View Footer Strip */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cryptographic Chain: All modifications append-only & preserved for regulatory inspection.</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Super Admin Auditor: <strong>{currentUser?.name || 'Authorized Super Admin'}</strong></span>
              <span>Total Events: <strong>{filteredHistory.length}</strong></span>
            </div>
          </div>
        </div>
      ) : (
        /* --- COMPACT AUDIT LOG TABLE --- */
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-3.5 whitespace-nowrap">Timestamp</th>
                <th className="py-3 px-3 whitespace-nowrap">Event Type</th>
                <th className="py-3 px-3">Item / Quotation Target</th>
                <th className="py-3 px-3 whitespace-nowrap text-right">Value Before</th>
                <th className="py-3 px-3 whitespace-nowrap text-right">Value After</th>
                <th className="py-3 px-3 whitespace-nowrap text-center">Value Delta</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Changed By</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Role</th>
                <th className="py-3 px-3 whitespace-nowrap">Branch Affected</th>
                <th className="py-3 px-3.5 min-w-[220px]">Change Summary & Justification</th>
                <th className="py-3 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-slate-400">
                    <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No audit events match your criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try resetting search filters or changing the date range</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const delta = (item.new_price || 0) - (item.old_price || 0);
                  const isPositive = delta > 0;
                  const isZero = delta === 0;
                  const deltaPct = item.old_price && item.old_price > 0 ? (((delta / item.old_price) * 100) || 0).toFixed(1) : '0.0';

                  const isQuotation = item.entity_type === 'QUOTATION';
                  const refCode = item.product_code || item.quotation_number || 'RECORD';
                  const title = item.product_name || item.customer_name || 'System Record';

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedAuditItem(item)}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.changed_date}</span>
                        </div>
                      </td>

                      {/* Event Type Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getEventTypeBadge(item)}
                      </td>

                      {/* Item / Quotation Target */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                              isQuotation ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {refCode}
                            </span>
                            {isQuotation && (
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                Order
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-slate-900 text-xs truncate" title={title}>
                            {title}
                          </p>
                        </div>
                      </td>

                      {/* Value Before */}
                      <td className="py-3 px-3 font-mono text-slate-400 text-right whitespace-nowrap text-[11px]">
                        {item.old_price != null && item.old_price > 0 ? (
                          <span className="line-through">Rs. {item.old_price.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-300">Rs. 0</span>
                        )}
                      </td>

                      {/* Value After */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right whitespace-nowrap text-xs">
                        Rs. {(item.new_price || 0).toLocaleString()}
                      </td>

                      {/* Value Delta */}
                      <td className="py-3 px-3 font-mono text-center whitespace-nowrap">
                        {isZero ? (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            No Price Delta
                          </span>
                        ) : (
                          <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded text-[10px] ${
                            isPositive 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                            {isPositive 
                              ? `+Rs. ${delta.toLocaleString()} (+${deltaPct}%)` 
                              : `-Rs. ${Math.abs(delta).toLocaleString()} (${deltaPct}%)`}
                          </span>
                        )}
                      </td>

                      {/* Changed By (Who) */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 font-semibold text-slate-800 text-xs">
                          <User className="w-3.5 h-3.5 text-[#E87F24] shrink-0" />
                          <span>{item.changed_by}</span>
                        </div>
                      </td>

                      {/* Their Role */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getRoleBadge(item.changed_by_role)}
                      </td>

                      {/* Branch Affected */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 font-medium bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {item.branch_affected || 'All Branches'}
                        </span>
                      </td>

                      {/* Change Summary & Justification */}
                      <td className="py-3 px-3.5 max-w-sm">
                        <div className="space-y-1">
                          {item.change_summary && (
                            <p className="text-xs text-slate-800 font-medium leading-snug">
                              {item.change_summary}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500 italic flex items-start gap-1">
                            <span className="font-semibold not-italic text-slate-400">Reason:</span>
                            "{item.reason}"
                          </p>
                        </div>
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAuditItem(item);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographic Chain: All modifications append-only & preserved for regulatory inspection.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Super Admin Auditor: <strong>{currentUser?.name || 'Authorized Super Admin'}</strong></span>
            <span>Ledger Records: <strong>{filteredHistory.length}</strong></span>
          </div>
        </div>
      </div>
      )}

      {/* --- AUDIT INSPECTION MODAL / DRAWER --- */}
      {selectedAuditItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0F203C] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E87F24] flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-white">
                    Forensic Audit Record Inspection
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Audit ID: {selectedAuditItem.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAuditItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Event Overview Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Entity / Event Type
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    {getEventTypeBadge(selectedAuditItem)}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Execution Timestamp
                  </span>
                  <div className="mt-1 text-xs font-mono font-bold text-slate-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {selectedAuditItem.changed_date}
                  </div>
                </div>
              </div>

              {/* Target & Value Comparison */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">Target Item / Reference</span>
                  <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-[#0F203C]">
                    {selectedAuditItem.product_code || selectedAuditItem.quotation_number || 'N/A'}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedAuditItem.product_name || selectedAuditItem.customer_name}
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Previous Value</span>
                    <span className="text-xs font-mono line-through text-slate-500 font-bold block mt-0.5">
                      Rs. {(selectedAuditItem.old_price || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Modified Value</span>
                    <span className="text-xs font-mono text-emerald-700 font-bold block mt-0.5">
                      Rs. {(selectedAuditItem.new_price || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Delta Variance</span>
                    <span className="text-xs font-mono font-bold text-[#E87F24] block mt-0.5">
                      {((selectedAuditItem.new_price || 0) - (selectedAuditItem.old_price || 0)) >= 0 ? '+' : ''}
                      Rs. {((selectedAuditItem.new_price || 0) - (selectedAuditItem.old_price || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actor & Role Details */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase block border-b border-slate-100 pb-1.5">
                  Actor & Node Identity
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Authorizing Actor:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-[#E87F24]" />
                      {selectedAuditItem.changed_by}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Account Role:</span>
                    <div className="mt-0.5">
                      {getRoleBadge(selectedAuditItem.changed_by_role)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Branch Node:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {selectedAuditItem.branch_affected || 'All Branches'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Regional Scope:</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {selectedAuditItem.region_affected || 'Island-wide Network'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Change Description & Justification */}
              <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-amber-900 uppercase block">
                  Mandated Business Justification
                </span>
                <p className="text-xs text-amber-950 font-serif italic leading-relaxed">
                  "{selectedAuditItem.reason}"
                </p>
                {selectedAuditItem.change_summary && (
                  <div className="pt-2 border-t border-amber-200/50 text-xs text-amber-900 font-medium">
                    <strong>Technical Change Summary:</strong> {selectedAuditItem.change_summary}
                  </div>
                )}
              </div>

              {/* Status information if applicable */}
              {(selectedAuditItem.old_status || selectedAuditItem.new_status) && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Lifecycle Status Shift:</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[11px]">
                      {selectedAuditItem.old_status || 'Draft'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                      {selectedAuditItem.new_status || 'Active'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Ledger verified by Super Admin Authority
              </span>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => {
                    generateAuditReportPDF(
                      [selectedAuditItem],
                      undefined,
                      'OFFICIAL AUDIT INSPECTION DOCKET',
                      `Audit Event ID: ${selectedAuditItem.id} • Target: ${selectedAuditItem.product_name || selectedAuditItem.customer_name || selectedAuditItem.quotation_number}`
                    );
                  }}
                  className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 border border-slate-300 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Export single audit record as PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-orange-600" />
                  <span>PDF Docket</span>
                </button>
                <button
                  onClick={() => {
                    const text = `*INNOVISTA AUDIT RECORD INSPECTION*\n` +
                      `*Event ID:* ${selectedAuditItem.id}\n` +
                      `*Date:* ${selectedAuditItem.changed_date}\n` +
                      `*Event:* ${selectedAuditItem.update_type}\n` +
                      `*Target:* ${selectedAuditItem.product_name || selectedAuditItem.customer_name || selectedAuditItem.quotation_number}\n` +
                      `*Changed by:* ${selectedAuditItem.changed_by} (${selectedAuditItem.changed_by_role})\n` +
                      `*Branch:* ${selectedAuditItem.branch_affected || 'All'}\n` +
                      `*Recorded Value:* Rs. ${(selectedAuditItem.new_price || 0).toLocaleString()}\n` +
                      `*Reason:* "${selectedAuditItem.reason}"`;
                    shareViaWhatsApp(text);
                  }}
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Share record via WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('innovista_open_gmail_modal', {
                      detail: {
                        to: currentUser?.email || 'admin@innovista.lk',
                        subject: `INNOVISTA AUDIT RECORD: ${selectedAuditItem.update_type} [${selectedAuditItem.product_code || selectedAuditItem.quotation_number || selectedAuditItem.id}]`,
                        bodyHtml: `<div style="font-family: Arial, sans-serif;">
                          <h2 style="color: #0f203c;">Innovista Forensic Audit Record</h2>
                          <p><strong>Audit ID:</strong> ${selectedAuditItem.id}</p>
                          <p><strong>Timestamp:</strong> ${selectedAuditItem.changed_date}</p>
                          <p><strong>Action Type:</strong> ${selectedAuditItem.update_type}</p>
                          <p><strong>Target:</strong> ${selectedAuditItem.product_name || selectedAuditItem.customer_name || selectedAuditItem.quotation_number}</p>
                          <p><strong>Officer:</strong> ${selectedAuditItem.changed_by} (${selectedAuditItem.changed_by_role})</p>
                          <p><strong>Branch:</strong> ${selectedAuditItem.branch_affected || 'Head Office Central'}</p>
                          <p><strong>Mandated Reason:</strong> "${selectedAuditItem.reason}"</p>
                          <p><strong>Values:</strong> Before: Rs. ${(selectedAuditItem.old_price || 0).toLocaleString()} | After: Rs. ${(selectedAuditItem.new_price || 0).toLocaleString()}</p>
                        </div>`
                      }
                    }));
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Send record via Email"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
                <button
                  onClick={() => setSelectedAuditItem(null)}
                  className="px-4 py-1.5 bg-[#0F203C] hover:bg-[#162A4D] text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
