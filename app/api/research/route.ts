import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildResearchPrompt } from '@/lib/claude';
import { searchTopic } from '@/lib/search';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const payload: ApiRoutePayload = await req.json();
    const { topic, tone, length } = payload;

    const searchResults = await searchTopic(topic);

    const anthropic = createAnthropicClient();
    const result = await streamText({
      model: anthropic(MODEL),
      system: buildSystemPrompt(tone, length),
      prompt: buildResearchPrompt(topic, searchResults),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('[research] error:', err);
    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }
}
