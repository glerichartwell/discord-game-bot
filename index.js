// Require the necessary discord.js classes
const { Client, Collection, GatewayIntentBits, ActivityType, Partials } = require('discord.js');
const { token } = require('./config.json');
const { createCommands, deployCommands, createEvents } = require('./setup');

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessages,
	],
	partials: [Partials.Channel], 
	presence: {
		activities: [{
			type: ActivityType.Listening,
			name: 'your conversations.',
		}],
	},
});

client.commands = new Collection();
const commands = createCommands(client);
deployCommands(commands);
createEvents(client);
client.login(token);


