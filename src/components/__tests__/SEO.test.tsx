import { cleanup, render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, describe, expect, it } from 'vitest';

import { SEO } from '../SEO';

const defaultProps = {
  title: 'Test Page',
  description: 'Testing alternate language links.',
};

const renderSEO = (path: string) => {
  window.history.replaceState({}, '', path);

  render(
    <HelmetProvider>
      <SEO {...defaultProps} />
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

  it('emits only English alternates for routes', async () => {
    renderSEO('/services');

    await waitFor(() => {
      const alternateLinks = getAlternateLinks();
      expect(alternateLinks.en).toBe(withOrigin('/services'));
      expect(alternateLinks['x-default']).toBe(withOrigin('/services'));
      expect(Object.keys(alternateLinks)).toHaveLength(2);

      expect(getCanonicalLink()).toBe(withOrigin('/services'));
    });
  });
});
