import type { Post, SentimentResult, Cluster, CoordinationResult, WhatIfResult } from '../types';

export function processQuery(query: string, context: { 
  posts: Post[]; 
  sentiments: SentimentResult[]; 
  clusters: Cluster[]; 
  coordination: CoordinationResult; 
  whatIf: WhatIfResult 
}): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('sentiment') || lowerQuery.includes('mood') || lowerQuery.includes('feeling')) {
    let pos = 0, neg = 0, neu = 0;
    context.sentiments.forEach(s => {
      if (s.label === 'positive') pos++;
      else if (s.label === 'negative') neg++;
      else neu++;
    });
    return `The overall sentiment is currently mixed, with ${pos} positive posts, ${neg} negative posts, and ${neu} neutral/mixed posts.`;
  }
  
  if (lowerQuery.includes('coordination') || lowerQuery.includes('coordinated') || lowerQuery.includes('bot') || lowerQuery.includes('inauthentic')) {
    if (context.coordination.detected) {
      const clusterCount = context.coordination.clusters.length;
      const accountCount = context.coordination.clusters.reduce((acc, c) => acc + c.accounts.length, 0);
      return `I detected ${clusterCount} coordination cluster(s) involving ${accountCount} accounts exhibiting suspicious timing and text similarity.`;
    } else {
      return "I have not detected any significant coordinated behavior or inauthentic activity in the current dataset.";
    }
  }
  
  if (lowerQuery.includes('what if') || lowerQuery.includes('clarify') || lowerQuery.includes('scenario') || lowerQuery.includes('reach') || lowerQuery.includes('projection')) {
    const doNothing = context.whatIf.scenarios.find(s => s.label === 'Do nothing');
    const clarifyNow = context.whatIf.scenarios.find(s => s.label === 'Clarify now');
    if (doNothing && clarifyNow) {
      return `If we do nothing, the reach is projected to hit ${doNothing.projectedReach} in 24 hours. If we clarify now, we can reduce that to ${clarifyNow.projectedReach}. ${context.whatIf.recommendation}`;
    }
    return context.whatIf.recommendation;
  }
  
  if (lowerQuery.includes('cluster') || lowerQuery.includes('topic') || lowerQuery.includes('narrative') || lowerQuery.includes('theme')) {
    if (context.clusters.length > 0) {
      const topClusters = context.clusters.slice(0, 3);
      const clusterDesc = topClusters.map((c, i) => `${i + 1}. "${c.label}" (${c.size} posts)`).join(', ');
      return `The main topics being discussed are: ${clusterDesc}.`;
    } else {
      return "There are no clear topics or clusters forming in the data right now.";
    }
  }
  
  if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('brief') || lowerQuery.includes('briefing')) {
    const totalPosts = context.posts.length;
    const coordStatus = context.coordination.detected ? "shows signs of coordinated activity" : "appears organic";
    const topTopic = context.clusters.length > 0 ? context.clusters[0].label : "mixed topics";
    
    return `Here is the briefing: We have processed ${totalPosts} posts. The dominant narrative is about "${topTopic}". The activity ${coordStatus}. ${context.whatIf.recommendation}`;
  }
  
  return "I can help with sentiment analysis, coordination detection, topic clustering, and what-if projections. Try asking about one of these.";
}
