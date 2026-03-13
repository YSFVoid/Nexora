const { TempVoiceRoom } = require('../../models/TempVoice');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'voice',
  aliases: ['vc', 'room'],
  description: 'Manage your temp voice room (lock/unlock/rename/limit/kick)',
  async execute(message, args) {
    const action = args[0]?.toLowerCase();
    if (!action) {
      return message.reply({ embeds: [errorEmbed('Usage: `!voice <lock|unlock|rename|limit|hide|unhide|kick> [value]`')] });
    }

    const vc = message.member.voice?.channel;
    if (!vc) return message.reply({ embeds: [errorEmbed('You must be in a voice channel.')] });

    const room = await TempVoiceRoom.findOne({ channelId: vc.id });
    if (!room) return message.reply({ embeds: [errorEmbed('This is not a temp voice room.')] });
    if (room.ownerId !== message.author.id) return message.reply({ embeds: [errorEmbed('You are not the owner of this room.')] });

    try {
      switch (action) {
        case 'lock': {
          await vc.permissionOverwrites.edit(message.guild.id, { Connect: false });
          await TempVoiceRoom.updateOne({ channelId: vc.id }, { locked: true });
          return message.reply({ embeds: [successEmbed('Room **locked**.')]});
        }
        case 'unlock': {
          await vc.permissionOverwrites.edit(message.guild.id, { Connect: null });
          await TempVoiceRoom.updateOne({ channelId: vc.id }, { locked: false });
          return message.reply({ embeds: [successEmbed('Room **unlocked**.')]});
        }
        case 'hide': {
          await vc.permissionOverwrites.edit(message.guild.id, { ViewChannel: false });
          await TempVoiceRoom.updateOne({ channelId: vc.id }, { hidden: true });
          return message.reply({ embeds: [successEmbed('Room is now **hidden**.')]});
        }
        case 'unhide': {
          await vc.permissionOverwrites.edit(message.guild.id, { ViewChannel: null });
          await TempVoiceRoom.updateOne({ channelId: vc.id }, { hidden: false });
          return message.reply({ embeds: [successEmbed('Room is now **visible**.')]});
        }
        case 'rename': {
          const name = args.slice(1).join(' ');
          if (!name) return message.reply({ embeds: [errorEmbed('Provide a name: `!voice rename My Room`')] });
          await vc.setName(name.slice(0, 100));
          await TempVoiceRoom.updateOne({ channelId: vc.id }, { name: name.slice(0, 100) });
          return message.reply({ embeds: [successEmbed(`Room renamed to **${name.slice(0, 100)}**.`)]});
        }
        case 'limit': {
          const limit = parseInt(args[1]);
          if (isNaN(limit) || limit < 0 || limit > 99) return message.reply({ embeds: [errorEmbed('Provide a limit (0-99): `!voice limit 5`')] });
          await vc.setUserLimit(limit);
          await TempVoiceRoom.updateOne({ channelId: vc.id }, { userLimit: limit });
          return message.reply({ embeds: [successEmbed(limit > 0 ? `User limit set to **${limit}**.` : 'User limit removed.')]});
        }
        case 'kick': {
          const target = message.mentions.members.first();
          if (!target) return message.reply({ embeds: [errorEmbed('Mention a user: `!voice kick @user`')] });
          if (target.voice?.channel?.id !== vc.id) return message.reply({ embeds: [errorEmbed('That user is not in your room.')] });
          await target.voice.disconnect('Room owner kicked');
          return message.reply({ embeds: [successEmbed(`**${target.user.tag}** kicked from your room.`)]});
        }
        default:
          return message.reply({ embeds: [errorEmbed('Unknown action. Use: `lock, unlock, rename, limit, hide, unhide, kick`')]});
      }
    } catch (err) {
      return message.reply({ embeds: [errorEmbed(`Failed: ${err.message}`)] });
    }
  },
};
