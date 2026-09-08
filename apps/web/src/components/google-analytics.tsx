'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

type ConsentChoice = 'granted' | 'denied';
type GtagCommand = 'config' | 'consent' | 'event' | 'js' | 'set';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: GtagCommand, ...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? '';
const debugMode = process.env.NEXT_PUBLIC_GA_DEBUG === 'true';
const consentStorageKey = 'gimme.analytics-consent.v1';
const consentChangeEvent = 'gimme:analytics-consent';
const validMeasurementId = /^G-[A-Z0-9]+$/i.test(measurementId);
let volatileConsent: ConsentChoice | null = null;

function readConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(consentStorageKey);
    return value === 'granted' || value === 'denied' ? value : volatileConsent;
  } catch {
    return volatileConsent;
  }
}

function writeConsent(value: ConsentChoice) {
  volatileConsent = value;
  try {
    localStorage.setItem(consentStorageKey, value);
  } catch {
    // Consent still applies for this page even if browser storage is unavailable.
  }
  window.dispatchEvent(new Event(consentChangeEvent));
}

function subscribeToConsent(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === consentStorageKey) onStoreChange();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(consentChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(consentChangeEvent, onStoreChange);
  };
}

function ensureGtag() {
  window.dataLayer ??= [];
  window.gtag ??= function gtag(command: GtagCommand, ...args: unknown[]) {
    window.dataLayer?.push([command, ...args]);
  };
  return window.gtag;
}

function consentParameters(choice: ConsentChoice) {
  return {
    analytics_storage: choice,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  };
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, () => null);
  const initialized = useRef(false);
  const lastPage = useRef<string | null>(null);
  const pagePath = useMemo(() => `${pathname}${query ? `?${query}` : ''}`, [pathname, query]);

  useEffect(() => {
    if (!validMeasurementId) return;
    const gtag = ensureGtag();
    gtag('consent', 'default', consentParameters('denied'));
    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ...(debugMode ? { debug_mode: true } : {}),
    });
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current || consent === null) return;
    window.gtag?.('consent', 'update', consentParameters(consent));
  }, [consent]);

  useEffect(() => {
    if (!initialized.current || consent !== 'granted' || lastPage.current === pagePath) return;
    lastPage.current = pagePath;
    window.gtag?.('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath,
      ...(debugMode ? { debug_mode: true } : {}),
    });
  }, [consent, pagePath]);

  if (!validMeasurementId) return null;

  const chooseConsent = (choice: ConsentChoice) => {
    writeConsent(choice);
    if (choice === 'denied') lastPage.current = null;
  };

  const vietnamese = pathname === '/vi' || pathname.startsWith('/vi/');

  return (
    <>
      {consent === 'granted' ? (
        <Script
          id="gimme-ga4"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
          strategy="afterInteractive"
        />
      ) : null}
      {consent === null ? (
        <aside
          className="analytics-consent"
          aria-label={vietnamese ? 'Quyền phân tích' : 'Analytics consent'}
        >
          <p>
            {vietnamese
              ? 'Cho phép số liệu ẩn danh để chúng tôi hiểu nguồn truy cập và cải thiện Gimme Idea? Dữ liệu quảng cáo luôn bị tắt.'
              : 'Allow anonymous analytics so we can understand traffic sources and improve Gimme Idea? Advertising data stays disabled.'}
          </p>
          <div className="analytics-consent__actions">
            <button type="button" onClick={() => chooseConsent('denied')}>
              {vietnamese ? 'Từ chối' : 'Decline'}
            </button>
            <button type="button" className="is-primary" onClick={() => chooseConsent('granted')}>
              {vietnamese ? 'Cho phép' : 'Allow'}
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
