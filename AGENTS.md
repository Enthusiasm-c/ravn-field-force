<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# RAVN Field Force

> Onboarding doc — read this and `PROJECT_MEMORY.md` (the *why* + gotchas) at session start.

## What this is

An interactive **demo** of a field-sales CRM for an alcohol **distributor (PAN)** in Bali, by Lentera Lab. One story: **visit → order → fulfilment, connected**. Built from the proposal `~/Downloads/ravn_field_force_proposal.html`.

It's a **clickable prototype** (real DB, real flow) — NOT a production pilot. Intentionally out of scope: real GPS, offline sync, ERP, auth/login, photo upload.

> ⚠️ Different product from `~/pulseapp` (JÄGERMEISTER Pulse = MES tracking for a brand team). RAVN was scaffolded fresh, not forked.

## The demo story (seeded, frozen)

Rep **Denis Rahmawan** (Canggu/Seminyak) checks in at **Old Man's** → visit **VST-8842** → order **ORD-4421** (IDR 5,340,000) → Sales Manager **Siti Wulandari**'s order desk → Director **Bayu Hartono**'s dashboard. Switch viewpoints via the floating **SurfaceSwitcher** (bottom-center): Rep / Manager / Director. No login. Demo clock frozen at **2026-04-18 14:52 WITA** (`DEMO_NOW`).

## Stack

Next.js **16.2.6** (App Router, Turbopack) · React **19** · Tailwind **4** (light theme, tokens in `app/globals.css @theme`) · Prisma **5.22** + **Neon Postgres** (Singapore) · **Leaflet + react-leaflet v5** (CartoDB Positron tiles, no key) · fonts Geist + **Fraunces**. No Clerk, no shadcn — hand-built components. Deploy: **Vercel** (`denisdoms-projects/ravn-field-force`).

> Prisma is pinned to **5.22, not 7** — v7 removed `url` from the schema datasource and needs driver adapters. Don't "upgrade" it.

## Routes

```
/                        Launcher
/rep/outlets             Mobile: route of the day (PhoneFrame)
/rep/visit/[code]        Mobile: visit capture (GPS/photos/competitors) — VST-8842
/rep/po/new?visit=CODE   Mobile: PO builder
/console/dashboard       Director: KPIs, real Bali map, leaderboard, activity
/console/orders          Manager: order desk (queue + detail panel)
/console/outlets         Outlet master (clickable rows)
/console/outlets/[id]    Outlet detail: sales trend, mix, map, history
/console/reps            Rep list (clickable cards)
/console/reps/[id]       Rep detail: trend, top outlets, recent sales
```

## Data model (`prisma/schema.prisma`)

`Rep` · `Outlet` · `Product`(SKU) · `Visit` · `Order` + `OrderLine`.
Enums `OutletType`, `OrderStatus`. `Visit.photos`/`Visit.competitors` are `Json`. `Order.visitId` unique.

## Seed (`prisma/seed.ts`)

5 reps · 5 products · **48 outlets** (9 hero + 39 real Bali venues) · **7 months history** (Oct'25→Apr'26, varied trends) ≈ 336 historical orders + 337 visits · **10 "today" hero orders** = the live desk. Reseed: `npm run db:seed` (wipes + repopulates, idempotent).

## Key files

- `lib/db.ts` — Prisma singleton
- `lib/utils.ts` — `formatIDR`, `compactIDR`, `formatDistance`, `freshness`, `DEMO_NOW`, `DEMO_DAY_START`
- `lib/demo.ts` — presentation constants (`HEADLINE`, `LEADERBOARD`, `PIN` hex, `STATUS_META`, `photoSrc`)
- `app/actions.ts` — `confirmOrder`, `rejectOrder`, `moveToDelivery`, `updateOrderLines`
- `components/map/{leaflet-map,map-view}.tsx` — real map (dynamic `ssr:false`)
- `components/sales-trend.tsx` — monthly bar chart
- `public/photos/*.jpg` — real visit photos (served locally)

## Design language

Light premium. `--ice` (blue distance/primary), `--glow` (alpenglow amber, stale), `--ok/--danger/--gold`. Classes: `.serif` (Fraunces totals), `.tabular` (mono prices), `.distance`, `.eyebrow`, `.alpenglow`, `.live-dot`. "Fraunces holds the total, mono holds the parts."

## Commands

```bash
npm run dev          # localhost:3000
npm run db:push      # schema → Neon
npm run db:seed      # reseed (wipes)
npm run build        # prisma generate && next build
vercel --prod --yes  # deploy
```

`.env` = `DATABASE_URL` + `DIRECT_URL` (Neon pooled + direct). **`.env` is blocked by a write hook — edit via Bash, not Edit.**

## Deploy

Vercel `denisdoms-projects/ravn-field-force`, same Neon DB. Env set on all 3 environments. `postinstall: prisma generate`. Watch **Deployment Protection** — it returns `401` to the public until disabled in Settings → Deployment Protection.
