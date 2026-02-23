import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { GoogleGenAI, Type } from 'https://esm.sh/@google/genai@1.42.0';

type Payload = {
  input?: string;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      Connection: 'keep-alive'
    }
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { message: 'METHOD_NOT_ALLOWED' });

  const apiKey = (Deno.env.get('GEMINI_API_KEY') ?? '').trim();
  if (!apiKey) return json(500, { message: 'MISSING_GEMINI_API_KEY' });

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return json(400, { message: 'INVALID_JSON' });
  }

  const input = (payload.input ?? '').trim();
  if (!input) return json(400, { message: 'EMPTY_INPUT' });

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `请将以下用户的活动记录解析为结构化的 JSON 对象： \"${input}\"。\n重要：\n1. 时间格式：必须严格使用 24 小时制（HH:mm），例如 2 PM 解析为 14:00。\n2. 当前日期：${new Date().toISOString().split('T')[0]}。\n3. 分类（category）：请从“工作、学习、运动、休闲、生活、健康”中选一个。\n4. 评分（1-5）：moodRating 和 completionRating。`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          date: { type: Type.STRING },
          startTime: { type: Type.STRING },
          endTime: { type: Type.STRING },
          moodRating: { type: Type.NUMBER },
          completionRating: { type: Type.NUMBER }
        },
        required: ['title']
      }
    }
  });

  try {
    const parsed = JSON.parse(response.text.trim());
    return json(200, parsed);
  } catch {
    return json(200, { raw: response.text.trim() });
  }
});

