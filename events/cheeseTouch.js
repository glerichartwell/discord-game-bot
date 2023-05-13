const { Events, ChannelType, MessageCollector } = require('discord.js');
const fs = require('fs');

// Initialize blacklist with 100 most common English words
const commonWords = fs.readFileSync('blacklist.txt', 'utf8').split('\n');
const blacklist = new Set(commonWords.slice(0, 100));

// set initial codeword to most commonly used word in english language
let codeword = 'the'

// currently infected member
let infected;

// if the codeword is currently set
let codewordSet = false;

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // grab the message content
        messageContent = message.content.toLowerCase();

        if (message.channel.type == ChannelType.DM) {

            // only capture input from infected people
            if (!message.author.bot && message.author.id === infected.id) {

                // infected already set the codeword, do not let them change it again
                if (codewordSet == true) {
                    message.author.send('You have already set the codeword. You cannot change it.');
                    return;
                }

                // invalid if contains spaces (multiple words) or on blacklist already
                if ((messageContent.includes(' ') || blacklist.has(messageContent)) && codewordSet === false) {
                    message.author.send('Invalid. Please make sure the codeword is only a single word (with no whitespace) and is not on the blacklist.');
                }

                // make sure valid codeword and that codeword hasn't been set this turn, add to blacklist and set flags
                if (!blacklist.has(messageContent) && !messageContent.includes(' ') && codewordSet === false) {

                    // validate to the user
                    message.author.send('Valid Codeword. Adding to blacklist.');

                    // add to blacklist set
                    blacklist.add(messageContent);

                    // append to the file
                    fs.appendFileSync('blacklist.txt', `\n${messageContent}`);

                    // set the new codeword
                    codeword = messageContent;

                    // set flag
                    codewordSet = true;

                    console.log(`New codeword = ${codeword}`);
                    console.log(`${codeword} added to the blacklist`);
                }
            }
            else if (!message.author.bot) {
                message.author.send('You do not have the cheese touch. You cannot set a codeword right now.');
            }
        }
        else {

            //get the cheese touch emoji in the guild
            const cheeseTouchEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'cheesetouch');

            // check if the message contains the codeword and that it's not from a bot
            if (messageContent.includes(codeword) && !message.author.bot) {

                // get author as guild member
                const member = message.member;

                // check if they already have the cheese touch
                if (hasCheeseTouch(member)) {
                    console.log(`${member.displayName} already has cheese touch`);
                    return;
                }

                // grab the cheese touch role
                const role = message.guild.roles.cache.find(role => role.name === 'Cheese Touch');

                // check if role exists
                if (role) {
                    // get all members with cheese touch role
                    const membersWithRole = message.guild.roles.cache.get(role.id).members;

                    // remove everyone that has the cheese touch role
                    membersWithRole.forEach(member => {
                        if (member.id !== message.author.id) {
                            member.roles.remove(role)
                                .then(() => {
                                    console.log(`Role '${role.name}' has been removed from ${member.displayName}.`);
                                })
                                .catch(error => {
                                    console.error(error);
                                });
                        }
                    });

                    // add the role to the message author
                    message.member.roles.add(role)
                        .then(async () => {
                            infected = member;
                            codewordSet = false;

                            console.log(`Role '${role.name}' has been assigned to ${message.author.username}.`);

                            // react to message containing codeword with cheesetouch emoji
                            message.react(cheeseTouchEmoji);

                            // reply to message with codeword announcing transfer of cheese touch
                            message.reply(`${cheeseTouchEmoji} ${message.author} has contracted the ${role}! ${cheeseTouchEmoji}`);

                            let filter = (message) => {
                                return message.author.id === infected.id;
                            };

                            const dmChannel = await member.createDM();

                            // DM the user that said codeword
                            dmChannel.send(`:cheese: YOU HAVE CONTRACTED THE  **CHEESE TOUCH** :cheese:\nPlease send me your codeword.\nCodewords must only be **ONE WORD** with **no spaces** and cannot be a word someone else has used.\nBlacklist:${getBlacklistStr()}`)

                            // handle a timeout
                            dmChannel.awaitMessages({ filter, max: 1, time: 10000, errors: ['time'] })
                                .then((c) => {
                                    console.log('New message collected');
                                    console.log(c);
                                })
                                .catch((c) => {
                                    console.log(`${infected.displayName} took too long setting a codeword. Reassigning.`);
                                    message.channel.send(`${infected} took too long setting a codeword. Reassigning.`);
                                },
                                );
                        });
                }
            }
        }
    },
};

// returns a string list of the blacklist
function getBlacklistStr() {
    str = '\n- ';
    arr = Array.from(blacklist.values());
    str += arr.join('\n- ')
    return str;
}

// check if they already have the cheese touch
function hasCheeseTouch(member) {
    if (member.roles.cache.some(role => role.name === 'Cheese Touch')) {
        return true;
    }
    return false;
}

// checks if message contains a valid codeword
function isValidCodeword(message) {

}