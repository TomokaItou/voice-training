const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.MIRA_FEEDBACK_PORT) || 8787;
const envPath = path.join(process.cwd(), '.env');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadDotEnv(envPath);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function formatValue(value) {
  return value === null || value === undefined || value === '' ? '无' : String(value);
}

function buildUserPrompt(payload) {
  const training = payload.trainingResult || {};
  const previous = payload.previousResult || {};
  return [
    '请根据这次训练摘要生成 Mira 的导航反馈。',
    '',
    `目标歌曲：${formatValue(payload.targetSong || training.targetSong)}`,
    `本次总分：${formatValue(training.totalScore ?? training.score)}`,
    `音准：${formatValue(training.pitchScore)}`,
    `节奏：${formatValue(training.rhythmScore)}`,
    `气息：${formatValue(training.breathScore)}`,
    `共鸣：${formatValue(training.resonanceScore)}`,
    `上次总分：${formatValue(previous.totalScore ?? previous.score)}`,
    `是否第一次训练：${payload.isFirstTraining ? '是' : '否'}`,
    `最近是否进步：${payload.recentImprovement === null ? '暂无数据' : payload.recentImprovement ? '是' : '否'}`,
    '',
    '请返回 JSON：',
    '{',
    '  "encouragement": "一句鼓励",',
    '  "observation": "一个主要观察",',
    '  "nextStep": "一个下一步动作"',
    '}',
  ].join('\n');
}

function getChatCompletionsUrl(baseUrl) {
  const cleanBase = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  return cleanBase.endsWith('/chat/completions') ? cleanBase : `${cleanBase}/chat/completions`;
}

function parseJsonObject(content) {
  const trimmed = String(content || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw error;
  }
}

async function callLLM(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not configured');
    error.code = 'missing_api_key';
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const response = await fetch(getChatCompletionsUrl(process.env.OPENAI_BASE_URL), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            '你是 Mira，Voice Navigation System 的声音导航员。你的任务不是批评用户，而是根据训练数据，帮助用户找到下一步最值得修正的方向。你的语气温柔、专业、简洁、有陪伴感。每次只指出一个最重要的下一步，不要长篇大论。',
        },
        {
          role: 'user',
          content: buildUserPrompt(payload),
        },
      ],
    }),
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`LLM API ${response.status}: ${detail.slice(0, 240)}`);
  }

  const data = await response.json();
  return parseJsonObject(data?.choices?.[0]?.message?.content || '{}');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }
  if (req.method !== 'POST' || req.url !== '/api/mira-feedback') {
    sendJson(res, 404, { error: 'not_found' });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const feedback = await callLLM(payload);
    sendJson(res, 200, { feedback, source: 'llm' });
  } catch (error) {
    const status = error.code === 'missing_api_key' ? 503 : 500;
    sendJson(res, status, { error: error.code || 'mira_feedback_failed', message: error.message });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Mira feedback server listening on http://127.0.0.1:${port}`);
});
