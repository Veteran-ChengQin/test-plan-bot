import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

// 初始化 GitHub API 客户端
export const createOctokitClient = () => {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY,
      installationId: process.env.GITHUB_INSTALLATION_ID,
    },
  });
};

// 解析评论中的机器人命令
export const parseBotCommand = (commentBody: string) => {
  const botUsername = process.env.BOT_USERNAME || "your-bot-name";
  const mentionRegex = new RegExp(`@${botUsername}\\s+\\/([\\w-]+)(?:\\s+(.*))?`, "i");
  const match = commentBody.match(mentionRegex);
  
  if (!match) return null;
  
  return {
    command: match[1],
    args: match[2] || ""
  };
};

// 处理不同类型的命令
export const processCommand = (command: string, args: string) => {
  switch (command.toLowerCase()) {
    case "help":
      return "我支持以下命令：`/help`、`/status`、`/params [args]`";
    case "status":
      return "我正常运行中！";
    case "params":
      return `收到参数：${args || "无"}`;
    default:
      return `未知命令：${command}。尝试使用 '/help' 获取命令列表。`;
  }
};