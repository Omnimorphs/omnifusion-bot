const Discord = require('discord.js');

const intents = new Discord.Intents();

intents.add(Discord.Intents.FLAGS.GUILDS);

const discordBot = new Discord.Client({intents});

let discordChannel;

const discordSetup = async () => {
  return new Promise((resolve, reject) => {
    ['DISCORD_BOT_TOKEN', 'DISCORD_CHANNEL_ID'].forEach((envVar) => {
      if (!process.env[envVar]) reject(`${envVar} not set`)
    })

    if (!discordChannel) {
      discordBot.login(process.env.DISCORD_BOT_TOKEN);
      discordBot.on('ready', async () => {
        console.log('bot connected');
        const channel = await discordBot.channels.fetch(process.env.DISCORD_CHANNEL_ID);
        discordChannel = channel;
        resolve(channel);
      });
    } else {
      resolve(discordChannel);
    }
  })
}

/**
 *
 * @param {{sender: string, toBurn: number, toFuse: number, imageUrl}} fusion
 * @return {MessageEmbed}
 */
const buildMessage = (fusion) => (
  new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`New OmniFusion!`)
    .setURL('https://fusion.omnimorphs.com')  // TODO - do all fusion have an URL?
    .addFields(
      { name: 'Owner', value: fusion.sender },
      { name: 'Fused token', value: fusion.toFuse.toString() },
      { name: 'Burned token', value: fusion.toBurn.toString() }
    )
    .setAuthor('OmniFusion Bot')
    .setTimestamp(new Date())
    .setImage(fusion.imageUrl)
    .setFooter('https://fusion.omnimorphs.com')
);

/**
 *
 * @param {{sender: string, toBurn: number, toFuse: number, imageUrl}} fusion
 */
const send = async (fusion) => {
  const channel = await discordSetup();
  const message = buildMessage(fusion);
  console.log(message);
  return channel.send({embeds: [message]});
}

module.exports = {
  send
}
