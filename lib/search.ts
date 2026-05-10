interface SearchResult {
  title: string;
  description: string;
  url: string;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return '';
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.description}\nSource: ${r.url}`)
    .join('\n\n');
}

export async function searchTopic(topic: string): Promise<string> {
  const queries = [
    `${topic} history youtube viral`,
    `${topic} history documentary interesting facts`,
    `${topic} history controversies mysteries`,
  ];

  try {
    // Dynamic import required — duck-duck-scrape is CJS
    const { search, SafeSearchType } = await import('duck-duck-scrape');

    const resultsArrays = await Promise.allSettled(
      queries.map((q) =>
        search(q, { safeSearch: SafeSearchType.OFF })
          .then((r: { results: SearchResult[] }) => r.results.slice(0, 10))
          .catch(() => [] as SearchResult[])
      )
    );

    const merged: SearchResult[] = resultsArrays
      .filter((r): r is PromiseFulfilledResult<SearchResult[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .slice(0, 25);

    return formatSearchResults(merged);
  } catch {
    // Graceful degradation: if search fails, return empty so Claude uses own knowledge
    return '';
  }
}
