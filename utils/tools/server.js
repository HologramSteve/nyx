import fs from "node:fs/promises";
import path from "node:path";

export async function get_channels({ client, message, params }) {
    let serverId = params[0]?.trim();
    if (!serverId && message?.guild) serverId = message.guild.id;
    if (!serverId) return "Error: Server ID required or not in a server.";
    
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    const channels = guild.channels.cache.map(c => `${c.id} - ${c.name} (${c.type})`);
    return `Channels in server ${guild.name}:\n${channels.join("\n")}`;
}

export async function make_channel({ client, message, rawLine, params }) {
    let serverId, name, type;
    const match = rawLine.match(/^make_channel\s*\(\s*([^,]+),\s*([^,]+)(?:,\s*(.*))?\);$/);
    if (match) {
        serverId = match[1].trim();
        name = match[2].trim();
        type = match[3] ? match[3].trim() : "text"; // defaults to text if not provided
    } else if (params[0]) {
        serverId = params[0].trim();
        name = params[1]?.trim();
        type = params[2] ? params[2].trim() : "text"; // defaults to text if not provided
    }
    
    if (!serverId && message?.guild) {
        serverId = message.guild.id;
    }

    if (!serverId) return "Error: Server ID required or not in a server.";
    if (!name) return "Error: Channel name required.";

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;
    
    // map type to discord.js ChannelType
    let channelType = 0; // GUILD_TEXT
    if (type.toLowerCase() === "voice") channelType = 2; // GUILD_VOICE
    else if (type.toLowerCase() === "category") channelType = 4; // GUILD_CATEGORY

    try {
        const channel = await guild.channels.create({
            name: name,
            type: channelType
        });
        return `Successfully created channel ${channel.name} (${channel.id})`;
    } catch (e) {
        return `Failed to create channel: ${e.message}`;
    }
}

export async function delete_channel({ client, message, params }) {
    const channelId = params[0]?.trim();
    if (!channelId) return "Error: Channel ID required.";
    
    try {
        const channel = client.channels.cache.get(channelId);
        if (!channel) return `Error: Channel with ID ${channelId} not found.`;
        
        await channel.delete();
        return `Successfully deleted channel ${channelId}.`;
    } catch (e) {
        return `Failed to delete channel: ${e.message}`;
    }
}

export async function timeout({ client, message, rawLine, params }) {
    let serverId, userId, duration, reason;
    const match = rawLine.match(/^timeout\s*\(\s*([^,]+),\s*([^,]+),\s*([^,]+)(?:,\s*(.*))?\);$/);
    if (match) {
        serverId = match[1].trim();
        userId = match[2].trim();
        duration = match[3].trim();
        reason = match[4] ? match[4].trim() : "No reason provided";
    } else {
        serverId = params[0]?.trim();
        userId = params[1]?.trim();
        duration = params[2]?.trim();
        reason = params.slice(3).join(",").trim() || "No reason provided";
    }
    
    if (!serverId) serverId = message?.guild?.id;
    if (!serverId) return "Error: Server ID required.";
    
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;
    
    if (!userId || !duration) return "Error: User ID and duration (in minutes) required.";
    
    try {
        const member = await guild.members.fetch(userId);
        if (!member) return `Error: Member ${userId} not found.`;
        
        const durationMs = parseInt(duration) * 60 * 1000;
        await member.timeout(durationMs, reason);
        return `Successfully timed out ${userId} for ${duration} minutes.`;
    } catch (e) {
        return `Failed to timeout: ${e.message}`;
    }
}

export async function untimeout({ client, message, rawLine, params }) {
    let serverId, userId, reason;
    const match = rawLine.match(/^untimeout\s*\(\s*([^,]+),\s*([^,]+)(?:,\s*(.*))?\);$/);
    if (match) {
        serverId = match[1].trim();
        userId = match[2].trim();
        reason = match[3] ? match[3].trim() : "No reason provided";
    } else {
        serverId = params[0]?.trim();
        userId = params[1]?.trim();
        reason = params.slice(2).join(",").trim() || "No reason provided";
    }
    
    if (!serverId) serverId = message?.guild?.id;
    if (!serverId) return "Error: Server ID required.";
    
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;
    
    if (!userId) return "Error: User ID required.";
    
    try {
        const member = await guild.members.fetch(userId);
        if (!member) return `Error: Member ${userId} not found.`;
        
        await member.timeout(null, reason);
        return `Successfully removed timeout for ${userId}.`;
    } catch (e) {
        return `Failed to untimeout: ${e.message}`;
    }
}

export async function kick({ client, message, rawLine, params }) {
    let serverId, userId, reason;
    const match = rawLine.match(/^kick\s*\(\s*([^,]+),\s*([^,]+)(?:,\s*(.*))?\);$/);
    if (match) {
        serverId = match[1].trim();
        userId = match[2].trim();
        reason = match[3] ? match[3].trim() : "No reason provided";
    } else {
        serverId = params[0]?.trim();
        userId = params[1]?.trim();
        reason = params.slice(2).join(",").trim() || "No reason provided";
    }
    
    if (!serverId) serverId = message?.guild?.id;
    if (!serverId) return "Error: Server ID required.";
    
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;
    
    if (!userId) return "Error: User ID required.";
    
    try {
        const member = await guild.members.fetch(userId);
        if (!member) return `Error: Member ${userId} not found.`;
        
        await member.kick(reason);
        return `Successfully kicked ${userId}.`;
    } catch (e) {
        return `Failed to kick: ${e.message}`;
    }
}

export async function send_msg({ client, message, rawLine, params }) {
    if (!message || !message.guild) return "Error: Not in a server.";
    
    let channelId, content;
    const match = rawLine.match(/^send_msg\s*\(\s*([^,]+),\s*(.*)\);$/);
    if (match) {
        channelId = match[1].trim();
        content = match[2].trim();
    } else {
        channelId = params[0]?.trim();
        content = params.slice(1).join(",").trim();
    }
    
    if (!channelId || !content) return "Error: Channel ID and message content required.";
    
    try {
        const channel = message.guild.channels.cache.get(channelId);
        if (!channel) return `Error: Channel with ID ${channelId} not found.`;
        
        await channel.send(content);
        return `Successfully sent message to channel ${channelId}.`;
    } catch (e) {
        return `Failed to send message: ${e.message}`;
    }
}

export async function get_servers({ client }) {
    if (!client) return "Error: Client not attached.";

    const servers = [];
    for (const [id, guild] of client.guilds.cache) {
        let tag = "";
        try {
            // Check if the bot has Administrator permission in the guild
            const botMember = await guild.members.fetch(client.user.id);
            if (botMember && botMember.permissions.has("Administrator")) {
                tag = " (owned)";
            }
        } catch (e) {
            // Ignore error if it fails to fetch member
        }
        
        servers.push(`${id} - ${guild.name}${tag}`);
    }

    if (servers.length === 0) return "Currently not in any servers.";
    
    return `Servers:\n${servers.join("\n")}`;
}