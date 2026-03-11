const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../../../models/ModerationCase');
const { successEmbed, errorEmbed, createEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'warn',
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption((o) => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the warning'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const lastCase = await ModerationCase.findOne({ guildId: interaction.guild.id }).sort({ caseNumber: -1 });
    const caseNumber = (lastCase?.caseNumber || 0) + 1;

    await ModerationCase.create({
      guildId: interaction.guild.id, caseNumber, userId: target.id,
      moderatorId: interaction.user.id, action: 'warn', reason,
    });

    const warnCount = await ModerationCase.countDocuments({
      guildId: interaction.guild.id, userId: target.id, action: 'warn', active: true,
    });

    try { await target.send({ embeds: [createEmbed({ color: Colors.WARNING, title: '⚠️ Warning', description: `You were warned in **${interaction.guild.name}**.\n**Reason:** ${reason}\n**Total Warnings:** ${warnCount}` })] }); } catch { }

    await interaction.reply({ embeds: [successEmbed(`**${target.tag}** has been warned (Case #${caseNumber}).\n**Reason:** ${reason}\n**Total Warnings:** ${warnCount}`)] });
  },
};
