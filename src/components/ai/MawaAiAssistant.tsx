import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Send, Sparkles, X } from 'lucide-react';
import { useSiteData } from '../../context/SiteDataContext';
import { askMawaAssistant, type ChatTurn } from '../../services/aiService';
import { trackAnalyticsEvent } from '../../services/firestoreService';

const QUICK_PROMPTS = [
  'Which MAWA products are free to use?',
  'What AI tools or utilities is MAWA building?',
  'Where can I view upcoming roadmap releases?',
];

export function MawaAiAssistant() {
  const { products, settings } = useSiteData();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatTurn[]>([
    {
      role: 'assistant',
      text: 'Hello! I am the MAWA Platform Assistant. Ask me about our digital products, categories, upcoming releases, downloads, or how to get in touch.',
    },
  ]);

  if (settings.aiAssistantEnabled === false) {
    return null;
  }

  const submitQuestion = async (rawQuestion: string) => {
    const q = rawQuestion.trim();
    if (!q || loading) return;
    setInput('');
    const nextHistory: ChatTurn[] = [...history, { role: 'user', text: q }];
    setHistory(nextHistory);
    setLoading(true);

    void trackAnalyticsEvent({
      eventType: 'ai_query',
      path: window.location.pathname,
      referrerSource: 'assistant_drawer',
    });

    try {
      const res = await askMawaAssistant(q, products, history);
      setHistory([...nextHistory, { role: 'assistant', text: res.answer }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close MAWA Assistant' : 'Open MAWA Assistant'}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-blue-600 text-white shadow-xl shadow-slate-950/20 hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors border border-slate-700/60 dark:border-blue-400/40"
      >
        {open ? (
          <X className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4 text-cyan-300" />
        )}
        <span className="text-xs font-semibold tracking-wide whitespace-nowrap">
          {open ? 'Close Assistant' : 'MAWA AI Guide'}
        </span>
      </button>

      {open && (
        <aside
          aria-label="MAWA Platform AI Assistant"
          className="fixed bottom-20 right-5 z-40 w-[calc(100vw-2.5rem)] sm:w-[24rem] max-h-[75vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700/90 bg-white dark:bg-[#0B1326] shadow-2xl overflow-hidden"
        >
          <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080F22] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                  MAWA AI Guide
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Product Finder &amp; Platform Help
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close drawer"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {history.map((turn, idx) => (
              <div
                key={idx}
                className={`rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-line ${
                  turn.role === 'user'
                    ? 'ml-8 bg-blue-600 text-white text-xs sm:text-sm'
                    : 'mr-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#060B19] text-slate-700 dark:text-slate-200 text-xs sm:text-sm'
                }`}
              >
                {turn.text}
              </div>
            ))}

            {loading && (
              <div className="mr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#060B19] px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                Checking MAWA catalog...
              </div>
            )}

            {history.length === 1 && (
              <div className="pt-2 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Suggested questions
                </p>
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void submitQuestion(q)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#080F22]">
            <Link
              to="/products"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Browse Catalog
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              to="/faq"
              onClick={() => setOpen(false)}
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              Read FAQ
            </Link>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitQuestion(input);
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-[#0B1326]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about MAWA products..."
              aria-label="Ask MAWA AI Assistant"
              className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B19] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={loading || input.trim().length < 2}
              aria-label="Send question"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
