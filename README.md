<p align="center">
  <h1 align="center">Nexora</h1>
  <p align="center">Premium all-in-one Discord bot — security, temp voice, tickets, moderation</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node.js-18+-339933?style=flat-square" />
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square" />
  <img src="https://img.shields.io/badge/mongodb-8-47A248?style=flat-square" />
</p>

---

## Overview

Nexora is the bot runtime and schema source of truth for a premium Discord experience. It owns all business logic, guild configuration, security enforcement, temp voice management, and ticket workflows.

An external dashboard connects to the same MongoDB instance to provide web-based configuration. This repository contains the bot service only.

## Core Features

**Security Engine** — Multi-layer detection (spam, raid, scam, invites, links, mass mentions, caps, emoji flooding), risk scoring, graduated action pipeline (delete → warn → timeout → kick → ban → quarantine), configurable bypass roles/channels/users, and real-time security logging. Default enforcement favors warn/timeout over aggressive actions.

**Temporary Voice** — Join-to-create rooms with race-condition-safe creation, owner control panel (rename, lock, hide, limit, permit, deny, kick, claim, transfer), automatic cleanup of empty and ghost rooms, duplicate prevention.

**Ticket System** — Category-based panel with select menu, role-scoped permissions, close/reopen/claim/delete workflow, transcript generation, and full event logging.

**Moderation** — Ban, kick, timeout, warn, purge with hierarchy enforcement, DM notifications, and persistent case tracking.

**Setup Wizard** — Interactive configuration with server type presets (community, gaming, shop, creator, support) and tiered security levels.

**Prefix Commands** — Member-facing utilities: `help`, `ping`, `avatar`, `serverinfo`.

**Localization** — i18n engine supporting English, French, Arabic, Spanish, Portuguese, and German.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Bot Framework | discord.js v14 |
| Database | MongoDB / Mongoose |
| Auth | Discord Bot Token |

## Project Structure

```
bot/
├── src/
│   ├── index.js
│   ├── deploy-commands.js
│   ├── config/
│   ├── constants/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   │   ├── GuildConfig.js
│   │   ├── SecurityConfig.js
│   │   ├── ModerationCase.js
│   │   ├── TempVoice.js
│   │   ├── Ticket.js
│   │   └── Modules.js
│   ├── modules/
│   │   ├── security/
│   │   ├── tempvoice/
│   │   ├── tickets/
│   │   ├── setup/
│   │   ├── welcome/
│   │   ├── autorole/
│   │   ├── leveling/
│   │   └── verification/
│   ├── commands/
│   │   ├── slash/
│   │   └── prefix/
│   ├── events/
│   ├── services/
│   └── utils/
└── locales/
```

## Shared Database Schema

This repo is the schema owner. Key collections:

| Collection | Purpose |
|-----------|---------|
| `guildconfigs` | Master guild settings, module toggles, prefix, language |
| `securityconfigs` | Per-guild security filter configuration |
| `moderationcases` | Moderation action history |
| `tempvoiceconfigs` | Temp voice channel settings |
| `tempvoicerooms` | Active temp voice room state |
| `ticketconfigs` | Ticket system configuration |
| `tickets` | Individual ticket records |

An external dashboard can read/write these collections directly to provide web-based configuration.

## Design Direction

- Dark purple brand palette (`#7C3AED` primary, `#0F0B1A` background)
- Consistent branded embeds and button layouts
- Premium SaaS aesthetic across all interfaces

## Development Status

| Module | Status |
|--------|--------|
| Security Engine | ✅ Stable |
| Temp Voice | ✅ Stable |
| Ticket System | ✅ Stable |
| Setup Wizard | ✅ Stable |
| Moderation Suite | ✅ Stable |
| Prefix Commands | ✅ Stable |
| Localization Engine | ✅ Stable |
| Welcome / Autorole | ⏳ Deferred |
| Leveling / XP | ⏳ Deferred |
| Music | 🔲 Planned |

## License

MIT
