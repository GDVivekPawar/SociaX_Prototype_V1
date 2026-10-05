import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Post } from '../types';

interface VolumeChartProps {
  posts: Post[];
}

export default function VolumeChart({ posts }: VolumeChartProps) {
  const chartData = useMemo(() => {
    if (posts.length === 0) return [];

    const sorted = [...posts].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const buckets = new Map<number, number>();

    sorted.forEach(post => {
      const t = new Date(post.timestamp).getTime();
      const hourBucket = Math.floor(t / (1000 * 60 * 60)) * 60 * 60 * 1000;
      buckets.set(hourBucket, (buckets.get(hourBucket) || 0) + 1);
    });

    const minBucket = Math.min(...Array.from(buckets.keys()));
    const maxBucket = Math.max(...Array.from(buckets.keys()));
    const data = [];
    for (let i = minBucket; i <= maxBucket; i += 60 * 60 * 1000) {
      data.push({
        timestamp: new Date(i).toISOString(),
        count: buckets.get(i) || 0,
      });
    }
    return data;
  }, [posts]);

  return (
    <div className="card p-4">
      <div className="accent-bar accent-navy mb-3">
        <p className="section-label label-navy">Timeline</p>
        <h2 className="text-sm font-semibold text-slate-700">Activity Chart</h2>
      </div>
      {chartData.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Waiting for data...</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              interval={Math.max(0, Math.ceil(chartData.length / 8) - 1)}
              tickFormatter={value => new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' })}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              formatter={(value: number) => [value, 'Posts/hour']}
              labelFormatter={value => `Hour beginning ${new Date(value).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              labelStyle={{ color: '#64748B', fontWeight: 500 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#1E3A5F"
              strokeWidth={1.5}
              fill="url(#volumeGradient)"
              isAnimationActive
              animationDuration={420}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
