import { Activity } from 'lucide-react';

import type { SurveyProgress as SurveyProgressType } from '../types/survey';

interface SurveyProgressProps {
  progress: SurveyProgressType;
  compact?: boolean;
}

function SurveyProgress({ progress, compact = false }: SurveyProgressProps) {
  const percentage = Math.max(0, Math.min(progress.completion_rate * 100, 100));

  if (compact) {
    return (
      <section className="min-w-[172px] rounded-[22px] border border-white/10 bg-white/[0.03] px-3.5 py-3 shadow-[0_14px_30px_rgba(0,0,0,0.16)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-white/42 uppercase">
            <Activity size={14} className="text-[#ff5b5b]" />
            진행률
          </div>
          <p className="text-sm font-semibold text-[#ff7a7a]">
            {Math.round(percentage)}%
          </p>
        </div>

        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#ff3434,#ff7f50)] transition-[width] duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="survey-panel p-3.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] text-[#ff4d4d]">
            <Activity size={16} />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-white">진행률</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-[#ff7a7a]">
          {Math.round(percentage)}%
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#ff3434,#ff7f50)] transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
}

export default SurveyProgress;
