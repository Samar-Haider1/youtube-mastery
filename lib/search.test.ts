// lib/search.test.ts
import { formatSearchResults } from './search';

describe('formatSearchResults', () => {
  it('formats results into readable string', () => {
    const results = [
      { title: 'Fall of Rome', description: 'How Rome fell', url: 'https://example.com' },
      { title: 'Roman History', description: 'Roman facts', url: 'https://example2.com' },
    ];
    const formatted = formatSearchResults(results);
    expect(formatted).toContain('Fall of Rome');
    expect(formatted).toContain('How Rome fell');
    expect(formatted).toContain('Roman History');
  });

  it('handles empty results', () => {
    expect(formatSearchResults([])).toBe('');
  });
});
