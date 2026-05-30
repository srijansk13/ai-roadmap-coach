# 🚀 SkillQuest AI — AI-Powered Career Roadmap Coach

An AI-powered career coaching platform that transforms ambitious goals into structured, gamified learning journeys.

SkillQuest AI combines personalized onboarding, intelligent AI coaching, roadmap generation, progress tracking, achievements, streaks, and a Duolingo-inspired learning experience to help users move from beginner to job-ready with clarity and consistency.

---

## ✨ Features

### 🤖 AI Career Coach

* Professional AI mentor powered by Gemini
* Context-aware conversations
* Personalized guidance based on user goals
* Remembers learning preferences and career objectives
* Dynamic profile updates from conversations

### 🗺️ Personalized Roadmap Generation

* AI-generated learning roadmaps
* Dynamic duration support:

  * 1 Month
  * 2 Months
  * 3 Months
  * Custom timelines
* Goal-specific roadmaps
* Internship-focused learning paths
* Progressive roadmap generation for performance

### 🎮 Gamified Learning Experience

* Duolingo-inspired progression system
* XP rewards
* Global levels
* Achievement badges
* Daily streak tracking
* Boss battles
* World-based progression
* Mission completion system

### 🏰 Interactive Quest Worlds

Each roadmap is divided into themed learning worlds:

* Digital Workshop
* JavaScript Forest
* DOM Lab
* React Kingdom
* Backend City
* Database Vault
* Portfolio Arena
* Interview Castle

Additional advanced worlds are generated for longer roadmaps.

### 📚 Verified Learning Resources

* Official documentation
* High-quality tutorials
* Curated learning references
* Safe resource validation system
* Reliable educational links

### 📊 Progress Analytics

* Learning progress tracking
* Completion percentage
* XP statistics
* Streak monitoring
* Achievement history
* User performance insights

### 🔐 Authentication System

* Secure Supabase Authentication
* Signup & Login
* Protected routes
* Session management
* Persistent user progress

### 🎨 Premium User Experience

* Modern glassmorphism design
* Responsive UI
* Framer Motion animations
* Dynamic roadmap interactions
* Gamified dashboard
* Premium player HUD

---

## 🛠️ Tech Stack

### Frontend

* Next.js 16
* React
* TypeScript
* Tailwind CSS
* Framer Motion
* Lucide Icons

### Backend

* Next.js Route Handlers
* Server Actions
* Gemini AI

### Database & Authentication

* Supabase
* PostgreSQL
* Row Level Security (RLS)

### AI

* Google Gemini 2.5 Flash

### Deployment

* Vercel

---

## 🧠 How It Works

### 1. User Onboarding

Users provide:

* Career goal
* Target role
* Timeline
* Current skill level
* Learning preferences
* Weekly availability

### 2. AI Profile Creation

The system builds a personalized learning profile and stores user context for future coaching interactions.

### 3. Roadmap Generation

The AI generates a structured roadmap with:

* Weekly worlds
* Daily missions
* Learning objectives
* Challenges
* Boss battles
* Verified resources

### 4. Gamified Progression

Users complete missions to:

* Earn XP
* Maintain streaks
* Unlock achievements
* Advance through worlds
* Reach career milestones

### 5. AI Coaching

The coach continuously adapts recommendations based on:

* User progress
* Completed missions
* Skill growth
* Career goals

---

## 📁 Project Structure

```bash
src/
├── app/
│   ├── api/
│   ├── auth/
│   ├── onboarding/
│   ├── dashboard/
│   │   ├── coach/
│   │   ├── roadmaps/
│   │   └── profile/
│   └── page.tsx
│
├── lib/
│   ├── supabase/
│   ├── resource-resolver.ts
│   └── ai-config.ts
│
├── constants/
│   └── verified-resources.ts
│
└── components/
```

## 🚀 Getting Started

### Clone Repository

```bash
git clone <repository-url>
cd ai-roadmap-coach
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

### Run Development Server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## 🔥 Key Highlights

* AI-powered career coaching
* Personalized roadmap generation
* Dynamic timeline support
* Gamified progression system
* Achievement and streak mechanics
* Verified learning resources
* Modern responsive UI
* Production-ready architecture
* Secure authentication
* Scalable roadmap generation

---

## 🎯 Future Improvements

* Team challenges
* Community leaderboards
* AI interview simulator
* Resume analysis integration
* Job matching engine
* Mentor marketplace
* Mobile application
* Advanced analytics

---

## 📄 License

This project is developed for educational, portfolio, and internship demonstration purposes.

---

### Built with ❤️ using Next.js, Supabase, Gemini AI, and TypeScript.
