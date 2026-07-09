// LLM helper — wraps @anthropic-ai/sdk with structured output + retry.
// NEVER logs the API key or full response objects; logs only step-level progress.

import Anthropic from '@anthropic-ai/sdk';
import type { ZodSchema } from 'zod';

// ── Types ──────────────────────────────────────────────────────────────────

export type ImageBlock = {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
    data: string;
  };
};

export type TextBlock = { type: 'text'; text: string };

export type UserContentBlock = TextBlock | ImageBlock;

// ── Client (lazy — key checked at call time, never at import time) ─────────

interface ClientConfig {
  client: Anthropic;
  /** Model string to pass to the API (may include provider prefix). */
  model: string;
}

const BASE_MODEL = 'claude-sonnet-4-6';

function getClient(): ClientConfig {
  const anthropicKey = process.env['ANTHROPIC_API_KEY'];
  if (anthropicKey) {
    // Direct Anthropic — apiKey is consumed by SDK; never logged.
    return {
      client: new Anthropic({ apiKey: anthropicKey }),
      model: BASE_MODEL,
    };
  }

  const openrouterKey = process.env['OPENROUTER_API_KEY'];
  if (openrouterKey) {
    // OpenRouter speaks the Anthropic Messages API at its own base URL.
    // Model names are prefixed with the provider slug.
    return {
      client: new Anthropic({
        apiKey: openrouterKey,
        // SDK appends /v1/messages to baseURL, so drop the /v1 here
        // to produce the correct: https://openrouter.ai/api/v1/messages
        baseURL: 'https://openrouter.ai/api',
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/rn-brand-factory',
          'X-Title': 'rn-brand-factory',
        },
      }),
      model: `anthropic/${BASE_MODEL}`,
    };
  }

  throw new Error(
    'No LLM API key found. Set one of:\n' +
      '  ANTHROPIC_API_KEY=sk-ant-...   (direct Anthropic)\n' +
      '  OPENROUTER_API_KEY=sk-or-...   (via OpenRouter)',
  );
}

// ── Core helper ────────────────────────────────────────────────────────────
const MAX_TOKENS = 512;
const TEMPERATURE = 0.2;

// Strips accidental ```json ... ``` fences the model may add despite instructions.
function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();
}

/**
 * Call the model and coerce its response into a validated T.
 *
 * - Appends "Return raw JSON only, no prose, no code fences." to every system prompt.
 * - On JSON/zod parse failure, sends the error text back as a retry turn.
 * - Throws with the last error after maxRetries consecutive failures.
 *
 * userContent may be a plain string or an array of blocks that includes an
 * image block for vision tasks.
 */
export async function structuredOutput<T>(
  schema: ZodSchema<T>,
  system: string,
  userContent: string | UserContentBlock[],
  maxRetries = 3,
): Promise<T> {
  const cfg = getClient();

  const systemPrompt =
    system.trimEnd() +
    '\n\nReturn raw JSON only — no prose, no code fences, no markdown.';

  // Normalise userContent to the SDK's content-block array form.
  const firstUserContent: Anthropic.MessageParam['content'] =
    typeof userContent === 'string'
      ? [{ type: 'text', text: userContent }]
      : (userContent as Anthropic.MessageParam['content']);

  // Mutable conversation — grows on retry turns.
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: firstUserContent },
  ];

  let lastError: Error = new Error('structuredOutput: no attempts made');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    process.stdout.write(
      `  [llm] attempt ${attempt + 1}/${maxRetries} (${cfg.model})\n`,
    );

    const response = await cfg.client.messages.create({
      model: cfg.model,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: systemPrompt,
      messages,
    });

    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    // Record the assistant turn for the next retry (if needed).
    messages.push({ role: 'assistant', content: rawText });

    try {
      const stripped = stripFences(rawText);
      const parsed: unknown = JSON.parse(stripped);
      return schema.parse(parsed);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      process.stderr.write(
        `  [llm] attempt ${attempt + 1} failed validation: ${lastError.message}\n`,
      );
      // Inject a correction request so the next turn sees what went wrong.
      messages.push({
        role: 'user',
        content: `Your output failed validation: ${lastError.message}. Return corrected JSON only.`,
      });
    }
  }

  throw new Error(
    `structuredOutput: all ${maxRetries} retries exhausted. Last error: ${lastError.message}`,
  );
}
