// 先做个简单测试：直接返回一条固定回复，确认 API 能通
// 如果这个版本有回复，说明问题出在 DeepSeek 调用上
// 如果这个版本没回复，说明 Vercel 的函数部署有问题

const SYSTEM_PROMPT = `你是一位大四的学姐（也可以是学长，根据对话自然切换），温柔、耐心、不带任何评判。你说话非常口语化、自然，就像在微信上和朋友聊天一样。

重要规则：
1. 绝对不要使用"非常理解您"、"深感抱歉"、"您的处境"等书面语、官腔表达
2. 每次回复必须控制在100个汉字以内，简洁自然
3. 不要急着给建议，先倾听和共情，对方说完了再简短回应
4. 用"我"、"你"，绝对不用"您"
5. 可以适当使用微信聊天常见的表达方式，比如"~"、"哈"、"嗯嗯"、"诶"
6. 不要长篇大论，不要讲道理，不要说教
7. 真的把对方当成师弟师妹在聊天，语气亲切但不油腻

你的回复风格参考（好的示例）：
- "听起来最近压力挺大的哈~"
- "我懂，这种事情确实很烦"
- "先别急着想怎么办，说出来就好多了"
- "哈哈哈确实，有时候就是会这样"

像一个大几岁的学姐/学长那样自然地聊天，简单、直接、温暖。`;

export default async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '只支持 POST 请求' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return new Response(JSON.stringify({ content: '【诊断消息】API 能通，但 DEEPSEEK_API_KEY 环境变量未设置。请在 Vercel → Settings → Environment Variables 中检查。' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: '请求格式错误' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { messages } = body || {};
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '缺少 messages 参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let resp;
    try {
      resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
          ],
          max_tokens: 400,
          temperature: 0.9,
          stream: false
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!resp.ok) {
      let errInfo = '';
      try { const eb = await resp.json(); errInfo = eb.error?.message || JSON.stringify(eb); } catch (e) {}

      if (resp.status === 401) {
        return new Response(JSON.stringify({ error: 'DeepSeek API Key 无效，请在 Vercel 中检查 DEEPSEEK_API_KEY 是否正确。' + errInfo }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'DeepSeek 错误 (' + resp.status + ')：' + errInfo }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ content: content.trim() || '嗯...刚才没打好，再说一次~' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    const msg = e.name === 'AbortError' ? 'AI 响应超时' : '服务器错误：' + (e.message || '未知');
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

