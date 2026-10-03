/**
 * Final Route Handler — Step 4 of Section 4 (RAG-as-tool-call) +
 * the source metadata used by Step 5's UI.
 *
 * The model decides whether to call the getInformation tool. When it does,
 * the tool runs vector search and returns chunk text + page + score. The
 * client renders those as collapsible sources under the assistant message.
 */
import { openai } from '@ai-sdk/openai';
import { streamText, tool, embed } from 'ai';
import { Index } from '@upstash/vector';
import { z } from 'zod';

const index = new Index();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system:
      'You are a helpful assistant for the Manual of Regulations of the Philippine Central Bank. ' +
      'Use the getInformation tool whenever the user asks a question whose ' +
      'answer might be in the document. If the document does not cover something, ' +
      'say so directly rather than guessing. ' +
      'Format responses for readability using this structure: ' +
      '"Short answer:", "Key points:", "Regulatory basis:", and "Practical takeaway:". ' +
      'Keep sections concise, use short bullet points where possible, and avoid dense paragraphs.',
    messages,
    tools: {
      getInformation: tool({
        description:
          'Look up information from the MORB. Use this whenever the user asks a substantive question about Philippine banking regulations.',
        parameters: z.object({
          query: z
            .string()
            .describe('the topic, term, or sub-question to search for'),
        }),
        execute: async ({ query }) => {
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: query,
          });
          const hits = await index.query({
            vector: embedding,
            topK: 4,
            includeMetadata: true,
          });
          return hits.map((h) => ({
            text: (h.metadata?.text as string) ?? '',
            page: (h.metadata?.page as number) ?? null,
            score: h.score,
          }));
        },
      }),
    },
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}
