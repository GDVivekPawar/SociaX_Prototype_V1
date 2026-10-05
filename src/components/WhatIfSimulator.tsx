import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Narrative, WhatIfResult } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface WhatIfSimulatorProps {
  whatIf: WhatIfResult;
  narrative?: Narrative;
}

const SCENARIO_COLORS = ['#1E293B', '#059669', '#2563EB', '#B45309'];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function WhatIfSimulator({ whatIf, narrative }: WhatIfSimulatorProps) {
  const reduceMotion = useReducedMotion();
  // Build combined chart data from all scenario curves
  const chartData = useMemo(() => {
    if (whatIf.scenarios.length === 0) return [];

    // Find max t across all scenarios safely without spread
    let maxT = 0;
    whatIf.scenarios.forEach(s => {
      s.curvePoints.forEach(p => {
        if (p.t > maxT) maxT = p.t;
      });
    });

    const data: Record<string, number | string>[] = [];
    for (let t = 0; t <= maxT; t++) {
      const point: Record<string, number | string> = { time: `H${t}` };
      whatIf.scenarios.forEach(scenario => {
        const cp = scenario.curvePoints.find(p => p.t === t);
        point[scenario.label] = cp ? cp.value : 0;
      });
      data.push(point);
    }
    return data;
  }, [whatIf]);

  const highestReach = whatIf.scenarios.length > 0
    ? Math.max(...whatIf.scenarios.map(s => s.projectedReach))
    : 0;

  if (whatIf.scenarios.length === 0) {
    return (
      <div className="card-hero p-6">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">What-If Decision Simulator</h2>
        <p className="text-sm text-slate-400 mt-4 text-center py-8">Waiting for data to compute scenarios...</p>
      </div>
    );
  }

  return (
    <motion.div key={narrative?.id || 'no-narrative'} initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="card-hero p-6 relative overflow-hidden">
      {/* Amber accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />

      {/* Title */}
      <div className="flex items-center gap-2 mb-6 ml-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">What-If Decision Simulator</h2>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <span>Current volume: {narrative?.totalPosts ?? whatIf.currentVolume} posts</span>
          <span>·</span>
          <span>Growth: {narrative ? `${narrative.growthRate >= 0 ? '+' : ''}${Math.round(narrative.growthRate * 100)}%` : `${(whatIf.growthRate * 100).toFixed(0)}%`}</span>
        </div>
      </div>
      {narrative && <p className="ml-2 -mt-4 mb-5 text-xs text-slate-500">Active narrative: <span className="font-semibold uppercase text-slate-700">{narrative.title.replaceAll(' · ', ' ')}</span> · {narrative.velocity >= 0 ? '+' : ''}{narrative.velocity} posts/hour · {narrative.acceleration >= 0 ? '+' : ''}{narrative.acceleration} posts/hour²<br />Projection based on the selected narrative's observed growth, velocity and propagation signals.</p>}

      {/* Scenario Cards - 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {whatIf.scenarios.map((scenario, idx) => {
          const isHighest = scenario.projectedReach === highestReach;
          return (
            <div
              key={scenario.label}
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SCENARIO_COLORS[idx] }}
                />
                <h3 className="text-sm font-semibold text-slate-800">{scenario.label}</h3>
              </div>
              <div className={`text-3xl font-bold mb-1 ${isHighest ? 'text-amber-600' : 'text-slate-700'}`}>
                {formatNumber(scenario.projectedReach)}
              </div>
              <div className="text-xs text-slate-400 mb-3">
                ±15% range: {formatNumber(scenario.range.low)} — {formatNumber(scenario.range.high)}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {scenario.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <div className="bg-white p-4 rounded-lg border-l-4 border-l-amber-500 border border-slate-200 shadow-sm mb-6">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Recommendation</h4>
        <p className="text-sm text-slate-800 font-medium leading-relaxed">{whatIf.recommendation}</p>
      </div>

      {/* Projection Chart */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <h4 className="text-xs font-semibold text-slate-700 mb-4">Projected Reach Trajectory</h4>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '11px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#475569' }}
            />
            {whatIf.scenarios.map((scenario, idx) => (
              <Line
                key={scenario.label}
                type="monotone"
                dataKey={scenario.label}
                stroke={SCENARIO_COLORS[idx]}
                strokeWidth={idx === 0 ? 2 : 1.5}
                dot={false}
                strokeDasharray={idx === 0 ? undefined : '4 2'}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
