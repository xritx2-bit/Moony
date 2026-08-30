const { EmbedBuilder } = require('discord.js');
const colors = require('./colors');

class Embeds {
  static base(options = {}) {
    const embed = new EmbedBuilder()
      .setColor(options.color || colors.primary)
      .setTimestamp();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.fields) embed.addFields(options.fields);
    if (options.footer) {
      if (typeof options.footer === 'string') {
        embed.setFooter({ text: options.footer });
      } else {
        embed.setFooter(options.footer);
      }
    } else {
      embed.setFooter({ text: 'Moony • The All-in-One SuperBot' });
    }
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.author) embed.setAuthor(options.author);
    return embed;
  }

  static success(title, description) {
    return this.base({
      title: `✅ ${title}`,
      description,
      color: colors.success
    });
  }

  static error(title, description) {
    return this.base({
      title: `❌ ${title}`,
      description,
      color: colors.danger
    });
  }

  static warning(title, description) {
    return this.base({
      title: `⚠️ ${title}`,
      description,
      color: colors.warning
    });
  }

  static info(title, description) {
    return this.base({
      title: `ℹ️ ${title}`,
      description,
      color: colors.info
    });
  }
}

module.exports = Embeds;
