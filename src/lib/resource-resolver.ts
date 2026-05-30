import { VERIFIED_RESOURCES, ResourceType, VerifiedResource } from '@/constants/verified-resources';

const ALLOWED_DOMAINS = [
  'developer.mozilla.org',
  'javascript.info',
  'react.dev',
  'nextjs.org',
  'nodejs.org',
  'expressjs.com',
  'supabase.com',
  'vercel.com',
  'github.com',
  'docs.github.com',
  'postgresqltutorial.com',
  'theodinproject.com',
  'roadmap.sh',
  'freecodecamp.org',
  'youtube.com',
  'techinterviewhandbook.org',
  'leetcode.com',
  'learngitbranching.js.org'
];

/**
 * Checks if a URL belongs to a safe domain.
 */
function isDomainAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * Given an AI topic intent, resolves 3 verified resources (1 docs, 1 video, 1 practice)
 */
export function resolveResourcesForTopic(topicIntent: string): { title: string; url: string }[] {
  const normalizedTopic = topicIntent.toLowerCase();
  
  // Find matching resources from our verified list
  const matches = VERIFIED_RESOURCES.filter(r => 
    r.topics.some(t => normalizedTopic.includes(t)) || 
    normalizedTopic.includes(r.title.toLowerCase())
  );

  const getBestMatch = (type: ResourceType, fallbackTitle: string, fallbackUrl: string) => {
    const typedMatches = matches.filter(m => m.type === type);
    if (typedMatches.length > 0) {
      return { title: typedMatches[0].title, url: typedMatches[0].url };
    }
    return { title: fallbackTitle, url: fallbackUrl };
  };

  const safeSearchQuery = encodeURIComponent(`${topicIntent} full course or tutorial`);

  return [
    getBestMatch('docs', `MDN Search: ${topicIntent}`, `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(topicIntent)}`),
    getBestMatch('video', `${topicIntent} (YouTube)`, `https://www.youtube.com/results?search_query=${safeSearchQuery}`),
    getBestMatch('practice', `freeCodeCamp: ${topicIntent}`, `https://www.freecodecamp.org/learn`)
  ];
}

/**
 * Resolves a single resource from AI intent
 */
export function resolveSingleResource(topicIntent: string, type: ResourceType, titleFallback: string): { title: string; url: string } {
  const normalizedTopic = topicIntent.toLowerCase();
  const matches = VERIFIED_RESOURCES.filter(r => 
    r.type === type && (r.topics.some(t => normalizedTopic.includes(t)) || normalizedTopic.includes(r.title.toLowerCase()))
  );

  if (matches.length > 0) {
    return { title: matches[0].title, url: matches[0].url };
  }

  const safeSearchQuery = encodeURIComponent(`${topicIntent} tutorial`);
  
  if (type === 'docs') {
    return { title: titleFallback, url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(topicIntent)}` };
  } else if (type === 'video') {
    return { title: titleFallback, url: `https://www.youtube.com/results?search_query=${safeSearchQuery}` };
  } else {
    return { title: titleFallback, url: `https://www.freecodecamp.org/learn` };
  }
}

/**
 * Repairs existing DB resources: ensures they are from allowed domains or replaces them.
 */
export function sanitizeLegacyResources(resources: { title: string; url: string }[]): { title: string; url: string }[] {
  if (!resources || !Array.isArray(resources)) return [];

  return resources.map((res, index) => {
    if (isDomainAllowed(res.url)) {
      // If it's a direct youtube video link, we might still want to convert to search if we suspect fake links,
      // but let's assume valid domains are okay for now unless it's a 404. Since we can't check 404s sync,
      // we just trust allowed domains. However, user specifically mentioned "No fake YouTube links", 
      // "No freeCodeCamp 404 article guesses". AI often guesses /news/ or /watch?v= fake ids.
      
      // Let's force YouTube links to search if they look generated and are specific videos
      if (res.url.includes('youtube.com/watch')) {
        return {
          title: res.title,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(res.title + ' tutorial')}`
        };
      }
      // Force freecodecamp articles to main learn page since articles often 404
      if (res.url.includes('freecodecamp.org/news')) {
        return {
          title: res.title,
          url: `https://www.youtube.com/results?search_query=freecodecamp+${encodeURIComponent(res.title)}`
        };
      }
      return res;
    }

    // Unsafe or unknown domain -> replace based on typical index
    const safeSearchQuery = encodeURIComponent(`${res.title} tutorial`);
    if (index === 0) {
      return { title: `Docs: ${res.title}`, url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(res.title)}` };
    } else if (index === 1) {
      return { title: `Video: ${res.title}`, url: `https://www.youtube.com/results?search_query=${safeSearchQuery}` };
    } else {
      return { title: `Practice: ${res.title}`, url: `https://www.freecodecamp.org/learn` };
    }
  });
}
