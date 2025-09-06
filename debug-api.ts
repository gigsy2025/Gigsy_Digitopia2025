import { api } from "./convex/_generated/api";

// Let's see what TypeScript thinks api is
console.log("API type:", typeof api);
console.log("API keys:", Object.keys(api));
console.log("Messages module:", api.messages);

// Type assertion to check what TypeScript infers
const apiType: typeof api = api;
const messagesType = api.messages;
const getForCurrentUserType = api.messages.getForCurrentUser;

export { apiType, messagesType, getForCurrentUserType };
