import "dotenv/config";
import { discordClient, aiClient, discordToken } from "./construct/client.js";
import { handleMessage } from "./eventHandlers/message.js";
import { handleReady } from "./eventHandlers/ready.js";

discordClient.once("ready", handleReady);
discordClient.on("messageCreate", (msg) => handleMessage(msg, aiClient));



discordClient.login(discordToken);