import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildDescriptionPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildDescriptionPrompt(payload),
  });

  return result.toTextStreamResponse();
}
