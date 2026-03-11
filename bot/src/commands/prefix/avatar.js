const { createEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'avatar',
  aliases: ['av', 'pfp'],
  description: 'View a user\'s avatar',
  execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const avatarUrl = user.displayAvatarURL({ size: 1024, dynamic: true });

    const embed = createEmbed({
      color: Colors.PRIMARY,
      title: `${user.tag}`,
      image: avatarUrl,
    });

    message.reply({ embeds: [embed] });
  },
};
