const fs = require('node:fs');
const path = require('node:path');
const { clientId, token } = require('./config.json');
const { REST, Routes } = require('discord.js');

function createCommands(client) {
	const commands = [];
	// constructs a path to the commands directory
	const foldersPath = path.join(__dirname, 'commands');
	const commandFolders = fs.readdirSync(foldersPath);

	// // loop over the array and dynamically set each command into the client.commands Collection
	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			// Set a new item in the Collection with the key as the command name and the value as the exported module
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
				commands.push(command.data.toJSON());
			}
			else {
				console.log(`[WARNING] The command at ${filePath} is missing a required 'data' or 'execute' property.`);
			}
		}
	}
	return commands;
}

function createEvents(client) {
	// Begin  dynamically retrieving all the event files in the events folder
	const eventsPath = path.join(__dirname, 'events');
	const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const event = require(filePath);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		}
		else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}
}

async function deployCommands(commands) {
	const rest = new REST().setToken(token);
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
	
}

module.exports = {
  createCommands,
  deployCommands,
  createEvents
}