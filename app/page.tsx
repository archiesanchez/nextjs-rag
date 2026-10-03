'use client';

import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Source = { text?: string; page?: number; score?: number };

function AssistantContent({ content }: { content: string }) {
  return (
    <div className="leading-7 text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h3 className="mb-2 text-base font-semibold text-slate-900">{children}</h3>,
          h2: ({ children }) => <h3 className="mb-2 text-base font-semibold text-slate-900">{children}</h3>,
          h3: ({ children }) => (
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">{children}</h4>
          ),
          p: ({ children }) => <p className="mb-3">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em] text-slate-900">{children}</code>
          ),
          hr: () => <hr className="my-3 border-slate-200" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-[#183a63] underline underline-offset-2"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
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

                <div
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
                </div>

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
