async function reply({ message, params }) {
    if (!message) return;
    await message.reply(params[0] || "").catch(() => {});
}

export { reply };
