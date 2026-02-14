const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
            return;
        }

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        const { member, guild } = interaction;
        const voiceChannel = member.voice.channel;

        // Load Config to check if user is in a valid temp voice category
        const configPath = path.join(__dirname, '../../config.json');
        if (!fs.existsSync(configPath)) {
            if (interaction.isRepliable()) await interaction.reply({ content: 'System not configured.', ephemeral: true });
            return;
        }
        const config = JSON.parse(fs.readFileSync(configPath));
        const guildConfig = config[guild.id];

        if (!guildConfig) return;

        // Check if user is in a voice channel
        if (!voiceChannel) {
            if (interaction.isRepliable()) await interaction.reply({ content: 'You must be in a voice channel to use this.', ephemeral: true });
            return;
        }

        // Check if the voice channel is part of the temp voice system (in the category)
        // We exclude the "Join to Create" channel itself from being edited
        if (voiceChannel.parentId !== guildConfig.categoryId || voiceChannel.id === guildConfig.joinChannelId) {
            if (interaction.isRepliable()) await interaction.reply({ content: 'You are not in a temporary voice channel.', ephemeral: true });
            return;
        }

        // Check ownership/permissions. We gave the user ManageChannels, so we can check that or just assume if they are in the channel and it's a temp channel.
        // For stricter control, we could check if they are the 'owner', but keeping it simple as per request + permission check.
        if (!voiceChannel.permissionsFor(member).has(PermissionFlagsBits.ManageChannels)) {
            if (interaction.isRepliable()) await interaction.reply({ content: 'You do not have permission to edit this channel.', ephemeral: true });
            return;
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'temp_voice_name') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_temp_voice_name')
                    .setTitle('Rename Voice Channel');

                const nameInput = new TextInputBuilder()
                    .setCustomId('nameInput')
                    .setLabel('New Channel Name')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
                modal.addComponents(firstActionRow);

                await interaction.showModal(modal);

            } else if (interaction.customId === 'temp_voice_limit') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_temp_voice_limit')
                    .setTitle('Set User Limit');

                const limitInput = new TextInputBuilder()
                    .setCustomId('limitInput')
                    .setLabel('User Limit (0 = Unlimited, Max = 99)')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(2)
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(limitInput);
                modal.addComponents(firstActionRow);

                await interaction.showModal(modal);

            } else if (interaction.customId === 'temp_voice_privacy') {
                // Toggle Privacy
                // Check current permission for @everyone
                const everyone = guild.roles.everyone;
                const permissions = voiceChannel.permissionOverwrites.cache.get(everyone.id);

                // If connect is NOT denied (allow or null), prompt to lock. If denied, prompt to unlock.
                const isLocked = permissions && permissions.deny.has(PermissionFlagsBits.Connect);

                if (isLocked) {
                    // Unlock
                    await voiceChannel.permissionOverwrites.edit(everyone, { Connect: null });
                    await interaction.reply({ content: '🔓 Channel is now **Public** (Visible/Joinable by everyone).', ephemeral: true });
                } else {
                    // Lock
                    await voiceChannel.permissionOverwrites.edit(everyone, { Connect: false });
                    await interaction.reply({ content: '🔒 Channel is now **Private** (Locked for everyone except you).', ephemeral: true });
                }
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_temp_voice_name') {
                const newName = interaction.fields.getTextInputValue('nameInput');
                await voiceChannel.setName(newName);
                await interaction.reply({ content: `✅ Channel name changed to **${newName}**`, ephemeral: true });
            } else if (interaction.customId === 'modal_temp_voice_limit') {
                const limitStr = interaction.fields.getTextInputValue('limitInput');
                let limit = parseInt(limitStr);
                if (isNaN(limit) || limit < 0 || limit > 99) {
                    await interaction.reply({ content: '❌ Invalid limit. Please enter a number between 0 and 99.', ephemeral: true });
                    return;
                }
                await voiceChannel.setUserLimit(limit);
                await interaction.reply({ content: `✅ Channel user limit set to **${limit === 0 ? 'Unlimited' : limit}**`, ephemeral: true });
            }
        }
    },
};
