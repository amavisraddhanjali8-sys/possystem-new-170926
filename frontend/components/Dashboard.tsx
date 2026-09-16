import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  FileText, 
  Users, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Package, 
  Layers, 
  Download, 
  RefreshCw, 
  Calendar, 
  Filter, 
  Tag,
  ChevronRight,
  Printer,
  MapPin,
  Eye,
  Search,
  ArrowRight,
  ShieldCheck,
  User,
  History,
  Share2,
  Send,
  MessageSquare,
  Mail,
  FileSpreadsheet
} from 'lucide-react';
import { Product, Quotation, Branch, Customer, PriceHistory, SystemUser, DiscountApprovalRequest, RealTimeEvent } from '../../shared/types';
import { 
  generateAndDownloadQuotationPDF,
  generateAndDownloadQuotationsReportPDF,
  exportQuotationsToCSV,
  generateAuditReportPDF,
  exportAuditToCSV,
  shareViaWhatsApp
} from '../utils/pdfExportEngine';
import { PrintableQuotationModal } from './PrintableQuotationModal';
import { UpdateRecordDetailModal } from './UpdateRecordDetailModal';
import { ActivityFeed } from './ActivityFeed';
import { ALL_SRI_LANKA_REGIONS } from '../utils/sriLankaRegions';
import { 
  getSystemCurrentDateString, 
  formatSystemDate, 
  formatSystemDateTime, 
  getSystemTimezone 
} from '../utils/timezoneEngine';

interface DashboardProps {
  products: Product[];
  quotations: Quotation[];
  branches: Branch[];
  customers: Customer[];
  priceHistory?: PriceHistory[];
  activeBranch: Branch;
  currentUser?: SystemUser | null;
  discountRequests?: DiscountApprovalRequest[];
  events?: RealTimeEvent[];
  onNavigateToTab: (tabId: string) => void;
  onRefreshData?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  quotations,
  branches,
  customers,
  priceHistory = [],
  activeBranch,
  currentUser,
  discountRequests = [],
  events = [],
  onNavigateToTab,
  onRefreshData
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [printModalQuote, setPrintModalQuote] = useState<Quotation | null>(null);

  // States for Cross-Branch Daily Sales & Revenue Intelligence Widget
  const [dailySalesPeriod, setDailySalesPeriod] = useState<'today' | 'yesterday' | '7d' | 'all'>('today');
  const [customDailyDate, setCustomDailyDate] = useState<string>('');

  const todayStr = useMemo(() => getSystemCurrentDateString(), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatSystemDate(d, undefined, 'iso');
  }, []);

  // Filter quotations for daily sales calculation based on selected period
  const periodFilteredQuotations = useMemo(() => {
    if (customDailyDate) {
      return quotations.filter(q => q.date && q.date.startsWith(customDailyDate));
    }
    if (dailySalesPeriod === 'today') {
      const todayMatches = quotations.filter(q => q.date && q.date.startsWith(todayStr));
      return todayMatches;
    }
    if (dailySalesPeriod === 'yesterday') {
      return quotations.filter(q => q.date && q.date.startsWith(yesterdayStr));
    }
    if (dailySalesPeriod === '7d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      return quotations.filter(q => {
        if (!q.date) return false;
        const d = new Date(q.date);
        return !isNaN(d.getTime()) && d >= cutoff;
      });
    }
    return quotations;
  }, [quotations, dailySalesPeriod, customDailyDate, todayStr, yesterdayStr]);

  // Overall database totals across all branches
  const totalRevenueAllBranches = useMemo(() => {
    return quotations.reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);
  }, [quotations]);

  const totalValidatedRevenueAllBranches = useMemo(() => {
    return quotations.filter(q => {
      const s = (q.status || '').toLowerCase();
      return s.includes('validated') || s.includes('official') || s.includes('approved') || s.includes('verified');
    }).reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);
  }, [quotations]);

  // Period-specific sales totals across all branches
  const periodDailySalesTotal = useMemo(() => {
    return periodFilteredQuotations.reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);
  }, [periodFilteredQuotations]);

  const periodDailyConfirmedSalesTotal = useMemo(() => {
    return periodFilteredQuotations.filter(q => {
      const s = (q.status || '').toLowerCase();
      return s.includes('validated') || s.includes('official') || s.includes('approved') || s.includes('verified');
    }).reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);
  }, [periodFilteredQuotations]);

  // Per-branch daily sales and cumulative total revenue breakdown
  const branchDailySalesSummary = useMemo(() => {
    return branches.map(b => {
      const bAllQuotes = quotations.filter(q => 
        q.branch_id === b.id || 
        q.branch_code === b.code ||
        (q.branch_name && b?.name && q.branch_name.toLowerCase().includes(b.name.toLowerCase()))
      );
      const bTotalRevenue = bAllQuotes.reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);
      const bConfirmedAllRevenue = bAllQuotes.filter(q => {
        const s = (q.status || '').toLowerCase();
        return s.includes('validated') || s.includes('official') || s.includes('approved') || s.includes('verified');
      }).reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);

      const bDailyQuotes = periodFilteredQuotations.filter(q => 
        q.branch_id === b.id || 
        q.branch_code === b.code ||
        (q.branch_name && b?.name && q.branch_name.toLowerCase().includes(b.name.toLowerCase()))
      );
      const bDailySales = bDailyQuotes.reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);
      const bDailyConfirmed = bDailyQuotes.filter(q => {
        const s = (q.status || '').toLowerCase();
        return s.includes('validated') || s.includes('official') || s.includes('approved') || s.includes('verified');
      }).reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);

      const convRate = bAllQuotes.length > 0
        ? Math.round((bAllQuotes.filter(q => {
            const s = (q.status || '').toLowerCase();
            return s.includes('validated') || s.includes('official') || s.includes('approved');
          }).length / bAllQuotes.length) * 100)
        : 0;

      const shareOfTotal = totalRevenueAllBranches > 0 
        ? ((bTotalRevenue / totalRevenueAllBranches) * 100).toFixed(1)
        : '0.0';

      return {
        branch: b,
        name: b.name,
        code: b.code,
        status: b.status || 'Online',
        dailySales: bDailySales,
        dailyConfirmed: bDailyConfirmed,
        dailyQuoteCount: bDailyQuotes.length,
        totalQuotes: bAllQuotes.length,
        totalRevenue: bTotalRevenue,
        confirmedRevenue: bConfirmedAllRevenue,
        conversionRate: convRate,
        shareOfTotal
      };
    });
  }, [branches, quotations, periodFilteredQuotations, totalRevenueAllBranches]);

  // Top performing branch by revenue
  const topBranchByRevenue = useMemo(() => {
    if (branchDailySalesSummary.length === 0) return null;
    return [...branchDailySalesSummary].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  }, [branchDailySalesSummary]);

  const handleShareBranchSalesWhatsApp = () => {
    const periodLabel = customDailyDate ? `Date: ${customDailyDate}` : `Period: ${dailySalesPeriod.toUpperCase()}`;
    const text = `*INNOVISTA ERP - MULTI-BRANCH DAILY SALES & REVENUE SUMMARY*\n` +
      `*Report Date:* ${formatSystemDate(new Date())} [${getSystemTimezone()}]\n` +
      `*${periodLabel}*\n` +
      `*Daily Sales across All Branches:* Rs. ${periodDailySalesTotal.toLocaleString()} (${periodFilteredQuotations.length} quotes)\n` +
      `*Confirmed Daily Sales:* Rs. ${periodDailyConfirmedSalesTotal.toLocaleString()}\n` +
      `*Total Cumulative Pipeline Revenue:* Rs. ${totalRevenueAllBranches.toLocaleString()} (${quotations.length} total quotes)\n` +
      `*Confirmed Overall Revenue:* Rs. ${totalValidatedRevenueAllBranches.toLocaleString()}\n\n` +
      `*Branch Breakdown:*\n` +
      branchDailySalesSummary.map(b => `• ${b.name} (${b.code}): Daily: Rs. ${b.dailySales.toLocaleString()} (${b.dailyQuoteCount} quotes) | Total: Rs. ${b.totalRevenue.toLocaleString()} (${b.totalQuotes} orders)`).join('\n') +
      `\n\nGenerated from Innovista Enterprise ERP Database.`;
    shareViaWhatsApp(text);
  };

  const handleSendBranchSalesEmail = () => {
    const subject = `INNOVISTA ERP: Daily Sales & Multi-Branch Revenue Summary - ${formatSystemDate(new Date())}`;
    window.dispatchEvent(new CustomEvent('innovista_open_gmail_modal', {
      detail: {
        to: currentUser?.email || 'management@innovista.lk',
        subject,
        bodyHtml: `<div style="font-family: Arial, sans-serif; color: #0f172a;">
          <h2 style="color: #ea580c; margin-bottom: 4px;">Innovista Multi-Branch Daily Sales & Revenue Report</h2>
          <p style="color: #64748b; font-size: 12px; margin-top: 0;">Generated: ${formatSystemDateTime(new Date(), true)} (${getSystemTimezone()})</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 4px 0;"><strong>Selected Period Sales (All Branches):</strong> <span style="font-size: 15px; color: #ea580c; font-weight: bold;">Rs. ${periodDailySalesTotal.toLocaleString()}</span> (${periodFilteredQuotations.length} quotes)</p>
            <p style="margin: 4px 0;"><strong>Total Cumulative Database Revenue:</strong> <span style="font-size: 15px; color: #0f172a; font-weight: bold;">Rs. ${totalRevenueAllBranches.toLocaleString()}</span> (${quotations.length} total quotes)</p>
            <p style="margin: 4px 0;"><strong>Total Confirmed Revenue:</strong> <span style="font-size: 15px; color: #047857; font-weight: bold;">Rs. ${totalValidatedRevenueAllBranches.toLocaleString()}</span></p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #0f172a; color: white;">
                <th style="padding: 6px 8px; text-align: left;">Branch Node</th>
                <th style="padding: 6px 8px; text-align: center;">Code</th>
                <th style="padding: 6px 8px; text-align: right;">Daily Sales</th>
                <th style="padding: 6px 8px; text-align: right;">Total Revenue</th>
                <th style="padding: 6px 8px; text-align: center;">Orders</th>
                <th style="padding: 6px 8px; text-align: right;">Share</th>
              </tr>
            </thead>
            <tbody>
              ${branchDailySalesSummary.map(b => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 8px;"><strong>${b.name}</strong></td>
                  <td style="padding: 6px 8px; text-align: center;">${b.code}</td>
                  <td style="padding: 6px 8px; text-align: right; color: #ea580c; font-weight: bold;">Rs. ${b.dailySales.toLocaleString()}</td>
                  <td style="padding: 6px 8px; text-align: right; font-weight: bold;">Rs. ${b.totalRevenue.toLocaleString()}</td>
                  <td style="padding: 6px 8px; text-align: center;">${b.totalQuotes}</td>
                  <td style="padding: 6px 8px; text-align: right;">${b.shareOfTotal}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`
      }
    }));
  };

  // States for New Updates & Status Records Feed
  const [updateSearchQuery, setUpdateSearchQuery] = useState('');
  const [updateTypeFilter, setUpdateTypeFilter] = useState<string>('ALL');
  const [updateStatusFilter, setUpdateStatusFilter] = useState<string>('ALL');
  const [adminRegionFilter, setAdminRegionFilter] = useState<string>('ALL');
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<PriceHistory | null>(null);

  // Check if current logged-in account is an Admin (Super Admin / HO Admin) or Regional Branch user
  const isUserAdmin = useMemo(() => {
    if (!currentUser) {
      return activeBranch.code === 'HO' || activeBranch.id === 'b-ho';
    }
    return (
      (currentUser.role === 'Super Admin' || currentUser.role === 'HO Admin') &&
      (currentUser.branch_id === 'b-ho' || !currentUser.branch_id)
    );
  }, [currentUser, activeBranch]);

  // Active Region name for current user or branch
  const currentRegionName = useMemo(() => {
    if (activeBranch?.region && activeBranch.region !== 'Head Office') {
      return activeBranch.region;
    }
    if (currentUser?.branch_name && !currentUser.branch_name.includes('Head Office') && !currentUser.branch_name.includes('HO')) {
      return currentUser.branch_name;
    }
    return activeBranch?.region || activeBranch?.name || '';
  }, [activeBranch, currentUser]);

  // Regional filtering for Price History / System Updates
  // - Admin accounts can view ALL updates across all regions.
  // - Regional accounts can ONLY view updates for their specific region/branch or global/master updates.
  const regionScopedPriceHistory = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return [];

    if (isUserAdmin) {
      return priceHistory;
    }

    const branchCode = (activeBranch?.code || '').toLowerCase();
    const branchName = (activeBranch?.name || '').toLowerCase();
    const regionName = (currentRegionName || '').toLowerCase();

    return priceHistory.filter(rec => {
      const recRegion = (rec.region_affected || '').toLowerCase();
      const recBranch = (rec.branch_affected || '').toLowerCase();

      // Check if update is global / master
      const isGlobal = 
        !rec.region_affected || 
        rec.region_affected === 'All Regions' || 
        recRegion.includes('all region') ||
        recBranch.includes('all branch') || 
        recBranch.includes('master db') ||
        recRegion === 'head office';

      if (isGlobal) return true;

      // Check if update belongs to this specific region or branch
      const isMyRegion = regionName && recRegion.includes(regionName);
      const isMyBranch = (branchCode && recBranch.includes(branchCode)) || (branchName && recBranch.includes(branchName));

      return isMyRegion || isMyBranch;
    });
  }, [priceHistory, isUserAdmin, activeBranch, currentRegionName]);

  // Filtered List View items for Updates section
  const filteredUpdatesList = useMemo(() => {
    return regionScopedPriceHistory.filter(rec => {
      // Optional Admin region filter
      if (isUserAdmin && adminRegionFilter !== 'ALL') {
        const rLower = adminRegionFilter.toLowerCase();
        const matchRegion = (rec.region_affected || '').toLowerCase().includes(rLower) ||
                            (rec.branch_affected || '').toLowerCase().includes(rLower);
        const isGlobal = rec.region_affected === 'All Regions' || rec.branch_affected?.includes('All Branches');
        if (!matchRegion && !isGlobal) return false;
      }

      // Update Type filter
      if (updateTypeFilter !== 'ALL') {
        if (rec.update_type !== updateTypeFilter) return false;
      }

      // Status filter
      if (updateStatusFilter !== 'ALL') {
        const st = (rec.status || rec.new_status || 'Active').toLowerCase();
        if (st !== updateStatusFilter.toLowerCase()) return false;
      }

      // Search query filter
      if (updateSearchQuery.trim()) {
        const q = updateSearchQuery.toLowerCase();
        const codeMatch = (rec.product_code || '').toLowerCase().includes(q);
        const nameMatch = (rec.product_name || '').toLowerCase().includes(q);
        const userMatch = (rec.changed_by || '').toLowerCase().includes(q);
        const reasonMatch = (rec.reason || '').toLowerCase().includes(q);
        const branchMatch = (rec.branch_affected || '').toLowerCase().includes(q);
        const regionMatch = (rec.region_affected || '').toLowerCase().includes(q);
        return codeMatch || nameMatch || userMatch || reasonMatch || branchMatch || regionMatch;
      }

      return true;
    });
  }, [regionScopedPriceHistory, isUserAdmin, adminRegionFilter, updateTypeFilter, updateStatusFilter, updateSearchQuery]);

  // Helper to safely parse dates across different formats
  const getQuotationDateStr = (q: Quotation): string => {
    if (q.date) {
      if (q.date.includes('T')) return q.date.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(q.date)) return q.date;
      const d = new Date(q.date);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    if ((q as any).created_at) {
      const d = new Date((q as any).created_at);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    return '';
  };

  // Effective branch filter: Branch Admin is strictly restricted to activeBranch.id
  const effectiveBranchFilter = !isUserAdmin ? (activeBranch?.id || '') : (selectedBranchFilter || 'ALL');

  // Filter quotations by branch and time range
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      // 1. Branch match
      if (effectiveBranchFilter && effectiveBranchFilter !== 'ALL') {
        const matchesBranch = 
          q.branch_id === effectiveBranchFilter || 
          q.branch_code === effectiveBranchFilter ||
          (q.branch_name && q.branch_name.toLowerCase().includes(String(effectiveBranchFilter).toLowerCase()));
        if (!matchesBranch) return false;
      }

      // 2. Time range match
      if (timeRange !== 'all') {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        cutoff.setHours(0, 0, 0, 0);

        const dateStr = getQuotationDateStr(q);
        if (dateStr) {
          const qDate = new Date(dateStr);
          if (!isNaN(qDate.getTime()) && qDate < cutoff) {
            return false;
          }
        }
      }

      return true;
    });
  }, [quotations, effectiveBranchFilter, timeRange]);

  // 1. KPI Aggregates (Strictly from actual filtered quotations)
  const totalQuotationValue = useMemo(() => {
    return filteredQuotations.reduce((sum, q) => sum + (Number(q.net_total) || 0), 0);
  }, [filteredQuotations]);

  const validatedOrders = useMemo(() => {
    return filteredQuotations.filter(q => {
      const s = (q.status || '').toLowerCase();
      return s.includes('validated') || s.includes('official') || s.includes('approved') || s.includes('verified');
    });
  }, [filteredQuotations]);

  const validatedSalesTotal = useMemo(() => {
    return validatedOrders.reduce((sum, q) => sum + (Number(q.net_total) || 0), 0);
  }, [validatedOrders]);

  const draftQuotationsCount = useMemo(() => {
    return filteredQuotations.filter(q => {
      const s = (q.status || '').toLowerCase();
      return s.includes('draft') || s.includes('pending') || s.includes('review');
    }).length;
  }, [filteredQuotations]);

  const averageQuotationValue = useMemo(() => {
    if (filteredQuotations.length === 0) return 0;
    return Math.round(totalQuotationValue / filteredQuotations.length);
  }, [filteredQuotations, totalQuotationValue]);

  const conversionRate = useMemo(() => {
    if (filteredQuotations.length === 0) return 0;
    return Math.round((validatedOrders.length / filteredQuotations.length) * 100);
  }, [filteredQuotations, validatedOrders]);

  const distinctCategoriesCount = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Math.max(1, cats.size);
  }, [products]);

  // 2. Daily Sales & Quotation Revenue Trend (Strictly from actual quotations)
  const dailySalesData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 14 : timeRange === '90d' ? 30 : 14;
    const result: Array<{ date: string; sales: number; quotations: number; orders: number; fullDate: string }> = [];

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Match actual quotations created on this specific calendar date
      const matchingQuotes = filteredQuotations.filter(q => getQuotationDateStr(q) === dateStr);
      const quoteVal = matchingQuotes.reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);
      
      const validatedQuotes = matchingQuotes.filter(q => {
        const s = (q.status || '').toLowerCase();
        return s.includes('validated') || s.includes('official') || s.includes('approved') || s.includes('verified');
      });
      const salesVal = validatedQuotes.reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);

      result.push({
        date: displayDate,
        fullDate: dateStr,
        sales: salesVal,
        quotations: quoteVal,
        orders: validatedQuotes.length
      });
    }

    return result;
  }, [filteredQuotations, timeRange]);

  // 3. Top Selling Products & High-Volume SKUs (Strictly from actual quotation items)
  const topSellingProductsData = useMemo(() => {
    const counts: Record<string, { name: string; code: string; revenue: number; units: number; category: string; isCatalogOnly?: boolean }> = {};

    // Scan all items in actual filtered quotations
    filteredQuotations.forEach(q => {
      if (Array.isArray(q.items)) {
        q.items.forEach(it => {
          const code = it.product_code || (it as any).code || 'ITEM';
          if (!counts[code]) {
            const matchedProduct = products.find(p => p.product_code === code || p.id === (it as any).product_id);
            counts[code] = {
              name: it.product_name || matchedProduct?.product_name || code,
              code,
              revenue: 0,
              units: 0,
              category: it.category || matchedProduct?.category || 'Aluminium Profiles'
            };
          }
          counts[code].revenue += (Number(it.total_price) || 0);
          counts[code].units += (Number(it.quantity) || 1);
        });
      }
    });

    const itemsFromQuotes = Object.values(counts);

    // If quotation items exist, sort by actual revenue descending
    if (itemsFromQuotes.length > 0) {
      return itemsFromQuotes
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6);
    }

    // If no quotation items recorded yet, show actual products from catalog with 0 revenue / 0 units
    return products.slice(0, 6).map(p => ({
      name: p.product_name,
      code: p.product_code,
      revenue: 0,
      units: 0,
      category: p.category,
      isCatalogOnly: true
    }));
  }, [filteredQuotations, products]);

  // 4. Branch Network Performance Comparison (Strictly from actual branch quotations)
  const branchPerformanceData = useMemo(() => {
    return branches.map((b) => {
      const bQuotes = quotations.filter(q => 
        q.branch_id === b.id || 
        q.branch_code === b.code ||
        (q.branch_name && b?.name && q.branch_name.toLowerCase().includes(b.name.toLowerCase()))
      );
      const bTotalRev = bQuotes.reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);
      const bValidatedRev = bQuotes.filter(q => {
        const s = (q.status || '').toLowerCase();
        return s.includes('validated') || s.includes('official') || s.includes('approved') || s.includes('verified');
      }).reduce((acc, q) => acc + (Number(q.net_total) || 0), 0);

      return {
        name: b.name.replace(' Branch', '').replace(' Node', '').replace(' Admin Center', ''),
        code: b.code,
        revenue: bTotalRev,
        validatedRevenue: bValidatedRev,
        orders: bQuotes.length,
        margin: b.default_margin_pct || b.margin_pct || 15
      };
    });
  }, [branches, quotations]);

  // 5. Quotation Status Pipeline Distribution (Strictly from actual filtered quotations)
  const statusPipelineData = useMemo(() => {
    let validated = 0;
    let approved = 0;
    let pending = 0;
    let draft = 0;

    filteredQuotations.forEach(q => {
      const s = (q.status || '').toLowerCase();
      if (s.includes('validated') || s.includes('official') || s.includes('verified')) {
        validated++;
      } else if (s.includes('approved')) {
        approved++;
      } else if (s.includes('pending') || s.includes('review') || s.includes('awaiting')) {
        pending++;
      } else {
        draft++;
      }
    });

    const segments = [
      { name: 'Validated Orders', value: validated, color: '#0F203C' },
      { name: 'Approved Quotes', value: approved, color: '#E87F24' },
      { name: 'Pending Review', value: pending, color: '#FFC81E' },
      { name: 'Draft Quotations', value: draft, color: '#73A5CA' }
    ].filter(item => item.value > 0);

    if (segments.length === 0) {
      return [{ name: 'No Active Quotes', value: 1, color: '#E2E8F0', isEmpty: true }];
    }

    return segments;
  }, [filteredQuotations]);

  // 6. Category Revenue Contribution (Strictly from actual quotation items or catalog)
  const categoryContributionData = useMemo(() => {
    const cats: Record<string, number> = {};

    filteredQuotations.forEach(q => {
      if (Array.isArray(q.items)) {
        q.items.forEach(it => {
          let cat = it.category;
          if (!cat) {
            const matched = products.find(p => p.product_code === it.product_code || p.id === (it as any).product_id);
            cat = matched?.category || 'Aluminium Profiles';
          }
          cats[cat] = (cats[cat] || 0) + (Number(it.total_price) || 0);
        });
      }
      if (Number(q.fabrication_cost) > 0) {
        cats['Aluminium Fabrication'] = (cats['Aluminium Fabrication'] || 0) + Number(q.fabrication_cost);
      }
      if (Number(q.installation_cost) > 0) {
        cats['Installation & Labour'] = (cats['Installation & Labour'] || 0) + Number(q.installation_cost);
      }
      if (Number(q.transport_cost) > 0) {
        cats['Logistics & Transport'] = (cats['Logistics & Transport'] || 0) + Number(q.transport_cost);
      }
    });

    // If no quotation item category data exists, calculate from actual catalog products
    if (Object.keys(cats).length === 0) {
      products.forEach(p => {
        const cat = p.category || 'Aluminium Profiles';
        cats[cat] = (cats[cat] || 0) + (Number(p.current_price) || Number(p.base_price) || 10000);
      });
    }

    const colors = ['#E87F24', '#73A5CA', '#0F203C', '#FFC81E', '#D26E1A', '#5C8FB5', '#10B981', '#6366F1'];

    const entries = Object.entries(cats).filter(([_, val]) => val > 0);
    if (entries.length === 0) {
      return [{ name: 'No Category Data', value: 1, color: '#E2E8F0', isEmpty: true }];
    }

    return entries
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length]
      }));
  }, [filteredQuotations, products]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-[#0F203C]">
      {/* 1. TOP DASHBOARD CONTROL BAR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#FEFDDF] text-[#E87F24] border border-[#FFC81E]/40 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0F203C] flex items-center space-x-2">
                <span>Enterprise ERP Analytics & Operations Dashboard</span>
                <span className="text-[10px] font-bold bg-[#E87F24] text-white px-2 py-0.5 rounded uppercase tracking-wider">
                  Live Stream
                </span>
              </h2>
              <p className="text-xs text-[#0F203C]/70">
                High-level visibility into multi-branch quotation volume, revenue trends, top SKUs, and sales conversion rates.
              </p>
            </div>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter */}
          {isUserAdmin ? (
            <div className="flex items-center space-x-1.5 bg-[#FEFDDF]/60 border border-[#FFC81E]/40 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F203C]">
              <Building2 className="w-3.5 h-3.5 text-[#73A5CA]" />
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="bg-transparent text-[#0F203C] font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Branch Nodes (Central)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-900 shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>{activeBranch.name} ({activeBranch.code} Admin Only)</span>
            </div>
          )}

          {/* Time Range Selector */}
          <div className="flex items-center bg-[#FEFDDF] p-0.5 rounded-lg border border-[#FFC81E]/40 text-xs font-bold">
            {(['7d', '30d', '90d', 'all'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeRange === t 
                    ? 'bg-[#0F203C] text-white shadow-2xs' 
                    : 'text-[#0F203C]/70 hover:text-[#0F203C]'
                }`}
              >
                {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : t === '90d' ? 'Quarter' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F203C] rounded-lg transition"
              title="Refresh ERP Live Metrics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onNavigateToTab('order-management')}
            className="bg-[#E87F24] hover:bg-[#D26E1A] text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-xs flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-[#FFC81E]" />
            <span>View All Orders</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Quotation Pipeline */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-[#E87F24] transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F203C]/70">
              Total Quotation Pipeline
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FEFDDF] text-[#E87F24] border border-[#FFC81E]/40 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#0F203C] font-mono">
              Rs. {(totalQuotationValue ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-[#E87F24] font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% vs last month</span>
              <span className="text-slate-400 font-normal">({filteredQuotations.length} quotes)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Validated Orders Converted */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-[#0F203C] transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F203C]/70">
              Validated Orders Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#0F203C] text-[#FFC81E] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#0F203C] font-mono">
              Rs. {(validatedSalesTotal ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-[#0F203C] font-semibold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#E87F24]" />
              <span>{validatedOrders.length} Confirmed Orders</span>
              <span className="text-slate-400 font-normal">({conversionRate}% conv rate)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Master Products SKU Count */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-[#73A5CA] transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F203C]/70">
              Master Catalog SKUs
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FEFDDF] text-[#73A5CA] border border-[#73A5CA]/30 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#0F203C] font-mono">
              {products.length} Products
            </div>
            <div className="flex items-center space-x-1 text-xs text-[#73A5CA] font-semibold mt-1">
              <Layers className="w-3.5 h-3.5" />
              <span>{distinctCategoriesCount} Active Categories</span>
              <span className="text-slate-400 font-normal">({branches.length} Sync Nodes)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Registered Customer Accounts */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-[#FFC81E] transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F203C]/70">
              Customer Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FEFDDF] text-[#0F203C] border border-[#FFC81E] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#E87F24]" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#0F203C] font-mono">
              {customers.length} Clients
            </div>
            <div className="flex items-center space-x-1 text-xs text-[#E87F24] font-semibold mt-1">
              <Building2 className="w-3.5 h-3.5 text-[#73A5CA]" />
              <span>{customers.filter(c => c.customer_type === 'Commercial' || c.customer_type === 'Tier 1 Contractor').length || customers.length} Tiers</span>
              <span className="text-slate-400 font-normal">({draftQuotationsCount} active drafts)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 CROSS-BRANCH DAILY SALES & CUMULATIVE REVENUE INTELLIGENCE WIDGET */}
      <div className="bg-white border-2 border-[#0F203C]/15 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0F203C] text-[#FFC81E] flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5 text-[#FFC81E]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black text-[#0F203C] tracking-tight">
                    Cross-Branch Daily Sales & Revenue Intelligence
                  </h2>
                  <span className="bg-[#E87F24]/15 text-[#E87F24] border border-[#E87F24]/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Live Quotation DB
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Aggregated daily sales velocity and cumulative pipeline revenue across all active branch nodes.
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Date Period Selector & Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Filters */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => { setDailySalesPeriod('today'); setCustomDailyDate(''); }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  dailySalesPeriod === 'today' && !customDailyDate 
                    ? 'bg-[#0F203C] text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => { setDailySalesPeriod('yesterday'); setCustomDailyDate(''); }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  dailySalesPeriod === 'yesterday' && !customDailyDate 
                    ? 'bg-[#0F203C] text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => { setDailySalesPeriod('7d'); setCustomDailyDate(''); }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  dailySalesPeriod === '7d' && !customDailyDate 
                    ? 'bg-[#0F203C] text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => { setDailySalesPeriod('all'); setCustomDailyDate(''); }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  dailySalesPeriod === 'all' && !customDailyDate 
                    ? 'bg-[#0F203C] text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Records
              </button>
            </div>

            {/* Specific Date Picker */}
            <div className="relative">
              <input
                type="date"
                value={customDailyDate}
                onChange={(e) => setCustomDailyDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#E87F24]"
                title="Select specific date to inspect cross-branch sales"
              />
            </div>

            {/* PDF Export */}
            <button
              type="button"
              onClick={() => generateAndDownloadQuotationsReportPDF(
                periodFilteredQuotations.length > 0 ? periodFilteredQuotations : quotations,
                undefined,
                `MULTI-BRANCH SALES & REVENUE REPORT (${dailySalesPeriod.toUpperCase()})`,
                `Date: ${customDailyDate || (dailySalesPeriod === 'today' ? todayStr : dailySalesPeriod)} • Cross-Branch Network`
              )}
              className="bg-[#0F203C] hover:bg-[#1E3A63] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Export Current Quotation & Sales Data as Printable PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#FFC81E]" />
              <span>Export PDF</span>
            </button>

            {/* CSV Export */}
            <button
              type="button"
              onClick={() => exportQuotationsToCSV(
                periodFilteredQuotations.length > 0 ? periodFilteredQuotations : quotations,
                `Innovista_Branch_Sales_${dailySalesPeriod}_${new Date().toISOString().slice(0, 10)}.csv`
              )}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Export Current Quotation Data to CSV Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareBranchSalesWhatsApp}
              className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Share Branch Sales Summary via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Email Report */}
            <button
              type="button"
              onClick={handleSendBranchSalesEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Send Sales Report via Gmail Mail Center"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
          </div>
        </div>

        {/* Aggregated Revenue Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Daily Sales Aggregated */}
          <div className="bg-gradient-to-br from-[#FEFDDF]/70 to-[#FFF9E6] border border-[#FFC81E]/50 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E87F24]">
                {customDailyDate ? `Sales on ${customDailyDate}` : dailySalesPeriod === 'today' ? "Today's Daily Sales" : `${dailySalesPeriod.toUpperCase()} Sales`}
              </span>
              <span className="text-[10px] font-bold bg-[#E87F24] text-white px-1.5 py-0.5 rounded">
                {periodFilteredQuotations.length} quotes
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#0F203C] font-mono mt-1">
              Rs. {periodDailySalesTotal.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-between">
              <span>Confirmed: Rs. {periodDailyConfirmedSalesTotal.toLocaleString()}</span>
              <span className="text-[#E87F24] font-bold">
                {periodDailySalesTotal > 0 ? `${Math.round((periodDailyConfirmedSalesTotal / periodDailySalesTotal) * 100)}% validated` : '0%'}
              </span>
            </div>
          </div>

          {/* Cumulative Quotation Database Total Revenue */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F203C]/70">
                Total Revenue (All Branches)
              </span>
              <span className="text-[10px] font-bold bg-[#0F203C] text-[#FFC81E] px-1.5 py-0.5 rounded font-mono">
                {quotations.length} total quotes
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#0F203C] font-mono mt-1">
              Rs. {totalRevenueAllBranches.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Based on entire master quotation database
            </div>
          </div>

          {/* Confirmed / Validated Orders Revenue */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Validated Orders Revenue
              </span>
              <span className="text-[10px] font-bold bg-emerald-700 text-white px-1.5 py-0.5 rounded">
                Official
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono mt-1">
              Rs. {totalValidatedRevenueAllBranches.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1">
              {totalRevenueAllBranches > 0 ? `${Math.round((totalValidatedRevenueAllBranches / totalRevenueAllBranches) * 100)}% conversion from quotes` : '0%'}
            </div>
          </div>

          {/* Top Branch Node Highlight */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Top Branch Contributor
              </span>
              <span className="text-[10px] font-bold bg-[#73A5CA]/20 text-[#0F203C] px-1.5 py-0.5 rounded font-mono">
                {topBranchByRevenue?.code || 'HO'}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-[#0F203C] truncate mt-1">
              {topBranchByRevenue?.name || 'Colombo HO'}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1 flex items-center justify-between">
              <span className="text-[#E87F24] font-bold">Rs. {(topBranchByRevenue?.totalRevenue || 0).toLocaleString()}</span>
              <span>{topBranchByRevenue?.shareOfTotal || '0'}% network share</span>
            </div>
          </div>
        </div>

        {/* Multi-Branch Sales & Revenue Breakdown Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/90">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F203C] text-white">
              <tr>
                <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Branch Node</th>
                <th className="py-2.5 px-2.5 text-center font-bold uppercase tracking-wider text-[10px]">Status</th>
                <th className="py-2.5 px-3 text-center font-bold uppercase tracking-wider text-[10px]">
                  {customDailyDate ? 'Date Quotes' : dailySalesPeriod === 'today' ? "Today's Quotes" : `${dailySalesPeriod.toUpperCase()} Quotes`}
                </th>
                <th className="py-2.5 px-3 text-right font-bold uppercase tracking-wider text-[10px] text-[#FFC81E]">
                  {customDailyDate ? 'Date Sales (LKR)' : dailySalesPeriod === 'today' ? "Today's Sales (LKR)" : `${dailySalesPeriod.toUpperCase()} Sales (LKR)`}
                </th>
                <th className="py-2.5 px-3 text-center font-bold uppercase tracking-wider text-[10px]">Total Orders in DB</th>
                <th className="py-2.5 px-3.5 text-right font-bold uppercase tracking-wider text-[10px]">Total Revenue in DB (LKR)</th>
                <th className="py-2.5 px-3 text-right font-bold uppercase tracking-wider text-[10px]">Confirmed Revenue</th>
                <th className="py-2.5 px-3 text-center font-bold uppercase tracking-wider text-[10px]">Conversion</th>
                <th className="py-2.5 px-3 text-right font-bold uppercase tracking-wider text-[10px]">Network Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {branchDailySalesSummary.map((b) => (
                <tr key={b.code} className="hover:bg-slate-50/90 transition-colors">
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200 font-bold">
                        {b.code}
                      </span>
                      <span>{b.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'Online' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${b.status === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {b.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono font-bold text-slate-700">
                    {b.dailyQuoteCount}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-[#E87F24]">
                    Rs. {b.dailySales.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-slate-600">
                    {b.totalQuotes}
                  </td>
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono font-black text-[#0F203C]">
                    Rs. {b.totalRevenue.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono text-emerald-700 font-semibold">
                    Rs. {b.confirmedRevenue.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono font-bold">
                    <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                      {b.conversionRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-700">
                    <div className="flex items-center justify-end space-x-1.5">
                      <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-[#E87F24] h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(5, Number(b.shareOfTotal)))}%` }} 
                        />
                      </div>
                      <span className="text-[11px]">{b.shareOfTotal}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Grand Total Row */}
              <tr className="bg-[#FEFDDF]/60 font-bold border-t-2 border-slate-300">
                <td className="py-3 px-3.5 text-[#0F203C] uppercase text-[11px] font-black" colSpan={2}>
                  Network Total Aggregate
                </td>
                <td className="py-3 px-3 text-center font-mono font-black text-[#0F203C]">
                  {periodFilteredQuotations.length}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-[#E87F24]">
                  Rs. {periodDailySalesTotal.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-center font-mono font-black text-[#0F203C]">
                  {quotations.length}
                </td>
                <td className="py-3 px-3.5 text-right font-mono font-black text-[#0F203C]">
                  Rs. {totalRevenueAllBranches.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-emerald-800">
                  Rs. {totalValidatedRevenueAllBranches.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-center font-mono font-black text-[#0F203C]">
                  {quotations.length > 0 ? `${Math.round((quotations.filter(q => (q.status || '').includes('Validated') || (q.status || '').includes('Approved')).length / quotations.length) * 100)}%` : '0%'}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-[#0F203C]">
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. CHARTS GRID ROW 1: DAILY SALES TREND & TOP SELLING PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Daily Sales & Quotation Revenue Chart (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span>Daily Sales & Quotation Pipeline Trend</span>
              </h3>
              <p className="text-xs text-slate-500">
                Daily total sales (LKR) vs total quotation draft value across active branch network
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              LKR (Rs.)
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="quotationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E87F24" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#E87F24" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F203C" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0F203C" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#73A5CA" 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#73A5CA" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  formatter={(value: any) => [`Rs. ${(Number(value) || 0).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0F203C', borderColor: '#73A5CA', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area 
                  type="monotone" 
                  dataKey="quotations" 
                  name="Quotation Value" 
                  stroke="#E87F24" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#quotationGradient)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="Confirmed Sales" 
                  stroke="#0F203C" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#salesGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top-Selling Products Bar Chart (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F203C] flex items-center space-x-2">
                <Tag className="w-4 h-4 text-[#E87F24]" />
                <span>Top-Selling Products & SKUs</span>
              </h3>
              <p className="text-xs text-[#0F203C]/70">
                {topSellingProductsData.some(p => p.units > 0)
                  ? 'Highest revenue generating architectural sections'
                  : 'Master catalog catalog items (0 quotation line items logged)'}
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('master-prices')}
              className="text-[11px] font-bold text-[#E87F24] hover:text-[#D26E1A] flex items-center space-x-0.5"
            >
              <span>Catalog</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSellingProductsData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#73A5CA" 
                  fontSize={10}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                />
                <YAxis 
                  type="category" 
                  dataKey="code" 
                  stroke="#0F203C" 
                  fontSize={10} 
                  fontWeight={600}
                  tickLine={false} 
                  width={65}
                />
                <Tooltip 
                  formatter={(value: any, name: any, item: any) => [
                    item.payload.isCatalogOnly
                      ? `Catalog Item (0 sales logged)`
                      : `Rs. ${(Number(value) || 0).toLocaleString()} (${item.payload.units} units)`, 
                    item.payload.name
                  ]}
                  contentStyle={{ backgroundColor: '#0F203C', borderColor: '#73A5CA', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#E87F24" radius={[0, 4, 4, 0]}>
                  {topSellingProductsData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#E87F24' : index === 1 ? '#FFC81E' : index === 2 ? '#73A5CA' : '#0F203C'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. CHARTS GRID ROW 2: BRANCH PERFORMANCE & PIPELINE STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Branch Network Performance Comparison (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F203C] flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#E87F24]" />
                <span>Branch Network Performance Trends</span>
              </h3>
              <p className="text-xs text-[#0F203C]/70">
                Revenue generated & order volume across Colombo HO, Kandy, Galle, Jaffna, Negombo, Kurunegala
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('branch-network')}
              className="text-[11px] font-bold text-[#E87F24] hover:text-[#D26E1A] flex items-center space-x-0.5"
            >
              <span>Network Monitor</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchPerformanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#73A5CA" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#73A5CA" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  formatter={(value: any, name: any, item: any) => [
                    `Rs. ${(Number(value) || 0).toLocaleString()} (${item.payload.orders} orders, ${item.payload.margin}% margin)`,
                    'Revenue'
                  ]}
                  contentStyle={{ backgroundColor: '#0F203C', borderColor: '#73A5CA', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#73A5CA" radius={[4, 4, 0, 0]}>
                  {branchPerformanceData.map((entry, index) => (
                    <Cell 
                      key={`branch-${index}`} 
                      fill={entry.code === 'HO' ? '#0F203C' : entry.code === 'KDY' ? '#E87F24' : entry.code === 'GAL' ? '#FFC81E' : '#73A5CA'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quotation Status & Category Mix (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-orange-500" />
                <span>Quotation Status & Category Mix</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pipeline breakdown and architectural revenue distribution
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 h-72">
            {/* Status Pie Chart */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Order Pipeline
              </span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPipelineData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={58}
                      paddingAngle={3}
                    >
                      {statusPipelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any, entry: any) => (entry?.payload as any)?.isEmpty ? ['No active quotes', ''] : [`${val} quotes`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[9px] text-center font-bold text-slate-600 mt-1">
                {filteredQuotations.length > 0 
                  ? `${validatedOrders.length} Validated / ${filteredQuotations.length} Total`
                  : '0 Quotes in Pipeline'}
              </div>
            </div>

            {/* Category Revenue Pie Chart */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category Mix
              </span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryContributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={58}
                      paddingAngle={3}
                    >
                      {categoryContributionData.map((entry, index) => (
                        <Cell key={`cat-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any, entry: any) => (entry?.payload as any)?.isEmpty ? ['No transactions recorded', ''] : [`Rs. ${(Number(val) || 0).toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[9px] text-center font-bold text-slate-600 mt-1 truncate max-w-[170px]" title={categoryContributionData.filter(c => !(c as any).isEmpty).map(c => `${c.name}: Rs.${(c.value/1000).toFixed(0)}k`).join(' | ')}>
                {(() => {
                  const nonEmpties = categoryContributionData.filter(c => !(c as any).isEmpty);
                  const total = nonEmpties.reduce((s, x) => s + x.value, 0);
                  if (total === 0 || nonEmpties.length === 0) return '0 Transactions';
                  return nonEmpties.slice(0, 2).map(c => `${c.name.split(' ')[0]} ${Math.round((c.value / total) * 100)}%`).join(' | ');
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4.4 LIVE ACTIVITY FEED */}
      <ActivityFeed
        priceHistory={priceHistory}
        quotations={quotations}
        events={events}
        discountRequests={discountRequests}
        products={products}
        activeBranch={activeBranch}
        currentUser={currentUser}
        onSelectRecordDetail={(rec) => setSelectedRecordDetail(rec)}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 4.5 NEW SYSTEM UPDATES & RECORD STATUS AUDIT FEED (LIST VIEW) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <History className="w-4 h-4 text-orange-500" />
                <span>New System Updates & Status Records (List View)</span>
              </h3>
              <span className="bg-orange-100 text-orange-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                {filteredUpdatesList.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit feed of product price revisions, regional overrides, and record status field changes with date and time.
            </p>
          </div>

          {/* Actions & Scope Indicator */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => generateAuditReportPDF(
                filteredUpdatesList.length > 0 ? filteredUpdatesList : regionScopedPriceHistory,
                'INNOVISTA AUDIT & RECORD REVISIONS REPORT',
                `${isUserAdmin ? 'Enterprise Master Audit' : currentRegionName} • ${filteredUpdatesList.length} Records`
              )}
              className="bg-[#0F203C] hover:bg-[#1E3A63] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Generate Audit Report as PDF document for printing and professional record-keeping"
            >
              <Printer className="w-3.5 h-3.5 text-[#FFC81E]" />
              <span>Audit PDF</span>
            </button>

            <button
              type="button"
              onClick={() => exportAuditToCSV(
                filteredUpdatesList.length > 0 ? filteredUpdatesList : regionScopedPriceHistory,
                `Innovista_Audit_Records_${new Date().toISOString().slice(0, 10)}.csv`
              )}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Export Audit Records to CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Audit CSV</span>
            </button>

            {isUserAdmin ? (
              <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Super Admin</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentRegionName}</span>
              </span>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={updateSearchQuery}
              onChange={(e) => setUpdateSearchQuery(e.target.value)}
              placeholder="Search code, name, user, reason..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Update Type Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={updateTypeFilter}
              onChange={(e) => setUpdateTypeFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-medium"
            >
              <option value="ALL">All Update Types</option>
              <option value="REGIONAL_OVERRIDE">Regional Price Overrides</option>
              <option value="PRICE_CHANGE">Global Price Revisions</option>
              <option value="STATUS_CHANGE">Status Field Changes</option>
              <option value="MASTER_DATA">Master Specification Updates</option>
            </select>
          </div>

          {/* Status Field Filter */}
          <div className="flex items-center space-x-2">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={updateStatusFilter}
              onChange={(e) => setUpdateStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-medium"
            >
              <option value="ALL">All Status Fields</option>
              <option value="Active">Active</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Admin Region Dropdown or Regional Badge */}
          {isUserAdmin ? (
            <div className="flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={adminRegionFilter}
                onChange={(e) => setAdminRegionFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-medium"
              >
                <option value="ALL">All Regions Filter</option>
                <option value="Central Province">Central Province (Kandy)</option>
                <option value="Southern Province">Southern Province (Galle)</option>
                <option value="Western Province">Western Province (Colombo)</option>
                <option value="Northern Province">Northern Province (Jaffna)</option>
                <option value="Head Office">Head Office / Master DB</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 font-normal">Scoped Region:</span>
              <span className="text-indigo-700 font-bold">{currentRegionName}</span>
            </div>
          )}
        </div>

        {/* List View Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Product Code & Name</th>
                <th className="py-2.5 px-3">Update Type</th>
                <th className="py-2.5 px-3 text-center">Status Field</th>
                <th className="py-2.5 px-3 text-right">Updated Record Rates</th>
                <th className="py-2.5 px-3">Region / Branch Scope</th>
                <th className="py-2.5 px-3">Authorized By</th>
                <th className="py-2.5 px-3 text-center">Record Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUpdatesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-6 h-6 text-slate-400" />
                      <p className="font-semibold text-slate-700">No update records found for this regional scope or filter criteria.</p>
                      <p className="text-xs text-slate-400">Regional price changes are strictly partitioned to their respective regional accounts.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUpdatesList.map((rec) => {
                  const oldPriceVal = rec.old_price || 0;
                  const newPriceVal = rec.new_price || 0;
                  const priceDiff = newPriceVal - oldPriceVal;
                  const pct = oldPriceVal > 0 ? ((priceDiff / oldPriceVal) * 100).toFixed(1) : '0.0';
                  const recordStatus = rec.status || rec.new_status || 'Active';

                  return (
                    <tr 
                      key={rec.id} 
                      onClick={() => setSelectedRecordDetail(rec)}
                      className="hover:bg-orange-50/50 cursor-pointer transition group"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{rec.changed_date || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Product Code & Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-900 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {rec.product_code || 'SKU'}
                          </span>
                          <span className="font-bold text-slate-900 truncate max-w-[200px]" title={rec.product_name}>
                            {rec.product_name || 'Item'}
                          </span>
                        </div>
                      </td>

                      {/* Update Type Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                          rec.update_type === 'REGIONAL_OVERRIDE'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : rec.update_type === 'PRICE_CHANGE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : rec.update_type === 'STATUS_CHANGE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}>
                          <span>
                            {rec.update_type === 'REGIONAL_OVERRIDE' ? '📍 Regional Override' :
                             rec.update_type === 'PRICE_CHANGE' ? '⚡ Price Revision' :
                             rec.update_type === 'STATUS_CHANGE' ? '🏷️ Status Update' :
                             '🏢 Master Data'}
                          </span>
                        </span>
                      </td>

                      {/* Status Field */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          recordStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : recordStatus === 'Pending Approval'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {recordStatus}
                        </span>
                      </td>

                      {/* Old -> New Rate & Variance */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          Rs. {(oldPriceVal ?? 0).toLocaleString()} → <span className="text-orange-600">Rs. {(newPriceVal ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] font-bold">
                          {priceDiff > 0 ? (
                            <span className="text-emerald-600">+Rs. {(priceDiff ?? 0).toLocaleString()} (+{pct}%)</span>
                          ) : priceDiff < 0 ? (
                            <span className="text-rose-600">-Rs. {(Math.abs(priceDiff) ?? 0).toLocaleString()} ({pct}%)</span>
                          ) : (
                            <span className="text-slate-400">No Rate Delta</span>
                          )}
                        </div>
                      </td>

                      {/* Region & Branch Scope */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-slate-700 text-xs font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span>{rec.region_affected || rec.branch_affected || 'All Regions'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {rec.branch_affected}
                        </div>
                      </td>

                      {/* Authorized By */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-slate-800 text-xs font-semibold">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{rec.changed_by}</span>
                        </div>
                      </td>

                      {/* Record Detail Action Button */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRecordDetail(rec)}
                          className="bg-slate-900 hover:bg-orange-600 text-white px-2.5 py-1 rounded-md text-xs font-bold transition inline-flex items-center space-x-1 shadow-2xs cursor-pointer"
                          title="View complete updated record details, audit log & specifications"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. RECENT HIGH-VALUE ORDERS & RAPID ACTION HUB */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span>Recent High-Value Quotations & Direct PDF Export</span>
            </h3>
            <p className="text-xs text-slate-500">
              One-click instant PDF download and customer verification for recent job orders
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('order-management')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
          >
            Manage Central Order Hub &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Quote Ref</th>
                <th className="py-2.5 px-3">Customer & Location</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3 text-right">Net Grand Total</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Instant PDF Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredQuotations.slice(0, 5).map((q) => (
                <tr key={q.id} className="hover:bg-orange-50/40 transition">
                  <td className="py-2.5 px-3">
                    <strong className="font-mono text-orange-600 font-bold">{q.quotation_number}</strong>
                    <div className="text-[10px] text-slate-400 font-mono">{q.date}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{q.customer_name}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{q.site_address || 'Colombo Site'}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {q.branch_code || 'HO'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    Rs. {(q.net_total || 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      q.status === 'Validated Official' || q.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => generateAndDownloadQuotationPDF(q, undefined, branches.find(b => b.id === q.branch_id))}
                        className="bg-slate-900 hover:bg-orange-600 text-white px-2 py-1 rounded text-[11px] font-bold transition inline-flex items-center space-x-1 shadow-2xs cursor-pointer"
                        title="Download Official PDF Quotation"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => setPrintModalQuote(q)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[11px] font-bold transition inline-flex items-center space-x-1 shadow-2xs cursor-pointer"
                        title="Trigger printer-friendly version of quotation using CSS media queries"
                      >
                        <Printer className="w-3 h-3 text-[#FFC81E]" />
                        <span>Print</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {printModalQuote && (
        <PrintableQuotationModal
          quotation={printModalQuote}
          activeBranch={branches.find(b => b.id === printModalQuote.branch_id || b.code === printModalQuote.branch_code) || activeBranch}
          onClose={() => setPrintModalQuote(null)}
        />
      )}

      {selectedRecordDetail && (
        <UpdateRecordDetailModal
          record={selectedRecordDetail}
          product={products.find(p => p.id === selectedRecordDetail.product_id || p.product_code === selectedRecordDetail.product_code)}
          onClose={() => setSelectedRecordDetail(null)}
        />
      )}
    </div>
  );
};
