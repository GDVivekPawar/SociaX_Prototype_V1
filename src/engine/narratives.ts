import { clusterPosts } from './clustering';
import { analyzeAllSentiments } from './sentiment';
import type { Narrative, NarrativeStatus, Post } from '../types';

const HOUR = 60 * 60 * 1000;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Explainable early-narrative score (not a trained model):
 * 30% period-over-period growth, 25% posting velocity, 20% positive
 * acceleration, 15% cross-source presence, 10% current hourly volume.
 */
export function analyzeNarratives(posts: Post[]): Narrative[] {
  const clusters = clusterPosts(posts).filter(cluster => cluster.size >= 2);
  return clusters.map((cluster, index) => toNarrative(cluster.posts, cluster.keywords, index))
    .sort((a, b) => b.earlyNarrativeScore - a.earlyNarrativeScore);
}

function toNarrative(posts: Post[], keywords: string[], index: number): Narrative {
  const sorted = [...posts].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
  const first = +new Date(sorted[0].timestamp);
  const last = +new Date(sorted[sorted.length - 1].timestamp);
  const firstBucket = Math.floor(first / HOUR) * HOUR;
  const lastBucket = Math.floor(last / HOUR) * HOUR;
  const volumes = new Map<number, number>();
  sorted.forEach(post => {
    const bucket = Math.floor(+new Date(post.timestamp) / HOUR) * HOUR;
    volumes.set(bucket, (volumes.get(bucket) || 0) + 1);
  });
  const timeline = [];
  let previousVolume = 0;
  let previousVelocity = 0;
  for (let time = firstBucket; time <= lastBucket; time += HOUR) {
    const volume = volumes.get(time) || 0;
    const velocity = volume - previousVolume;
    timeline.push({ timestamp: new Date(time).toISOString(), volume, velocity, acceleration: velocity - previousVelocity });
    previousVolume = volume;
    previousVelocity = velocity;
  }
  const current = timeline.at(-1)!;
  const previous = timeline.at(-2) || { volume: 0, velocity: 0, acceleration: 0 };
  const sources = [...new Set(sorted.map(post => post.platform))];
  const growthRate = (current.volume - previous.volume) / Math.max(previous.volume, 1);
  const crossSource = sources.length >= 3 ? 1 : sources.length === 2 ? 0.6 : 0.2;
  const score = clamp(
    0.30 * clamp(growthRate / 2) +
    0.25 * clamp(current.velocity / 12) +
    0.20 * clamp(current.acceleration / 10) +
    0.15 * crossSource +
    0.10 * clamp(current.volume / 20),
  );
  const status: NarrativeStatus = score >= 0.8 ? 'high momentum' : score >= 0.6 ? 'emerging' : score >= 0.3 ? 'growing' : growthRate < -0.2 ? 'declining' : 'stable';
  const sentiments = analyzeAllSentiments(sorted);
  const sentiment = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  sentiments.forEach(item => { sentiment[item.label]++; });
  const languageDistribution: Record<string, number> = {};
  sorted.forEach(post => { const language = /[\u0900-\u097F]/.test(post.text) ? 'hi' : 'en'; languageDistribution[language] = (languageDistribution[language] || 0) + 1; });
  const explanation = [
    `Volume changed from ${previous.volume} to ${current.volume} posts in the latest hour.`,
    current.velocity > 0 ? `Posting velocity is +${current.velocity} posts/hour.` : 'Posting velocity is not increasing.',
    current.acceleration > 0 ? `Acceleration is +${current.acceleration} posts/hour².` : 'Acceleration is not positive.',
    `Observed across ${sources.length} source${sources.length === 1 ? '' : 's'}.`,
  ];
  return {
    id: `narrative-${index}-${keywords.join('-') || 'general'}`, title: keywords.length ? keywords.slice(0, 3).join(' · ') : 'General discussion',
    keywords, postIds: sorted.map(post => post.id || `${post.platform}:${post.timestamp}`), posts: sorted, sources,
    firstSeen: new Date(first).toISOString(), lastSeen: new Date(last).toISOString(), totalPosts: sorted.length,
    currentVolume: current.volume, previousVolume: previous.volume, growthRate, velocity: current.velocity,
    acceleration: current.acceleration, sentiment, languageDistribution, status, confidence: Math.round(clamp((sorted.length / 12) * 0.7 + score * 0.3) * 100) / 100,
    earlyNarrativeScore: Math.round(score * 100) / 100, timeline, explanation,
  };
}
