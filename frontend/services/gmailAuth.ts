import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly'
];

const provider = new GoogleAuthProvider();
// Add granted Gmail scopes to provider
GMAIL_SCOPES.forEach(scope => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the access token strictly in memory (per workspace-integration guidelines)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentGoogleUser: User | null = null;

// Auth state listener callbacks
type AuthCallback = (user: User | null, token: string | null) => void;
const listeners = new Set<AuthCallback>();

export const notifyListeners = () => {
  listeners.forEach(cb => cb(currentGoogleUser, cachedAccessToken));
};

export const subscribeToGmailAuth = (cb: AuthCallback) => {
  listeners.add(cb);
  // Initial callback with current state
  cb(currentGoogleUser, cachedAccessToken);
  return () => {
    listeners.delete(cb);
  };
};

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    currentGoogleUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        notifyListeners();
      } else if (!isSigningIn) {
        // User is signed in to Firebase, but access token needs popup renewal
        if (onAuthFailure) onAuthFailure();
        notifyListeners();
      }
    } else {
      cachedAccessToken = null;
      currentGoogleUser = null;
      if (onAuthFailure) onAuthFailure();
      notifyListeners();
    }
  });
};

// Must be called from an explicit button click / user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Gmail access token from Google sign in');
    }

    cachedAccessToken = credential.accessToken;
    currentGoogleUser = result.user;
    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Gmail sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getGoogleUser = (): User | null => {
  return currentGoogleUser;
};

export const isGmailConnected = (): boolean => {
  return !!(cachedAccessToken && currentGoogleUser);
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  currentGoogleUser = null;
  notifyListeners();
};

/**
 * Base64 URL safe encoder according to RFC 4648
 */
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  fromName?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  id: string;
  threadId: string;
  labelIds?: string[];
}

/**
 * Sends an email using the Gmail REST API (users.messages.send)
 * Requires an active in-memory access token.
 */
export async function sendGmailMessage(params: SendEmailParams): Promise<SendEmailResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Gmail is not connected. Please connect your Google account first.');
  }

  const fromSender = params.fromName 
    ? `"${params.fromName}" <${currentGoogleUser?.email || 'me'}>`
    : currentGoogleUser?.email || 'me';

  const plainText = params.bodyText || params.bodyHtml.replace(/<[^>]+>/g, ' ');

  // Construct MIME multipart email format
  const boundary = '----=_Part_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2);
  const rawEmailParts = [
    `From: ${fromSender}`,
    `To: ${params.to}`,
    params.replyTo ? `Reply-To: ${params.replyTo}` : '',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    plainText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.bodyHtml,
    '',
    `--${boundary}--`
  ].filter(line => line !== null && line !== undefined);

  const rawMime = rawEmailParts.join('\r\n');
  const encodedRaw = base64UrlEncode(rawMime);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedRaw
    })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const message = errorJson.error?.message || `Gmail API error ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  const result: SendEmailResult = await response.json();
  return result;
}

/**
 * Lists recent sent or inbox messages from the connected Gmail account
 */
export async function listGmailMessages(maxResults = 10, query = ''): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to list messages: ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.messages || !Array.isArray(data.messages)) {
    return [];
  }

  // Fetch headers for each message
  const details = await Promise.all(
    data.messages.map(async (msg: { id: string; threadId: string }) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (itemRes.ok) {
          const itemData = await itemRes.json();
          const headers = itemData.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
          const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
          return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: itemData.snippet || '',
            subject,
            from,
            to,
            date,
            labelIds: itemData.labelIds || []
          };
        }
      } catch (err) {
        console.error('Failed to fetch message metadata', err);
      }
      return { id: msg.id, threadId: msg.threadId };
    })
  );

  return details;
}
