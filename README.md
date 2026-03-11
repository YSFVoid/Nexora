<p align="center">
  <h1 align="center">Nexora</h1>
  <p align="center">Premium all-in-one Discord bot with real-time dashboard</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node.js-18+-339933?style=flat-square" />
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square" />
  <img src="https://img.shields.io/badge/next.js-14-000000?style=flat-square" />
  <img src="https://img.shields.io/badge/mongodb-8-47A248?style=flat-square" />
</p>

---

## Overview

Nexora is a production-grade Discord bot and web dashboard designed for server operators who demand reliability, control, and polish. It combines deep security automation, voice and ticket infrastructure, and a fully integrated management dashboard — all unified under a dark purple SaaS identity.

Built for real workloads. No compromises.

## Core Features

**Security Engine** — Multi-layer detection (spam, raid, scam, invites, links, mass mentions, caps, emoji flooding), risk scoring, graduated action pipeline (delete → warn → timeout → kick → ban → quarantine), bypass system, and real-time security logging.

**Temporary Voice** — Join-to-create rooms with race-condition-safe creation, owner control panel (rename, lock, hide, limit, permit, deny, kick, claim, transfer), automatic cleanup of empty and ghost rooms.

**Ticket System** — Category-based panel with select menu, role-scoped permissions, close/reopen/claim/delete workflow, transcript generation, and full event logging.

**Setup Wizard** — Interactive configuration flow with server type presets (community, gaming, shop, creator, support), tiered security levels, and smart module defaults.

**Moderation** — Ban, kick, timeout, warn, purge with hierarchy enforcement, DM notifications, and persistent case tracking.

**Additional Modules** — Welcome/goodbye messages, autorole with delay, XP leveling with role rewards, button-based verification, suggestion system, multi-channel logging.

**Dashboard** — Next.js 14 web application with Discord OAuth, guild selection, security toggle management, module configuration, and general settings — connected to the same MongoDB instance as the bot.

**Localization** — Full i18n engine supporting English, French, Arabic, Spanish, Portuguese, and German.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Bot Framework | discord.js v14 |
| Database | MongoDB / Mongoose |
| Dashboard | Next.js 14, React, NextAuth.js |
| Styling | Vanilla CSS (dark purple design system) |

## Project Structure

```
Nexora/
├── bot/
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   ├── constants/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── modules/
│   │   │   ├── security/
│   │   │   ├── tempvoice/
│   │   │   ├── tickets/
│   │   │   ├── setup/
│   │   │   ├── welcome/
│   │   │   ├── autorole/
│   │   │   ├── leveling/
│   │   │   └── verification/
│   │   ├── commands/slash/
│   │   ├── events/
│   │   ├── services/
│   │   └── utils/
│   └── locales/
├── dashboard/
│   ├── app/
│   ├── lib/
│   └── styles/
└── .env.example
```

## Design Direction

- Dark purple brand palette (`#7C3AED` primary, `#0F0B1A` background)
- Premium SaaS aesthetic across all interfaces
- Consistent branded embeds, button layouts, and panel designs
- Dashboard mirrors the bot's visual identity with glassmorphism and micro-animations

## Development Status

| Module | Status |
|--------|--------|
| Security Engine | ✅ Complete |
| Temp Voice | ✅ Complete |
| Ticket System | ✅ Complete |
| Setup Wizard | ✅ Complete |
| Moderation Suite | ✅ Complete |
| Welcome / Autorole | ✅ Complete |
| Leveling / XP | ✅ Complete |
| Verification | ✅ Complete |
| Localization (6 langs) | ✅ Complete |
| Dashboard | ✅ Complete |

## License

MIT
