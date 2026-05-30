export type ResourceType = 'docs' | 'video' | 'practice';

export interface VerifiedResource {
  title: string;
  url: string;
  type: ResourceType;
  topics: string[];
}

export const VERIFIED_RESOURCES: VerifiedResource[] = [
  // HTML
  { title: "MDN: HTML Basics", url: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics", type: "docs", topics: ["html", "basics", "web"] },
  { title: "HTML Full Course (freeCodeCamp)", url: "https://www.youtube.com/results?search_query=html+full+course+freecodecamp", type: "video", topics: ["html", "basics", "web"] },
  { title: "freeCodeCamp: Responsive Web Design", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/", type: "practice", topics: ["html", "css", "web"] },
  
  // CSS
  { title: "MDN: CSS Basics", url: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/CSS_basics", type: "docs", topics: ["css", "styling", "flexbox", "grid"] },
  { title: "CSS Full Course (freeCodeCamp)", url: "https://www.youtube.com/results?search_query=css+full+course+freecodecamp", type: "video", topics: ["css", "styling", "flexbox", "grid"] },
  
  // JS
  { title: "JavaScript.info", url: "https://javascript.info/", type: "docs", topics: ["javascript", "js", "dom", "es6"] },
  { title: "MDN: JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", type: "docs", topics: ["javascript", "js", "dom", "es6"] },
  { title: "JavaScript Full Course (freeCodeCamp)", url: "https://www.youtube.com/results?search_query=javascript+full+course+freecodecamp", type: "video", topics: ["javascript", "js", "dom", "es6"] },
  { title: "freeCodeCamp: JavaScript Algorithms", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/", type: "practice", topics: ["javascript", "js", "algorithms", "dsa"] },
  
  // Git / GitHub
  { title: "GitHub Docs", url: "https://docs.github.com/en/get-started", type: "docs", topics: ["git", "github", "version control"] },
  { title: "Git and GitHub for Beginners", url: "https://www.youtube.com/results?search_query=git+and+github+for+beginners+freecodecamp", type: "video", topics: ["git", "github", "version control"] },
  { title: "Learn Git Branching", url: "https://learngitbranching.js.org/", type: "practice", topics: ["git", "version control"] },
  
  // React
  { title: "React Official Docs", url: "https://react.dev/learn", type: "docs", topics: ["react", "hooks", "frontend"] },
  { title: "React Full Course", url: "https://www.youtube.com/results?search_query=react+full+course+freecodecamp", type: "video", topics: ["react", "hooks", "frontend"] },
  { title: "React Tic-Tac-Toe Tutorial", url: "https://react.dev/learn/tutorial-tic-tac-toe", type: "practice", topics: ["react", "frontend"] },

  // Next.js
  { title: "Next.js Docs", url: "https://nextjs.org/docs", type: "docs", topics: ["nextjs", "next.js", "react", "ssr"] },
  { title: "Next.js Full Course", url: "https://www.youtube.com/results?search_query=next.js+full+course+freecodecamp", type: "video", topics: ["nextjs", "next.js", "react"] },
  { title: "Next.js Dashboard App Tutorial", url: "https://nextjs.org/learn", type: "practice", topics: ["nextjs", "next.js", "react", "fullstack"] },

  // Node.js & Express
  { title: "Node.js Docs", url: "https://nodejs.org/en/learn", type: "docs", topics: ["node.js", "nodejs", "backend", "express"] },
  { title: "Express.js Docs", url: "https://expressjs.com/en/starter/installing.html", type: "docs", topics: ["node.js", "nodejs", "backend", "express"] },
  { title: "Node.js and Express Course", url: "https://www.youtube.com/results?search_query=node.js+express+full+course+freecodecamp", type: "video", topics: ["node.js", "nodejs", "backend", "express"] },

  // Supabase & PostgreSQL
  { title: "Supabase Docs", url: "https://supabase.com/docs", type: "docs", topics: ["supabase", "database", "backend", "postgres", "auth"] },
  { title: "PostgreSQL Tutorial", url: "https://www.postgresqltutorial.com/", type: "docs", topics: ["postgresql", "postgres", "sql", "database"] },
  { title: "Supabase Crash Course", url: "https://www.youtube.com/results?search_query=supabase+crash+course", type: "video", topics: ["supabase", "database", "auth"] },

  // APIs
  { title: "MDN: Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API", type: "docs", topics: ["api", "apis", "fetch", "rest"] },
  { title: "APIs for Beginners", url: "https://www.youtube.com/results?search_query=apis+for+beginners+freecodecamp", type: "video", topics: ["api", "apis", "rest"] },

  // Deployment
  { title: "Vercel Docs", url: "https://vercel.com/docs", type: "docs", topics: ["deployment", "vercel", "hosting"] },
  
  // General Web Dev
  { title: "The Odin Project", url: "https://www.theodinproject.com/", type: "practice", topics: ["fullstack", "web dev", "project"] },
  { title: "Roadmap.sh", url: "https://roadmap.sh/", type: "docs", topics: ["roadmap", "career", "overview"] },

  // Career / Interview
  { title: "Tech Interview Handbook", url: "https://www.techinterviewhandbook.org/", type: "docs", topics: ["interview", "resume", "career", "dsa"] },
  { title: "Cracking the Coding Interview Prep", url: "https://www.youtube.com/results?search_query=cracking+the+coding+interview", type: "video", topics: ["interview", "dsa", "algorithms"] },
  { title: "LeetCode", url: "https://leetcode.com/", type: "practice", topics: ["interview", "dsa", "algorithms", "practice"] }
];
