// app/page.tsx
'use client';

import { useState } from 'react';

type OKRVersion = {
  objective: string;
  keyResults: string[];
};

type ScoreResult = {
  score: number;
  verdict: string;
  reasoningPoints: string[];
  improvedOKRs: OKRVersion[];
};

function getEmoji(score: number) {
  if (score <= 1) return '😡';
  if (score <= 3) return '😟';
  if (score <= 5) return '😐';
  if (score <= 7) return '🙂';
  if (score <= 9) return '😊';
  return '🤩';
}

function ScoreScale({ score }: { score: number }) {
  const leftPercent = (score / 10) * 100;
  return (
    <div className="w-full mt-2">
      <div
        className="relative w-full h-9 rounded-full overflow-hidden shadow-inner"
        style={{
          background:
            'linear-gradient(to right, #ef4444, #f97316, #facc15, #a3e635, #22c55e, #0d9488)',
        }}
      >
        <div className="absolute inset-0 flex justify-between px-2 items-center text-xs font-semibold text-black/40">
          {Array.from({ length: 11 }).map((_, i) => (
            <span key={i}>{i}</span>
          ))}
        </div>
      </div>

      <div className="relative w-full" style={{ height: '3.5rem' }}>
        <div
          className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center transition-all duration-700 ease-out"
          style={{ left: `${leftPercent}%` }}
        >
          <span className="text-4xl drop-shadow-md">{getEmoji(score)}</span>
        </div>
      </div>

      <p className="text-center text-2xl font-bold text-slate-900 mt-1">
        Your OKR Score: <span className="text-indigo-600">{score}</span>
      </p>
    </div>
  );
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      onClick={handleCopy}
      aria-label="Copy"
      className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
    >
      <CopyIcon copied={copied} />
    </button>
  );
}

function DraftCard({
  draft,
  setDraft,
  loading,
  handleCheck,
  error,
}: {
  draft: string;
  setDraft: (v: string) => void;
  loading: boolean;
  handleCheck: () => void;
  error: string;
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-sm p-6">
      <label className="text-xs font-semibold uppercase tracking-wide text-indigo-500 mb-2 block">
        Your draft OKR
      </label>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="e.g. Increase customer satisfaction by improving support"
        className="w-full h-28 p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />

      <div className="flex justify-center mt-4">
        <button
          onClick={handleCheck}
          disabled={loading || draft.trim().length < 5}
          className="px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold disabled:opacity-40 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-200"
        >
          {loading ? 'Scoring...' : 'Score My OKR'}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-center mt-4 text-sm">{error}</p>}
    </div>
  );
}

export default function Home() {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/score-okr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftOKR: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-slate-900 overflow-x-hidden">
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-28">
        <h1 className="text-4xl font-extrabold text-center mb-2 tracking-tight">
          OKR Quality Checker
        </h1>
        <p className="text-slate-500 text-center mb-10">
          Paste your draft OKR. Get a score, a verdict, and 3 sharper rewrites.
        </p>

        {!result ? (
          <div className="max-w-2xl mx-auto">
            <DraftCard
              draft={draft}
              setDraft={setDraft}
              loading={loading}
              handleCheck={handleCheck}
              error={error}
            />
          </div>
        ) : (
          <div className="md:grid md:grid-cols-[1fr_1px_1fr] md:gap-10 items-stretch animate-in fade-in duration-500">
            {/* LEFT column */}
            <div className="space-y-6">
              <DraftCard
                draft={draft}
                setDraft={setDraft}
                loading={loading}
                handleCheck={handleCheck}
                error={error}
              />

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <ScoreScale score={result.score} />
                <p className="text-center font-bold text-lg mt-6">{result.verdict}</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-4 text-sm text-slate-600">
                  {result.reasoningPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block bg-slate-200" />

            {/* RIGHT column */}
            <div className="space-y-4 mt-10 md:mt-0">
              <h2 className="font-semibold text-slate-700 px-1">Better-framed versions</h2>
              {result.improvedOKRs.map((okr, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                        Objective
                      </span>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{okr.objective}</p>
                    </div>
                    <CopyLine text={okr.objective} />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-3 block">
                    Key Results
                  </span>
                  <div className="mt-1 space-y-1.5">
                    {okr.keyResults.map((kr, j) => (
                      <div key={j} className="flex items-start justify-between gap-2">
                        <p className="text-sm text-slate-600">{kr}</p>
                        <CopyLine text={kr} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-4">What is an OKR?</h2>
          <p className="text-slate-600 mb-4">
            OKR stands for Objectives and Key Results — a goal-setting framework
            popularized by Intel and later Google, used to align teams around a
            small number of ambitious, measurable goals each quarter.
          </p>
          <p className="text-slate-600 mb-4">
            An <strong>Objective</strong> is a qualitative, inspiring statement of
            what you want to achieve. A <strong>Key Result</strong> is a
            quantitative, verifiable metric that tells you whether you got there.
          </p>
          <p className="text-slate-600 mb-4">
            <strong>Example:</strong> Objective — &quot;Delight our customers with
            best-in-class support.&quot; Key Results — &quot;Reduce average
            response time from 24h to 4h,&quot; &quot;Raise CSAT from 72% to
            90%,&quot; &quot;Cut ticket reopen rate from 15% to 5%.&quot;
          </p>
          <p className="text-slate-600">
            Good OKRs are specific, measurable, time-bound, and ambitious without
            being unrealistic. They describe outcomes, not tasks — &quot;launch a
            new onboarding flow&quot; is a task; &quot;increase 7-day activation
            rate from 40% to 60%&quot; is an outcome.
          </p>
        </div>
      </section>
    </main>
  );
}