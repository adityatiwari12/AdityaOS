import Groq from 'groq-sdk';

/**
 * Shared Groq access used by the copilot endpoints. Centralizes client
 * creation, the one-retry-on-429 policy, and JSON response parsing so every
 * caller behaves identically.
 */

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResult {
  message: string;
  actions: any[];
  mode: string;
}

export function groqConfigured(): boolean {
  return Boolean(
    import.meta.env.GROQ_API_KEY ||
      (typeof process !== 'undefined' ? process.env.GROQ_API_KEY : undefined)
  );
}

function getClient(): Groq | null {
  const apiKey =
    import.meta.env.GROQ_API_KEY ||
    (typeof process !== 'undefined' ? process.env.GROQ_API_KEY : undefined);
  return apiKey ? new Groq({ apiKey }) : null;
}

/**
 * Calls Groq with a single retry on rate-limit (429). Returns parsed
 * message/actions/mode. Throws on unrecoverable errors so the caller can fall
 * back to the offline engine.
 */
export async function callGroq(messages: GroqMessage[]): Promise<GroqResult> {
  const groq = getClient();
  if (!groq) throw new Error('GROQ_NOT_CONFIGURED');

  const create = () =>
    groq.chat.completions.create({
      // Cheapest + fastest Groq model. The offline engine handles most queries
      // for free; this only runs for low-confidence ones, with a tight token
      // budget to keep cost minimal.
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: 0.6,
      max_tokens: 320,
      response_format: { type: 'json_object' },
    });

  let completion;
  try {
    completion = await create();
  } catch (e) {
    if (e instanceof Groq.APIError && e.status === 429) {
      await new Promise((r) => setTimeout(r, 1500));
      completion = await create();
    } else {
      throw e;
    }
  }

  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error('EMPTY_RESPONSE');

  try {
    const parsed = JSON.parse(content);
    return {
      message: parsed.message ?? parsed.reply ?? content,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      mode: parsed.mode ?? 'chat',
    };
  } catch {
    return { message: content, actions: [], mode: 'chat' };
  }
}
