async function handleReady(readyClient) {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
}

export { handleReady }