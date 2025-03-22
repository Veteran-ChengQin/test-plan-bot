import { NextResponse } from 'next/server';
import { Webhooks } from "@octokit/webhooks";
import { createOctokitClient, parseBotCommand, processCommand } from '@/utils/github';

export async function POST(request: Request) {
  const payload = await request.json();
  const signature = request.headers.get('x-hub-signature-256');
  
  if (!signature) {
    return NextResponse.json({ error: '缺少签名' }, { status: 401 });
  }
  
  // 初始化 webhook 实例
  const webhooks = new Webhooks({
    secret: process.env.GITHUB_WEBHOOK_SECRET || '',
  });
  
  // 验证 webhook 签名
  try {
    await webhooks.verifySignature({
      signature,
      payload: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('无效签名', error);
    return NextResponse.json({ error: '无效签名' }, { status: 401 });
  }
  
  // 处理 webhook 事件
  try {
    // 只处理创建评论的事件
    if (payload.action !== 'created') {
      return NextResponse.json({ message: '非评论创建事件' });
    }
    
    // 获取评论数据
    const comment = payload.comment || (payload.review && payload.review.comment);
    if (!comment) {
      return NextResponse.json({ message: '无评论数据' });
    }
    
    const commentBody = comment.body;
    
    // 获取 PR 编号
    const pullRequestNumber = payload.issue?.number || (payload.pull_request && payload.pull_request.number);
    if (!pullRequestNumber) {
      return NextResponse.json({ message: '无法确定 PR 编号' });
    }
    
    // 解析机器人命令
    const commandData = parseBotCommand(commentBody);
    if (!commandData) {
      return NextResponse.json({ message: '没有检测到命令' });
    }
    
    // 处理命令
    const responseMessage = processCommand(commandData.command, commandData.args);
    
    // 获取 Octokit 客户端
    const octokit = createOctokitClient();
    
    // 回复评论
    await octokit.rest.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: pullRequestNumber,
      body: responseMessage,
    });
    
    return NextResponse.json({ success: true, message: '命令已处理' });
  } catch (error) {
    console.error('处理 webhook 时出错', error);
    return NextResponse.json({ error: '处理 webhook 时出错' }, { status: 500 });
  }
}