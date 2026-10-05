import type { Post, WhatIfResult, Scenario } from '../types';

export function computeWhatIfScenarios(posts: Post[]): WhatIfResult {
  if (posts.length === 0) {
    return {
      scenarios: [],
      recommendation: "No data available to compute scenarios.",
      currentVolume: 0,
      growthRate: 0
    };
  }

  // Filter out very old posts (e.g. old pinned messages) to prevent massive timelines
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const filteredPosts = posts.filter(p => new Date(p.timestamp).getTime() > fourteenDaysAgo);
  
  if (filteredPosts.length === 0) {
    return {
      scenarios: [],
      recommendation: "No recent data available to compute scenarios.",
      currentVolume: 0,
      growthRate: 0
    };
  }

  // Sort posts by time
  const sortedPosts = [...filteredPosts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Calculate volume over time (hourly buckets)
  const startTime = new Date(sortedPosts[0].timestamp).getTime();
  const buckets = new Map<number, number>();
  
  sortedPosts.forEach(post => {
    const t = new Date(post.timestamp).getTime();
    const hourBucket = Math.floor((t - startTime) / (1000 * 60 * 60));
    buckets.set(hourBucket, (buckets.get(hourBucket) || 0) + 1);
  });
  
  let maxBucket = 0;
  for (const k of buckets.keys()) {
    if (k > maxBucket) maxBucket = k;
  }
  let cumulative = 0;
  const cumulativeData: { t: number, val: number }[] = [];
  
  for (let i = 0; i <= maxBucket; i++) {
    cumulative += buckets.get(i) || 0;
    cumulativeData.push({ t: i, val: cumulative });
  }
  
  const currentVolume = cumulative;
  
  // Deterministic scenario coefficients: clarification applies 60% of baseline
  // capacity and 40% of its growth rate; account action scales capacity by
  // observed volume remaining after the top three authors, then by 80%.
  // These are planning assumptions, not a trained or guaranteed forecast.
  // Estimate parameters for logistic growth: S(t) = L / (1 + e^(-k*(t-t0)))
  // Simplistic estimation
  const recentGrowth = cumulativeData.length >= 2 
    ? cumulativeData[cumulativeData.length - 1].val - cumulativeData[Math.max(0, cumulativeData.length - 3)].val 
    : 0;
    
  let k = 0.3; // Default growth rate
  if (currentVolume > 0 && cumulativeData.length > 2) {
    // Rough estimate of k
    k = Math.max(0.1, Math.min(1.0, recentGrowth / currentVolume));
  }
  
  let L = currentVolume * 2;
  if (recentGrowth > currentVolume * 0.1) {
    L = currentVolume * 3;
  }
  
  let t0 = maxBucket; // inflection point near current time
  
  const generatePoints = (L_val: number, k_val: number, t0_val: number, startT: number, endT: number) => {
    const points = [];
    for (let t = startT; t <= endT; t++) {
      const val = L_val / (1 + Math.exp(-k_val * (t - t0_val)));
      // Normalize so it aligns with current volume
      points.push({ t: t, value: Math.round(val) });
    }
    return points;
  };
  
  // Baseline (Do nothing)
  const baselinePoints = generatePoints(L, k, t0, 0, maxBucket + 24);
  const baselineReach = baselinePoints[baselinePoints.length - 1].value;
  
  const scenario1: Scenario = {
    label: "Do nothing",
    description: "Current trajectory extended 24 hours.",
    projectedReach: baselineReach,
    range: { low: Math.round(baselineReach * 0.85), high: Math.round(baselineReach * 1.15) },
    curvePoints: baselinePoints
  };
  
  // Clarify now
  const L2 = L * 0.6;
  const k2 = k * 0.4;
  const scenario2Points = generatePoints(L2, k2, t0, 0, maxBucket + 24);
  const reach2 = scenario2Points[scenario2Points.length - 1].value;
  
  const scenario2: Scenario = {
    label: "Clarify now",
    description: "Issue a clarification immediately to dampen growth.",
    projectedReach: reach2,
    range: { low: Math.round(reach2 * 0.85), high: Math.round(reach2 * 1.15) },
    curvePoints: scenario2Points
  };
  
  // Clarify in 2 hours
  const scenario3Points = [];
  for (let t = 0; t <= maxBucket + 24; t++) {
    if (t <= maxBucket + 2) {
      scenario3Points.push({ t, value: Math.round(L / (1 + Math.exp(-k * (t - t0)))) });
    } else {
      // Switch to dampened growth
      const baseVal = L / (1 + Math.exp(-k * (maxBucket + 2 - t0)));
      const extraVal = (L2 - baseVal) / (1 + Math.exp(-k2 * (t - (maxBucket + 2))));
      scenario3Points.push({ t, value: Math.round(baseVal + Math.max(0, extraVal)) });
    }
  }
  const reach3 = scenario3Points[scenario3Points.length - 1].value;
  
  const scenario3: Scenario = {
    label: "Clarify in 2 hours",
    description: "Delay clarification by 2 hours.",
    projectedReach: reach3,
    range: { low: Math.round(reach3 * 0.85), high: Math.round(reach3 * 1.15) },
    curvePoints: scenario3Points
  };
  
  // Remove key accounts
  const authorCounts = new Map<string, number>();
  sortedPosts.forEach(p => authorCounts.set(p.username, (authorCounts.get(p.username) || 0) + 1));
  const topAccounts = Array.from(authorCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
  
  const reducedPosts = sortedPosts.filter(p => !topAccounts.includes(p.username));
  const L4 = L * (reducedPosts.length / sortedPosts.length) * 0.8;
  const k4 = k * 0.7;
  const scenario4Points = generatePoints(L4, k4, t0, 0, maxBucket + 24);
  const reach4 = scenario4Points[scenario4Points.length - 1].value;
  
  const scenario4: Scenario = {
    label: "Address key accounts",
    description: "Effect if the top 3 most-posting accounts are removed.",
    projectedReach: reach4,
    range: { low: Math.round(reach4 * 0.85), high: Math.round(reach4 * 1.15) },
    curvePoints: scenario4Points
  };
  
  const scenarios = [scenario1, scenario2, scenario3, scenario4];
  
  // Determine recommendation
  let recommendation = "Taking action 'Clarify now' is recommended to significantly reduce the spread.";
  if (reach4 < reach2) {
    recommendation = "Addressing the top 3 key accounts will have the most significant impact on reducing reach.";
  }
  
  return {
    scenarios,
    recommendation,
    currentVolume,
    growthRate: k
  };
}
