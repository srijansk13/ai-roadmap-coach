This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment Preparation

This application relies on Supabase for the database and authentication, and the Gemini API for AI roadmap generation. To deploy to production, follow these steps:

1. **Create a Supabase Project**:
   - Go to [Supabase](https://supabase.com/) and create a new project.
   - Wait for the database to provision.

2. **Run Migrations**:
   - In your Supabase SQL Editor, run all the required database migrations (tables for `profiles`, `roadmaps`, `roadmap_sections`, `roadmap_levels`, `roadmap_tasks`, and `achievements`).

3. **Configure Environment Variables**:
   - In your Vercel project settings, add the following Environment Variables exactly as they appear in `.env.example`:
     - `NEXT_PUBLIC_SUPABASE_URL` (From Supabase Project Settings -> API)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (From Supabase Project Settings -> API)
     - `GEMINI_API_KEY` (From Google AI Studio)

4. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel and trigger a deployment. The app uses Next.js and will automatically build using `npm run build`.
