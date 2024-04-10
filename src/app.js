import 'dotenv/config'
import { Client, GatewayIntentBits } from 'discord.js';
import cron from "node-cron"
import { processFaucet } from "./faucet/faucet.js"
import { sendEthProcess } from "./faucet/job.js"

const token = process.env.TOKEN;

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildMemberAdd', (member) => {

    const welcomeChannel = member.guild.channels.cache.find(
        (channel) => channel.id === process.env.CHANNEL_ID_WELCOME
    );

    if (welcomeChannel) {
        welcomeChannel.send(`Welcome to Gemefi server. Verify in <#1198520802518249582> to access all channels , ${member}! 🎉`);
    }
});

client.on('messageCreate', async (message) => {
    if (message.content.startsWith("!x https://")) {
        const channelId = process.env.X_CHANNEL
        const roleIDTag = process.env.TEAM_ROLE

        const link = message.content.split(" ")[1]
        const member = message.guild.members.cache.get(message.author.id);
        const roles = member ? member.roles.cache.map(role => role.name) : [];
        if(roles.includes("Team")){
            const channel = client.channels.cache.get(channelId);
            const role = message.guild.roles.cache.get(roleIDTag);
            channel.send(`Gemefi posted a tweet ${role.toString()}: ${link}`)
        }
    }else if(message.content.startsWith('!faucet')){
        
        const channelId = process.env.CHANNEL_ID_FAUCET
        if(message.channel.id === channelId){
            const splits = message.content.split(" ")
            if(splits.length == 2){
                if(splits[1].startsWith("0x") && splits[1].length === 42){
                    const messageReply = await processFaucet(
                        message.author.username,
                        message.author.id,
                        splits[1]
                    )
                    message.reply(messageReply)
                }else{
                    message.reply("Wrong wallet address formet")
                }
            }else{
                message.reply('Wrong faucet command. Please do it: !faucet 0x...')
            }
        }else{
            message.reply(`Please faucet in <#${channelId}>`)
        }
    }
 });

const job = cron.schedule('* * * * * *', () => {
    sendEthProcess(client);
}, {
    timezone: "America/New_York"
});
job.start();

client.login(token);
