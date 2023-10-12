const { Events, ChannelType } = require('discord.js');

// init blacklist
let blacklist = ["of","to","and","a","in","is","it","you","that","he","was","for","on","are","with","as","I","his","they","be","at","one","have","this","from","or","had","by","not","word","but","what","some","we","can","out","other","were","all","there","when","up","use","your","how","said","an","each","she","which","do","their","time","if","will","way","about","many","then","them","write","would","like","so","these","her","long","make","thing","see","him","two","has","look","more","day","could","go","come","did","number","sound","no","most","people","my","over","know","water","than","call","first","who","may","down","side","been","now","find", "the"]

// set initial codeword to most commonly used word in english language
let codeword = 'the'

// currently infected member
let infected;

// if the codeword is currently set
let codewordSet = true;

let allServerMembers;

let guild;

// 12 hours in milliseconds
const TIMEOUT = 1000 * 60 * 60 * 12;

module.exports = {
    getCodewordSet,
    getBlacklist,
    name: Events.MessageCreate,
    async execute(message) {
        // grab the message content
        messageContent = message.content.toLowerCase();

        // check if the message contains the codeword and that it's not from a bot
        if (messageContent.includes(codeword) && !message.author.bot && (message.channel.type !== ChannelType.DM)) {

            // get author as guild member
            const member = message.member;

            // get all members of guild
            guild = message.guild;
            allServerMembers = await guild.members.fetch();

            // check if they already have the cheese touch
            if (hasCheeseTouch(member)) {
                console.log(`${member.displayName} already has cheese touch`);
                return;
            }

            // grab the cheese touch role
            const role = message.guild.roles.cache.find(role => role.name === 'Cheese Touch');

            // handle assigning cheese touch and getting codeword (and possible reassigning)
            assignCheeseTouch(message, role, member, guild);

        }
    },
};

// returns a string list of the blacklist
function getBlacklistStr() {
    str = '\n- ';
    str += blacklist.join('\n- ')
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
    return !blacklist.includes(message.content.toLowerCase()) && !message.content.includes(' ') && codewordSet === false;
}

// handle adding the role and getting codeword
function assignCheeseTouch(message, role, member, guild) {

    if (!codewordSet) {
        return;
    }

    // get the cheese touch emoji in the guild
    const cheeseTouchEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'cheesetouch');

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
            .then(() => {
                infected = member;
                codewordSet = false;
                let channel = message.channel;

                console.log(`Role '${role.name}' has been assigned to ${infected.displayName}.`);

                // react to message containing codeword with cheesetouch emoji
                message.react(cheeseTouchEmoji);

                // reply to message with codeword announcing transfer of cheese touch
                channel.send(`${cheeseTouchEmoji} ${message.author} has contracted the ${role}! ${cheeseTouchEmoji}`);

                getCodeword(member, channel);

            });
    }
}

async function getCodeword(member, channel) {

    // get the DM channel with the infected person
    const dmChannel = await member.createDM();

    // DM the user that said codeword
    dmChannel.send(`:cheese: YOU HAVE CONTRACTED THE  **CHEESE TOUCH** :cheese:\nPlease send me your codeword.\nCodewords must only be **ONE WORD**. If more than one word is detected I will be angry :rage:. It is your responsibility to use real words because **I WILL NOT BE CHECKING TO MAKE SURE THEY'RE REAL**.\nBlacklist:${getBlacklistStr()}`)
        .then(() => {
            const collectorFilter = (m) => m.author.id === infected.id && !m.author.bot && isValidCodeword(m);
            const collector = dmChannel.createMessageCollector({ filter: collectorFilter, time: TIMEOUT });

            collector.on('collect', (message) => {

                console.log(`collected ${message}`);

                msg = message.content.toLowerCase();

                // validate to the user
                dmChannel.send('Valid Codeword. Adding to blacklist.');

                // add to blacklist set
                blacklist.push(msg);

                // set the new codeword
                codeword = msg;

                // set flag
                codewordSet = true;

                console.log(`New codeword = ${codeword}`);
                console.log(`${codeword} added to the blacklist`);
                
                channel.send(`${message.author} set the codeword. Resume Cheese Touch!`);

                // stop the collector
                console.log('stopping the collector');
                collector.stop();
            });

            // Respond whenever a codeword is ignored
            collector.on('ignore', (msg) => {
                msgContent = msg.content.toLowerCase();
                console.log(`REJECTED: ${msgContent}`);

                if (msg.author.bot) {
                    return;
                }

                // respond on basis of why it was ignored
                if (codewordSet) {
                    dmChannel.send('You have already set the codeword. You cannot change it.');
                    console.log('Reason: codeword already set.');
                }
                else if (msgContent.includes(' ')) {
                    dmChannel.send('Invalid. Please make sure the codeword is only a single word (with no whitespace).');
                    console.log('Reason: codeword includes whitespace.');
                }
                else if (blacklist.includes(msgContent)) {
                    dmChannel.send('Invalid. Please make sure the codeword is not already on the blacklist.');
                    console.log('Reason: codeword already exists in the blacklist.');
                }

                // reset timer based on last interaction
                collector.resetTimer();
            });

            // after collector finishes
            collector.on('end', (collected) => {

                // check for timeout
                if (codewordSet === false) {
                    console.log(`${infected.displayName} took too long in providing a valid codeword. Reassigning...`);
                    dmChannel.send('Timeout. You took too long in providing a codeword. Reassigning...');
                    channel.send(`${infected} took too long in providing a valid codeword. Reassigning...`);

                    // get a random server member
                    let possibleInfected = allServerMembers.random();

                    // try again if already infected person 
                    // (TODO: find a better solution to not getting the same infected person)
                    if (possibleInfected.id === infected.id || !possibleInfected.user.bot) {
                        possibleInfected = allServerMembers.random();
                    }

                    console.log(`Reassigning the cheese touch to: ${possibleInfected.displayName}`);

                    // reassign the cheese touch role
                    reassignCheeseTouch(possibleInfected, channel);
                }
            });
        });
}

// reassigns the cheesetouch to a random server member
function reassignCheeseTouch(newInfected, channel) {
    // get the cheese touch emoji in the guild
    const cheeseTouchEmoji = guild.emojis.cache.find(emoji => emoji.name === 'cheesetouch');

    const role = guild.roles.cache.find(role => role.name === 'Cheese Touch');

    // check if role exists
    if (role) {

        infected.roles.remove(role)
            .then(() => {
                console.log(`Role '${role.name}' has been removed from ${infected.displayName}.`);
            })
            .catch(error => {
                console.error(error);
            });

        // add the role to the message author
        newInfected.roles.add(role)
            .then(() => {
                infected = newInfected;
                codewordSet = false;

                console.log(`Role '${role.name}' has been assigned to ${newInfected.displayName}.`);

                // reply to message with codeword announcing transfer of cheese touch
                channel.send(` ${cheeseTouchEmoji} ${newInfected} has contracted the ${role}! ${cheeseTouchEmoji}`);

                getCodeword(newInfected, channel);
            });
    }
}

function getBlacklist() {
    return blacklist;
}

function getCodewordSet() {
    return codewordSet;
}