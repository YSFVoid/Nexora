const { LevelingConfig, UserLevel } = require('../../models/Modules');
const { getGuildConfig } = require('../../services/configService');
const { createEmbed } = require('../../utils/embeds');
const Colors = require('../../constants/colors');
const logger = require('../../utils/logger');

const xpCooldowns = new Map();

function xpForLevel(level) {
  return 5 * Math.pow(level, 2) + 50 * level + 100;
}

async function processMessage(message) {
  const guildConfig = await getGuildConfig(message.guild.id);
  if (!guildConfig.modules?.leveling) return;

  const config = await LevelingConfig.findOne({ guildId: message.guild.id });
  if (!config?.enabled) return;

  if ((config.ignoredChannels || []).includes(message.channel.id)) return;
  if (message.member.roles.cache.some((r) => (config.ignoredRoles || []).includes(r.id))) return;

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const cooldown = config.xpCooldown || 60000;

  if (xpCooldowns.has(key) && now - xpCooldowns.get(key) < cooldown) return;
  xpCooldowns.set(key, now);

  const min = config.xpPerMessage?.min || 15;
  const max = config.xpPerMessage?.max || 25;
  const xpGain = Math.floor(Math.random() * (max - min + 1)) + min;

  try {
    const user = await UserLevel.findOneAndUpdate(
      { guildId: message.guild.id, userId: message.author.id },
      { $inc: { xp: xpGain, totalMessages: 1 }, lastXpAt: new Date() },
      { upsert: true, new: true }
    );

    const needed = xpForLevel(user.level);
    if (user.xp >= needed) {
      const newLevel = user.level + 1;
      await UserLevel.updateOne(
        { guildId: message.guild.id, userId: message.author.id },
        { level: newLevel, xp: user.xp - needed }
      );

      const announceChannel = config.channelId
        ? message.guild.channels.cache.get(config.channelId)
        : message.channel;

      if (announceChannel) {
        const embed = createEmbed({
          color: Colors.SUCCESS,
          description: `🎉 Congratulations ${message.author}! You reached **Level ${newLevel}**!`,
        });
        await announceChannel.send({ embeds: [embed] }).catch(() => {});
      }

      if (config.roleRewards?.length) {
        const reward = config.roleRewards.find((r) => r.level === newLevel);
        if (reward) {
          const role = message.guild.roles.cache.get(reward.roleId);
          if (role) {
            await message.member.roles.add(role, `[Nexora] Level ${newLevel} reward`).catch(() => {});
          }

          if (!config.stackRoles) {
            for (const r of config.roleRewards) {
              if (r.level < newLevel && r.roleId !== reward.roleId) {
                await message.member.roles.remove(r.roleId).catch(() => {});
              }
            }
          }
        }
      }
    }
  } catch (err) {
    logger.error('Leveling', `XP processing error: ${err.message}`);
  }
}

module.exports = { processMessage, xpForLevel };
