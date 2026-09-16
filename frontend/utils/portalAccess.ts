import { SystemUser } from '../../shared/types';
import { hasPermission } from './permissionEngine';

export type PortalId = 
  | 'dashboard'
  | 'master-prices'
  | 'order-management'
  | 'customer-portal'
  | 'transport-engine'
  | 'branch-network'
  | 'price-history'
  | 'settings-config';

/**
 * Checks whether a user role/account type is authorized to see and access a given portal.
 * Unauthorized access portals are hidden completely for accounts not authorized to work in them.
 */
export function isPortalAuthorized(portalId: string, user: SystemUser | null | undefined): boolean {
  if (!user) return false;

  const role = user.role;

  // Master Price & Quotation Audit Log ('price-history'):
  // Strictly restricted to Super Admin only. Cannot be viewed by HO Admin, Branch Manager, or Sales Executive.
  if (portalId === 'price-history') {
    return role === 'Super Admin' || (role as string) === 'HO MASTER';
  }

  // 1. Super Admin: full root access to all portals
  if (role === 'Super Admin' || (role as string) === 'HO MASTER') {
    return true;
  }

  // 2. Head Office Admin: full enterprise operational and config access
  if (role === 'HO Admin') {
    return true;
  }

  // 3. Branch Manager:
  // Authorized to work in:
  // - Dashboard (Branch sales & performance metrics)
  // - Master Prices / POS
  // - Order Management & Quotations
  // - Customer Portal
  // - Transport Engine
  // - Settings & Config (for branch user management and profile)
  // Strictly HIDDEN:
  // - Multi-Branch Network Infrastructure ('branch-network' is HO only)
  // - Global Price Audit Log ('price-history' is HO only)
  if (role === 'Branch Manager') {
    if (portalId === 'branch-network' || portalId === 'price-history') {
      return false;
    }
    return true;
  }

  // 4. Sales Executive:
  // Only related and authorized to work in functional sales portals:
  // - Master Prices / POS Catalog
  // - Order Management & Quotations Hub
  // - Customer Portal & Client Pricing
  // - Transport Cost Engine
  // Strictly HIDDEN (they no need to see that):
  // - Dashboard (Executive sales metrics / financials)
  // - Branch Network
  // - Audit Log
  // - Settings & Config (Master admin configurations)
  if (role === 'Sales Executive') {
    if (
      portalId === 'master-prices' ||
      portalId === 'order-management' ||
      portalId === 'customer-portal' ||
      portalId === 'transport-engine'
    ) {
      return true;
    }
    return false;
  }

  // Fallback check against saved permissions if customized
  if (portalId === 'dashboard') {
    return hasPermission(role, 'view_sales_analytics');
  }
  if (portalId === 'settings-config') {
    return (
      hasPermission(role, 'view_company_branding') ||
      hasPermission(role, 'manage_users') ||
      hasPermission(role, 'manage_roles_permissions') ||
      hasPermission(role, 'view_backup_export')
    );
  }

  return false;
}

/**
 * Returns the default initial authorized portal for a given user account
 */
export function getDefaultAuthorizedPortal(user: SystemUser | null | undefined): string {
  if (!user) return 'master-prices';
  if (user.role === 'Sales Executive') {
    return 'master-prices';
  }
  if (isPortalAuthorized('dashboard', user)) {
    return 'dashboard';
  }
  return 'master-prices';
}
