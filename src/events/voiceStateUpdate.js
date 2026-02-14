const { Events, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { tempChannels, cooldowns } = require('../utils/tempVoiceManager');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const guild = newState.guild;
        const configPath = path.join(__dirname, '../../config.json');

        if (!fs.existsSync(configPath)) return;
        const config = JSON.parse(fs.readFileSync(configPath));
        if (!config[guild.id]) return;

        const joinChannelId = config[guild.id].joinChannelId;
        const categoryId = config[guild.id].categoryId;

        // User Joined "Join to Create"
        if (newState.channelId === joinChannelId) {
            const member = newState.member;

            // Check Cooldown/Lock (3 seconds Global for the Join Channel to prevent race conditions/spam)
            // Implementation: Simple lock per guild or global. User asked for "bot agar bot tidak error saat menangani banyak user"
            // We can use a simple flag or timestamp validation.

            const now = Date.now();
            const lastCreation = cooldowns.get(`global_lock_${guild.id}`);

            if (lastCreation && now - lastCreation < 3000) {
                // Too fast
                await member.voice.disconnect();
                try {
                    await member.send("Tunggu sebentar ada user lain yang baru saja membuat voice channel");
                } catch (e) {
                    console.log(`Could not DM user ${member.user.tag}`);
                }
                return;
            }

            // Set Lock
            cooldowns.set(`global_lock_${guild.id}`, now);

            try {
                // Create Voice Channel
                const voiceChannel = await guild.channels.create({
                    name: `${member.user.username} voice`,
                    type: ChannelType.GuildVoice,
                    parent: categoryId,
                    permissionOverwrites: [
                        {
                            id: member.id,
                            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect, PermissionFlagsBits.MoveMembers],
                        },
                        {
                            id: guild.roles.everyone,
                            allow: [PermissionFlagsBits.Connect],
                        }
                    ]
                });

                // Move Member
                await member.voice.setChannel(voiceChannel);

                // Register in Map
                tempChannels.set(voiceChannel.id, member.id);

            } catch (error) {
                console.error("Error creating temp channel:", error);
            }
        }

        // Cleanup: User Left a Temp Channel
        if (oldState.channelId && tempChannels.has(oldState.channelId)) {
            const channel = oldState.channel;
            // If channel is empty, delete it
            if (channel.members.size === 0) {
                try {
                    await channel.delete();
                    tempChannels.delete(oldState.channelId);
                } catch (err) {
                    console.error("Error deleting temp channel:", err);
                }
            }
        }
    },
};
