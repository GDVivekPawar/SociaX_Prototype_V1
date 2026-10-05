import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useDataFetcher } from './hooks/useDataFetcher';
import { analyzeAllSentiments, getSentimentSummary } from './engine/sentiment';
import { clusterPosts } from './engine/clustering';
import { detectCoordination, injectTestCluster } from './engine/coordination';
import { computeWhatIfScenarios } from './engine/whatif';
import { processQuery } from './engine/chatbot';
import Sidebar from './components/Sidebar';
import TopBar from './components/Topbar';
import NarrativeFeed from './components/NarrativeFeed';
import VolumeChart from './components/VolumeChart';
import SentimentBreakdown from './components/SentimentBreakdown';
import NetworkGraph from './components/NetworkGraph';
import CoordinationAlert from './components/CoordinationAlert';
import WhatIfSimulator from './components/WhatIfSimulator';
import ChatAssistant from './components/ChatAssistant';
import NarrativeIntelligence from './components/NarrativeIntelligence';
import { analyzeNarratives } from './engine/narratives';
import type { Post } from './types';

const TAB_TITLES: Record<string, string> = {
  overview: 'Overview',
  feed: 'News Feed',
  network: 'Network & Coordination',
  whatif: 'What-If Simulator',
  narratives: 'Early Narrative Warning',
};

export default function App() {
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState('overview');
  const { posts: rawPosts, status, isLive, sourceCounts, lastIngestion, sourceStatuses } = useDataFetcher();
  const [showTestCluster, setShowTestCluster] = useState(false);
  const [selectedNarrativeId, setSelectedNarrativeId] = useState<string | null>(null);

  const posts: Post[] = useMemo(() => {
    if (showTestCluster && rawPosts.length > 0) {
      return injectTestCluster(rawPosts);
    }
    return rawPosts;
  }, [rawPosts, showTestCluster]);

  const sentiments = useMemo(() => {
    if (posts.length === 0) return [];
    return analyzeAllSentiments(posts);
  }, [posts]);

  const sentimentSummary = useMemo(() => {
    return getSentimentSummary(sentiments);
  }, [sentiments]);

  const clusters = useMemo(() => {
    if (posts.length === 0) return [];
    return clusterPosts(posts);
  }, [posts]);

  const narratives = useMemo(() => analyzeNarratives(posts), [posts]);
  const activeNarrative = useMemo(() => narratives.find(item => item.id === selectedNarrativeId) || narratives[0], [narratives, selectedNarrativeId]);

  const coordination = useMemo(() => {
    if (posts.length === 0) return { detected: false, clusters: [], summary: 'No data loaded yet.' };
    return detectCoordination(posts);
  }, [posts]);

  const whatIf = useMemo(() => {
    if (posts.length === 0) return {
      scenarios: [],
      recommendation: 'Waiting for data...',
      currentVolume: 0,
      growthRate: 0,
    };
    return computeWhatIfScenarios(activeNarrative?.posts || posts);
  }, [posts, activeNarrative]);

  const handleQuery = useCallback((query: string): string => {
    return processQuery(query, {
      posts,
      sentiments,
      clusters,
      coordination,
      whatIf,
    });
  }, [posts, sentiments, clusters, coordination, whatIf]);

  return (
    <div className="flex bg-[#F7F8FA] min-h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 min-w-0">
        <TopBar
          title={TAB_TITLES[activeTab]}
          status={status}
          isLive={isLive}
          showTestCluster={showTestCluster}
          onToggleTestCluster={() => setShowTestCluster(prev => !prev)}
          showTestClusterToggle={activeTab === 'network'}
          sourceCounts={sourceCounts}
          lastIngestion={lastIngestion}
          sourceStatuses={sourceStatuses}
        />

        <main className="page-container">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeTab} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -3 }} transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {activeNarrative && <div className="card p-5 border-l-4 border-l-amber-500">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="section-label label-terracotta">Priority early warning · {activeNarrative.status}</p><h2 className="text-xl font-semibold text-slate-800 uppercase">{activeNarrative.title.replaceAll(' · ', ' ')}</h2><p className="text-xs text-slate-500 mt-1">{activeNarrative.totalPosts} related posts · Score {Math.round(activeNarrative.earlyNarrativeScore * 100)}% · {activeNarrative.growthRate >= 0 ? '+' : ''}{Math.round(activeNarrative.growthRate * 100)}% growth · {activeNarrative.velocity >= 0 ? '+' : ''}{activeNarrative.velocity} posts/hour</p></div>
                  <div className="flex gap-2"><button onClick={() => setActiveTab('narratives')} className="px-3 py-2 border border-slate-200 rounded text-xs text-slate-600 hover:bg-slate-50">Review evidence</button><button onClick={() => setActiveTab('whatif')} className="px-3 py-2 bg-slate-800 rounded text-xs text-white hover:bg-slate-700">Explore interventions</button></div>
                </div>
                <p className="mt-3 text-xs text-slate-600">Why flagged: {activeNarrative.explanation.join(' ')}</p>
                <p className="mt-2 text-[10px] text-slate-400">Scenario evidence is labelled as simulation; live Telegram data remains separately identified.</p>
              </div>}
              <div className="content-grid">
                <div className="lg:col-span-2 space-y-6">
                  <VolumeChart posts={posts} />
                  <CoordinationAlert coordination={coordination} showTestCluster={showTestCluster} />
                </div>
                <SentimentBreakdown summary={sentimentSummary} />
              </div>
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="max-w-3xl mx-auto">
              <NarrativeFeed posts={posts} sentiments={sentiments} />
            </div>
          )}

          {activeTab === 'network' && (
            <div className="content-grid">
              <div className="lg:col-span-2">
                <NetworkGraph coordination={coordination} posts={posts} />
              </div>
              <CoordinationAlert coordination={coordination} showTestCluster={showTestCluster} />
            </div>
          )}

          {activeTab === 'whatif' && (
            <WhatIfSimulator whatIf={whatIf} narrative={activeNarrative} />
          )}

          {activeTab === 'narratives' && (
            <NarrativeIntelligence narratives={narratives} selectedId={selectedNarrativeId} onSelect={setSelectedNarrativeId} />
          )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ChatAssistant onQuery={handleQuery} />
    </div>
  );
}
