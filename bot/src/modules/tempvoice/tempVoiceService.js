const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { TempVoiceConfig, TempVoiceRoom } = require('../../models/TempVoice');
const { getGuildConfig } = require('../../services/configService');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const Colors = require('../../constants/colors');
const Emojis = require('../../constants/emojis');
const logger = require('../../utils/logger');

const creationLock = new Set();
const configCache = new Map();

async function getConfig(guildId) {
  const cached = configCache.get(guildId);
  if (cached && Date.now() - cached._cachedAt < 300000) return cached;

  let config = await TempVoiceConfig.findOne({ guildId });
  if (!config) return null;

  const obj = config.toObject();
  obj._cachedAt = Date.now();
  configCache.set(guildId, obj);
  return obj;
}

async function handleVoiceStateUpdate(oldState, newState) {
  const guild = newState.guild || oldState.guild;
  const guildConfig = await getGuildConfig(guild.id);
  if (!guildConfig.modules?.tempvoice) return;

  const config = await getConfig(guild.id);
  if (!config || !config.creatorChannelId) return;

  if (newState.channelId === config.creatorChannelId && newState.member) {
    await createTempRoom(newState, config);
  }

  if (oldState.channelId && oldState.channelId !== config.creatorChannelId) {
    await cleanupIfEmpty(oldState, config);
  }
}

async function createTempRoom(voiceState, config) {
  const member = voiceState.member;
  const guild = voiceState.guild;
  const lockKey = `${guild.id}:${member.id}`;

  if (creationLock.has(lockKey)) return;
  creationLock.add(lockKey);

  try {
    const existingRoom = await TempVoiceRoom.findOne({ guildId: guild.id, ownerId: member.id });
    if (existingRoom) {
      const existingChannel = guild.channels.cache.get(existingRoom.channelId);
      if (existingChannel) {
        try { await member.voice.setChannel(existingChannel); } catch { }
        return;
      } else {
        await TempVoiceRoom.deleteOne({ channelId: existingRoom.channelId });
      }
    }

    const name = (config.defaultNameTemplate || "{user}'s Room")
      .replace('{user}', member.displayName)
      .slice(0, 100);

    const channel = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: config.categoryId || null,
      userLimit: config.defaultUserLimit || 0,
      permissionOverwrites: [
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
          ],
        },
      ],
    });

    await TempVoiceRoom.create({
      guildId: guild.id, channelId: channel.id, ownerId: member.id, name,
    });

    try {
      await member.voice.setChannel(channel);
    } catch (err) {
      logger.warn('TempVoice', `Failed to move ${member.user.tag}, cleaning up: ${err.message}`);
      await channel.delete().catch(() => {});
      await TempVoiceRoom.deleteOne({ channelId: channel.id });
      return;
    }

    logger.info('TempVoice', `Created room "${name}" for ${member.user.tag} in ${guild.name}`);
  } catch (err) {
    logger.error('TempVoice', `Failed to create room: ${err.message}`);
  } finally {
    creationLock.delete(lockKey);
  }
}

async function cleanupIfEmpty(voiceState, config) {
  const channelId = voiceState.channelId;
  const room = await TempVoiceRoom.findOne({ channelId });
  if (!room) return;

  const channel = voiceState.guild.channels.cache.get(channelId);
  if (!channel) {
    await TempVoiceRoom.deleteOne({ channelId });
    return;
  }

  if (channel.members.size === 0) {
    if (config.autoDeleteEmpty !== false) {
      const delay = config.autoDeleteDelay || 0;
      if (delay > 0) {
        setTimeout(async () => {
          try {
            const ch = await voiceState.guild.channels.fetch(channelId).catch(() => null);
            if (ch && ch.members.size === 0) {
              await ch.delete().catch(() => {});
              await TempVoiceRoom.deleteOne({ channelId });
            }
          } catch { }
        }, delay);
      } else {
        await channel.delete().catch(() => {});
        await TempVoiceRoom.deleteOne({ channelId });
      }
    }
  }
}

async function handleButton(interaction, action, args) {
  const member = interaction.member;
  const guild = interaction.guild;
  const room = await TempVoiceRoom.findOne({ guildId: guild.id, ownerId: member.id });

  if (action === 'claim') return handleClaim(interaction);

  if (!room) {
    return interaction.reply({ embeds: [errorEmbed('You don\'t have an active voice room.')], ephemeral: true });
  }

  const channel = guild.channels.cache.get(room.channelId);
  if (!channel) {
    await TempVoiceRoom.deleteOne({ channelId: room.channelId });
    return interaction.reply({ embeds: [errorEmbed('Your room no longer exists.')], ephemeral: true });
  }

  switch (action) {
    case 'rename': return showRenameModal(interaction);
    case 'lock': return toggleLock(interaction, channel, room, true);
    case 'unlock': return toggleLock(interaction, channel, room, false);
    case 'hide': return toggleHide(interaction, channel, room, true);
    case 'unhide': return toggleHide(interaction, channel, room, false);
    case 'limit': return showLimitModal(interaction);
    case 'permit': return showUserSelectModal(interaction, 'permit');
    case 'deny': return showUserSelectModal(interaction, 'deny');
    case 'kick': return showUserSelectModal(interaction, 'kick');
    case 'transfer': return showUserSelectModal(interaction, 'transfer');
    default: return interaction.reply({ embeds: [errorEmbed('Unknown action.')], ephemeral: true });
  }
}

async function toggleLock(interaction, channel, room, locked) {
  try {
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: locked ? false : null });
    await TempVoiceRoom.updateOne({ channelId: room.channelId }, { locked });
    await interaction.reply({
      embeds: [successEmbed(locked ? 'Room has been **locked**.' : 'Room has been **unlocked**.')],
      ephemeral: true,
    });
  } catch {
    await interaction.reply({ embeds: [errorEmbed('Failed to update room.')], ephemeral: true });
  }
}

async function toggleHide(interaction, channel, room, hidden) {
  try {
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: hidden ? false : null });
    await TempVoiceRoom.updateOne({ channelId: room.channelId }, { hidden });
    await interaction.reply({
      embeds: [successEmbed(hidden ? 'Room is now **hidden**.' : 'Room is now **visible**.')],
      ephemeral: true,
    });
  } catch {
    await interaction.reply({ embeds: [errorEmbed('Failed to update room.')], ephemeral: true });
  }
}

async function showRenameModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('tempvoice:rename')
    .setTitle('Rename Your Room')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('name').setLabel('New Room Name')
          .setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true)
      )
    );
  await interaction.showModal(modal);
}

async function showLimitModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('tempvoice:limit')
    .setTitle('Set User Limit')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('limit').setLabel('User Limit (0 = no limit)')
          .setStyle(TextInputStyle.Short).setMaxLength(3).setRequired(true).setPlaceholder('0')
      )
    );
  await interaction.showModal(modal);
}

async function showUserSelectModal(interaction, action) {
  const modal = new ModalBuilder()
    .setCustomId(`tempvoice:${action}user`)
    .setTitle(`${action.charAt(0).toUpperCase() + action.slice(1)} User`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('userid').setLabel('User ID or @mention')
          .setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Enter user ID')
      )
    );
  await interaction.showModal(modal);
}

async function handleModal(interaction, action) {
  const room = await TempVoiceRoom.findOne({ guildId: interaction.guild.id, ownerId: interaction.user.id });
  if (!room) {
    return interaction.reply({ embeds: [errorEmbed('You don\'t have an active voice room.')], ephemeral: true });
  }

  const channel = interaction.guild.channels.cache.get(room.channelId);
  if (!channel) {
    await TempVoiceRoom.deleteOne({ channelId: room.channelId });
    return interaction.reply({ embeds: [errorEmbed('Your room no longer exists.')], ephemeral: true });
  }

  switch (action) {
    case 'rename': {
      const name = interaction.fields.getTextInputValue('name').slice(0, 100);
      await channel.setName(name).catch(() => {});
      await TempVoiceRoom.updateOne({ channelId: room.channelId }, { name });
      return interaction.reply({ embeds: [successEmbed(`Room renamed to **${name}**.`)], ephemeral: true });
    }
    case 'limit': {
      const limitStr = interaction.fields.getTextInputValue('limit');
      const limit = Math.max(0, Math.min(99, parseInt(limitStr) || 0));
      await channel.setUserLimit(limit).catch(() => {});
      await TempVoiceRoom.updateOne({ channelId: room.channelId }, { userLimit: limit });
      return interaction.reply({
        embeds: [successEmbed(limit > 0 ? `User limit set to **${limit}**.` : 'User limit removed.')],
        ephemeral: true,
      });
    }
    case 'permituser':
    case 'denyuser':
    case 'kickuser':
    case 'transferuser': {
      const userInput = interaction.fields.getTextInputValue('userid').replace(/[<@!>]/g, '');
      const targetMember = await interaction.guild.members.fetch(userInput).catch(() => null);
      if (!targetMember) {
        return interaction.reply({ embeds: [errorEmbed('User not found.')], ephemeral: true });
      }

      if (action === 'permituser') {
        await channel.permissionOverwrites.edit(targetMember, { Connect: true, ViewChannel: true });
        await TempVoiceRoom.updateOne({ channelId: room.channelId }, { $addToSet: { permitted: targetMember.id } });
        return interaction.reply({ embeds: [successEmbed(`**${targetMember.displayName}** can now join your room.`)], ephemeral: true });
      }
      if (action === 'denyuser') {
        await channel.permissionOverwrites.edit(targetMember, { Connect: false });
        await TempVoiceRoom.updateOne({ channelId: room.channelId }, { $addToSet: { denied: targetMember.id } });
        if (targetMember.voice?.channelId === channel.id) {
          await targetMember.voice.disconnect().catch(() => {});
        }
        return interaction.reply({ embeds: [successEmbed(`**${targetMember.displayName}** has been denied from your room.`)], ephemeral: true });
      }
      if (action === 'kickuser') {
        if (targetMember.voice?.channelId === channel.id) {
          await targetMember.voice.disconnect().catch(() => {});
          return interaction.reply({ embeds: [successEmbed(`**${targetMember.displayName}** has been kicked from your room.`)], ephemeral: true });
        }
        return interaction.reply({ embeds: [errorEmbed('That user is not in your room.')], ephemeral: true });
      }
      if (action === 'transferuser') {
        await TempVoiceRoom.updateOne({ channelId: room.channelId }, { ownerId: targetMember.id });
        await channel.permissionOverwrites.edit(targetMember, {
          Connect: true, ManageChannels: true, MoveMembers: true,
        });
        return interaction.reply({ embeds: [successEmbed(`Room ownership transferred to **${targetMember.displayName}**.`)], ephemeral: true });
      }
    }
    default:
      return interaction.reply({ embeds: [errorEmbed('Unknown action.')], ephemeral: true });
  }
}

async function handleClaim(interaction) {
  const vc = interaction.member.voice?.channel;
  if (!vc) {
    return interaction.reply({ embeds: [errorEmbed('You must be in a voice channel to claim it.')], ephemeral: true });
  }

  const room = await TempVoiceRoom.findOne({ channelId: vc.id });
  if (!room) {
    return interaction.reply({ embeds: [errorEmbed('This is not a temporary voice room.')], ephemeral: true });
  }

  const ownerInChannel = vc.members.has(room.ownerId);
  if (ownerInChannel) {
    return interaction.reply({ embeds: [errorEmbed('The room owner is still in the channel.')], ephemeral: true });
  }

  await TempVoiceRoom.updateOne({ channelId: vc.id }, { ownerId: interaction.user.id });
  await vc.permissionOverwrites.edit(interaction.user, {
    Connect: true, ManageChannels: true, MoveMembers: true, MuteMembers: true, DeafenMembers: true,
  });

  return interaction.reply({ embeds: [successEmbed('You have claimed ownership of this room.')], ephemeral: true });
}

function buildControlPanel() {
  const embed = createEmbed({
    color: Colors.PRIMARY,
    title: `${Emojis.VOICE} Temporary Voice Controls`,
    description: 'Use the buttons below to manage your temporary voice room.\nYou must be the room owner to use these controls.',
    fields: [
      { name: '🔒 Lock/Unlock', value: 'Control who can join', inline: true },
      { name: '👁️ Hide/Unhide', value: 'Toggle room visibility', inline: true },
      { name: '✏️ Rename', value: 'Change room name', inline: true },
      { name: '👥 User Limit', value: 'Set max users', inline: true },
      { name: '✅ Permit/Deny', value: 'Allow or block users', inline: true },
      { name: '👑 Claim/Transfer', value: 'Change room ownership', inline: true },
    ],
  });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tempvoice:rename').setLabel('Rename').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tempvoice:lock').setLabel('Lock').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tempvoice:unlock').setLabel('Unlock').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tempvoice:hide').setLabel('Hide').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tempvoice:unhide').setLabel('Unhide').setEmoji('👀').setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tempvoice:limit').setLabel('User Limit').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tempvoice:permit').setLabel('Permit').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('tempvoice:deny').setLabel('Deny').setEmoji('❌').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('tempvoice:kick').setLabel('Kick').setEmoji('👢').setStyle(ButtonStyle.Danger),
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tempvoice:claim').setLabel('Claim Room').setEmoji('👑').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('tempvoice:transfer').setLabel('Transfer').setEmoji('🔄').setStyle(ButtonStyle.Primary),
  );

  return { embed, components: [row1, row2, row3] };
}

function startCleanupJob(client) {
  setInterval(async () => {
    try {
      const rooms = await TempVoiceRoom.find();
      for (const room of rooms) {
        const guild = client.guilds.cache.get(room.guildId);
        if (!guild) continue;

        const channel = guild.channels.cache.get(room.channelId);
        if (!channel) {
          await TempVoiceRoom.deleteOne({ channelId: room.channelId });
          continue;
        }

        if (channel.members.size === 0) {
          const config = await getConfig(room.guildId);
          if (config?.autoDeleteEmpty !== false) {
            await channel.delete().catch(() => {});
            await TempVoiceRoom.deleteOne({ channelId: room.channelId });
          }
        }
      }
    } catch (err) {
      logger.error('TempVoice', `Cleanup job error: ${err.message}`);
    }
  }, 60000);
}

function invalidateConfigCache(guildId) {
  configCache.delete(guildId);
}

module.exports = {
  handleVoiceStateUpdate, handleButton, handleModal,
  buildControlPanel, startCleanupJob, invalidateConfigCache, getConfig,
};
