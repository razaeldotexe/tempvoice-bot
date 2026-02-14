# Temp Voice Discord Bot

A Discord bot to manage temporary voice channels with a setup command and control interface.

## Prerequisites

- Node.js (v16.9.0 or higher)
- A Discord Bot Token (Get it from [Discord Developer Portal](https://discord.com/developers/applications))

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Open `.env` and fill in your details:
    ```env
    DISCORD_TOKEN=your_bot_token_here
    CLIENT_ID=your_client_id_here
    ```

3.  **Deploy Commands**:
    Run this once to register the `/setup` command.
    ```bash
    node src/deploy-commands.js
    ```

4.  **Start the Bot**:
    ```bash
    node src/index.js
    ```

## Usage

1.  **In Discord**, run `/setup` in the server.
    - This will create a "Temp Voice" category.
    - It will create a "join-to-create" voice channel.
    - It will create a "channel-setting" text channel with a control panel.
2.  **Join** the "🔧｜join-to-create" channel to create your own temporary voice channel.
3.  **Use the Control Panel** in "⚙️｜channel-setting" to:
    - 📝 **Rename** your channel.
    - 👥 **Set Limit** for users.
    - 🔒 **Lock/Unlock** your channel (Privacy).

## Features

- **Auto-Create**: Automatically creates a channel when you join.
- **Auto-Delete**: Deletes the channel when everyone leaves.
- **Cooldown**: Prevents spam by adding a 3-second delay between channel creations (per guild).
- **Interface**: Easy-to-use buttons for channel management.
