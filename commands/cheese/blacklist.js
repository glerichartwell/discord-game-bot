// User uses '/blacklist' command, bot replies with all words on the blacklist except the current codeword
const { SlashCommandBuilder } = require('discord.js');
const { getBlacklist, getCodewordSet } = require('../../events/cheeseTouch')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blacklist')
		.setDescription('Replies with blacklist except current codeword.'),
	async execute(interaction) {
		await interaction.reply({content: getBlacklistStr(), ephemeral: true});
	},
};

// returns a string list of the blacklist
function getBlacklistStr() {
	str = 'BLACKLISTED CODEWORDS:\n- ';
	arr = Array.from(getBlacklist());
	if (getCodewordSet())
		codeword = arr.pop()

	str += arr.join('\n- ')
	return str;
}

