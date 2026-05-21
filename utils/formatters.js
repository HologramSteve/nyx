function formatDiscordReply(reply) {
    let footer = "\n-# Tokens (in/out): " + reply.usage.tokens_in + "/" + reply.usage.tokens_out + "\n-# Duration: " + reply.duration;
    let fullMessage = reply.content + footer;

    if (fullMessage.length > 2000) {
        console.log("Hit message limit. Full length: " + fullMessage.length);
        let maxContentLen = 2000 - footer.length - 50;
        if (maxContentLen < 0) maxContentLen = 0;
        reply.content = reply.content.substring(0, maxContentLen) + "\n*... [truncated]*";
        fullMessage = reply.content + footer;
        console.log("Truncated message: " + fullMessage.length);
    }

    if (fullMessage.length > 2000) {
        fullMessage = fullMessage.substring(0, 1997) + "...";
    }

    return fullMessage;
}

export { formatDiscordReply };
