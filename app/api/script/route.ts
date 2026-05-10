import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildScriptPrompt } from '@/lib/claude';
import { WORD_COUNT_TARGETS } from '@/lib/types';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const payload: ApiRoutePayload = await req.json();
    const wordCount = WORD_COUNT_TARGETS[payload.length];
    const anthropic = createAnthropicClient();

    const result = await streamText({
      model: anthropic(MODEL),
      system: buildSystemPrompt(payload.tone, payload.length),
      prompt: buildScriptPrompt(payload, wordCount),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('[script] error:', err);
    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }
}
