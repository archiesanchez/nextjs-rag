'use client';

import { useChat } from '@ai-sdk/react';

type Source = { text?: string; page?: number; score?: number };

type AssistantToken =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

function tokenizeAssistantContent(content: string): AssistantToken[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const tokens: AssistantToken[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i += 1;
      continue;
    }

    const headingMatch = line.match(/^\*\*?\s*([^:*][^:]*)\s*:\s*\*\*?$/) || line.match(/^([^:*][^:]{1,60}):$/);
    if (headingMatch) {
      tokens.push({ type: 'heading', text: headingMatch[1].trim() });
      i += 1;
      continue;
    }

    const listStart = line.match(/^([-*•]|\d+\.)\s+(.+)$/);
    if (listStart) {
      const items: string[] = [];
      while (i < lines.length) {
        const listLine = lines[i].trim();
        const listMatch = listLine.match(/^([-*•]|\d+\.)\s+(.+)$/);
        if (!listMatch) {
          break;
        }
        items.push(listMatch[2].trim());
        i += 1;
      }
      tokens.push({ type: 'list', items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const paragraphLine = lines[i].trim();
      if (!paragraphLine) {
        break;
      }
      if (paragraphLine.match(/^\*\*?\s*([^:*][^:]*)\s*:\s*\*\*?$/) || paragraphLine.match(/^([^:*][^:]{1,60}):$/)) {
        break;
      }
      if (paragraphLine.match(/^([-*•]|\d+\.)\s+(.+)$/)) {
        break;
      }
      paragraphLines.push(paragraphLine);
      i += 1;
    }
    tokens.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return tokens;
}

function AssistantContent({ content }: { content: string }) {
  const tokens = tokenizeAssistantContent(content);

  if (tokens.length === 0) {
    return <p className="leading-7">{content}</p>;
  }

  return (
    <div className="space-y-3 leading-7">
      {tokens.map((token, index) => {
        if (token.type === 'heading') {
          return (
            <h3
              key={`${token.type}-${index}`}
              className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600"
            >
              {token.text}
            </h3>
          );
        }

        if (token.type === 'list') {
          return (
            <ul key={`${token.type}-${index}`} className="list-disc space-y-1.5 pl-5 text-slate-800">
              {token.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${token.type}-${index}`} className="text-slate-800">
            {token.text}
          </p>
        );
      })}
    </div>
  );
}

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: '/api/chat',
  });

  return (
    <main className="min-h-screen">
      <section className="bsp-shell h-28" />

      <section className="mx-auto -mt-16 max-w-5xl px-4 pb-8 sm:px-6">
        <div className="bsp-card p-5 sm:p-7">
          <header>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Bangko Sentral ng Pilipinas
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
                  MORB Knowledge Assistant
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Ask questions about BSP&apos;s Manual of Regulations. Each response includes
                  traceable source excerpts for review.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                <span className="bsp-chip">Policy Domain: Banking Supervision</span>
                <span className="bsp-chip">Mode: Source-backed Answers</span>
              </div>
            </div>

            <div className="bsp-divider mt-5" />
          </header>

          <ul className="mb-6 mt-5 min-h-[280px] space-y-4">
            {messages.map((m) => (
              <li
                key={m.id}
                className={
                  m.role === 'user'
                    ? 'flex justify-end'
                    : 'flex flex-col items-start justify-start'
                }
              >
                {m.role === 'assistant' && (
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    MORB Response
                  </p>
                )}

                <span
                  className={
                    m.role === 'user'
                      ? 'inline-block max-w-[92%] rounded-xl bg-[#183a63] px-4 py-2.5 text-sm text-white sm:max-w-[82%]'
                      : 'bsp-assistant-accent bsp-appear inline-block max-w-[92%] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 sm:max-w-[82%]'
                  }
                >
                  {m.role === 'assistant' ? (
                    <AssistantContent content={m.content} />
                  ) : (
                    m.content
                  )}
                </span>

                {m.role === 'assistant' &&
                  m.toolInvocations?.map(
                    (inv) =>
                      inv.state === 'result' &&
                      inv.toolName === 'getInformation' && (
                        <details
                          key={inv.toolCallId}
                          className="bsp-appear mt-2 w-full max-w-[92%] rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700 sm:max-w-[82%]"
                        >
                          <summary className="cursor-pointer font-medium text-slate-800">
                            References ({(inv.result as Source[]).length})
                          </summary>
                          <ul className="mt-3 space-y-2">
                            {(inv.result as Source[]).map((src, i) => (
                              <li
                                key={i}
                                className="rounded-md border border-slate-200 bg-white p-3"
                              >
                                <span className="text-xs text-slate-500">
                                  page {src.page ?? '?'} · score{' '}
                                  {typeof src.score === 'number'
                                    ? src.score.toFixed(2)
                                    : '-'}
                                </span>
                                <p className="mt-1 leading-6 text-slate-700">{src.text}</p>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ),
                  )}
              </li>
            ))}

            {status === 'streaming' && (
              <li className="max-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
                Generating response...
              </li>
            )}

            {error && (
              <li className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                Error: {error.message}
              </li>
            )}
          </ul>

          <form onSubmit={handleSubmit} className="bsp-card p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={input}
                onChange={handleInputChange}
                className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#183a63] focus:outline-none"
                placeholder="Ask about Philippine banking regulations..."
                disabled={status === 'streaming' || status === 'submitted'}
              />
              <button
                type="submit"
                disabled={!input || status === 'streaming' || status === 'submitted'}
                className="rounded-lg bg-[#183a63] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
              >
                Submit Query
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
