import { useMemo } from 'react';
import type { Post, SentimentResult } from '../types';

interface NarrativeFeedProps {
  posts: Post[];
  sentiments: SentimentResult[];
}

const sentimentColors: Record<string, string> = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  mixed: 'bg-amber-50 text-amber-700 border-amber-200',
};

function timeAgo(ts: string): string {
  const seconds = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (seconds < 0) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours >= 48) return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NarrativeFeed({ posts, sentiments }: NarrativeFeedProps) {
  const displayPosts = useMemo(() => [...posts].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 50), [posts]);
  const sentimentByPost = useMemo(() => new Map(sentiments.map(result => [result.post, result])), [sentiments]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">Narrative Feed</h2>
        <span className="text-xs text-slate-400">{posts.length} posts</span>
      </div>
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {displayPosts.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">Waiting for data...</p>
        )}
        {displayPosts.map((post, i) => {
          const sentiment = sentimentByPost.get(post);
          const isSynthetic = post._synthetic;

          return (
            <div
              key={`${post.username}-${post.timestamp}-${i}`}
              className={`p-3 rounded-lg border transition-opacity duration-300 ${
                isSynthetic
                  ? 'border-dashed border-slate-300 bg-slate-50'
                  : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-700">{post.username}</span>
                  <span className="text-xs text-slate-400">· {post.platform === 'demo' ? 'SIMULATION' : post.channel}</span>
                  {isSynthetic && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-medium">
                      Synthetic
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">{timeAgo(post.timestamp)}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-1.5">{post.text}</p>
              {sentiment && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${sentimentColors[sentiment.label] || sentimentColors.neutral}`}>
                    {sentiment.label}
                  </span>
                  {sentiment.emotions.slice(0, 3).map(emotion => (
                    <span key={emotion} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {emotion}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
