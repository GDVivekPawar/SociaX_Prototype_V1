import type { Post, SentimentResult } from '../types';

const lexicon: Record<string, { weight: number, emotions: string[] }> = {
  // English
  angry: { weight: -0.85, emotions: ['anger'] },
  anger: { weight: -0.8, emotions: ['anger'] },
  frustrated: { weight: -0.75, emotions: ['anger'] },
  frustration: { weight: -0.75, emotions: ['anger'] },
  unacceptable: { weight: -0.8, emotions: ['anger'] },
  failed: { weight: -0.75, emotions: ['anger'] },
  failure: { weight: -0.75, emotions: ['anger'] },
  delayed: { weight: -0.55, emotions: ['concern'] },
  delay: { weight: -0.55, emotions: ['concern'] },
  stopped: { weight: -0.65, emotions: ['concern'] },
  blocked: { weight: -0.6, emotions: ['concern'] },
  disruption: { weight: -0.6, emotions: ['concern'] },
  disrupted: { weight: -0.6, emotions: ['concern'] },
  worse: { weight: -0.65, emotions: ['fear'] },
  worsening: { weight: -0.7, emotions: ['fear'] },
  furious: { weight: -0.9, emotions: ['anger'] },
  outraged: { weight: -0.9, emotions: ['anger'] },
  disgusted: { weight: -0.8, emotions: ['anger'] },
  hate: { weight: -1.0, emotions: ['anger'] },
  support: { weight: 0.8, emotions: ['hope'] },
  agree: { weight: 0.7, emotions: ['hope'] },
  solidarity: { weight: 0.9, emotions: ['hope'] },
  thanks: { weight: 0.55, emotions: ['joy'] },
  thankful: { weight: 0.65, emotions: ['joy'] },
  proud: { weight: 0.8, emotions: ['joy'] },
  help: { weight: 0.6, emotions: ['hope'] },
  sarcastic: { weight: -0.4, emotions: ['anger'] },
  obviously: { weight: -0.2, emotions: ['anger'] },
  "sure right": { weight: -0.6, emotions: ['anger'] },
  "yeah right": { weight: -0.7, emotions: ['anger'] },
  concern: { weight: -0.4, emotions: ['concern'] },
  concerned: { weight: -0.45, emotions: ['concern'] },
  worried: { weight: -0.5, emotions: ['concern'] },
  alarming: { weight: -0.7, emotions: ['concern'] },
  dangerous: { weight: -0.8, emotions: ['concern', 'fear'] },
  fear: { weight: -0.8, emotions: ['fear'] },
  afraid: { weight: -0.8, emotions: ['fear'] },
  uncertainty: { weight: -0.45, emotions: ['concern'] },
  scared: { weight: -0.8, emotions: ['fear'] },
  terrified: { weight: -0.9, emotions: ['fear'] },
  hope: { weight: 0.8, emotions: ['hope'] },
  expected: { weight: 0.35, emotions: ['hope'] },
  reassuring: { weight: 0.65, emotions: ['hope'] },
  returned: { weight: 0.7, emotions: ['joy'] },
  restored: { weight: 0.85, emotions: ['joy'] },
  restoration: { weight: 0.55, emotions: ['hope'] },
  relieved: { weight: 0.8, emotions: ['joy'] },
  relief: { weight: 0.8, emotions: ['joy'] },
  smoothly: { weight: 0.5, emotions: ['joy'] },
  easier: { weight: 0.45, emotions: ['joy'] },
  welcome: { weight: 0.5, emotions: ['joy'] },
  clear: { weight: 0.3, emotions: ['hope'] },
  joy: { weight: 0.8, emotions: ['joy'] },
  happy: { weight: 0.7, emotions: ['joy'] },
  sad: { weight: -0.6, emotions: ['sadness'] },
  sadness: { weight: -0.7, emotions: ['sadness'] },
  disappointed: { weight: -0.65, emotions: ['sadness'] },
  disappointing: { weight: -0.6, emotions: ['sadness'] },
  shocked: { weight: -0.4, emotions: ['surprise'] },
  surprised: { weight: -0.25, emotions: ['surprise'] },
  surprising: { weight: -0.2, emotions: ['surprise'] },
  better: { weight: 0.5, emotions: ['hope', 'positive'] },
  improve: { weight: 0.6, emotions: ['hope', 'positive'] },
  positive: { weight: 0.8, emotions: ['joy'] },
  good: { weight: 0.6, emotions: ['joy'] },
  great: { weight: 0.8, emotions: ['joy'] },
  awesome: { weight: 0.9, emotions: ['joy'] },
  excellent: { weight: 0.9, emotions: ['joy'] },
  bad: { weight: -0.6, emotions: ['concern'] },
  terrible: { weight: -0.8, emotions: ['anger'] },
  awful: { weight: -0.8, emotions: ['anger'] },
  horrible: { weight: -0.9, emotions: ['anger'] },
  // News/alert/disaster vocabulary
  urgent: { weight: -0.6, emotions: ['concern'] },
  alert: { weight: -0.5, emotions: ['concern'] },
  worry: { weight: -0.55, emotions: ['concern'] },
  upset: { weight: -0.65, emotions: ['anger'] },
  usable: { weight: 0.45, emotions: ['hope'] },
  unusable: { weight: -0.6, emotions: ['concern'] },
  warning: { weight: -0.6, emotions: ['concern', 'fear'] },
  feared: { weight: -0.7, emotions: ['fear', 'concern'] },
  evacuate: { weight: -0.7, emotions: ['fear', 'concern'] },
  "seek higher ground": { weight: -0.8, emotions: ['fear', 'concern'] },
  disaster: { weight: -0.8, emotions: ['fear', 'concern'] },
  outage: { weight: -0.5, emotions: ['concern'] },
  "widespread outage": { weight: -0.7, emotions: ['concern'] },
  earthquake: { weight: -0.4, emotions: ['concern'] },
  storm: { weight: -0.4, emotions: ['concern'] },
  crisis: { weight: -0.7, emotions: ['concern', 'fear'] },
  collapse: { weight: -0.7, emotions: ['fear', 'concern'] },
  historic: { weight: 0.5, emotions: ['positive'] },
  breakthrough: { weight: 0.8, emotions: ['positive', 'hope'] },
  approved: { weight: 0.4, emotions: ['positive'] },

  // Hindi
  gussa: { weight: -0.8, emotions: ['anger'] },
  nafrat: { weight: -1.0, emotions: ['anger'] },
  ghatiya: { weight: -0.8, emotions: ['anger', 'negative'] },
  sahyog: { weight: 0.8, emotions: ['support'] },
  himmat: { weight: 0.7, emotions: ['support', 'hope'] },
  mazaak: { weight: -0.3, emotions: ['sarcasm'] },
  chinta: { weight: -0.5, emotions: ['concern'] },
  dar: { weight: -0.8, emotions: ['fear'] },
  khatarnak: { weight: -0.8, emotions: ['fear', 'concern'] },
  ummeed: { weight: 0.8, emotions: ['hope'] },
  badiya: { weight: 0.7, emotions: ['positive'] },

  // Hinglish
  bc: { weight: -0.9, emotions: ['anger'] },
  mc: { weight: -0.9, emotions: ['anger'] },
  bakwas: { weight: -0.7, emotions: ['negative', 'anger'] },
  jhooth: { weight: -0.6, emotions: ['negative'] },
  "sahi hai": { weight: 0.6, emotions: ['positive'] },
  accha: { weight: 0.5, emotions: ['positive'] },
  theek: { weight: 0.3, emotions: ['positive'] },
  "kya baat": { weight: 0.7, emotions: ['positive'] },
  ekdum: { weight: 0.5, emotions: ['positive'] },
  bahut: { weight: 0.2, emotions: ['positive'] },
  "kab tak": { weight: -0.4, emotions: ['concern'] },
  pagal: { weight: -0.6, emotions: ['anger'] },
  chutiya: { weight: -0.9, emotions: ['anger'] }
};

const negations = ['not', 'no', 'never', 'nahi', 'na', 'nhi', "don't", "doesn't", "didn't", "won't", "can't"];

export function analyzeSentiment(text: string): { label: 'positive' | 'negative' | 'neutral' | 'mixed'; score: number; emotions: string[] } {
  const words = text.toLowerCase().replace(/[.,!?'"]/g, ' ').split(/\s+/).filter(w => w.length > 0);

  let score = 0;
  let wordCount = 0;
  const foundEmotions = new Set<string>();
  const emotionStrength = new Map<string, number>();

  let isNegated = false;
  let posCount = 0;
  let negCount = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (negations.includes(word)) {
      isNegated = true;
      continue;
    }

    // Check bigrams
    let match = null;
    if (i < words.length - 1) {
      const bigram = `${word} ${words[i + 1]}`;
      if (lexicon[bigram]) {
        match = lexicon[bigram];
        i++; // skip next word
      }
    }

    if (!match && lexicon[word]) {
      match = lexicon[word];
    }

    if (match) {
      let w = match.weight;
      if (isNegated) {
        w = -w;
      }

      score += w;
      wordCount++;

      if (w > 0) posCount++;
      if (w < 0) negCount++;

      match.emotions.forEach(e => {
        foundEmotions.add(e);
        emotionStrength.set(e, (emotionStrength.get(e) || 0) + Math.abs(w));
      });

      isNegated = false;
    }
  }

  let finalScore = 0;
  if (wordCount > 0) {
    finalScore = score / wordCount;
  }
  // Clamp between -1 and 1
  finalScore = Math.max(-1, Math.min(1, finalScore));

  let label: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';

  if (posCount > 0 && negCount > 0 && Math.abs(posCount - negCount) <= 1) {
    label = 'mixed';
  } else if (finalScore > 0.02) {
    label = 'positive';
  } else if (finalScore < -0.02) {
    label = 'negative';
  }

  return {
    label,
    score: finalScore,
    // Keep a single dominant emotion per post so emotion totals reconcile to
    // the analyzed dataset instead of counting one post in several categories.
    emotions: Array.from(foundEmotions).sort((a, b) => (emotionStrength.get(b) || 0) - (emotionStrength.get(a) || 0)).slice(0, 1)
  };
}

export function analyzeAllSentiments(posts: Post[]): SentimentResult[] {
  return posts.map(post => {
    const { label, score, emotions } = analyzeSentiment(post.text);
    return {
      post,
      label,
      score,
      emotions
    };
  });
}

export function getSentimentSummary(results: SentimentResult[]): { positive: number; negative: number; neutral: number; mixed: number; topEmotions: string[]; emotionCounts: Record<string, number> } {
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  let mixed = 0;
  const emotionCounts: Record<string, number> = {};

  results.forEach(res => {
    if (res.label === 'positive') positive++;
    else if (res.label === 'negative') negative++;
    else if (res.label === 'neutral') neutral++;
    else if (res.label === 'mixed') mixed++;

    res.emotions.forEach(e => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });
    if (res.emotions.length === 0) emotionCounts['neutral/other'] = (emotionCounts['neutral/other'] || 0) + 1;
  });

  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0]);

  return { positive, negative, neutral, mixed, topEmotions, emotionCounts };
}
