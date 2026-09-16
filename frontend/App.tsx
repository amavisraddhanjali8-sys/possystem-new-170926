import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { MasterPriceManagement } from './components/MasterPriceManagement';
import { PriceHistoryAudit } from './components/PriceHistoryAudit';
import { TransportCostEngine } from './components/TransportCostEngine';
import { BranchNetworkMonitor } from './components/BranchNetworkMonitor';
import { SettingsConfigManagement } from './components/SettingsConfigManagement';
import { OrderManagementPortal } from './components/OrderManagementPortal';
import { CustomerManagementPortal } from './components/CustomerManagementPortal';
import { RightBillingOrderPanel } from './components/RightBillingOrderPanel';
import { ProductImageLightboxModal } from './components/ProductImageLightboxModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { KeyboardShortcutCheatSheetModal } from './components/KeyboardShortcutCheatSheetModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { MfaSecurityModal } from './components/MfaSecurityModal';
import { UserProfileModal } from './components/UserProfileModal';
import { GmailMailCenterModal } from './components/GmailMailCenterModal';
import { LoginPage } from './components/LoginPage';
import { 
  notifyAccountLogin, 
  notifyAccountPasswordChanged, 
  notifyAccountMfaUpdated,
  notifyAdminPriceRevision,
  notifyAdminSecurityIncident
} from './services/notificationEmailService';
import { SystemUser } from '../shared/types';
import { INITIAL_USERS } from './data/initialData';
import { 
  Keyboard, 
  Command, 
  CheckCircle2,
  X,
  Info,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { 
  ShortcutSettingsMap, 
  matchesKeyboardEvent, 
  formatShortcutDisplay, 
  getSavedShortcutSettings, 
  isMasterShortcutsEnabled 
} from './utils/shortcutDefaults';
import { getSessionTimeoutMinutes } from './utils/sessionEngine';
import { isPortalAuthorized, getDefaultAuthorizedPortal } from './utils/portalAccess';


import { 
  fetchProducts, 
  updateProductPrice, 
  batchUpdateProductPrices,
  updateProductMasterData,
  addProduct, 
  proposePriceChange, 
  approvePriceChange, 
  fetchPriceHistory, 
  fetchBranches, 
  fetchVehicles, 
  updateVehicle, 
  fetchTransportRules, 
  updateTransportRules, 
  fetchLocations, 
  calculateTransport, 
  fetchQuotations, 
  createQuotation,
  validateQuotation, 
  updateQuotation,
  deleteQuotation,
  requestOrderRemoval,
  rejectOrderRemoval,
  fetchRecentEvents, 
  subscribeToRealTimeEvents,
  fetchBranchPrices,
  createBranchPriceOverride,
  deleteBranchPriceOverride,
  fetchCustomerPrices,
  createCustomerPriceOverride,
  deleteCustomerPriceOverride,
  fetchDiscountRequests,
  approveDiscountRequest,
  updateBranchMargin,
  deleteProduct,
  fetchCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  updateUser
} from './services/api';

import { 
  Product, 
  PriceHistory, 
  Branch, 
  Vehicle, 
  TransportRules, 
  SiteLocation, 
  Quotation, 
  RealTimeEvent,
  BranchPriceOverride,
  CustomerPriceOverride,
  DiscountApprovalRequest,
  QuotationItem,
  Customer
} from '../shared/types';
import { 
  INITIAL_BRANCHES, 
  INITIAL_PRODUCTS, 
  INITIAL_PRICE_HISTORY, 
  INITIAL_VEHICLES, 
  INITIAL_TRANSPORT_RULES, 
  INITIAL_LOCATIONS, 
  INITIAL_QUOTATIONS, 
  INITIAL_BRANCH_PRICES, 
  INITIAL_CUSTOMER_PRICES, 
  INITIAL_DISCOUNT_REQUESTS, 
  INITIAL_CUSTOMERS 
} from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('master-prices');
  const [activeBranch, setActiveBranch] = useState<Branch>(INITIAL_BRANCHES[0]); // Default Head Office Admin
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [history, setHistory] = useState<PriceHistory[]>(INITIAL_PRICE_HISTORY);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [rules, setRules] = useState<TransportRules>(INITIAL_TRANSPORT_RULES);
  const [locations, setLocations] = useState<SiteLocation[]>(INITIAL_LOCATIONS);
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [branchPrices, setBranchPrices] = useState<BranchPriceOverride[]>(INITIAL_BRANCH_PRICES);
  const [customerPrices, setCustomerPrices] = useState<CustomerPriceOverride[]>(INITIAL_CUSTOMER_PRICES);
  const [discountRequests, setDiscountRequests] = useState<DiscountApprovalRequest[]>(INITIAL_DISCOUNT_REQUESTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [pendingCartItem, setPendingCartItem] = useState<QuotationItem | null>(null);
  const [isBillingPanelOpen, setIsBillingPanelOpen] = useState<boolean>(true);
  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(false);
  const [shortcuts, setShortcuts] = useState<ShortcutSettingsMap>(getSavedShortcutSettings);
  const [shortcutToast, setShortcutToast] = useState<{ message: string; combo: string } | null>(null);

  const [globalToasts, setGlobalToasts] = useState<Array<{ id: string; message: string; type: string }>>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      if (e.detail?.message) {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newToast = { id, message: String(e.detail.message), type: e.detail.type || 'info' };
        setGlobalToasts(prev => [...prev.slice(-3), newToast]);
        setTimeout(() => {
          setGlobalToasts(prev => prev.filter(t => t.id !== id));
        }, 4200);
      }
    };
    window.addEventListener('innovista_toast', handleToast);
    return () => window.removeEventListener('innovista_toast', handleToast);
  }, []);

  const showShortcutToast = (message: string, combo: string) => {
    setShortcutToast({ message, combo });
    setTimeout(() => {
      setShortcutToast(prev => (prev?.message === message ? null : prev));
    }, 2800);
  };

  // Sync shortcuts on settings change
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail?.shortcuts) {
        setShortcuts(e.detail.shortcuts);
      } else {
        setShortcuts(getSavedShortcutSettings());
      }
    };
    window.addEventListener('innovista_shortcuts_changed', handleSync);
    return () => window.removeEventListener('innovista_shortcuts_changed', handleSync);
  }, []);

  // Global Keyboard Shortcuts Event Handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isMasterShortcutsEnabled()) return;
      const currentShortcuts = getSavedShortcutSettings();

      const target = e.target as HTMLElement | null;
      const isTyping = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isSearchInput = target && target.id === 'billing-quick-search-input';

      // 1. New Quotation (Ctrl + N)
      if (matchesKeyboardEvent(e, currentShortcuts.newQuotation)) {
        e.preventDefault();
        e.stopPropagation();
        setIsBillingPanelOpen(true);
        window.dispatchEvent(new CustomEvent('innovista_new_quotation'));
        showShortcutToast('New Quotation Initialized', formatShortcutDisplay(currentShortcuts.newQuotation));
        return;
      }

      // 2. Focus Product Scanner Search (Ctrl + S)
      if (matchesKeyboardEvent(e, currentShortcuts.focusSearch)) {
        e.preventDefault();
        e.stopPropagation();
        setIsBillingPanelOpen(true);
        window.dispatchEvent(new CustomEvent('innovista_focus_scanner_search'));
        showShortcutToast('Product Scanner & Search Focused', formatShortcutDisplay(currentShortcuts.focusSearch));
        return;
      }

      // 3. Toggle Order & Billing Panel (Alt + B)
      if (matchesKeyboardEvent(e, currentShortcuts.toggleBillingPanel)) {
        e.preventDefault();
        e.stopPropagation();
        setIsBillingPanelOpen(prev => !prev);
        showShortcutToast('Order & Billing Panel Toggled', formatShortcutDisplay(currentShortcuts.toggleBillingPanel));
        return;
      }

      // 4. Barcode Camera Scanner (Alt + X)
      if (matchesKeyboardEvent(e, currentShortcuts.openScanner)) {
        e.preventDefault();
        e.stopPropagation();
        setIsScannerOpen(true);
        showShortcutToast('Barcode Camera Scanner Activated', formatShortcutDisplay(currentShortcuts.openScanner));
        return;
      }

      // 5. Open Cheat Sheet (Shift + ? or ?)
      if (matchesKeyboardEvent(e, currentShortcuts.openCheatSheet) && !isTyping) {
        e.preventDefault();
        e.stopPropagation();
        setIsCheatSheetOpen(true);
        showShortcutToast('Keyboard Shortcuts Cheat Sheet', formatShortcutDisplay(currentShortcuts.openCheatSheet));
        return;
      }

      // 6. Navigation Shortcuts (Alt + 1, Alt + 2, Alt + 3, Alt + 4, Alt + 5)
      if (matchesKeyboardEvent(e, currentShortcuts.navMasterPrices)) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab('master-prices');
        showShortcutToast('Navigated to Master Prices / POS', formatShortcutDisplay(currentShortcuts.navMasterPrices));
        return;
      }

      if (matchesKeyboardEvent(e, currentShortcuts.navOrders)) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab('order-management');
        showShortcutToast('Navigated to Central Order Hub', formatShortcutDisplay(currentShortcuts.navOrders));
        return;
      }

      if (matchesKeyboardEvent(e, currentShortcuts.navCustomers)) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab('customer-portal');
        showShortcutToast('Navigated to Customer Portal', formatShortcutDisplay(currentShortcuts.navCustomers));
        return;
      }

      if (matchesKeyboardEvent(e, currentShortcuts.navTransport)) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab('transport-engine');
        showShortcutToast('Navigated to Transport Cost Engine', formatShortcutDisplay(currentShortcuts.navTransport));
        return;
      }

      if (matchesKeyboardEvent(e, currentShortcuts.navSettings)) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab('settings-config');
        showShortcutToast('Navigated to Settings & Config', formatShortcutDisplay(currentShortcuts.navSettings));
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
  }, []);

  // User Session Management: Always start signed out on system load/refresh
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState<number>(getSessionTimeoutMinutes);
  const lastActivityRef = useRef<number>(Date.now());

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isForcePasswordChange, setIsForcePasswordChange] = useState<boolean>(false);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState<boolean>(false);
  const [gmailModalParams, setGmailModalParams] = useState<{
    recipient?: string;
    subject?: string;
    body?: string;
  }>({});

  // Global listener for Gmail modal triggers (quotes, invoices, recovery, audit dockets)
  useEffect(() => {
    const handleOpenGmail = (e: any) => {
      const detail = e.detail || {};
      setGmailModalParams({
        recipient: detail.to || detail.recipient || '',
        subject: detail.subject || '',
        body: detail.bodyHtml || detail.bodyText || detail.body || ''
      });
      setIsGmailModalOpen(true);
    };
    window.addEventListener('innovista_open_gmail_modal', handleOpenGmail);
    return () => window.removeEventListener('innovista_open_gmail_modal', handleOpenGmail);
  }, []);

  // Synchronize session timeout when changed from Head Office Admin settings
  useEffect(() => {
    const handleTimeoutChange = (e: any) => {
      if (e.detail?.mins) {
        setSessionTimeoutMins(e.detail.mins);
      } else {
        setSessionTimeoutMins(getSessionTimeoutMinutes());
      }
    };
    window.addEventListener('innovista_session_timeout_changed', handleTimeoutChange);
    return () => window.removeEventListener('innovista_session_timeout_changed', handleTimeoutChange);
  }, []);

  // Track User Interaction Activity & Automatic Inactivity Session Termination
  useEffect(() => {
    if (!currentUser) return;

    // Reset last activity timestamp whenever user performs work or interacts
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetActivity, { passive: true }));

    // Reset reference timestamp on active session start
    lastActivityRef.current = Date.now();

    // Check inactivity every 5 seconds
    const checkInterval = setInterval(() => {
      const elapsedMs = Date.now() - lastActivityRef.current;
      const timeoutMs = sessionTimeoutMins * 60 * 1000;

      if (elapsedMs >= timeoutMs) {
        // Terminate inactive session
        setCurrentUser(null);
        try {
          localStorage.removeItem('innovista_logged_user');
        } catch (e) {
          console.error(e);
        }
        setSessionNotice(`Your login session was terminated automatically due to ${sessionTimeoutMins} minute${sessionTimeoutMins > 1 ? 's' : ''} of inactivity (no work detected). Please log in again.`);
      }
    }, 5000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, resetActivity));
      clearInterval(checkInterval);
    };
  }, [currentUser, sessionTimeoutMins]);

  // Guard activeTab to ensure unauthorized portals are strictly hidden/redirected for current account type
  useEffect(() => {
    if (currentUser && !isPortalAuthorized(activeTab, currentUser)) {
      setActiveTab(getDefaultAuthorizedPortal(currentUser));
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (currentUser?.mustChangePassword) {
      setIsChangePasswordOpen(true);
      setIsForcePasswordChange(true);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: SystemUser) => {
    setCurrentUser(user);
    setSessionNotice(null);
    lastActivityRef.current = Date.now();
    try {
      localStorage.setItem('innovista_logged_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    if (user.branch_id) {
      const userBranch = branches.find(b => b.id === user.branch_id || b.code === user.branch_id);
      if (userBranch) {
        setActiveBranch(userBranch);
      }
    }
    // Automatically dispatch account sign-in email notification & admin security alerts
    notifyAccountLogin(user, 'Standard Password Verification', user.branch_name || activeBranch?.name).catch(err => {
      console.warn('Could not dispatch login security notification email:', err);
    });

    // Route user to their authorized portal (e.g. POS for Sales Executive)
    if (!isPortalAuthorized(activeTab, user)) {
      setActiveTab(getDefaultAuthorizedPortal(user));
    }
    if (user.mustChangePassword) {
      setIsChangePasswordOpen(true);
      setIsForcePasswordChange(true);
    }
  };

  const handleUpdateUserMfa = (updatedUser: SystemUser) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('innovista_logged_user', JSON.stringify(updatedUser));
      updateUser(updatedUser.id, updatedUser).catch(err => console.error(err));
      notifyAccountMfaUpdated(updatedUser, updatedUser.mfaEnabled ? 'enabled' : 'disabled').catch(err => {
        console.warn('Could not dispatch MFA notification email:', err);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordChanged = (updatedUser: SystemUser) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('innovista_logged_user', JSON.stringify(updatedUser));
      notifyAccountPasswordChanged(updatedUser, false).catch(err => {
        console.warn('Could not dispatch password change notification email:', err);
      });
    } catch (e) {
      console.error(e);
    }
    setIsChangePasswordOpen(false);
    setIsForcePasswordChange(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSessionNotice(null);
    try {
      localStorage.removeItem('innovista_logged_user');
    } catch (e) {
      console.error(e);
    }
  };

  // Barcode scan handler for products
  const handleProductScanned = (p: Product) => {
    const itemPrice = p.current_price || p.base_price || 0;
    const item: QuotationItem = {
      id: `qi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      product_id: p.id,
      product_code: p.product_code,
      product_name: p.product_name,
      unit: p.unit,
      unit_price: itemPrice,
      quantity: 1,
      weight_kg: p.unit_weight_kg || 0,
      total_price: itemPrice,
      price_source_label: 'BARCODE SCANNER'
    };
    setPendingCartItem(item);
    setIsBillingPanelOpen(true);
  };

  // Barcode scan handler for quotations/orders
  const handleQuotationScanned = (q: Quotation) => {
    setActiveTab('order-management');
  };


  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [syncMode, setSyncMode] = useState<'REALTIME' | 'POLLING_5MIN'>('REALTIME');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load initial backend state with resilient Promise.allSettled
  const loadInitialData = async () => {
    try {
      const results = await Promise.allSettled([
        fetchProducts(),
        fetchPriceHistory(),
        fetchBranches(),
        fetchVehicles(),
        fetchTransportRules(),
        fetchLocations(),
        fetchQuotations(),
        fetchRecentEvents(),
        fetchBranchPrices(),
        fetchCustomerPrices(),
        fetchDiscountRequests(),
        fetchCustomers()
      ]);

      const [
        prodsRes, 
        histRes, 
        branchRes, 
        vehRes, 
        rulesRes, 
        locsRes, 
        quotesRes, 
        evtsRes,
        bpRes,
        cpRes,
        drRes,
        custRes
      ] = results;

      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value) && prodsRes.value.length > 0) {
        setProducts(prodsRes.value);
      }
      if (histRes.status === 'fulfilled' && Array.isArray(histRes.value)) {
        setHistory(histRes.value);
      }
      if (branchRes.status === 'fulfilled' && Array.isArray(branchRes.value) && branchRes.value.length > 0) {
        setBranches(branchRes.value);
      }
      if (vehRes.status === 'fulfilled' && Array.isArray(vehRes.value) && vehRes.value.length > 0) {
        setVehicles(vehRes.value);
      }
      if (rulesRes.status === 'fulfilled' && rulesRes.value) {
        setRules(rulesRes.value);
      }
      if (locsRes.status === 'fulfilled' && Array.isArray(locsRes.value) && locsRes.value.length > 0) {
        setLocations(locsRes.value);
      }
      if (quotesRes.status === 'fulfilled' && Array.isArray(quotesRes.value) && quotesRes.value.length > 0) {
        setQuotations(quotesRes.value);
      }
      if (evtsRes.status === 'fulfilled' && Array.isArray(evtsRes.value)) {
        setEvents(evtsRes.value);
      }
      if (bpRes.status === 'fulfilled' && Array.isArray(bpRes.value)) {
        setBranchPrices(bpRes.value);
      }
      if (cpRes.status === 'fulfilled' && Array.isArray(cpRes.value)) {
        setCustomerPrices(cpRes.value);
      }
      if (drRes.status === 'fulfilled' && Array.isArray(drRes.value)) {
        setDiscountRequests(drRes.value);
      }
      if (custRes.status === 'fulfilled' && Array.isArray(custRes.value) && custRes.value.length > 0) {
        setCustomers(custRes.value);
      }
    } catch (e) {
      console.warn('Data sync note (fallback to local state):', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Subscribe to Real-Time SSE Stream for Instant Push Updates across all browsers
  useEffect(() => {
    const unsubscribe = subscribeToRealTimeEvents((evt) => {
      setEvents((prev) => [evt, ...prev.slice(0, 49)]);
      setUnreadCount((c) => c + 1);

      // Automatically re-sync all database state on any real-time backend update event
      loadInitialData();
    });

    // Periodic auto-sync interval (every 12s) as fail-safe across network switches
    const pollInterval = setInterval(() => {
      loadInitialData();
    }, 12000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // Handlers
  const getActorName = () => {
    if (currentUser) {
      return `${currentUser.name}${currentUser.employee_id ? ` (${currentUser.employee_id})` : ''}`;
    }
    return activeBranch.manager_name || 'HO Master Admin';
  };

  const handleUpdatePrice = async (id: string, newPrice: number, reason: string, effectiveDate?: string) => {
    const res = await updateProductPrice(id, newPrice, getActorName(), reason, effectiveDate, currentUser?.role, activeBranch.name);
    setProducts((prev) => prev.map((p) => (p.id === id ? res.product : p)));
    setHistory((prev) => [res.history, ...prev]);
  };

  const handleBatchMarginUpdate = async (
    items: Array<{ id: string; new_price: number; old_price: number }>,
    reason: string,
    effectiveDate?: string,
    category?: string,
    supplier?: string
  ) => {
    try {
      const res = await batchUpdateProductPrices(
        items,
        getActorName(),
        reason,
        effectiveDate,
        category,
        supplier
      );
      const updatedMap = new Map(res.products.map(p => [p.id, p]));
      setProducts(prev => prev.map(p => updatedMap.get(p.id) || p));
      if (res.history && res.history.length > 0) {
        setHistory(prev => [...res.history, ...prev]);
      }
      // Dispatch admin email alert for master catalog price revision
      notifyAdminPriceRevision({
        operatorName: getActorName(),
        operatorRole: currentUser?.role || 'Head Office Administrator',
        revisionType: 'Bulk Price Revision / Margin Re-indexing',
        value: `${items.length} Products`,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        category: category || 'Master Catalog',
        reason: reason || 'Routine Catalog Price Adjustment',
        affectedCount: items.length
      }).catch(e => console.warn(e));
    } catch (err) {
      console.error('Batch margin update fallback:', err);
      setProducts(prev => prev.map(p => {
        const item = items.find(it => it.id === p.id);
        if (item) {
          return {
            ...p,
            old_price: item.old_price,
            current_price: item.new_price,
            effective_date: effectiveDate || new Date().toISOString().split('T')[0],
            last_updated: new Date().toLocaleString(),
            updated_by: getActorName()
          };
        }
        return p;
      }));
    }
  };

  const handleUpdateProductData = async (id: string, productData: Partial<Product> & { reason?: string; effectiveDate?: string }) => {
    const res = await updateProductMasterData(id, { ...productData, updated_by: getActorName() });
    setProducts((prev) => prev.map((p) => (p.id === id ? res.product : p)));
    if (res.history) {
      setHistory((prev) => [res.history!, ...prev]);
    }
  };

  const handleProposePrice = async (id: string, proposedPrice: number, reason: string) => {
    const res = await proposePriceChange(id, proposedPrice, `${activeBranch.name} (${getActorName()})`, reason);
    setProducts((prev) => prev.map((p) => (p.id === id ? res : p)));
  };

  const handleApprovePrice = async (id: string, approved: boolean) => {
    const res = await approvePriceChange(id, approved, getActorName());
    setProducts((prev) => prev.map((p) => (p.id === id ? res : p)));
    fetchPriceHistory().then(setHistory);
  };

  const handleAddProduct = async (p: Partial<Product>) => {
    const res = await addProduct(p);
    setProducts((prev) => [res, ...prev]);
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteProduct(id);
    } catch (err) {
      console.warn('Backend warning on product deletion:', err);
    }
  };

  const handleProceedToQuotation = (item: QuotationItem) => {
    setPendingCartItem(item);
    setIsBillingPanelOpen(true);
  };


  const handleCreateBranchOverride = async (override: Partial<BranchPriceOverride>) => {
    const res = await createBranchPriceOverride(override);
    fetchBranchPrices().then(setBranchPrices);
  };

  const handleDeleteBranchOverride = async (id: string) => {
    setBranchPrices((prev) => prev.filter(bp => bp.id !== id));
    try {
      await deleteBranchPriceOverride(id);
    } catch (err) {
      console.warn('Backend warning on branch override deletion:', err);
    }
  };

  const handleCreateCustomerOverride = async (rule: Partial<CustomerPriceOverride>) => {
    const res = await createCustomerPriceOverride(rule);
    fetchCustomerPrices().then(setCustomerPrices);
  };

  const handleDeleteCustomerOverride = async (id: string) => {
    setCustomerPrices((prev) => prev.filter(cp => cp.id !== id));
    try {
      await deleteCustomerPriceOverride(id);
    } catch (err) {
      console.warn('Backend warning on customer override deletion:', err);
    }
  };

  const handleApproveDiscountRequest = async (id: string, approved: boolean, notes?: string) => {
    const res = await approveDiscountRequest(id, approved, activeBranch.manager_name, notes);
    setDiscountRequests((prev) => prev.map(d => d.id === id ? res : d));
    fetchQuotations().then(setQuotations);
  };

  const handleUpdateBranchMargin = async (branchId: string, marginPct: number) => {
    const res = await updateBranchMargin(branchId, marginPct);
    setBranches((prev) => prev.map(b => b.id === branchId ? res : b));
  };

  const handleUpdateVehicle = async (id: string, data: Partial<Vehicle>) => {
    const res = await updateVehicle(id, data);
    setVehicles((prev) => prev.map((v) => (v.id === id ? res : v)));
  };

  const handleUpdateRules = async (r: Partial<TransportRules>) => {
    const res = await updateTransportRules(r);
    setRules(res);
  };

  const handleAddCustomer = async (cust: Partial<Customer>) => {
    const res = await addCustomer(cust);
    setCustomers((prev) => [res, ...prev]);
    return res;
  };

  const handleUpdateCustomer = async (id: string, cust: Partial<Customer>) => {
    const res = await updateCustomer(id, cust);
    setCustomers((prev) => prev.map((c) => (c.id === id ? res : c)));
    return res;
  };

  const handleDeleteCustomer = async (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteCustomer(id);
    } catch (err) {
      console.warn('Backend warning on customer deletion:', err);
    }
  };

  const handleCreateQuotation = async (q: Partial<Quotation>) => {
    const payload = {
      ...q,
      created_by: getActorName(),
      actor_name: getActorName(),
      role: currentUser?.role || 'Sales Executive',
      created_by_role: currentUser?.role || 'Sales Executive'
    };
    const res = await createQuotation(payload);
    setQuotations((prev) => [res, ...prev]);
    try {
      const freshHistory = await fetchPriceHistory(currentUser?.role);
      if (Array.isArray(freshHistory)) {
        setHistory(freshHistory);
      }
    } catch (e) {
      console.warn('Audit history refresh note:', e);
    }
    return res;
  };

  const handleValidateQuotation = async (id: string, extRef?: string, notes?: string) => {
    const res = await validateQuotation(id, getActorName(), extRef, notes);
    setQuotations((prev) => prev.map(q => q.id === id || q.quotation_number === id ? res : q));
    try {
      const freshHistory = await fetchPriceHistory(currentUser?.role);
      if (Array.isArray(freshHistory)) {
        setHistory(freshHistory);
      }
    } catch (e) {}
  };

  const handleDeleteQuotation = async (id: string, remark?: string) => {
    try {
      await deleteQuotation(id, getActorName(), currentUser?.role, remark);
      setQuotations(prev => prev.filter(q => q.id !== id && q.quotation_number !== id));
      try {
        const freshHistory = await fetchPriceHistory(currentUser?.role);
        if (Array.isArray(freshHistory)) {
          setHistory(freshHistory);
        }
      } catch (e) {}
    } catch (err: any) {
      console.error('Failed to delete quotation:', err);
      alert('Failed to delete quotation: ' + (err.message || 'Server error'));
      throw err;
    }
  };

  const handleRequestOrderRemoval = async (id: string, reason: string) => {
    try {
      const updated = await requestOrderRemoval(id, reason, getActorName(), currentUser?.role || 'Sales Executive');
      setQuotations(prev => prev.map(q => q.id === id || q.quotation_number === id ? updated : q));
      try {
        const freshHistory = await fetchPriceHistory(currentUser?.role);
        if (Array.isArray(freshHistory)) {
          setHistory(freshHistory);
        }
      } catch (e) {}
    } catch (err: any) {
      console.error('Failed to submit removal request:', err);
      alert('Failed to submit removal request: ' + (err.message || 'Server error'));
      throw err;
    }
  };

  const handleRejectOrderRemoval = async (id: string) => {
    try {
      const updated = await rejectOrderRemoval(id, getActorName(), currentUser?.role);
      setQuotations(prev => prev.map(q => q.id === id || q.quotation_number === id ? updated : q));
      try {
        const freshHistory = await fetchPriceHistory(currentUser?.role);
        if (Array.isArray(freshHistory)) {
          setHistory(freshHistory);
        }
      } catch (e) {}
    } catch (err: any) {
      console.error('Failed to reject removal request:', err);
      alert('Failed to reject removal request: ' + (err.message || 'Server error'));
      throw err;
    }
  };

  const handleUpdateQuotation = async (updatedQuote: Quotation) => {
    setQuotations((prev) => prev.map(q => q.id === updatedQuote.id || q.quotation_number === updatedQuote.quotation_number ? updatedQuote : q));
    try {
      await updateQuotation(updatedQuote.id, {
        ...updatedQuote,
        actor_name: getActorName(),
        role: currentUser?.role || 'Branch Manager',
        updated_by: getActorName(),
        updated_by_role: currentUser?.role || 'Branch Manager'
      });
      try {
        const freshHistory = await fetchPriceHistory(currentUser?.role);
        if (Array.isArray(freshHistory)) {
          setHistory(freshHistory);
        }
      } catch (e) {}
    } catch (err) {
      console.error('Failed to sync updated quotation to server:', err);
    }
  };

  const handleSimulatePriceUpdate = async () => {

    if (products.length > 0) {
      const p = products[0];
      const newPrice = p.current_price + 500;
      await handleUpdatePrice(p.id, newPrice, 'Simulated Global Market Index Adjustment', new Date().toISOString().split('T')[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-[#0F203C] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#E87F24] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h3 className="font-bold text-base text-[#0F203C]">Connecting to Central Master Database...</h3>
          <p className="text-xs text-slate-500">INNOVISTA Enterprise ERP System Initialization</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} branches={branches} sessionNotice={sessionNotice} />;
  }

  return (
    <div className="min-h-screen bg-white text-[#0F203C] font-sans antialiased selection:bg-[#E87F24] selection:text-white">
      {/* Top Ribbon Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeBranch={activeBranch}
        setActiveBranch={setActiveBranch}
        branches={branches}
        events={events}
        unreadCount={unreadCount}
        clearUnread={() => setUnreadCount(0)}
        syncMode={syncMode}
        setSyncMode={setSyncMode}
        onOpenScannerModal={() => setIsScannerOpen(true)}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenChangePassword={() => {
          setIsChangePasswordOpen(true);
          setIsForcePasswordChange(false);
        }}
        onOpenMfaSecurity={() => setIsMfaModalOpen(true)}
        onOpenGmailCenter={() => setIsGmailModalOpen(true)}
        products={products}
        quotations={quotations}
        customers={customers}
        vehicles={vehicles}
        history={history}
      />

      {/* Main Content Area */}
      <main className={`max-w-[1750px] w-full mx-auto px-3 sm:px-6 py-5 space-y-6 transition-all duration-300 ${
        isBillingPanelOpen ? 'xl:pr-[480px]' : ''
      }`}>
          {activeTab === 'dashboard' && isPortalAuthorized('dashboard', currentUser) && (
            <Dashboard
              products={products}
              quotations={quotations}
              branches={branches}
              customers={customers}
              priceHistory={history}
              activeBranch={activeBranch}
              currentUser={currentUser}
              discountRequests={discountRequests}
              events={events}
              onNavigateToTab={(tabId) => setActiveTab(tabId)}
              onRefreshData={() => loadInitialData()}
            />
          )}

          {activeTab === 'master-prices' && isPortalAuthorized('master-prices', currentUser) && (
            <MasterPriceManagement
              products={products}
              branches={branches}
              branchPrices={branchPrices}
              customerPrices={customerPrices}
              discountRequests={discountRequests}
              priceHistory={history}
              activeBranch={activeBranch}
              locations={locations}
              vehicles={vehicles}
              rules={rules}
              quotations={quotations}
              onCreateQuotation={handleCreateQuotation}
              onCalculateTransport={calculateTransport}
              onUpdatePrice={handleUpdatePrice}
              onUpdateProductData={handleUpdateProductData}
              onProposePrice={handleProposePrice}
              onApprovePrice={handleApprovePrice}
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
              onProceedToQuotation={handleProceedToQuotation}
              onCreateBranchOverride={handleCreateBranchOverride}
              onDeleteBranchOverride={handleDeleteBranchOverride}
              onCreateCustomerOverride={handleCreateCustomerOverride}
              onDeleteCustomerOverride={handleDeleteCustomerOverride}
              onApproveDiscountRequest={handleApproveDiscountRequest}
              onUpdateBranchMargin={handleUpdateBranchMargin}
            />
          )}

          {activeTab === 'order-management' && isPortalAuthorized('order-management', currentUser) && (
            <OrderManagementPortal
              quotations={quotations}
              branches={branches}
              activeBranch={activeBranch}
              currentUser={currentUser}
              onValidateQuotation={handleValidateQuotation}
              onProceedToQuotation={handleProceedToQuotation}
              onRefreshData={() => fetchQuotations().then(setQuotations)}
              onDeleteQuotation={handleDeleteQuotation}
              onRequestOrderRemoval={handleRequestOrderRemoval}
              onRejectOrderRemoval={handleRejectOrderRemoval}
            />
          )}

          {activeTab === 'customer-portal' && isPortalAuthorized('customer-portal', currentUser) && (
            <CustomerManagementPortal
              customers={customers}
              products={products}
              quotations={quotations}
              customerPrices={customerPrices}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onCreateCustomerOverride={handleCreateCustomerOverride}
              onDeleteCustomerOverride={handleDeleteCustomerOverride}
            />
          )}

          {activeTab === 'transport-engine' && isPortalAuthorized('transport-engine', currentUser) && (
            <TransportCostEngine
              vehicles={vehicles}
              rules={rules}
              locations={locations}
              activeBranch={activeBranch}
              quotations={quotations}
              onUpdateVehicle={handleUpdateVehicle}
              onUpdateRules={handleUpdateRules}
              onCalculateTransport={calculateTransport}
              onUpdateQuotation={handleUpdateQuotation}
            />
          )}

          {activeTab === 'price-history' && (
            <PriceHistoryAudit
              history={history}
              currentUser={currentUser}
              onRefresh={loadInitialData}
            />
          )}

          {activeTab === 'branch-network' && isPortalAuthorized('branch-network', currentUser) && (
            <BranchNetworkMonitor
              activeBranch={activeBranch}
              branches={branches}
              products={products}
              events={events}
              syncMode={syncMode}
              setSyncMode={setSyncMode}
              onSimulatePriceUpdate={handleSimulatePriceUpdate}
              onBatchMarginUpdate={handleBatchMarginUpdate}
            />
          )}

          {activeTab === 'settings-config' && isPortalAuthorized('settings-config', currentUser) && (
            <SettingsConfigManagement
              activeBranch={activeBranch}
              branches={branches}
              products={products}
              quotations={quotations}
              customers={customers}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}
        </main>

      {/* Persistent Right-Side Billing & Order Processing Portal Panel */}
      <RightBillingOrderPanel
        products={products}
        quotations={quotations}
        locations={locations}
        vehicles={vehicles}
        activeBranch={activeBranch}
        pendingCartItem={pendingCartItem}
        onClearPendingCartItem={() => setPendingCartItem(null)}
        onCreateQuotation={handleCreateQuotation}
        onOpenProductSpecs={(p) => setLightboxProduct(p)}
        isOpen={isBillingPanelOpen}
        onToggleOpen={() => setIsBillingPanelOpen(!isBillingPanelOpen)}
        currentUser={currentUser}
      />

      {/* Product Tech Spec Lightbox Modal */}
      {lightboxProduct && (
        <ProductImageLightboxModal
          product={lightboxProduct}
          isOpen={!!lightboxProduct}
          onClose={() => setLightboxProduct(null)}
        />
      )}

      {/* Global Barcode & QR Code Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        quotations={quotations}
        onProductScanned={handleProductScanned}
        onQuotationScanned={handleQuotationScanned}
      />

      {/* Global Keyboard Shortcut Cheat Sheet Modal */}
      <KeyboardShortcutCheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        shortcuts={shortcuts}
        onGoToSettings={() => {
          setActiveTab('settings-config');
        }}
      />

      {/* Password Change Security Modal */}
      {currentUser && (
        <ChangePasswordModal
          user={currentUser}
          isOpen={isChangePasswordOpen}
          isForceChange={isForcePasswordChange}
          onClose={() => setIsChangePasswordOpen(false)}
          onPasswordChanged={handlePasswordChanged}
        />
      )}

      {/* MFA 2FA Security Center Modal */}
      {currentUser && (
        <MfaSecurityModal
          user={currentUser}
          isOpen={isMfaModalOpen}
          onClose={() => setIsMfaModalOpen(false)}
          onUpdateUserMfa={handleUpdateUserMfa}
        />
      )}

      {/* User Account Profile & Security Details Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onOpenChangePassword={() => {
            setIsChangePasswordOpen(true);
            setIsForcePasswordChange(false);
          }}
          onOpenMfaSecurity={() => setIsMfaModalOpen(true)}
        />
      )}

      {/* Gmail Communications & Automations Center Modal */}
      <GmailMailCenterModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        customers={customers}
        staffUsers={INITIAL_USERS}
        quotations={quotations}
        initialRecipient={gmailModalParams.recipient}
        initialSubject={gmailModalParams.subject}
        initialBody={gmailModalParams.body}
      />

      {/* Global In-App Toast Notifications (Safe iframe Alert Replacements) */}
      {globalToasts.length > 0 && (
        <div id="global-toasts-container" className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto max-w-sm w-full">
          {globalToasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isWarning = toast.type === 'warning';
            return (
              <div
                key={toast.id}
                id={`toast-item-${toast.id}`}
                className={`p-3.5 px-4 rounded-xl border shadow-xl flex items-start space-x-3 backdrop-blur-md animate-fadeIn transition-all ${
                  isSuccess
                    ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700/80'
                    : isError
                    ? 'bg-rose-900/95 text-rose-100 border-rose-700/80'
                    : isWarning
                    ? 'bg-amber-900/95 text-amber-100 border-amber-700/80'
                    : 'bg-slate-900/95 text-slate-100 border-slate-700/80'
                }`}
              >
                <div className="p-1 rounded-md shrink-0 mt-0.5">
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isError ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Info className="w-4 h-4 text-orange-400" />
                  )}
                </div>
                <div className="flex-1 text-xs font-medium leading-relaxed break-words">
                  {toast.message}
                </div>
                <button
                  id={`btn-close-toast-${toast.id}`}
                  onClick={() => setGlobalToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-white/60 hover:text-white p-1 rounded transition-colors shrink-0"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Speed-Dial Shortcut Toast Alert Notification */}
      {shortcutToast && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl rounded-xl p-3.5 px-4 flex items-center space-x-3 backdrop-blur-md animate-fadeIn transition-all max-w-md">
          <div className="p-1.5 bg-orange-500 text-white rounded-lg shadow-xs">
            <Keyboard className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                Hotkey Triggered
              </span>
              <kbd className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-slate-200 rounded">
                {shortcutToast.combo}
              </kbd>
            </div>
            <p className="text-xs font-semibold text-white truncate mt-0.5">
              {shortcutToast.message}
            </p>
          </div>
          <button
            onClick={() => setShortcutToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

