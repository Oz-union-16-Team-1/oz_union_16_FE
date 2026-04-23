import { Activity } from 'lucide-react';

import type { SurveyProgress as SurveyProgressType } from '../types/survey';

interface SurveyProgressProps {
  progress: SurveyProgressType;
}

function SurveyProgress({ progress }: SurveyProgressProps) {
  const percentage = Math.max(0, Math.min(progress.completion_rate * 100, 100));

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
