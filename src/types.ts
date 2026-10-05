export type SocialSource = 'telegram' | 'reddit' | 'youtube' | 'rss' | 'x' | 'demo';

export interface SocialPost {
  id: string;
  source: SocialSource;
  sourcePostId: string;
  authorId: string;
  authorName?: string;
  username?: string;
  content: string;
  sourceTimestamp: string;
  ingestedAt: string;
  url?: string | null;
  language?: string | null;
  engagement: { likes: number; comments: number; shares: number; views: number };
  metadata: Record<string, unknown>;
}

export interface Post {
  id?: string;
  author?: string;
  text: string;
  timestamp: string;
  channel: string;
  username: string;
  platform: string;
  _synthetic?: boolean;
}

export interface IngestionStatus {
  state: 'LIVE' | 'STALE' | 'ERROR' | 'REPLAY / DEMO';
  checkedAt?: string;
  sources?: Record<string, { state: string; lastSuccessAt?: string; fetched?: number; error?: string }>;
}

export type NarrativeStatus = 'emerging' | 'growing' | 'stable' | 'declining' | 'high momentum';

export interface NarrativeTimelinePoint {
  timestamp: string;
  volume: number;
  velocity: number;
  acceleration: number;
}

export interface Narrative {
  id: string;
  title: string;
  keywords: string[];
  postIds: string[];
  posts: Post[];
  sources: string[];
  firstSeen: string;
  lastSeen: string;
  totalPosts: number;
  currentVolume: number;
  previousVolume: number;
  growthRate: number;
  velocity: number;
  acceleration: number;
  sentiment: { positive: number; negative: number; neutral: number; mixed: number };
  languageDistribution: Record<string, number>;
  status: NarrativeStatus;
  confidence: number;
  earlyNarrativeScore: number;
  timeline: NarrativeTimelinePoint[];
  explanation: string[];
}

export interface SentimentResult {
  post: Post;
  label: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number;
  emotions: string[];
}

export interface Cluster {
  id: number;
  label: string;
  posts: Post[];
  keywords: string[];
  size: number;
}

export interface CoordCluster {
  id: number;
  accounts: string[];
  posts: Post[];
  relationships: { source: string; target: string; similarity: number; score: number }[];
  evidence: {
    timeWindow: string;
    avgSimilarity: number;
    pairCount: number;
    coordinationScore?: number;
    sharedTopic?: string;
  };
}

export interface CoordinationResult {
  detected: boolean;
  clusters: CoordCluster[];
  summary: string;
}

export interface Scenario {
  label: string;
  projectedReach: number;
  range: { low: number; high: number };
  description: string;
  curvePoints: { t: number; value: number }[];
}

export interface WhatIfResult {
  scenarios: Scenario[];
  recommendation: string;
  currentVolume: number;
  growthRate: number;
}
