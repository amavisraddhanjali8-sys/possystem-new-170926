import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Barcode1D } from './BarcodeGenerator';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  XCircle,
  Printer, 
  Eye, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Truck, 
  Layers, 
  ChevronRight, 
  X, 
  Calendar, 
  Tag, 
  Download, 
  FileSpreadsheet,
  RefreshCw,
  QrCode,
  DollarSign,
  ShoppingCart,
  Maximize2,
  Minimize2,
  LayoutGrid,
  List,
  Lock,
  Trash2,
  AlertTriangle,
  Send,
  MessageSquare,
  Mail,
  Share2
} from 'lucide-react';
import { Quotation, Branch, QuotationItem, SystemUser } from '../../shared/types';
import { 
  generateAndDownloadQuotationPDF, 
  generateAndDownloadQuotationsReportPDF, 
  exportQuotationsToCSV, 
  shareViaWhatsApp 
} from '../utils/pdfExportEngine';
import { PrintableQuotationModal } from './PrintableQuotationModal';
import { getSystemCurrentDateString, formatSystemDateTime, getSystemTimezone } from '../utils/timezoneEngine';

// Dedicated Status Indicator Badge Component
export const QuotationStatusBadge: React.FC<{ status: string; isDark?: boolean; className?: string }> = ({ 
  status, 
  isDark = false,
  className = '' 
}) => {
  const normalized = (status || '').toLowerCase().trim();

  let badgeStyle = '';
  let icon = null;

  if (normalized.includes('validated') || normalized.includes('approved') || normalized.includes('verified') || normalized.includes('official')) {
    badgeStyle = isDark 
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-2xs' 
      : 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs';
    icon = <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />;
  } else if (normalized.includes('pending') || normalized.includes('awaiting') || normalized.includes('review')) {
    badgeStyle = isDark 
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-2xs' 
      : 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs';
    icon = <Clock className="w-3 h-3 text-amber-500 shrink-0" />;
  } else if (normalized.includes('cancel') || normalized.includes('reject') || normalized.includes('void') || normalized.includes('decline')) {
    badgeStyle = isDark 
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-2xs' 
      : 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs';
    icon = <XCircle className="w-3 h-3 text-rose-500 shrink-0" />;
  } else if (normalized.includes('draft') || normalized.includes('temp')) {
    badgeStyle = isDark 
      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-2xs' 
      : 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs';
    icon = <FileText className="w-3 h-3 text-blue-500 shrink-0" />;
  } else {
    badgeStyle = isDark 
      ? 'bg-slate-700 text-slate-200 border-slate-600' 
      : 'bg-slate-100 text-slate-800 border-slate-200';
    icon = <Tag className="w-3 h-3 text-slate-400 shrink-0" />;
  }

  return (
    <span className={`inline-flex items-center space-x-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle} ${className}`}>
      {icon}
      <span>{status || 'Draft'}</span>
    </span>
  );
};

interface OrderManagementPortalProps {
  quotations: Quotation[];
  branches: Branch[];
  activeBranch: Branch;
  currentUser?: SystemUser | null;
  onValidateQuotation: (id: string, extRef?: string, notes?: string) => Promise<void>;
  onProceedToQuotation?: (item: QuotationItem) => void;
  onRefreshData?: () => void;
  onDeleteQuotation?: (id: string, remark?: string) => Promise<void>;
  onRequestOrderRemoval?: (id: string, reason: string) => Promise<void>;
  onRejectOrderRemoval?: (id: string) => Promise<void>;
}

export const OrderManagementPortal: React.FC<OrderManagementPortalProps> = ({
  quotations,
  branches,
  activeBranch,
  currentUser,
  onValidateQuotation,
  onProceedToQuotation,
  onRefreshData,
  onDeleteQuotation,
  onRequestOrderRemoval,
  onRejectOrderRemoval
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Sync search filter from global search bar
  useEffect(() => {
    const handleFilterOrder = (e: any) => {
      if (e.detail?.query) {
        setSearchTerm(e.detail.query);
      }
    };
    window.addEventListener('innovista_search_filter_order', handleFilterOrder);
    return () => window.removeEventListener('innovista_search_filter_order', handleFilterOrder);
  }, []);
  
  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Quotation | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [isOrderFullscreen, setIsOrderFullscreen] = useState(false);
  const [printModalQuote, setPrintModalQuote] = useState<Quotation | null>(null);

  // Validation Form State
  const [extRefInput, setExtRefInput] = useState('');
  const [validationNotesInput, setValidationNotesInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Check if current user has Head Office admin privileges
  const isHO = (currentUser?.role === 'Super Admin' || currentUser?.role === 'HO Admin') && 
               (currentUser?.branch_id === 'b-ho' || !currentUser?.branch_id);

  // User role capabilities for deletion workflow
  // Only Branch Admin (Branch Manager), Super Admin, and HO Admin can delete orders
  const canDeleteOrder = currentUser?.role === 'Super Admin' || currentUser?.role === 'HO Admin' || currentUser?.role === 'Branch Manager';
  // Sales manager / executive can request to remove an order with a remark
  const canRequestRemoval = currentUser?.role === 'Sales Executive' || !canDeleteOrder;

  // Order Deletion Confirmation Modal State
  const [deleteTargetOrder, setDeleteTargetOrder] = useState<Quotation | null>(null);
  const [deleteRemark, setDeleteRemark] = useState('');
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [isApprovingRemoval, setIsApprovingRemoval] = useState(false);

  // Order Removal Request Modal State (Sales Executive / Manager)
  const [removalTargetOrder, setRemovalTargetOrder] = useState<Quotation | null>(null);
  const [removalRemark, setRemovalRemark] = useState('');
  const [isSubmittingRemoval, setIsSubmittingRemoval] = useState(false);
  const [removalError, setRemovalError] = useState('');

  // Rejection State
  const [isRejectingRemoval, setIsRejectingRemoval] = useState(false);

  // Branch access enforcement: Branch Admins only see and manage their branch's orders
  const effectiveBranchFilter = !isHO ? (activeBranch?.id || '') : branchFilter;

  // Branch-scoped base quotations dataset
  const branchScopedQuotations = quotations.filter(q => {
    if (isHO) return true;
    const bId = activeBranch?.id;
    const bCode = activeBranch?.code;
    const bName = activeBranch?.name;
    return (bId && q.branch_id === bId) || 
           (bCode && q.branch_code === bCode) ||
           (q.branch_name && bName && q.branch_name.toLowerCase().includes(bName.toLowerCase()));
  });

  // Filtered orders for table & grid view
  const filteredOrders = branchScopedQuotations.filter((q) => {
    const sTerm = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (q.quotation_number || '').toLowerCase().includes(sTerm) ||
      (q.customer_name || '').toLowerCase().includes(sTerm) ||
      (q.customer_phone || '').includes(searchTerm || '') ||
      (q.site_address && q.site_address.toLowerCase().includes(sTerm)) ||
      (q.deletion_reason && q.deletion_reason.toLowerCase().includes(sTerm)) ||
      (q.notes && q.notes.toLowerCase().includes(sTerm));

    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'REMOVAL_REQUESTED' ? !!q.deletion_requested :
      statusFilter === 'VALIDATED' ? (q.status === 'Validated Official' || q.status === 'Approved' || q.status === 'Verified Quote') :
      statusFilter === 'DRAFT' ? (q.status === 'Temporary Branch Draft' || q.status === 'Draft') :
      statusFilter === 'PENDING' ? (q.status === 'Pending HO Validation' || q.status === 'Pending Approval') :
      statusFilter === 'CANCELLED' ? (q.status === 'Cancelled' || q.status === 'Rejected' || q.status === 'Voided') : true;

    const matchesBranch = 
      effectiveBranchFilter === 'ALL' ? true :
      q.branch_id === effectiveBranchFilter || q.branch_code === effectiveBranchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  // Calculate Key Metrics scoped strictly to current branch for Branch Admins
  const totalOrders = branchScopedQuotations.length;
  const validatedOrdersCount = branchScopedQuotations.filter(q => q.status === 'Validated Official' || q.status === 'Approved' || q.status === 'Verified Quote').length;
  const pendingValidationCount = branchScopedQuotations.filter(q => q.status === 'Pending HO Validation' || q.status === 'Pending Approval').length;
  const draftOrdersCount = branchScopedQuotations.filter(q => q.status === 'Temporary Branch Draft' || q.status === 'Draft').length;
  const cancelledOrdersCount = branchScopedQuotations.filter(q => q.status === 'Cancelled' || q.status === 'Rejected' || q.status === 'Voided').length;
  const removalRequestsCount = branchScopedQuotations.filter(q => q.deletion_requested).length;
  const totalRevenueLKR = branchScopedQuotations.reduce((acc, q) => acc + (q.net_total || 0), 0);

  const handleConfirmDelete = async () => {
    if (!deleteTargetOrder || !onDeleteQuotation) return;
    setIsDeletingOrder(true);
    try {
      await onDeleteQuotation(deleteTargetOrder.id, deleteRemark);
      if (selectedOrder?.id === deleteTargetOrder.id) {
        setSelectedOrder(null);
      }
      setDeleteTargetOrder(null);
      setDeleteRemark('');
      setIsApprovingRemoval(false);
    } catch (err: any) {
      console.error('Failed to delete order:', err);
    } finally {
      setIsDeletingOrder(false);
    }
  };

  const handleConfirmRemovalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removalTargetOrder || !onRequestOrderRemoval) return;
    if (!removalRemark.trim()) {
      setRemovalError('Please provide a clear remark explaining why this order should be removed.');
      return;
    }
    setIsSubmittingRemoval(true);
    setRemovalError('');
    try {
      await onRequestOrderRemoval(removalTargetOrder.id, removalRemark.trim());
      if (selectedOrder?.id === removalTargetOrder.id) {
        setSelectedOrder({
          ...selectedOrder,
          deletion_requested: true,
          deletion_reason: removalRemark.trim(),
          deletion_requested_by: currentUser?.name || 'Sales Rep',
          deletion_requested_role: currentUser?.role || 'Sales Executive',
          deletion_requested_at: new Date().toISOString()
        });
      }
      setRemovalTargetOrder(null);
      setRemovalRemark('');
    } catch (err: any) {
      setRemovalError(err.message || 'Failed to submit removal request');
    } finally {
      setIsSubmittingRemoval(false);
    }
  };

  const handleRejectRemovalClick = async (order: Quotation) => {
    if (!onRejectOrderRemoval) return;
    if (!window.confirm(`Reject removal request for Order #${order.quotation_number} and keep it active in the database?`)) {
      return;
    }
    setIsRejectingRemoval(true);
    try {
      await onRejectOrderRemoval(order.id);
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({
          ...selectedOrder,
          deletion_requested: false,
          deletion_reason: undefined,
          deletion_requested_by: undefined,
          deletion_requested_role: undefined,
          deletion_requested_at: undefined
        });
      }
    } catch (err: any) {
      console.error('Failed to reject removal:', err);
      alert('Failed to reject removal request: ' + (err.message || 'Server error'));
    } finally {
      setIsRejectingRemoval(false);
    }
  };

  const handleValidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsValidating(true);
    try {
      await onValidateQuotation(selectedOrder.id, extRefInput, validationNotesInput);
      setSelectedOrder(prev => prev ? { 
        ...prev, 
        status: 'Validated Official', 
        validated_by: activeBranch.manager_name,
        validated_at: new Date().toISOString(),
        external_software_ref: extRefInput,
        validation_notes: validationNotesInput
      } : null);
      setExtRefInput('');
      setValidationNotesInput('');
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setIsValidating(false);
    }
  };

  // Export Orders & Quotations History to PDF Document
  const handleExportOrdersPDF = () => {
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : quotations;
    if (!ordersToExport || ordersToExport.length === 0) {
      alert('No order or quotation records available to export.');
      return;
    }
    generateAndDownloadQuotationsReportPDF(
      ordersToExport,
      undefined,
      'CENTRAL ORDERS & QUOTATIONS REGISTER',
      `Active Filter: ${statusFilter} • Branch: ${branchFilter} • ${ordersToExport.length} Records`
    );
  };

  // Export Orders & Quotations History to CSV Report
  const handleExportOrdersCSV = () => {
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : quotations;
    if (!ordersToExport || ordersToExport.length === 0) {
      alert('No order or quotation records available to export.');
      return;
    }

    const headers = [
      'Quotation / Order #',
      'Customer Name',
      'Customer Phone',
      'Branch Code',
      'Status',
      'Subtotal (LKR)',
      'Discount (LKR)',
      'Transport (LKR)',
      'Net Total (LKR)',
      'Site Address',
      'Created Date',
      'Validated By',
      'HO Ext Ref'
    ];

    const csvRows = [
      headers.join(','),
      ...ordersToExport.map(q => {
        const row = [
          `"${(q.quotation_number || '').replace(/"/g, '""')}"`,
          `"${(q.customer_name || '').replace(/"/g, '""')}"`,
          `"${(q.customer_phone || '').replace(/"/g, '""')}"`,
          `"${(q.branch_code || q.branch_id || '').replace(/"/g, '""')}"`,
          `"${(q.status || 'Draft').replace(/"/g, '""')}"`,
          q.subtotal || 0,
          q.discount_amount || 0,
          q.transport_cost || 0,
          q.net_total || 0,
          `"${(q.site_address || '').replace(/"/g, '""')}"`,
          `"${(q.created_at || '').replace(/"/g, '""')}"`,
          `"${(q.validated_by || '').replace(/"/g, '""')}"`,
          `"${(q.external_software_ref || '').replace(/"/g, '""')}"`
        ];
        return row.join(',');
      })
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Order_Quotation_History_${getSystemCurrentDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Share Quotation Summary via WhatsApp
  const handleShareOrdersWhatsApp = () => {
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : quotations;
    const totalVal = ordersToExport.reduce((acc, q) => acc + (q.net_total || 0), 0);
    const text = `*INNOVISTA ENTERPRISE - ORDERS & QUOTATIONS SUMMARY*\n` +
      `*Report Date:* ${formatSystemDateTime(new Date(), false)} [${getSystemTimezone()}]\n` +
      `*Total Orders/Quotes:* ${ordersToExport.length}\n` +
      `*Total Value:* Rs. ${totalVal.toLocaleString()}\n` +
      `*Status Filter:* ${statusFilter} | *Branch:* ${branchFilter}\n\n` +
      `*Recent Records:*\n` +
      ordersToExport.slice(0, 5).map(q => `• ${q.quotation_number}: ${q.customer_name} - Rs. ${(q.net_total || 0).toLocaleString()} (${q.status || 'Draft'})`).join('\n') +
      `\n\nGenerated from Innovista Enterprise ERP Order Management Hub.`;
    shareViaWhatsApp(text);
  };

  // Send Quotations Summary via Email / Mail Center
  const handleEmailOrdersSummary = () => {
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : quotations;
    const totalVal = ordersToExport.reduce((acc, q) => acc + (q.net_total || 0), 0);
    const subject = `INNOVISTA ERP: Central Orders & Quotations Summary (${ordersToExport.length} Records)`;
    window.dispatchEvent(new CustomEvent('innovista_open_gmail_modal', {
      detail: {
        to: currentUser?.email || 'admin@innovista.lk',
        subject,
        bodyHtml: `<div style="font-family: Arial, sans-serif;">
          <h2 style="color: #ea580c;">Innovista Central Orders & Quotations Summary</h2>
          <p><strong>Generated:</strong> ${formatSystemDateTime(new Date(), true)} (${getSystemTimezone()})</p>
          <p><strong>Total Quotation Records:</strong> ${ordersToExport.length}</p>
          <p><strong>Cumulative Total Value:</strong> Rs. ${totalVal.toLocaleString()}</p>
          <p><strong>Active Filter:</strong> Status: ${statusFilter}, Branch: ${branchFilter}</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px;">
            <thead>
              <tr style="background: #0f172a; color: white;">
                <th style="padding: 6px; text-align: left;">Quotation #</th>
                <th style="padding: 6px; text-align: left;">Customer</th>
                <th style="padding: 6px; text-align: center;">Status</th>
                <th style="padding: 6px; text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${ordersToExport.slice(0, 15).map(q => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px;"><strong>${q.quotation_number}</strong></td>
                  <td style="padding: 6px;">${q.customer_name}</td>
                  <td style="padding: 6px; text-align: center;">${q.status || 'Draft'}</td>
                  <td style="padding: 6px; text-align: right; font-weight: bold;">Rs. ${(q.net_total || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. PORTAL HEADER BANNER */}
      <div className="bg-white rounded-xl p-5 text-slate-900 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-orange-500 text-white p-1.5 rounded-md text-xs font-bold uppercase tracking-wider">
                Order Hub
              </span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                Central Order Management & Saved Quotes Portal
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Complete details, line-by-line material specifications, transport breakdowns & official HO validation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Export PDF Document */}
            <button
              onClick={handleExportOrdersPDF}
              className="bg-[#0F203C] hover:bg-[#1E3A63] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Export Current Quotation Data as PDF Document for Printing & Archiving"
            >
              <Printer className="w-4 h-4 text-[#FFC81E]" />
              <span>Export PDF</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportOrdersCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Export Order & Quotation History to CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleShareOrdersWhatsApp}
              className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Share Current Quotation Summary via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Email Summary */}
            <button
              onClick={handleEmailOrdersSummary}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Dispatch Orders Summary via Email"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>

            {onRefreshData && (
              <button
                onClick={onRefreshData}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Orders</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Saved Orders & Quotes
            </span>
            <strong className="text-xl font-black text-slate-900 font-mono">
              {totalOrders}
            </strong>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Validated Official Invoices
            </span>
            <strong className="text-xl font-black text-emerald-600 font-mono">
              {validatedOrdersCount}
            </strong>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending HO Validation
            </span>
            <strong className="text-xl font-black text-amber-600 font-mono">
              {pendingValidationCount}
            </strong>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Cumulative Registered Volume
            </span>
            <strong className="text-xl font-black text-orange-600 font-mono">
              Rs. {totalRevenueLKR.toLocaleString()}
            </strong>
          </div>
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, Phone, Address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 font-medium text-slate-800"
          />
        </div>

        {/* Filter Pills / Selects & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="ALL">All Statuses ({totalOrders})</option>
            {removalRequestsCount > 0 && (
              <option value="REMOVAL_REQUESTED" className="text-amber-700 font-bold">
                ⚠️ Removal Requested ({removalRequestsCount})
              </option>
            )}
            <option value="VALIDATED">Validated / Official ({validatedOrdersCount})</option>
            <option value="PENDING">Pending Validation ({pendingValidationCount})</option>
            <option value="DRAFT">Branch Drafts ({draftOrdersCount})</option>
            <option value="CANCELLED">Cancelled / Rejected ({cancelledOrdersCount})</option>
          </select>

          {/* Branch Select */}
          {isHO ? (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">All Branches ({quotations.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-bold shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>{activeBranch.name} ({activeBranch.code} Admin Only)</span>
            </div>
          )}

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportOrdersCSV}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
            title="Download CSV report of filtered orders"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">CSV Report</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                viewMode === 'GRID' ? 'bg-white text-orange-600 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-white text-orange-600 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Structured Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Removal Requests Notification Banner */}
      {removalRequestsCount > 0 && statusFilter !== 'REMOVAL_REQUESTED' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center space-x-2.5 text-xs text-amber-900 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <span>
              {removalRequestsCount} order removal request{removalRequestsCount > 1 ? 's' : ''} submitted with sales remarks awaiting administrative review.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('REMOVAL_REQUESTED')}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
          >
            Review Pending Requests ({removalRequestsCount})
          </button>
        </div>
      )}

      {/* 4. ORDERS GRID / TABLE */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">No Orders Found</h4>
          <p className="text-xs text-slate-400">
            No saved orders or quotes match your search filters.
          </p>
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'Pending HO Validation' || order.status === 'Pending Approval';

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between ${
                  order.deletion_requested ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-slate-200 hover:border-orange-500'
                }`}
              >
                {/* Header Header Bar */}
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-orange-400">
                      #{order.quotation_number}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {order.date}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {order.deletion_requested && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Removal Req</span>
                      </span>
                    )}
                    <QuotationStatusBadge status={order.status} isDark={true} />
                  </div>
                </div>

                {/* Removal Request Notification Banner on Card */}
                {order.deletion_requested && (
                  <div className="bg-amber-50 border-b border-amber-200 p-2.5 text-xs text-amber-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-black text-[11px] text-amber-950">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Removal Requested</span>
                      </div>
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                        By {order.deletion_requested_by || 'Sales Rep'}
                      </span>
                    </div>
                    {order.deletion_reason && (
                      <p className="mt-1 text-[11px] text-amber-800 italic bg-white/70 p-1.5 rounded border border-amber-200/60 font-medium">
                        "{order.deletion_reason}"
                      </p>
                    )}
                  </div>
                )}

                {/* Card Body */}
                <div className="p-3.5 space-y-3 grow">
                  {/* Customer Info */}
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="truncate">{order.customer_name}</span>
                    </h4>
                    {order.customer_phone && (
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{order.customer_phone}</span>
                      </p>
                    )}
                    {order.site_address && (
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{order.site_address}</span>
                      </p>
                    )}
                  </div>

                  {/* Branch & Created By */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{order.branch_name || 'Head Office'}</span>
                    </div>
                    {order.created_by && (
                      <span>Rep: <strong className="text-slate-700">{order.created_by}</strong></span>
                    )}
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Order Breakdown ({order.items.length} Line Items)
                    </span>
                    <div className="space-y-1 max-h-[85px] overflow-y-auto pr-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-[10px] flex items-center justify-between bg-white p-1 rounded border border-slate-100">
                          <span className="text-slate-800 font-semibold truncate max-w-[170px]">
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="font-mono text-slate-700">
                            Rs. {item.total_price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grand Net Total */}
                  <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-200 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-orange-800 uppercase tracking-wider block">
                        Net Total Amount
                      </span>
                      <span className="text-xs text-slate-500">
                        {order.transport_cost > 0 ? `+ Rs. ${order.transport_cost.toLocaleString()} Transport` : 'Includes Delivery'}
                      </span>
                    </div>
                    <strong className="text-base font-black text-orange-600 font-mono">
                      Rs. {order.net_total.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center space-x-1.5">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-1.5 px-2 rounded flex items-center justify-center space-x-1 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-orange-400" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => {
                      const orderBranch = branches.find(b => b.id === order.branch_id || b.code === order.branch_code) || activeBranch;
                      generateAndDownloadQuotationPDF(order, undefined, orderBranch);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-1.5 px-2 rounded flex items-center space-x-1 transition shadow-2xs cursor-pointer"
                    title="Export Quotation PDF Document"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => setPrintModalQuote(order)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-1.5 px-2 rounded flex items-center space-x-1 transition shadow-2xs cursor-pointer"
                    title="Trigger printer-friendly version of quotation using CSS media queries"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#FFC81E]" />
                    <span>Print</span>
                  </button>

                  {isHO && isPending && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-2 rounded flex items-center space-x-1 transition cursor-pointer"
                      title="Validate Official Invoice"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Validate</span>
                    </button>
                  )}

                  {/* Authorized Order Deletion Actions (Super Admin, HO Admin, Branch Admin) */}
                  {canDeleteOrder && (
                    order.deletion_requested ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setDeleteTargetOrder(order);
                            setDeleteRemark(order.deletion_reason || 'Approved sales removal request');
                            setIsApprovingRemoval(true);
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-1.5 px-2 rounded flex items-center space-x-1 transition shadow-2xs cursor-pointer"
                          title="Approve removal request and permanently delete this order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Approve Delete</span>
                        </button>
                        <button
                          onClick={() => handleRejectRemovalClick(order)}
                          disabled={isRejectingRemoval}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-1.5 px-2 rounded flex items-center space-x-1 transition cursor-pointer"
                          title="Reject removal request and keep order active"
                        >
                          <X className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setDeleteTargetOrder(order);
                          setDeleteRemark('');
                          setIsApprovingRemoval(false);
                        }}
                        className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 font-bold text-xs py-1.5 px-2 rounded flex items-center space-x-1 transition cursor-pointer"
                        title="Delete order permanently (Admin privilege)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Delete</span>
                      </button>
                    )
                  )}

                  {/* Sales Manager / Rep Removal Request Action */}
                  {canRequestRemoval && (
                    order.deletion_requested ? (
                      <span
                        className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1.5 rounded flex items-center space-x-1"
                        title={`Removal requested with remark: "${order.deletion_reason || ''}"`}
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Pending Removal</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setRemovalTargetOrder(order);
                          setRemovalRemark('');
                          setRemovalError('');
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold text-xs py-1.5 px-2 rounded flex items-center space-x-1 transition cursor-pointer"
                        title="Request order removal with remark"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span className="hidden sm:inline">Request Removal</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STRUCTURED TABLE LIST VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Order / Quote #</th>
                  <th className="p-3">Customer Details</th>
                  <th className="p-3">Site / Location</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3 text-center font-mono">Items</th>
                  <th className="p-3 text-right">Net Total Amount</th>
                  <th className="p-3 text-center">Status Indicator</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'Pending HO Validation' || order.status === 'Pending Approval';
                  const orderBranch = branches.find(b => b.id === order.branch_id || b.code === order.branch_code) || activeBranch;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono">
                        <span className="font-black text-slate-900 text-xs block">
                          #{order.quotation_number}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {order.date}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{order.customer_name}</div>
                        {order.customer_phone && (
                          <div className="text-[10px] text-slate-500 font-mono">📞 {order.customer_phone}</div>
                        )}
                      </td>

                      <td className="p-3 text-slate-600 max-w-[180px] truncate">
                        <div className="truncate font-medium">{order.site_address || 'Site Unspecified'}</div>
                        {order.site_location_name && (
                          <div className="text-[10px] text-slate-400">📍 {order.site_location_name}</div>
                        )}
                      </td>

                      <td className="p-3 text-slate-700">
                        <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                          {order.branch_name || 'Head Office'}
                        </span>
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {order.items?.length || 0} items
                      </td>

                      <td className="p-3 text-right font-mono font-black text-slate-900">
                        Rs. {(order.net_total || 0).toLocaleString()}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center space-y-1">
                          <QuotationStatusBadge status={order.status} isDark={false} />
                          {order.deletion_requested && (
                            <span 
                              className="inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300"
                              title={`Removal requested by ${order.deletion_requested_by || 'Sales Rep'}: "${order.deletion_reason || ''}"`}
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              <span>Removal Req</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded flex items-center space-x-1 cursor-pointer transition"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3 text-orange-400" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => generateAndDownloadQuotationPDF(order, undefined, orderBranch)}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-2 py-1 rounded cursor-pointer transition"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => setPrintModalQuote(order)}
                            className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-2 py-1 rounded cursor-pointer transition"
                            title="Print"
                          >
                            <Printer className="w-3 h-3 text-[#FFC81E]" />
                          </button>

                          {isHO && isPending && (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2 py-1 rounded flex items-center space-x-0.5 cursor-pointer transition"
                              title="Validate Invoice"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Validate</span>
                            </button>
                          )}

                          {/* Authorized Deletion Actions */}
                          {canDeleteOrder && (
                            order.deletion_requested ? (
                              <>
                                <button
                                  onClick={() => {
                                    setDeleteTargetOrder(order);
                                    setDeleteRemark(order.deletion_reason || 'Approved sales removal request');
                                    setIsApprovingRemoval(true);
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2 py-1 rounded flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                                  title="Approve removal request and delete order"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectRemovalClick(order)}
                                  disabled={isRejectingRemoval}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold px-1.5 py-1 rounded cursor-pointer transition"
                                  title="Reject removal request"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setDeleteTargetOrder(order);
                                  setDeleteRemark('');
                                  setIsApprovingRemoval(false);
                                }}
                                className="bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-[11px] font-bold px-1.5 py-1 rounded cursor-pointer transition"
                                title="Delete order permanently"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )
                          )}

                          {/* Sales Manager Request Removal */}
                          {canRequestRemoval && (
                            order.deletion_requested ? (
                              <span
                                className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-1 rounded flex items-center space-x-0.5"
                                title={`Removal pending: "${order.deletion_reason || ''}"`}
                              >
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setRemovalTargetOrder(order);
                                  setRemovalRemark('');
                                  setRemovalError('');
                                }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold px-2 py-1 rounded flex items-center space-x-1 cursor-pointer transition"
                                title="Request order removal with remark"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span className="hidden sm:inline">Req Removal</span>
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. FULL ORDER SPEC & RECEIPT MODAL */}
      {selectedOrder && (
        <div className={`fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center ${isOrderFullscreen ? 'p-0' : 'p-3 overflow-y-auto'}`}>
          <div className={`bg-white border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 ${
            isOrderFullscreen 
              ? 'w-screen h-screen max-w-none max-h-none rounded-none' 
              : 'rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh]'
          }`}>
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-black text-base tracking-tight flex items-center space-x-2">
                    <span>{selectedOrder.quotation_number}</span>
                    <span className="text-xs font-mono text-slate-400 font-normal">
                      ({selectedOrder.quotation_type || 'Official Order'})
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Created on {selectedOrder.date} • Branch: {selectedOrder.branch_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setIsOrderFullscreen(!isOrderFullscreen)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  title={isOrderFullscreen ? "Exit Fullscreen" : "View in Fullscreen Mode"}
                >
                  {isOrderFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-orange-400" /> : <Maximize2 className="w-3.5 h-3.5 text-orange-400" />}
                  <span>{isOrderFullscreen ? 'Exit' : 'Fullscreen'}</span>
                </button>

                <button
                  onClick={() => {
                    const orderBranch = branches.find(b => b.id === selectedOrder.branch_id || b.code === selectedOrder.branch_code) || activeBranch;
                    generateAndDownloadQuotationPDF(selectedOrder, undefined, orderBranch);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => setPrintModalQuote(selectedOrder)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  title="Trigger printer-friendly version of quotation using CSS media queries"
                >
                  <Printer className="w-3.5 h-3.5 text-[#FFC81E]" />
                  <span>Print</span>
                </button>

                <button
                  onClick={() => {
                    const text = `*INNOVISTA ENTERPRISE - OFFICIAL QUOTATION*\n` +
                      `*Quotation #:* ${selectedOrder.quotation_number}\n` +
                      `*Customer:* ${selectedOrder.customer_name}\n` +
                      `*Phone:* ${selectedOrder.customer_phone || 'N/A'}\n` +
                      `*Branch:* ${selectedOrder.branch_name || 'Head Office'}\n` +
                      `*Total Amount:* Rs. ${selectedOrder.net_total.toLocaleString()}\n` +
                      `*Status:* ${selectedOrder.status}\n\n` +
                      `Thank you for doing business with Innovista Enterprise.`;
                    shareViaWhatsApp(text, selectedOrder.customer_phone);
                  }}
                  className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                  title="Send Quotation to Customer via WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('innovista_open_gmail_modal', {
                      detail: {
                        to: selectedOrder.customer_phone?.includes('@') ? selectedOrder.customer_phone : '',
                        subject: `Innovista Enterprise Official Quotation: ${selectedOrder.quotation_number}`,
                        bodyHtml: `<p>Dear ${selectedOrder.customer_name},</p><p>Please find details for quotation <strong>${selectedOrder.quotation_number}</strong> with total amount of <strong>Rs. ${selectedOrder.net_total.toLocaleString()}</strong>.</p>`
                      }
                    }));
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  title="Dispatch Quotation to Customer via Email"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>

                <button
                  onClick={() => setShowPrintView(!showPrintView)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-orange-400" />
                  <span>{showPrintView ? 'Specs' : 'Invoice'}</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setIsOrderFullscreen(false);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto grow text-slate-800">
              {showPrintView ? (
                /* Print Invoice View */
                <div className="bg-white border-2 border-slate-800 p-6 rounded-lg space-y-4 font-sans text-xs">
                  <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">INNOVISTA ENTERPRISE</h2>
                      <p className="text-[10px] text-slate-600">Aluminium & Glass Systems • Head Office Central ERP</p>
                      <p className="text-[10px] text-slate-600">Colombo, Sri Lanka • Hotlines: +94 11 234 5678</p>
                    </div>
                    <div className="text-right flex flex-col items-end space-y-1">
                      <h3 className="text-lg font-black text-orange-600 uppercase">OFFICIAL INVOICE</h3>
                      <p className="font-mono text-xs font-bold">{selectedOrder.quotation_number}</p>
                      <p className="text-[10px] text-slate-500">Date: {selectedOrder.date}</p>
                      <div className="pt-1 flex items-center space-x-2">
                        <Barcode1D value={selectedOrder.barcode || selectedOrder.quotation_number} height={35} width={1.5} />
                        <div className="p-0.5 bg-white border border-slate-300 rounded">
                          <QRCodeSVG value={JSON.stringify({ order: selectedOrder.quotation_number, total: selectedOrder.net_total, customer: selectedOrder.customer_name })} size={40} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">CUSTOMER DETAILS</span>
                      <h4 className="font-bold text-slate-900 text-xs">{selectedOrder.customer_name}</h4>
                      <p className="text-[11px] text-slate-600">{selectedOrder.customer_phone}</p>
                      <p className="text-[11px] text-slate-600">{selectedOrder.site_address}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">BRANCH & VALIDATION</span>
                      <p className="font-semibold text-slate-800">{selectedOrder.branch_name}</p>
                      <p className="text-[10px] text-slate-600">Status: <strong>{selectedOrder.status}</strong></p>
                      {selectedOrder.external_software_ref && (
                        <p className="text-[10px] font-mono text-emerald-700 font-bold">Ref: {selectedOrder.external_software_ref}</p>
                      )}
                    </div>
                  </div>

                  {/* Print Table */}
                  <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                    <thead className="bg-slate-900 text-white uppercase text-[10px]">
                      <tr>
                        <th className="p-2 border border-slate-700">Item</th>
                        <th className="p-2 border border-slate-700 text-center">Unit</th>
                        <th className="p-2 border border-slate-700 text-center">Qty</th>
                        <th className="p-2 border border-slate-700 text-right">Unit Rate</th>
                        <th className="p-2 border border-slate-700 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 font-semibold">
                            {item.product_name} ({item.product_code})
                            {item.thickness_applied && <span className="text-[10px] text-slate-500 block">• Thickness: {item.thickness_applied}</span>}
                          </td>
                          <td className="p-2 text-center font-mono">{item.unit}</td>
                          <td className="p-2 text-center font-mono">{item.quantity}</td>
                          <td className="p-2 text-right font-mono">Rs. {item.unit_price.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono font-bold">Rs. {item.total_price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-2">
                    <div className="w-64 space-y-1 text-right font-mono text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Materials Subtotal:</span>
                        <span>Rs. {(selectedOrder.material_subtotal || selectedOrder.items.reduce((a,b)=>a+b.total_price,0)).toLocaleString()}</span>
                      </div>
                      {selectedOrder.transport_cost > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Transport Charge:</span>
                          <span>Rs. {selectedOrder.transport_cost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Special Discount:</span>
                          <span>- Rs. {selectedOrder.discount_amount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-400">
                        <span>GRAND TOTAL:</span>
                        <span>Rs. {selectedOrder.net_total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
                    Thank you for doing business with INNOVISTA. Authorized Signature: ______________________
                  </div>
                </div>
              ) : (
                /* Full Spec Details View */
                <div className="space-y-4">
                  {/* Pending Removal Request Alert Banner */}
                  {selectedOrder.deletion_requested && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-extrabold text-sm text-amber-950">
                                Order Removal Request Awaiting Approval
                              </h4>
                              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                Action Required
                              </span>
                            </div>
                            <p className="text-xs text-amber-800 mt-0.5">
                              Submitted by <strong className="text-slate-900 font-bold">{selectedOrder.deletion_requested_by || 'Sales Rep'}</strong> ({selectedOrder.deletion_requested_role || 'Sales Executive'})
                              {selectedOrder.deletion_requested_at && ` on ${new Date(selectedOrder.deletion_requested_at).toLocaleString()}`}
                            </p>
                            <div className="mt-2 p-2.5 bg-white border border-amber-200 rounded-lg text-xs text-slate-800">
                              <span className="font-bold text-amber-900 block mb-0.5">Sales Removal Remark / Reason:</span>
                              "{selectedOrder.deletion_reason || 'No specific remark recorded'}"
                            </div>
                          </div>
                        </div>
                      </div>

                      {canDeleteOrder && (
                        <div className="mt-3 pt-3 border-t border-amber-200 flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleRejectRemovalClick(selectedOrder)}
                            disabled={isRejectingRemoval}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline Request</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTargetOrder(selectedOrder);
                              setDeleteRemark(selectedOrder.deletion_reason || 'Approved sales removal request');
                              setIsApprovingRemoval(true);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Approve & Delete Order</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status & Barcode Header */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <QuotationStatusBadge status={selectedOrder.status} isDark={false} />
                      {selectedOrder.barcode && (
                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-300 font-bold">
                          {selectedOrder.barcode}
                        </span>
                      )}
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-600">
                      <span>Valid Until: <strong>{selectedOrder.valid_until || '30 Days'}</strong></span>
                    </div>
                  </div>

                  {/* Customer & Delivery Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Customer Account Details
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                        <User className="w-4 h-4 text-orange-600" />
                        <span>{selectedOrder.customer_name}</span>
                      </h4>
                      <p className="text-xs text-slate-600 flex items-center space-x-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedOrder.customer_phone || 'No Contact Phone'}</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Site & Delivery Address
                      </span>
                      <p className="text-xs text-slate-800 font-semibold flex items-start space-x-1.5">
                        <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        <span>{selectedOrder.site_address || 'Colombo Central Site'}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Location Zone: <strong>{selectedOrder.site_location_name || 'Colombo Region'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Line Items Specification Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1">
                      <Layers className="w-4 h-4 text-orange-500" />
                      <span>Item Specifications & Line Breakdown ({selectedOrder.items.length} items)</span>
                    </h4>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Product</th>
                            <th className="p-2.5">Tech Specs</th>
                            <th className="p-2.5 text-center">Unit & Qty</th>
                            <th className="p-2.5 text-right">Unit Rate</th>
                            <th className="p-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedOrder.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">{item.product_name}</div>
                                <span className="font-mono text-[10px] text-orange-600">{item.product_code}</span>
                              </td>
                              <td className="p-2.5 text-[10px] text-slate-600 space-y-0.5">
                                {item.thickness_applied && <div>Gauge: <strong>{item.thickness_applied}</strong></div>}
                                {item.finish_applied && <div>Finish: <strong>{item.finish_applied}</strong></div>}
                                {item.glass_type_applied && <div>Glass: <strong>{item.glass_type_applied}</strong></div>}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="p-2.5 text-right font-mono text-slate-700">
                                Rs. {item.unit_price.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                Rs. {item.total_price.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Summary Box */}
                  <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Materials Subtotal:</span>
                      <span>Rs. {(selectedOrder.material_subtotal || selectedOrder.items.reduce((a,b)=>a+b.total_price,0)).toLocaleString()}</span>
                    </div>

                    {selectedOrder.transport_cost > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Transport & Freight ({selectedOrder.site_location_name}):</span>
                        <span>+ Rs. {selectedOrder.transport_cost.toLocaleString()}</span>
                      </div>
                    )}

                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Special Customer Discount:</span>
                        <span>- Rs. {selectedOrder.discount_amount.toLocaleString()}</span>
                      </div>
                    )}

                    {selectedOrder.tax_amount > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>VAT ({selectedOrder.tax_pct || 18}%):</span>
                        <span>+ Rs. {selectedOrder.tax_amount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-black text-orange-400 pt-2 border-t border-slate-800">
                      <span>GRAND TOTAL NET AMOUNT:</span>
                      <span>Rs. {selectedOrder.net_total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* HO Validation Section */}
                  {isHO && selectedOrder.status !== 'Validated Official' && (
                    <form onSubmit={handleValidateSubmit} className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Head Office Validation & Registration Engine</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-emerald-800 uppercase block">
                            External ERP / SAP Reference #
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. SAP-2026-9901"
                            value={extRefInput}
                            onChange={(e) => setExtRefInput(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-emerald-300 rounded font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-emerald-800 uppercase block">
                            Validation Approval Notes
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Verified by Head Office Manager"
                            value={validationNotesInput}
                            onChange={(e) => setValidationNotesInput(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-emerald-300 rounded"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isValidating}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded shadow transition flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isValidating ? 'Validating...' : 'Approve & Issue Official Validated Invoice'}</span>
                      </button>
                    </form>
                  )}
                  {/* Order Deletion or Removal Request Actions in Detail View */}
                  <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Order Governance & Removal
                    </span>
                    <div className="flex items-center space-x-2">
                      {canDeleteOrder ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTargetOrder(selectedOrder);
                            setDeleteRemark(selectedOrder.deletion_reason || '');
                            setIsApprovingRemoval(!!selectedOrder.deletion_requested);
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete Order Permanently</span>
                        </button>
                      ) : canRequestRemoval ? (
                        selectedOrder.deletion_requested ? (
                          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Removal Request Submitted</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setRemovalTargetOrder(selectedOrder);
                              setRemovalRemark('');
                              setRemovalError('');
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Request Order Removal</span>
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sales Manager Request Removal Modal */}
      {removalTargetOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="font-black text-sm tracking-tight">Request Order Removal</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRemovalTargetOrder(null);
                  setRemovalRemark('');
                  setRemovalError('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRemovalRequest} className="p-5 space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-rose-950">
                    Order #{removalTargetOrder.quotation_number}
                  </span>
                  <span className="text-xs font-black text-rose-900 font-mono">
                    Rs. {removalTargetOrder.net_total.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-rose-800">
                  Customer: <strong>{removalTargetOrder.customer_name}</strong> • Branch: {removalTargetOrder.branch_name}
                </p>
                <p className="text-[11px] text-rose-700/90 pt-1 border-t border-rose-200">
                  ⚠️ Per company policy, only Branch Admin, Super Admin, and HO Admin have direct deletion rights. As a Sales Executive/Manager, you can submit this removal request along with a mandatory remark for administrative review.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Remark / Justification for Removal <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={removalRemark}
                  onChange={(e) => {
                    setRemovalRemark(e.target.value);
                    if (removalError) setRemovalError('');
                  }}
                  placeholder="e.g. Customer cancelled order due to site redesign; duplicate order created by error; wrong dimensions inputted..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white text-slate-900 transition"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  This remark will be permanently logged and displayed to the Branch Admin and Super Admin.
                </span>
              </div>

              {removalError && (
                <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-lg text-xs text-rose-800 font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{removalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRemovalTargetOrder(null);
                    setRemovalRemark('');
                    setRemovalError('');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRemoval || !removalRemark.trim()}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingRemoval ? 'Submitting...' : 'Submit Removal Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authorized Order Deletion Confirmation Modal */}
      {deleteTargetOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-rose-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="font-black text-sm tracking-tight">
                  {isApprovingRemoval ? 'Approve Removal & Delete Order' : 'Delete Order (Admin Authorized)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetOrder(null);
                  setDeleteRemark('');
                  setIsApprovingRemoval(false);
                }}
                className="text-rose-300 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-rose-950">
                    Order #{deleteTargetOrder.quotation_number}
                  </span>
                  <span className="text-xs font-black text-rose-900 font-mono">
                    Rs. {deleteTargetOrder.net_total.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-rose-800">
                  Customer: <strong>{deleteTargetOrder.customer_name}</strong> • Branch: {deleteTargetOrder.branch_name}
                </p>
                {deleteTargetOrder.deletion_requested && (
                  <div className="mt-2 p-2 bg-white rounded border border-rose-200 text-xs text-slate-800">
                    <span className="font-bold text-rose-900 block mb-0.5">Sales Removal Request:</span>
                    "{deleteTargetOrder.deletion_reason || 'No remark'}"
                    <span className="block text-[10px] text-slate-500 mt-1">
                      Submitted by: {deleteTargetOrder.deletion_requested_by || 'Sales Rep'} ({deleteTargetOrder.deletion_requested_role || 'Sales Executive'})
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-rose-700/90 pt-1.5 border-t border-rose-200 font-semibold">
                  ⚠️ This will permanently delete this order from the PostgreSQL database and active order register.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Admin Deletion Remark / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={deleteRemark}
                  onChange={(e) => setDeleteRemark(e.target.value)}
                  placeholder={isApprovingRemoval ? "Approved removal request from sales" : "e.g. Cancelled by branch manager"}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900 transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTargetOrder(null);
                    setDeleteRemark('');
                    setIsApprovingRemoval(false);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeletingOrder}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingOrder ? 'Deleting...' : 'Confirm & Delete Order'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {printModalQuote && (
        <PrintableQuotationModal
          quotation={printModalQuote}
          activeBranch={branches.find(b => b.id === printModalQuote.branch_id || b.code === printModalQuote.branch_code) || activeBranch}
          onClose={() => setPrintModalQuote(null)}
        />
      )}
    </div>
  );
};
