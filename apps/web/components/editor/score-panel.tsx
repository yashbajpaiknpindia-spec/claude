'use client';

import { useState } from 'react';
import type { ScoreFeedback } from '@brandforge/types';
import { Flame, RefreshCw, TrendingUp, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useApi } from '@/hooks/use-api';

interface ScorePanelProps {
  projectId: string;
  score: number | null;
  feedback: ScoreFeedback | null;
}

export function ScorePanel({ projectId, score, feedback: initialFeedback }: ScorePanelProps) {
  const { post } = useApi();
  const [feedback, setFeedback] = useState<ScoreFeedback | null>(initialFeedback);
  const [isLoading, setIsLoading] = useState(false);
  const [roastMode, setRoastMode] = useState(false);

  const runScore = async (roast = false) => {
    setIsLoading(true);
    setRoastMode(roast);
    const result = await post(`/projects/${projectId}/score`, { roastMode: roast });
    setFeedback(result.data);
    setIsLoading(false);
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreGrade = (s: number) => {
    if (s >= 90) return 'A+';
    if (s >= 80) return 'A';
    if (s >= 70) return 'B+';
    if (s >= 60) return 'B';
    if (s >= 50) return 'C';
    return 'D';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="font-syne font-semibold text-sm">Portfolio Score</h3>
        <p className="text-xs text-white/30 mt-0.5">AI-powered analysis</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!feedback && !isLoading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="font-syne font-semibold mb-2">Score your portfolio</h4>
            <p className="text-xs text-white/30 mb-6 leading-relaxed">
              Get an AI-powered score and actionable feedback to improve your brand.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => runScore(false)}
                className="btn-primary btn w-full text-sm py-2.5 gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Score my portfolio
              </button>
              <button
                onClick={() => runScore(true)}
                className="btn w-full text-sm py-2.5 gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-colors"
              >
                <Flame className="w-4 h-4" />
                Roast my portfolio 🔥
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-2 border-[#7c6af7]/30 border-t-[#7c6af7] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-white/40">
              {roastMode ? '🔥 Preparing the roast...' : 'Analyzing your portfolio...'}
            </p>
          </div>
        )}

        {feedback && !isLoading && (
          <div className="space-y-5">
            {/* Overall score */}
            <div className="text-center py-5">
              <div
                className="text-6xl font-syne font-bold mb-1"
                style={{ color: getScoreColor(feedback.overall) }}
              >
                {feedback.overall}
              </div>
              <div
                className="text-2xl font-bold mb-2"
                style={{ color: getScoreColor(feedback.overall) }}
              >
                {getScoreGrade(feedback.overall)}
              </div>

              {/* Score ring */}
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={getScoreColor(feedback.overall)}
                    strokeWidth="2"
                    strokeDasharray={`${feedback.overall} ${100 - feedback.overall}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{feedback.overall}</span>
                </div>
              </div>
            </div>

            {/* Roast */}
            {feedback.roast && (
              <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">The Roast</span>
                </div>
                <p className="text-sm text-white/70 italic leading-relaxed">"{feedback.roast}"</p>
              </div>
            )}

            {/* Category breakdown */}
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Breakdown</h4>
              <div className="space-y-3">
                {Object.entries(feedback.categories).map(([cat, data]) => (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium capitalize">{cat}</span>
                      <span className="text-xs font-bold" style={{ color: getScoreColor(data.score) }}>
                        {data.score}/100
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${data.score}%`, background: getScoreColor(data.score) }}
                      />
                    </div>
                    <p className="text-xs text-white/30 mt-1">{data.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick wins */}
            {feedback.quickWins?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#f59e0b]" />
                  Quick Wins
                </h4>
                <div className="space-y-2">
                  {feedback.quickWins.map((win, i) => (
                    <div key={i} className="flex gap-2.5 text-xs text-white/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0 mt-0.5" />
                      {win}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues */}
            {feedback.topIssues?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#ef4444]" />
                  Top Issues
                </h4>
                <div className="space-y-2">
                  {feedback.topIssues.map((issue, i) => (
                    <div key={i} className="flex gap-2.5 text-xs text-white/60">
                      <div className="w-1 h-1 rounded-full bg-[#ef4444] flex-shrink-0 mt-1.5" />
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Re-score */}
            <button
              onClick={() => runScore(false)}
              className="btn-secondary btn w-full text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
