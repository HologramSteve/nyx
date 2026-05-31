import fs from "node:fs/promises";
import path from "node:path";

function resolveGuild({ client, message, params, rawLine, commandName }) {
    let serverId = params[0]?.trim();
    if (!serverId && message?.guild) serverId = message.guild.id;
    if (!serverId && rawLine) {
        const match = rawLine.match(new RegExp(`^${commandName}\\s*\\(\\s*([^,]+)`));
        if (match) serverId = match[1].trim();
    }
    if (!serverId) return { error: "Error: Server ID required or not in a server." };

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return { error: `Error: Server ${serverId} not found.` };

    return { guild, serverId };
}

export async function get_channels({ client, message, params }) {
    let serverId = params[0]?.trim();
    if (!serverId && message?.guild) serverId = message.guild.id;
    if (!serverId) return "Error: Server ID required or not in a server.";
    
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    const channels = guild.channels.cache.map(c => `${c.id} - ${c.name} (${c.type})`);
    return `Channels in server ${guild.name}:\n${channels.join("\n")}`;
}

export async function get_roles({ client, message, params }) {
    let serverId = params[0]?.trim();
    if (!serverId && message?.guild) serverId = message.guild.id;
    if (!serverId) return "Error: Server ID required or not in a server.";

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    const roles = guild.roles.cache
        .sort((a, b) => b.position - a.position)
        .map(role => `${role.id} - ${role.name} (position: ${role.position})`);

    return `Roles in server ${guild.name}:\n${roles.join("\n")}`;
}

export async function make_category({ client, message, params, rawLine }) {
    const resolved = resolveGuild({ client, message, params, rawLine, commandName: "make_category" });
    if (resolved.error) return resolved.error;

    const guild = resolved.guild;
    const name = params[1]?.trim();
    if (!name) return "Error: Category name required.";

    try {
        const channel = await guild.channels.create({ name, type: 4 });
        return `Successfully created category ${channel.name} (${channel.id})`;
    } catch (e) {
        return `Failed to create category: ${e.message}`;
    }
}

export async function make_channel({ client, message, rawLine, params }) {
    let serverId, name, type, categoryId;
    const match = rawLine.match(/^make_channel\s*\(\s*([^,]+),\s*([^,]+)(?:,\s*([^,]+))?(?:,\s*(.*))?\);$/);
    if (match) {
        serverId = match[1].trim();
        name = match[2].trim();
        categoryId = match[3] ? match[3].trim() : null;
        type = match[4] ? match[4].trim() : "text"; // defaults to text if not provided
    } else if (params[0]) {
        serverId = params[0].trim();
        name = params[1]?.trim();
        if (params.length >= 4) {
            categoryId = params[2]?.trim();
            type = params[3] ? params[3].trim() : "text";
        } else {
            categoryId = null;
            type = params[2] ? params[2].trim() : "text"; // defaults to text if not provided
        }
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
        const createOptions = {
            name: name,
            type: channelType
        };

        if (categoryId) {
            const category = guild.channels.cache.get(categoryId);
            if (!category) return `Error: Category with ID ${categoryId} not found.`;
            createOptions.parent = categoryId;
        }

        const channel = await guild.channels.create({
            ...createOptions
        });
        return `Successfully created channel ${channel.name} (${channel.id})`;
    } catch (e) {
        return `Failed to create channel: ${e.message}`;
    }
}

export async function rename_channel({ client, message, params }) {
    const channelId = params[0]?.trim();
    const newName = params[1]?.trim();
    if (!channelId) return "Error: Channel ID required.";
    if (!newName) return "Error: New channel name required.";

    try {
        const channel = client.channels.cache.get(channelId);
        if (!channel) return `Error: Channel with ID ${channelId} not found.`;

        await channel.setName(newName);
        return `Successfully renamed channel ${channelId} to ${newName}.`;
    } catch (e) {
        return `Failed to rename channel: ${e.message}`;
    }
}

export async function move_channel({ client, message, params }) {
    const channelId = params[0]?.trim();
    const categoryId = params[1]?.trim();
    if (!channelId) return "Error: Channel ID required.";

    try {
        const channel = client.channels.cache.get(channelId);
        if (!channel) return `Error: Channel with ID ${channelId} not found.`;

        await channel.setParent(categoryId || null);
        return categoryId
            ? `Successfully moved channel ${channelId} to category ${categoryId}.`
            : `Successfully removed channel ${channelId} from its category.`;
    } catch (e) {
        return `Failed to move channel: ${e.message}`;
    }
}

export async function set_channel_permissions({ client, message, params, rawLine }) {
    const channelId = params[0]?.trim();
    const targetId = params[1]?.trim();
    const allow = params[2]?.trim();
    const deny = params[3]?.trim();

    if (!channelId) return "Error: Channel ID required.";
    if (!targetId) return "Error: Role or user ID required.";

    const channel = client.channels.cache.get(channelId);
    if (!channel) return `Error: Channel with ID ${channelId} not found.`;

    try {
        await channel.permissionOverwrites.edit(targetId, {
            ViewChannel: allow?.toLowerCase() === "true" ? true : deny?.toLowerCase() === "true" ? false : undefined,
            SendMessages: allow?.toLowerCase() === "true" ? true : deny?.toLowerCase() === "true" ? false : undefined
        });
        return `Successfully updated permissions for ${targetId} in channel ${channelId}.`;
    } catch (e) {
        return `Failed to set channel permissions: ${e.message}`;
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

export async function create_role({ client, message, params }) {
    const serverId = params[0]?.trim() || message?.guild?.id;
    const roleName = params[1]?.trim();
    if (!serverId) return "Error: Server ID required or not in a server.";
    if (!roleName) return "Error: Role name required.";

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    try {
        const role = await guild.roles.create({ name: roleName });
        return `Successfully created role ${role.name} (${role.id})`;
    } catch (e) {
        return `Failed to create role: ${e.message}`;
    }
}

export async function rename_role({ client, message, params }) {
    const serverId = params[0]?.trim() || message?.guild?.id;
    const roleId = params[1]?.trim();
    const newName = params[2]?.trim();
    if (!serverId) return "Error: Server ID required or not in a server.";
    if (!roleId) return "Error: Role ID required.";
    if (!newName) return "Error: New role name required.";

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    try {
        const role = guild.roles.cache.get(roleId);
        if (!role) return `Error: Role ${roleId} not found.`;
        await role.setName(newName);
        return `Successfully renamed role ${roleId} to ${newName}.`;
    } catch (e) {
        return `Failed to rename role: ${e.message}`;
    }
}

export async function move_role({ client, message, params }) {
    const serverId = params[0]?.trim() || message?.guild?.id;
    const roleId = params[1]?.trim();
    const position = params[2]?.trim();
    if (!serverId) return "Error: Server ID required or not in a server.";
    if (!roleId) return "Error: Role ID required.";
    if (!position) return "Error: Role position required.";

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    try {
        const role = guild.roles.cache.get(roleId);
        if (!role) return `Error: Role ${roleId} not found.`;

        await role.setPosition(parseInt(position, 10));
        return `Successfully moved role ${roleId} to position ${position}.`;
    } catch (e) {
        return `Failed to move role: ${e.message}`;
    }
}

export async function set_role_permissions({ client, message, params }) {
    const serverId = params[0]?.trim() || message?.guild?.id;
    const roleId = params[1]?.trim();
    const permissions = params[2]?.trim();
    if (!serverId) return "Error: Server ID required or not in a server.";
    if (!roleId) return "Error: Role ID required.";
    if (!permissions) return "Error: Permissions required.";

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    try {
        const role = guild.roles.cache.get(roleId);
        if (!role) return `Error: Role ${roleId} not found.`;

        const permissionBits = permissions
            .split(/[\s,]+/)
            .map(permission => permission.trim())
            .filter(Boolean);

        await role.setPermissions(permissionBits);
        return `Successfully updated permissions for role ${roleId}.`;
    } catch (e) {
        return `Failed to set role permissions: ${e.message}`;
    }
}

export async function set_role_color({ client, message, params }) {
    const serverId = params[0]?.trim() || message?.guild?.id;
    const roleId = params[1]?.trim();
    const color = params[2]?.trim();
    if (!serverId) return "Error: Server ID required or not in a server.";
    if (!roleId) return "Error: Role ID required.";
    if (!color) return "Error: Color required.";

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    try {
        const role = guild.roles.cache.get(roleId);
        if (!role) return `Error: Role ${roleId} not found.`;
        await role.setColor(color);
        return `Successfully updated color for role ${roleId}.`;
    } catch (e) {
        return `Failed to set role color: ${e.message}`;
    }
}

export async function delete_role({ client, message, params }) {
    const serverId = params[0]?.trim() || message?.guild?.id;
    const roleId = params[1]?.trim();
    if (!serverId) return "Error: Server ID required or not in a server.";
    if (!roleId) return "Error: Role ID required.";

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    try {
        const role = guild.roles.cache.get(roleId);
        if (!role) return `Error: Role ${roleId} not found.`;
        await role.delete();
        return `Successfully deleted role ${roleId}.`;
    } catch (e) {
        return `Failed to delete role: ${e.message}`;
    }
}

export async function assign_role({ client, message, params }) {
    const serverId = params[0]?.trim() || message?.guild?.id;
    const userId = params[1]?.trim();
    const roleId = params[2]?.trim();
    if (!serverId) return "Error: Server ID required or not in a server.";
    if (!userId || !roleId) return "Error: User ID and role ID required.";

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    try {
        const member = await guild.members.fetch(userId);
        const role = guild.roles.cache.get(roleId);
        if (!member) return `Error: Member ${userId} not found.`;
        if (!role) return `Error: Role ${roleId} not found.`;
        await member.roles.add(role);
        return `Successfully assigned role ${roleId} to ${userId}.`;
    } catch (e) {
        return `Failed to assign role: ${e.message}`;
    }
}

export async function remove_role({ client, message, params }) {
    const serverId = params[0]?.trim() || message?.guild?.id;
    const userId = params[1]?.trim();
    const roleId = params[2]?.trim();
    if (!serverId) return "Error: Server ID required or not in a server.";
    if (!userId || !roleId) return "Error: User ID and role ID required.";

    const guild = client.guilds.cache.get(serverId);
    if (!guild) return `Error: Server ${serverId} not found.`;

    try {
        const member = await guild.members.fetch(userId);
        const role = guild.roles.cache.get(roleId);
        if (!member) return `Error: Member ${userId} not found.`;
        if (!role) return `Error: Role ${roleId} not found.`;
        await member.roles.remove(role);
        return `Successfully removed role ${roleId} from ${userId}.`;
    } catch (e) {
        return `Failed to remove role: ${e.message}`;
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