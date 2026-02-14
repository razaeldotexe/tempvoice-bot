const { Collection } = require('discord.js');

const tempChannels = new Map(); // Map<channelId, ownerId>
const cooldowns = new Collection(); // Collection<userId, timestamp>

module.exports = {
    tempChannels,
    cooldowns,
};
