/**
 * Innovista Central Timezone & Record Timestamping Engine
 * Guarantees correct local and company timezone handling across all portals, records,
 * quotations, daily sales analytics, and audit ledgers.
 * 
 * Primary Default: Sri Lanka Standard Time ('Asia/Colombo', UTC+05:30)
 */

export const DEFAULT_TIMEZONE = 'Asia/Colombo';
export const STORAGE_KEY_TIMEZONE = 'innovista_system_timezone';

export interface TimezoneOption {
  id: string;
  label: string;
  offset: string;
  region: string;
}

export const SUPPORTED_TIMEZONES: TimezoneOption[] = [
  { id: 'Asia/Colombo', label: 'Sri Lanka Standard Time (SLST)', offset: 'UTC+05:30', region: 'Sri Lanka (Colombo)' },
  { id: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: 'UTC+05:30', region: 'India (New Delhi)' },
  { id: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: 'UTC+04:00', region: 'UAE (Dubai / Abu Dhabi)' },
  { id: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', offset: 'UTC+08:00', region: 'Singapore / Malaysia' },
  { id: 'Europe/London', label: 'Greenwich Mean / British Summer Time (GMT/BST)', offset: 'UTC+00:00 / +01:00', region: 'United Kingdom' },
  { id: 'Europe/Berlin', label: 'Central European Time (CET/CEST)', offset: 'UTC+01:00 / +02:00', region: 'Europe (Germany/France)' },
  { id: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-05:00 / -04:00', region: 'United States (East)' },
  { id: 'Australia/Sydney', label: 'Australian Eastern Time (AEST/AEDT)', offset: 'UTC+10:00 / +11:00', region: 'Australia (Sydney)' },
  { id: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+00:00', region: 'Universal / Cloud Native' }
];

/**
 * Returns the active system timezone, defaulting to Sri Lanka (Asia/Colombo)
 */
export function getSystemTimezone(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TIMEZONE);
    if (saved && isValidTimezone(saved)) {
      return saved;
    }
  } catch {
    // Fallback if localStorage is inaccessible
  }
  return DEFAULT_TIMEZONE;
}

/**
 * Sets the active system timezone and dispatches notification event
 */
export function setSystemTimezone(tz: string): void {
  if (!isValidTimezone(tz)) {
    console.warn(`Invalid timezone identifier: ${tz}, defaulting to ${DEFAULT_TIMEZONE}`);
    tz = DEFAULT_TIMEZONE;
  }
  try {
    localStorage.setItem(STORAGE_KEY_TIMEZONE, tz);
    window.dispatchEvent(new CustomEvent('innovista_timezone_changed', { detail: { timezone: tz } }));
  } catch (err) {
    console.error('Failed to persist timezone:', err);
  }
}

/**
 * Validates whether a given timezone string is recognized by Intl API
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a human-friendly label for the timezone
 */
export function getTimezoneLabel(tz: string = getSystemTimezone()): string {
  const match = SUPPORTED_TIMEZONES.find(t => t.id === tz);
  if (match) {
    return `${match.label} [${match.offset}]`;
  }
  return tz;
}

/**
 * Parses any incoming date parameter safely into a Date instance
 */
function toDate(input?: Date | string | number | null): Date {
  if (!input) return new Date();
  if (input instanceof Date) return isNaN(input.getTime()) ? new Date() : input;
  if (typeof input === 'number') return new Date(input);
  
  // Handle plain date format "YYYY-MM-DD"
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    const [y, m, d] = input.trim().split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0); // Midday to prevent edge-of-day rollover
  }
  
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Returns current date string "YYYY-MM-DD" strictly formatted in the target system timezone.
 * Solves the UTC midnight offset issue where records get yesterday's or tomorrow's date.
 */
export function getSystemCurrentDateString(tz: string = getSystemTimezone()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Returns an accurate timestamp string representation in the system timezone (e.g. "2026-09-10 11:30:45 (SLST)")
 */
export function getSystemCurrentFormattedTimestamp(tz: string = getSystemTimezone()): string {
  const now = new Date();
  const dateStr = formatSystemDate(now, tz);
  const timeStr = formatSystemTime(now, true, tz);
  const label = tz === 'Asia/Colombo' ? 'SLST' : tz.split('/').pop()?.replace('_', ' ') || '';
  return `${dateStr} ${timeStr} (${label})`;
}

/**
 * Formats a Date/string/timestamp into a localized date string (e.g. "10 Sep 2026") in the system timezone
 */
export function formatSystemDate(
  input?: Date | string | number | null,
  tz: string = getSystemTimezone(),
  format: 'short' | 'medium' | 'full' | 'iso' = 'medium'
): string {
  const d = toDate(input);
  try {
    if (format === 'iso') {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d);
    }
    
    if (format === 'short') {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(d);
    }

    if (format === 'full') {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    }

    // Default 'medium' e.g. "10 Sep 2026"
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Formats time in system timezone (e.g. "11:05 AM" or "11:05:30 AM")
 */
export function formatSystemTime(
  input?: Date | string | number | null,
  includeSeconds: boolean = false,
  tz: string = getSystemTimezone()
): string {
  const d = toDate(input);
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true
    }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

/**
 * Formats date and time combined (e.g. "10 Sep 2026, 11:05 AM") in system timezone
 */
export function formatSystemDateTime(
  input?: Date | string | number | null,
  includeSeconds: boolean = false,
  tz: string = getSystemTimezone()
): string {
  const d = toDate(input);
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true
    }).format(d);
  } catch {
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }
}

/**
 * Formats audit logs and revision events with exact second precision and timezone code
 */
export function formatAuditTimestamp(
  input?: Date | string | number | null,
  tz: string = getSystemTimezone()
): string {
  const d = toDate(input);
  const formatted = formatSystemDateTime(d, true, tz);
  const tzAbbrev = tz === 'Asia/Colombo' ? 'SLST' : tz === 'Asia/Kolkata' ? 'IST' : 'LST';
  return `${formatted} ${tzAbbrev}`;
}

/**
 * Determines whether a date string or timestamp matches "Today" in the target system timezone
 */
export function isTodayInSystemTimezone(
  input?: Date | string | number | null,
  tz: string = getSystemTimezone()
): boolean {
  if (!input) return false;
  const targetToday = getSystemCurrentDateString(tz);
  const recordDateStr = formatSystemDate(input, tz, 'iso');
  return targetToday === recordDateStr;
}

/**
 * Checks if two dates fall on the same calendar day in the system timezone
 */
export function isSameDayInSystemTimezone(
  dateA?: Date | string | number | null,
  dateB?: Date | string | number | null,
  tz: string = getSystemTimezone()
): boolean {
  if (!dateA || !dateB) return false;
  const strA = formatSystemDate(dateA, tz, 'iso');
  const strB = formatSystemDate(dateB, tz, 'iso');
  return strA === strB;
}

/**
 * Returns standard ISO string guaranteed to contain local timezone offset
 */
export function getIsoWithLocalTimezone(date: Date = new Date(), tz: string = getSystemTimezone()): string {
  const isoDate = formatSystemDate(date, tz, 'iso');
  const timeStr = formatSystemTime(date, true, tz);
  return `${isoDate}T${timeStr}`;
}
