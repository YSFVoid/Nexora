const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { startSetup } = require('../../modules/setup/setupWizard');

module.exports = {
  name: 'setup',
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Launch the Nexora Setup Wizard to configure your server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  permissions: [PermissionFlagsBits.Administrator],
  adminOnly: true,
  cooldown: 60000,
  async execute(interaction) {
    await startSetup(interaction);
  },
};
