import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';

import { ROUTES } from '../../../constants/routes';
import type { MatchingCandidateItem } from '../../../features/matching/types';
import MatchingCandidatePanel, {
  type MatchingCandidatePanelProps,
} from './MatchingCandidatePanel';
import MatchingMediaPanel from './MatchingMediaPanel';

const MATCHING_BACK_LINK_CLASS =
  'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]';

export function MatchingDetailSkeleton() {
  return (
    <section className="mx-auto mt-9 max-w-255 animate-pulse sm:mt-10 md:mt-12">
      <div className="text-center">
        <div className="mx-auto h-4 w-20 rounded-full bg-[#792222]/35" />
        <div className="relative mt-3">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-transparent sm:text-4xl md:text-[40px]">
            매칭 과정을 따라가세요
          </h1>
          <div className="absolute top-1/2 left-1/2 h-10 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/9" />
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.32fr_0.92fr] lg:gap-5 xl:mt-9">
        <div className="overflow-hidden rounded-[26px] border border-white/8 bg-[#0d0d0f] shadow-[0_24px_48px_rgba(0,0,0,0.28)]">
          <div className="aspect-video h-full min-h-90 rounded-[26px] bg-white/5 sm:min-h-105" />
        </div>

        <div className="survey-panel flex flex-col px-5 py-5 sm:px-6 sm:py-6">
          <div className="relative max-w-[72%]">
            <h2 className="text-2xl leading-[1.28] font-semibold tracking-[-0.02em] text-transparent sm:text-[30px]">
              플레이스홀더 제목 제목
            </h2>
            <div className="absolute top-1/2 left-0 h-9 w-full -translate-y-1/2 rounded-full bg-white/9" />
          </div>
          <div className="mt-4 h-4 w-full rounded-full bg-white/7" />
          <div className="mt-2 h-4 w-[88%] rounded-full bg-white/7" />
          <div className="mt-2 h-4 w-[82%] rounded-full bg-white/7" />
          <div className="mt-2 h-4 w-[64%] rounded-full bg-white/7" />

          <div className="mt-5 grid gap-1.5 sm:grid-cols-2">
            <div className="h-16 rounded-[14px] border border-white/8 bg-white/3" />
            <div className="h-16 rounded-[14px] border border-white/8 bg-white/3" />
          </div>

          <div className="mt-7 h-4 w-44 rounded-full bg-white/8" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-10 w-10 rounded-full bg-white/6" />
            ))}
          </div>

          <div className="mt-auto pt-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="h-12 w-23 rounded-full bg-white/5" />
              <div className="h-12 w-26 rounded-full bg-white/8" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MatchingDetailInvalidSection() {
  return (
    <section className="survey-panel mx-auto max-w-190 px-6 py-10 sm:px-8 sm:py-12">
      <p className="text-sm font-semibold tracking-[0.2em] text-[#ff8c8c] uppercase">
        Matching
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
        선택한 장르를 찾을 수 없어요.
      </h1>
      <p className="mt-4 max-w-[52ch] text-sm leading-7 break-keep text-white/60 sm:text-base">
        잘못된 경로로 접근했거나 아직 준비되지 않은 장르입니다. 장르 선택
        화면으로 돌아가서 다시 시작해보세요.
      </p>
      <Link
        to={`/${ROUTES.MATCHING_LIST}`}
        className={`mt-7 ${MATCHING_BACK_LINK_CLASS}`}
      >
        <ChevronLeft size={16} />
        장르 선택으로 돌아가기
      </Link>
    </section>
  );
}

type MatchingDetailErrorSectionProps = {
  message: string;
  onRetry: () => void;
};

export function MatchingDetailErrorSection({
  message,
  onRetry,
}: MatchingDetailErrorSectionProps) {
  return (
    <section className="survey-panel mx-auto max-w-190 px-6 py-10 sm:px-8 sm:py-12">
      <p className="text-sm font-semibold tracking-[0.2em] text-[#ff8c8c] uppercase">
        Matching
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
        매칭 후보를 불러오지 못했어요.
      </h1>
      <p className="mt-4 max-w-[52ch] text-sm leading-7 break-keep text-white/60 sm:text-base">
        {message}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className={MATCHING_BACK_LINK_CLASS}
        >
          다시 시도
        </button>
        <Link
          to={`/${ROUTES.MATCHING_LIST}`}
          className={MATCHING_BACK_LINK_CLASS}
        >
          <ChevronLeft size={16} />
          장르 선택으로 돌아가기
        </Link>
      </div>
    </section>
  );
}

export function MatchingDetailEmptySection() {
  return (
    <section className="survey-panel mx-auto max-w-190 px-6 py-10 sm:px-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
        이 장르에 준비된 후보 게임이 아직 없어요.
      </h1>
      <p className="mt-4 max-w-[52ch] text-sm leading-7 break-keep text-white/60 sm:text-base">
        잠시 후 다시 시도하거나 다른 장르에서 먼저 매칭을 진행해보세요.
      </p>
      <Link
        to={`/${ROUTES.MATCHING_LIST}`}
        className={`mt-7 ${MATCHING_BACK_LINK_CLASS}`}
      >
        <ChevronLeft size={16} />
        다른 장르 보기
      </Link>
    </section>
  );
}

type MatchingDetailReadySectionProps = {
  currentStep: number;
  totalSteps: number;
  currentCandidate: MatchingCandidateItem;
  candidatePanelProps: MatchingCandidatePanelProps;
};

export function MatchingDetailReadySection({
  currentStep,
  totalSteps,
  currentCandidate,
  candidatePanelProps,
}: MatchingDetailReadySectionProps) {
  return (
    <>
      <div className="pointer-events-none absolute top-[5.15rem] left-1/2 z-20 w-screen -translate-x-1/2 pr-[clamp(1rem,5vw,20rem)] pl-[clamp(0.35rem,3vw,20rem)] sm:top-[5.45rem] md:top-23">
        <Link
          to={`/${ROUTES.MATCHING_LIST}`}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
        >
          <ChevronLeft size={16} />
          다른 장르 보기
        </Link>
      </div>

      <section className="mx-auto mt-9 max-w-255 sm:mt-10 md:mt-12">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-[#d93737] uppercase">
            {currentStep} / {totalSteps} 단계
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-[40px]">
            매칭 과정을 따라가세요
          </h1>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.32fr_0.92fr] lg:gap-5 xl:mt-9">
          <MatchingMediaPanel candidate={currentCandidate} />
          <MatchingCandidatePanel {...candidatePanelProps} />
        </div>
      </section>
    </>
  );
}
