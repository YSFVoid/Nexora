<div align="center">

# Nexora

**Premium All-in-One Discord Bot**

A stable, production-grade Discord bot backend with dark purple branding, modular architecture, and external dashboard compatibility.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square&logo=discord)](https://discord.js.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)

</div>

---

## Features

### 🛡️ Security System
Full `/security` command group — anti-spam, anti-raid, anti-link, anti-invite, anti-mass-mention, anti-caps, anti-emoji-spam, anti-scam, bypass management, and security logging. Configurable per guild with a "warn first" philosophy.

### 🔊 Temporary Voice
Create-on-join voice rooms with a dedicated control panel. Members manage rooms via buttons or `!voice` prefix commands (lock, unlock, rename, limit, hide, kick). Stable cleanup, no ghost rooms.

### 🎫 Ticket System
Select-menu ticket creation with full admin config: `/ticket category-add`, `/ticket staff-role`, `/ticket log-channel`, `/ticket transcript-channel`, `/ticket max-tickets`. Idempotent panel deployment.

### 🎵 Music
Real music playback via `@discordjs/voice` and `play-dl`. Queue management, skip, stop, now-playing display, auto-disconnect on idle.

### ⚙️ Setup Wizard
Multi-step production wizard: server type → security level → language. Smart presets for community, gaming, shop, creator, and support servers. All next-step references point to real, working commands.

### 🌐 Localization
6 languages: English, French, Arabic, Spanish, Portuguese, German. Core flow translations for security, tickets, temp voice, music, welcome, and leveling.

### 📦 All-in-One Modules
| Module | Slash Command | Status |
|--------|--------------|--------|
| Welcome | `/welcome` | ✅ Active |
| Autorole | `/autorole` | ✅ Active |
| Leveling | `/leveling` | ✅ Active |
| Verification | `/verification` | ✅ Active |
| Suggestions | `/suggestions` | ✅ Active |
| Logging | `/logging` | ✅ Active |
| Moderation | `/ban` `/kick` `/warn` `/timeout` `/purge` `/cases` | ✅ Active |

---

## External Dashboard

The dashboard is a **separate project** that connects to the same MongoDB Atlas database. It reads and writes the same schemas defined in this bot's models. This repo is the bot backend only.

---

<div align="center">
<sub>Built with precision. Powered by Nexora.</sub>
</div>
