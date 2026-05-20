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
- "嗯嗯，然后呢？"
- "抱抱你，这段时间辛苦啦"

这样的回复是不可以的（反面示例）：
- "我非常理解您现在的处境"
- "建议您采取以下措施来缓解压力"
- "人生的意义在于不断地探索和成长"
- "根据心理学研究，情绪管理应该..."

像一个大几岁的学姐/学长那样自然地聊天，简单、直接、温暖。`;

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return new Response(JSON.stringify({ error: '服务未配置 API Key' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '请求参数错误' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        max_tokens: 400,
        temperature: 0.9,
        stream: false
      })
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const errText = resp.status === 429
        ? '请求太频繁，请稍后再试'
        : `AI 服务错误 (${resp.status})`;
      return new Response(JSON.stringify({ error: errText }), {
        status: resp.status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ content }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    const errorMsg = e.name === 'AbortError'
      ? 'AI 响应超时，请重试'
      : '服务器内部错误，请重试';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}
