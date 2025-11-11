## Changelogy

Changelogy is a minimal changelog generator. Paste your release notes and instantly publish a polished, shareable page—no accounts, no dashboards to maintain.

### Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 & shadcn/ui components
- Prisma ORM with PostgreSQL
- Markdown rendering via `react-markdown` and `remark-gfm`

### Project Structure

- Landing page at `/` with a CTA to the dashboard
- Dashboard at `/dashboard` for creating a changelog entry
- Public changelog page at `/c/[id]` with Markdown rendering and a pre-filled “Share on X” link

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database (local or hosted)

### Environment

Create a `.env` file using the provided sample:

```bash
cp .env.example .env
```

Update `DATABASE_URL` to point to your PostgreSQL instance.

### Setup & Development

```bash
pnpm install
npx prisma generate
npx prisma migrate dev
pnpm dev
```

The development server runs on [http://localhost:3000](http://localhost:3000).

### Deployment Notes

- Ensure `DATABASE_URL` is set in the deployment environment.
- Optionally configure `NEXT_PUBLIC_APP_URL` so share links resolve to your production domain.
- Run `npx prisma migrate deploy` during deployment to apply schema changes.
