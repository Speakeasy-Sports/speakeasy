# Speakeasy Sports

Public content site for Speakeasy Sports at speakeasysports.com. Next.js App Router, Sanity, Tailwind v4, Vercel. Conversation lives in Circle.

- `AGENTS.md` is the build spec and working agreement.
- `docs/setup.md` covers the Sanity project, Vercel, env vars, and the local smoke test.
- `docs/circle-api-notes.md` records what the Circle Admin API actually does.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` before a PR.
