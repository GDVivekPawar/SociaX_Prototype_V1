import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import type { Narrative } from '../types';

const statusStyle: Record<string, string> = {
  'high momentum': 'bg-rose-50 text-rose-700 border-rose-200', emerging: 'bg-amber-50 text-amber-700 border-amber-200',
  growing: 'bg-blue-50 text-blue-700 border-blue-200', stable: 'bg-slate-50 text-slate-600 border-slate-200', declining: 'bg-slate-50 text-slate-500 border-slate-200',
};
const formatTime = (value: string) => new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function NarrativeIntelligence({ narratives, selectedId, onSelect }: { narratives: Narrative[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const reduceMotion = useReducedMotion();
  const selected = useMemo(() => narratives.find(item => item.id === selectedId) || narratives[0], [narratives, selectedId]);
  if (!narratives.length) return <div className="card p-6 text-sm text-slate-400 text-center">Waiting for enough timestamped posts to identify narratives…</div>;
  return <div className="space-y-6">
    <div className="card p-4">
      <div className="accent-bar accent-amber mb-4"><p className="section-label label-terracotta">Early warning</p><h2 className="text-lg font-semibold text-slate-800">Narrative Intelligence</h2><p className="text-xs text-slate-500 mt-1">Scores are transparent heuristics derived from source timestamps, not a trained model.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {narratives.slice(0, 8).map((narrative, index) => <motion.button key={narrative.id} initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: index * 0.03 }} layout onClick={() => onSelect(narrative.id)} className={`text-left rounded-lg border p-4 transition-colors ${selected?.id === narrative.id ? 'border-amber-300 bg-amber-50/30 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
          <div className="flex justify-between gap-3"><h3 className="font-semibold text-slate-800 capitalize">{narrative.title}</h3><span className={`h-fit whitespace-nowrap text-[10px] font-semibold uppercase px-2 py-1 rounded-full border ${statusStyle[narrative.status]}`}>{narrative.status}</span></div>
          <div className="grid grid-cols-4 gap-2 mt-3 text-xs"><Metric label="Score" value={`${Math.round(narrative.earlyNarrativeScore * 100)}%`} /><Metric label="Posts" value={String(narrative.totalPosts)} /><Metric label="Growth" value={`${narrative.growthRate >= 0 ? '+' : ''}${Math.round(narrative.growthRate * 100)}%`} /><Metric label="Velocity" value={`${narrative.velocity >= 0 ? '+' : ''}${narrative.velocity}/h`} /></div>
          <p className="mt-3 text-[11px] text-slate-400">{narrative.sources.join(' · ')} · Last update {formatTime(narrative.lastSeen)}</p>
        </motion.button>)}
      </div>
    </div>
    {selected && <NarrativeDetail narrative={selected} />}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><div className="font-semibold text-slate-700">{value}</div><div className="text-slate-400">{label}</div></div>; }

function NarrativeDetail({ narrative }: { narrative: Narrative }) {
  const timeline = narrative.timeline.map(point => ({ ...point, time: formatTime(point.timestamp) }));
  return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 card p-4"><h3 className="text-sm font-semibold text-slate-700 mb-3">Timeline: volume and velocity</h3><ResponsiveContainer width="100%" height={220}><LineChart data={timeline}><CartesianGrid stroke="#F1F5F9" vertical={false}/><XAxis dataKey="time" tick={{fontSize: 10}}/><YAxis tick={{fontSize: 10}}/><Tooltip/><Line type="monotone" dataKey="volume" stroke="#1E3A5F" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="velocity" stroke="#B45309" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>
    <div className="card p-4"><h3 className="text-sm font-semibold text-slate-700 mb-3">Why flagged</h3><ul className="space-y-2 text-xs text-slate-600">{narrative.explanation.map(item => <li key={item} className="flex gap-2"><span className="text-emerald-600">✓</span>{item}</li>)}</ul><div className="mt-4 pt-3 border-t border-slate-100 text-xs"><p><span className="text-slate-400">First detected:</span> {formatTime(narrative.firstSeen)}</p><p className="mt-1"><span className="text-slate-400">Keywords:</span> {narrative.keywords.join(', ')}</p><p className="mt-1"><span className="text-slate-400">Sentiment:</span> +{narrative.sentiment.positive} / −{narrative.sentiment.negative} / {narrative.sentiment.neutral} neutral</p></div></div>
    <div className="lg:col-span-3 card p-4"><h3 className="text-sm font-semibold text-slate-700 mb-3">Supporting evidence</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{narrative.posts.slice(-6).reverse().map(post => <div key={post.id || `${post.username}-${post.timestamp}`} className="rounded border border-slate-100 p-3 text-xs"><p className="text-slate-600 line-clamp-4">{post.text}</p><p className="mt-2 text-slate-400">{post.username} · {post.platform} · {formatTime(post.timestamp)}</p></div>)}</div></div>
  </div>;
}
