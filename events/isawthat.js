const { Events, ChannelType } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
    async execute(message) {
      const phrase = "i saw that"

      messageContent = message.content.toLowerCase();
      // check if the message contains the phrase and that it's not from a bot
      if (messageContent.includes(phrase) && !message.author.bot && (message.channel.type !== ChannelType.DM)) {
        const channel = message.channel;
        channel.send(message.content)
        .then((message) => {
          console.log("Mr. Cheesy Fingers saw that.")
          setTimeout(() => message.delete(), 1000)
          
        });

      }
    }
}