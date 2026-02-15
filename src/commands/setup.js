const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup the temporary voice channel system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;

        try {
            // 1. Create Category
            const category = await guild.channels.create({
                name: '━━━━━Temp Voice━━━━━',
                type: ChannelType.GuildCategory,
            });

            // 2. Create "join-to-create" Voice Channel
            const joinChannel = await guild.channels.create({
                name: '🔧｜join-to-create',
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        allow: [PermissionFlagsBits.Connect],
                    }
                ]
            });

            // 3. Create "channel-setting" Text Channel
            const settingChannel = await guild.channels.create({
                name: '⚙️｜channel-setting',
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionFlagsBits.SendMessages],
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
                    }
                ]
            });

            // 4. Send Control Panel Embed
            const embed = new EmbedBuilder()
                .setTitle('Voice Channel Interface')
                .setDescription('Click the buttons below to control your temporary voice channel.')
                .setColor('#0099ff')
                .addFields(
                    { name: '📝 Set Name', value: 'Change the name of your voice channel', inline: true },
                    { name: '👥 Set Limit', value: 'Set a user limit for your channel', inline: true },
                    { name: '🔒 Privacy', value: 'Lock or Unlock your channel', inline: true }
                )
                .setFooter({ text: 'Temp Voice System' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('temp_voice_name')
                        .setLabel('Set Name')
                        .setEmoji('📝')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('temp_voice_limit')
                        .setLabel('Set Limit')
                        .setEmoji('👥')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('temp_voice_privacy')
                        .setLabel('Privacy')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Secondary),
                );

            await settingChannel.send({ embeds: [embed], components: [row] });

            // 5. Save Config
            const configPath = path.join(__dirname, '../../config.json');
            let config = {};
            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath));
            }

            if (!config[guild.id]) config[guild.id] = {};
            config[guild.id].joinChannelId = joinChannel.id;
            config[guild.id].categoryId = category.id;

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            await interaction.editReply({ content: 'Setup complete! Created category and channels.' });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'An error occurred during setup.' });
        }
    },
};
