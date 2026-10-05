import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SentimentBreakdownProps {
  summary: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
    topEmotions: string[];
    emotionCounts: Record<string, number>;
  };
}

const COLORS: Record<string, string> = {
  positive: '#059669',
  negative: '#E11D48',
  neutral: '#64748B',
  mixed: '#D97706',
  'neutral / mixed': '#64748B',
};

export default function SentimentBreakdown({ summary }: SentimentBreakdownProps) {
  const data = [
    { name: 'Positive', value: summary.positive },
    { name: 'Negative', value: summary.negative },
    { name: 'Neutral / Mixed', value: summary.neutral + summary.mixed },
  ].filter(d => d.value > 0);

  const total = summary.positive + summary.negative + summary.neutral + summary.mixed;
  const emotionRows = Object.entries(summary.emotionCounts)
    .filter(([emotion]) => emotion !== 'neutral/other')
    .sort((a, b) => b[1] - a[1]);
  const visibleEmotions = emotionRows.slice(0, 5);
  const otherCount = total - visibleEmotions.reduce((sum, [, count]) => sum + count, 0);
  const maxEmotionCount = Math.max(1, ...visibleEmotions.map(([, count]) => count), otherCount);
  const emotionColor: Record<string, string> = {
    concern: '#B45309', fear: '#7C3AED', anger: '#BE123C', sadness: '#475569',
    joy: '#059669', hope: '#0F766E', surprise: '#2563EB', support: '#0F766E', sarcasm: '#64748B',
  };

  return (
    <div className="card p-4">
      <div className="accent-bar accent-teal mb-3"><p className="section-label label-teal">Conversation response</p><h2 className="text-sm font-semibold text-slate-700">Sentiment & Emotion</h2></div>
      {total === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Waiting for data...</p>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={48}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive
                    animationDuration={450}
                    animationEasing="ease-out"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[entry.name.toLowerCase()] || '#94A3B8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-xs">
              {data.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[d.name.toLowerCase()] }}
                  />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="text-slate-400 font-medium">{d.value} <span className="text-slate-300">({Math.round((d.value / total) * 100)}%)</span></span>
                </div>
              ))}
            </div>
          </div>
          {summary.topEmotions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Top emotions — what is driving discussion?</span>
              <div className="mt-2 space-y-2">
                {[...visibleEmotions, ['neutral/other', otherCount] as [string, number]].filter(([, count]) => count > 0).map(([emotion, count]) => {
                  const percent = total ? (count / total) * 100 : 0;
                  return <div key={emotion}>
                    <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px] leading-4">
                      <span className="capitalize text-slate-600">{emotion === 'neutral/other' ? 'Other / no clear emotion' : emotion}</span>
                      <span className="shrink-0 tabular-nums text-slate-500">{count} · {percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, (count / maxEmotionCount) * 100)}%`, backgroundColor: emotionColor[emotion] || '#94A3B8' }} /></div>
                  </div>;
                })}
              </div>
              <p className="mt-2 text-[9px] text-slate-400">One strongest detected emotion per post; remaining posts are grouped as Other.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
