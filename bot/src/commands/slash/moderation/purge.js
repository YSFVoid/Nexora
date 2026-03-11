const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');

module.exports = {
  name: 'purge',
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages from a channel')
    .addIntegerOption((o) => o.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('user').setDescription('Only delete messages from this user'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  permissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 5000,
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: amount });

      if (targetUser) {
        messages = messages.filter((m) => m.author.id === targetUser.id);
      }

      const twoWeeksAgo = Date.now() - 1209600000;
      messages = messages.filter((m) => m.createdTimestamp > twoWeeksAgo);

      if (messages.size === 0) {
        return interaction.editReply({ embeds: [errorEmbed('No deletable messages found.')] });
      }

      const deleted = await interaction.channel.bulkDelete(messages, true);
      await interaction.editReply({ embeds: [successEmbed(`Deleted **${deleted.size}** messages.`)] });
    } catch (err) {
      await interaction.editReply({ embeds: [errorEmbed(`Failed: ${err.message}`)] });
    }
  },
};
