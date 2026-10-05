import type { Post, CoordinationResult, CoordCluster } from '../types';

function tokenize(text: string): string[] {
  const stopwords = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were', 'have', 'has', 'had', 'after', 'since', 'into', 'our', 'your', 'their', 'they', 'there', 'near', 'about', 'across', 'during', 'amid', 'several', 'another', 'local', 'residents']);
  return text.toLowerCase().replace(/[.,!?'"()\[\]{}]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
}

function cosineSimilarity(text1: string, text2: string): number {
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);
  
  const tf1 = new Map<string, number>();
  const tf2 = new Map<string, number>();
  
  tokens1.forEach(t => tf1.set(t, (tf1.get(t) || 0) + 1));
  tokens2.forEach(t => tf2.set(t, (tf2.get(t) || 0) + 1));
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  tf1.forEach((val, key) => {
    dotProduct += val * (tf2.get(key) || 0);
    norm1 += val * val;
  });
  
  tf2.forEach(val => norm2 += val * val);
  
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

class UnionFind {
  parent: Map<number, number>;
  
  constructor() {
    this.parent = new Map();
  }
  
  find(i: number): number {
    if (!this.parent.has(i)) {
      this.parent.set(i, i);
    }
    if (this.parent.get(i) === i) return i;
    const root = this.find(this.parent.get(i)!);
    this.parent.set(i, root);
    return root;
  }
  
  union(i: number, j: number) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent.set(rootI, rootJ);
    }
  }
}

export function detectCoordination(posts: Post[]): CoordinationResult {
  const uf = new UnionFind();
  const edges: { i: number, j: number, sim: number, timeDiff: number, score: number }[] = [];
  
  for (let i = 0; i < posts.length; i++) {
    uf.find(i);
    for (let j = i + 1; j < posts.length; j++) {
      if (posts[i].username === posts[j].username) continue;
      
      const t1 = new Date(posts[i].timestamp).getTime();
      const t2 = new Date(posts[j].timestamp).getTime();
      const timeDiffSecs = Math.abs(t1 - t2) / 1000;
      
      if (timeDiffSecs > 300) continue;
      
      let timeSimilarity = 0;
      if (timeDiffSecs <= 60) {
        timeSimilarity = 1.0;
      } else {
        timeSimilarity = Math.max(0, 1.0 - ((timeDiffSecs - 60) / 240));
      }
      
      const textSim = cosineSimilarity(posts[i].text, posts[j].text);
      const combinedScore = 0.4 * timeSimilarity + 0.6 * textSim;
      
      if (textSim > 0.45 && combinedScore > 0.62) {
        uf.union(i, j);
        edges.push({ i, j, sim: textSim, timeDiff: timeDiffSecs, score: combinedScore });
      }
    }
  }
  
  const clustersMap = new Map<number, number[]>();
  for (let i = 0; i < posts.length; i++) {
    const root = uf.find(i);
    if (!clustersMap.has(root)) {
      clustersMap.set(root, []);
    }
    clustersMap.get(root)!.push(i);
  }
  
  const coordClusters: CoordCluster[] = [];
  let clusterId = 1;
  
  clustersMap.forEach((componentIndices) => {
    const ordered = componentIndices.sort((a, b) => +new Date(posts[a].timestamp) - +new Date(posts[b].timestamp));
    const episodes: number[][] = [];
    ordered.forEach(index => {
      const currentEpisode = episodes[episodes.length - 1];
      const previousIndex = currentEpisode?.[currentEpisode.length - 1];
      const firstIndex = currentEpisode?.[0];
      const timestamp = +new Date(posts[index].timestamp);
      if (!currentEpisode || timestamp - +new Date(posts[previousIndex].timestamp) > 300_000 || timestamp - +new Date(posts[firstIndex].timestamp) > 300_000) episodes.push([index]);
      else currentEpisode.push(index);
    });

    episodes.forEach(indices => {
      if (indices.length < 2) return;
      const accounts = Array.from(new Set(indices.map(idx => posts[idx].username)));
      if (accounts.length < 2) return;
      const indexSet = new Set(indices);
      const clusterPosts = indices.map(idx => posts[idx]);
      const clusterEdges = edges.filter(edge => indexSet.has(edge.i) && indexSet.has(edge.j));
      if (clusterEdges.length === 0) return;
      const totalSim = clusterEdges.reduce((sum, edge) => sum + edge.sim, 0);
      const totalScore = clusterEdges.reduce((sum, edge) => sum + edge.score, 0);
      const avgSim = totalSim / clusterEdges.length;
      const coordinationScore = totalScore / clusterEdges.length;
      const common = new Map<string, number>();
      clusterPosts.forEach(post => tokenize(post.text).forEach(word => common.set(word, (common.get(word) || 0) + 1)));
      const sharedTopic = Array.from(common.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([word]) => word).join(' ');
      const times = clusterPosts.map(post => +new Date(post.timestamp));
      const timeWindowSecs = Math.round((Math.max(...times) - Math.min(...times)) / 1000);
      const accountFor = (index: number) => posts[index].username;
      coordClusters.push({
        id: clusterId++, accounts, posts: clusterPosts,
        relationships: clusterEdges.map(edge => ({ source: accountFor(edge.i), target: accountFor(edge.j), similarity: Number(edge.sim.toFixed(2)), score: Number(edge.score.toFixed(2)) })),
        evidence: { timeWindow: `${timeWindowSecs} seconds`, avgSimilarity: Number(avgSim.toFixed(2)), pairCount: clusterEdges.length, coordinationScore: Number(coordinationScore.toFixed(2)), sharedTopic },
      });
    });
  });
  
  const detected = coordClusters.length > 0;
  
  return {
    detected,
    clusters: coordClusters.sort((a, b) => (b.evidence.coordinationScore || 0) - (a.evidence.coordinationScore || 0) || b.posts.length - a.posts.length),
    summary: detected ? `Detected ${coordClusters.length} coordination cluster(s) involving ${coordClusters.reduce((acc, c) => acc + c.accounts.length, 0)} accounts.` : "No coordination cluster detected in current data"
  };
}

export function injectTestCluster(posts: Post[]): Post[] {
  if (posts.length < 6) return posts;
  
  const newPosts = [...posts];
  const baseTime = new Date().getTime();
  const modifications = [
    "The new policy changes are completely unacceptable and will ruin our community.",
    "These new policy changes are completely unacceptable and will destroy our community.",
    "The new policy rules are completely unacceptable and will destroy our community.",
    "The recent policy changes are completely unacceptable and will destroy our community.",
    "The new policy changes are entirely unacceptable and will destroy our community.",
    "The new policy changes are completely unacceptable and will destroy the community."
  ];
  
  for (let i = 0; i < 6; i++) {
    newPosts.push({
      platform: "telegram",
      channel: "test_channel",
      text: modifications[i],
      timestamp: new Date(baseTime + i * 2000).toISOString(),
      username: `synth_bot_${i}`,
      _synthetic: true
    });
  }
  
  return newPosts;
}
