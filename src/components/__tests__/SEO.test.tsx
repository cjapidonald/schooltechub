import { cleanup, render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, describe, expect, it } from 'vitest';

import { SEO } from '../SEO';

type SupportedLang = NonNullable<Parameters<typeof SEO>[0]['lang']>;

const defaultProps = {
  title: 'Test Page',
  description: 'Testing alternate language links.',
};

const renderSEO = (path: string, lang: SupportedLang) => {
  window.history.replaceState({}, '', path);

  render(
    <HelmetProvider>
      <SEO {...defaultProps} lang={lang} />
    </HelmetProvider>,
  );
};

const getAlternateLinks = () => {
  const linkElements = Array.from(document.head.querySelectorAll('link[rel="alternate"]'));

  return linkElements.reduce<Record<string, string>>((acc, element) => {
    const hrefLang = element.getAttribute('hreflang');
    const href = element.getAttribute('href');

    if (hrefLang && href) {
      acc[hrefLang] = href;
    }

    return acc;
  }, {});
};

const withOrigin = (path: string) => `${window.location.origin}${path}`;

const getCanonicalLink = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');

describe('SEO locale alternates', () => {
  afterEach(() => {
    cleanup();
    document.querySelectorAll('[data-rh="true"]').forEach(element => {
      element.parentElement?.removeChild(element);
    });
  });

  it('emits localized alternates for English routes', async () => {
    renderSEO('/services', 'en');

    await waitFor(() => {
      const alternateLinks = getAlternateLinks();
      expect(alternateLinks.en).toBe(withOrigin('/services'));
      expect(alternateLinks.sq).toBe(withOrigin('/sq/services'));
      expect(alternateLinks.vi).toBe(withOrigin('/vi/services'));
      expect(alternateLinks['x-default']).toBe(withOrigin('/services'));

      expect(getCanonicalLink()).toBe(withOrigin('/services'));
    });
  });

  it('keeps localized canonical and alternates for Albanian routes', async () => {
    renderSEO('/sq/services', 'sq');

    await waitFor(() => {
      const alternateLinks = getAlternateLinks();
      expect(alternateLinks.en).toBe(withOrigin('/services'));
      expect(alternateLinks.sq).toBe(withOrigin('/sq/services'));
      expect(alternateLinks.vi).toBe(withOrigin('/vi/services'));

      expect(getCanonicalLink()).toBe(withOrigin('/sq/services'));
    });
  });

  it('keeps localized canonical and alternates for Vietnamese routes', async () => {
    renderSEO('/vi/services', 'vi');

    await waitFor(() => {
      const alternateLinks = getAlternateLinks();
      expect(alternateLinks.en).toBe(withOrigin('/services'));
      expect(alternateLinks.sq).toBe(withOrigin('/sq/services'));
      expect(alternateLinks.vi).toBe(withOrigin('/vi/services'));

      expect(getCanonicalLink()).toBe(withOrigin('/vi/services'));
    });
  });
});
