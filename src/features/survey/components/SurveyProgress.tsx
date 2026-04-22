import { Activity } from 'lucide-react';

import type { SurveyProgress as SurveyProgressType } from '../types/survey';

interface SurveyProgressProps {
  progress: SurveyProgressType;
}

function SurveyProgress({ progress }: SurveyProgressProps) {
  const percentage = Math.max(0, Math.min(progress.completion_rate * 100, 100));

  return (
    <section className="survey-panel p-4">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-[#ff4d4d]">
            <Activity size={18} />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-white">진행률</p>
            <p className="text-[13px] leading-5 text-white/55">
              답변이 구체적일수록 남은 질문 수가 줄어들 수 있습니다.
            </p>
          </div>
        </div>
        <p className="pt-0.5 text-sm font-semibold text-[#ff7a7a]">
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
