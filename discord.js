import Discord from 'discord.js';

const discordBot = new Discord.Client();

const  discordSetup = async () => {
  return new Promise((resolve, reject) => {
    ['DISCORD_BOT_TOKEN', 'DISCORD_CHANNEL_ID'].forEach((envVar) => {
      if (!process.env[envVar]) reject(`${envVar} not set`)
    })

    discordBot.login(process.env.DISCORD_BOT_TOKEN);
    discordBot.on('ready', async () => {
      const channel = await discordBot.channels.fetch(process.env.DISCORD_CHANNEL_ID);
      resolve(channel);
    });
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
    .setTitle(`${fusion.sender} fused Omnimorph #${fusion.toFuse} and #${fusion.toBurn}!`)
    // .setURL(sale.asset.permalink)  // TODO - do all fusion have an URL?
    .setAuthor('OmniFusion Bot', 'https://lh3.googleusercontent.com/S36Gqs6mWRd2EpeG3QCY6HubD0O1k_sTslOJbtnx5Lg5EWiebyBhLGJIjebNqfTGU-ALVuUY6_CwGXbc_-ZxXne6T-3pYXqpjKpk=s0', 'https://fusion.omnimorphs.com')
    .setImage(fusion.imageUrl)
    .setFooter('Try out OmniFusion!', 'https://fusion.omnimoprphs.com')
);

/**
 *
 * @param {{sender: string, toBurn: number, toFuse: number, imageUrl}} fusion
 */
const send = async (fusion) => {
  const channel = await discordSetup();
  const message = buildMessage(fusion);
  return channel.send(message);
}

module.exports = {
  send
}
