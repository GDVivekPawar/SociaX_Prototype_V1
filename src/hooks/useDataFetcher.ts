import { useState, useEffect, useCallback } from 'react';
import type { IngestionStatus, Post, SocialPost } from '../types';

interface DataState {
  posts: Post[];
  lastFetchTime: number | null;
  isLive: boolean;
  status: string;
  error: string | null;
  sourceCounts: Record<string, number>;
  lastIngestion: string | null;
  sourceStatuses: Record<string, string>;
}

const POLL_INTERVAL = 10_000; // 10 seconds

export function useDataFetcher() {
  const [state, setState] = useState<DataState>({
    posts: [],
    lastFetchTime: null,
    isLive: false,
    status: 'REPLAY / DEMO',
    error: null,
    sourceCounts: {},
    lastIngestion: null,
    sourceStatuses: {},
  });

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/posts');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: SocialPost[] = await response.json();
      const statusResponse = await fetch('/api/ingestion/status');
      const ingestion: IngestionStatus = statusResponse.ok ? await statusResponse.json() : { state: 'ERROR' };
      const posts: Post[] = data.map(post => ({
        id: post.id, text: post.content, timestamp: post.sourceTimestamp,
        channel: String(post.metadata.channel || post.source), username: post.username || post.authorName || post.authorId,
        platform: post.source, author: post.authorName,
      }));
      const sourceCounts = data.reduce<Record<string, number>>((counts, post) => {
        counts[post.source] = (counts[post.source] || 0) + 1;
        return counts;
      }, {});
      const now = Date.now();

      if (Array.isArray(posts)) {
        setState({
          posts,
          lastFetchTime: now,
          isLive: ingestion.state === 'LIVE',
          status: ingestion.state,
          error: null,
          sourceCounts,
          lastIngestion: ingestion.checkedAt || null,
          sourceStatuses: Object.fromEntries(Object.entries(ingestion.sources || {}).map(([source, value]) => [source, value.state])),
        });
      }
    } catch {
      const response = await fetch(`/real_telegram_data.json?t=${Date.now()}`);
      if (!response.ok) throw new Error(`API and replay unavailable (${response.status})`);
      const posts: Post[] = await response.json();
      setState({ posts, lastFetchTime: Date.now(), isLive: false, status: 'REPLAY / DEMO', error: null, sourceCounts: { telegram: posts.length }, lastIngestion: null, sourceStatuses: {} });
    }
  }, []);

  useEffect(() => {
    fetchData(); // initial fetch
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return state;
}
