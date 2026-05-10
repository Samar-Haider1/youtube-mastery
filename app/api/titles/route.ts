import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildTitlesPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const payload: ApiRoutePayload = await req.json();
    const anthropic = createAnthropicClient();

    const result = await streamText({
      model: anthropic(MODEL),
      system: buildSystemPrompt(payload.tone, payload.length),
      prompt: buildTitlesPrompt(payload),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('[titles] error:', err);
    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }
}
