
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseNaturalLanguageEvent = async (input: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `请将以下用户的活动记录解析为结构化的 JSON 对象： "${input}"。
    重要：
    1. 时间格式：必须严格使用 24 小时制（HH:mm），例如 2 PM 解析为 14:00。
    2. 当前日期：${new Date().toISOString().split('T')[0]}。
    3. 分类（category）：请从“工作、学习、运动、休闲、生活、健康”中选一个。
    4. 评分（1-5）：moodRating 和 completionRating。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING, description: "从固定分类中选择" },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          date: { type: Type.STRING, description: "YYYY-MM-DD" },
          startTime: { type: Type.STRING, description: "HH:mm (24小时制)" },
          endTime: { type: Type.STRING, description: "HH:mm (24小时制)" },
          moodRating: { type: Type.NUMBER, description: "1-5 分" },
          completionRating: { type: Type.NUMBER, description: "1-5 分" }
        },
        required: ["title"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("解析 Gemini 响应失败", e);
    return null;
  }
};
