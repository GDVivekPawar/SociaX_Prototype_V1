import type { Post, Cluster } from '../types';

// Words that carry no topical meaning — greetings, filler, generic chat words
const STOPWORDS = new Set([
  // English function words
  'the', 'a', 'an', 'is', 'it', 'to', 'of', 'in', 'on', 'for', 'and', 'or',
  'but', 'with', 'this', 'that', 'was', 'are', 'be', 'as', 'at', 'by', 'from',
  'has', 'have', 'had', 'will', 'would', 'can', 'could', 'should', 'i', 'you',
  'we', 'they', 'he', 'she', 'my', 'your', 'our', 'their', 'me', 'us', 'if',
  'not', 'no', 'do', 'does', 'did', 'so', 'just', 'up', 'out', 'about', 'into',
  'more', 'all', 'also', 'been', 'were', 'am', 'what', 'which', 'who', 'when',
  'where', 'how', 'why', 'there', 'here',
  // Greeting / filler / conversational noise
  'hey', 'hi', 'hello', 'welcome', 'nice', 'know', 'knowing', 'known', 'knows',
  'thanks', 'thank', 'please', 'good', 'great', 'ok', 'okay', 'yeah', 'yes',
  'sure', 'wow', 'oh', 'well', 'like', 'really', 'follow', 'read', 'more',
  'news', 'breaking',
  // Telegram/channel boilerplate — the new fix
  'chat', 'group', 'channel', 'join', 'member', 'members', 'subscribe',
  'link', 'community', 'admin',
  // Hindi/Hinglish common function words + filler
  'hai', 'ho', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'ye', 'yeh', 'aur', 'bhi',
  'to', 'toh', 'kya', 'kyun', 'kyu', 'nahi', 'nhi', 'acha', 'accha',
]);

interface TokenizedPost extends Post {
  tokens: string[];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')       // strip URLs
    .replace(/[^\w\s]/g, ' ')             // strip punctuation
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, magA = 0, magB = 0;
  a.forEach((val, key) => {
    dot += val * (b.get(key) || 0);
    magA += val * val;
  });
  b.forEach(val => { magB += val * val; });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function clusterPosts(posts: Post[]): Cluster[] {
  if (posts.length === 0) return [];

  const tokenized: TokenizedPost[] = posts.map(p => ({
    ...p,
    tokens: tokenize(p.text),
  }));

  // Document frequency — how many posts contain each word
  const docFreq = new Map<string, number>();
  tokenized.forEach(p => {
    new Set(p.tokens).forEach(word => {
      docFreq.set(word, (docFreq.get(word) || 0) + 1);
    });
  });

  const N = tokenized.length;

  // TF-IDF vector per post — this is what actually fixes the bug:
  // common/filler words that appear in many posts get a LOW idf weight,
  // so they can never dominate a cluster label even if frequent
  function tfidfVector(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    const vec = new Map<string, number>();
    tf.forEach((count, word) => {
      const idf = Math.log(N / (1 + (docFreq.get(word) || 0)));
      vec.set(word, count * idf);
    });
    return vec;
  }

  const vectors = tokenized.map(p => tfidfVector(p.tokens));

  // Simple greedy clustering by cosine similarity threshold
  const SIMILARITY_THRESHOLD = 0.15;
  const assigned = new Array(tokenized.length).fill(-1);
  const rawClusters: number[][] = [];

  for (let i = 0; i < tokenized.length; i++) {
    if (assigned[i] !== -1) continue;
    if (vectors[i].size === 0) continue; // post had no meaningful words

    const group = [i];
    assigned[i] = rawClusters.length;

    for (let j = i + 1; j < tokenized.length; j++) {
      if (assigned[j] !== -1) continue;
      if (vectors[j].size === 0) continue;
      if (cosineSimilarity(vectors[i], vectors[j]) >= SIMILARITY_THRESHOLD) {
        group.push(j);
        assigned[j] = rawClusters.length;
      }
    }
    rawClusters.push(group);
  }

  // Merge closely related greedy groups by their aggregate TF-IDF profiles.
  // This reduces seed-order fragmentation while keeping the same explainable
  // cosine-similarity basis and avoiding any source-specific topic rules.
  const centroid = (indices: number[]) => {
    const combined = new Map<string, number>();
    indices.forEach(index => vectors[index].forEach((value, word) => combined.set(word, (combined.get(word) || 0) + value)));
    return combined;
  };
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < rawClusters.length; i++) {
      for (let j = i + 1; j < rawClusters.length; j++) {
        if (cosineSimilarity(centroid(rawClusters[i]), centroid(rawClusters[j])) >= SIMILARITY_THRESHOLD) {
          rawClusters[i].push(...rawClusters[j]);
          rawClusters.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }

  // Build final Cluster objects, labeling by highest TF-IDF terms (not raw frequency)
  const clusters: Cluster[] = rawClusters
    .filter(group => group.length >= 1)
    .map((group, idx) => {
      const combined = new Map<string, number>();
      group.forEach(i => {
        vectors[i].forEach((val, word) => {
          combined.set(word, (combined.get(word) || 0) + val);
        });
      });

      const topWords = Array.from(combined.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);

      return {
        id: idx,
        label: topWords.length > 0 ? topWords.join(', ') : 'General discussion',
        posts: group.map(i => posts[i]),
        keywords: topWords,
        size: group.length,
      };
    })
    .sort((a, b) => b.size - a.size);

  return clusters;
}
