import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildHashtagsPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildHashtagsPrompt(payload),
  });

  return result.toTextStreamResponse();
}
