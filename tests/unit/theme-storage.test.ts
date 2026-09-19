import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasStoredTheme } from '@/components/theme-storage';
import { THEME_STORAGE_KEY } from '@/components/consts';

const stubStorage = (stored: string | null) => {
  vi.stubGlobal('window', {
    localStorage: { getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null) },
  });
};

describe('hasStoredTheme', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('true, когда в localStorage лежит тема', () => {
    stubStorage('dark');
    expect(hasStoredTheme()).toBe(true);
  });

  it('false, когда в localStorage темы нет', () => {
    stubStorage(null);
    expect(hasStoredTheme()).toBe(false);
  });

  it('false, когда localStorage недоступен: тема не считается выбранной', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new Error('SecurityError');
      },
    });
    expect(hasStoredTheme()).toBe(false);
  });
});
