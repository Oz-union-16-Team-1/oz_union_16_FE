import type {
  SupportChatQuickAction,
  SupportChatRouteContext,
} from '../types/supportChat';
import { ROUTE_PATHS } from '@/constants/routes';

type SupportFaqEntry = {
  id: string;
  label: string;
  keywords: string[];
  answer: string;
};

export const SUPPORT_CHAT_WELCOME_MESSAGE =
  '안녕하세요! 고객센터 챗봇입니다.\n궁금한 내용을 입력하시거나 아래 예시 질문을 눌러 바로 도움을 받아보세요.';

export const SUPPORT_CHAT_QUICK_ACTIONS: SupportChatQuickAction[] = [
  { id: 'account-help', label: '아이디 비밀번호 변경은 어떻게 하나요?' },
  { id: 'search-help', label: '게임을 검색했는데 안나와요.' },
  {
    id: 'delete-account-help',
    label: '계정 삭제 하고 싶은데 어떻게 하나요?',
  },
  { id: 'find-id-help', label: '아이디를 찾고 싶어요' },
  { id: 'forgot-password-help', label: '비밀번호가 기억이 안나요.' },
  { id: 'google-login-help', label: '구글 로그인은 어떻게 하나요?' },
];

const SUPPORT_FAQ_ENTRIES: SupportFaqEntry[] = [
  {
    id: 'account-change',
    label: '아이디 비밀번호 변경은 어떻게 하나요?',
    keywords: ['아이디', '비밀번호', '변경', '수정', '로그인 정보'],
    answer:
      '아이디 확인이나 비밀번호 변경이 필요하시면 로그인 화면 또는 마이페이지를 이용해 주세요.\n비밀번호 변경은 마이페이지에서 진행할 수 있고, 아이디 찾기는 본인 확인 절차가 준비되면 안내에 따라 확인하실 수 있습니다.',
  },
  {
    id: 'search',
    label: '게임을 검색했는데 안나와요.',
    keywords: ['게임', '검색', '안 나와', '결과 없음', '찾을 수 없'],
    answer:
      '검색 결과가 보이지 않는 경우 띄어쓰기나 영문 표기를 조금 다르게 입력해 보시는 것을 먼저 권장드려요.\n그래도 찾으시는 게임이 없다면 메인 페이지 검색이나 추천 목록 갱신 후 다시 확인해 주세요.',
  },
  {
    id: 'delete-account',
    label: '계정 삭제 하고 싶은데 어떻게 하나요?',
    keywords: ['계정 삭제', '회원 탈퇴', '탈퇴', '계정 제거'],
    answer:
      '회원탈퇴는 마이페이지 하단의 회원탈퇴 버튼에서 진행하실 수 있습니다.\n탈퇴 전에는 계정 정보와 저장된 로그인 상태가 함께 정리되므로, 필요한 정보가 있다면 먼저 확인해 주세요.',
  },
  {
    id: 'find-id',
    label: '아이디를 찾고 싶어요',
    keywords: ['아이디', '찾고', '분실', '모르겠'],
    answer:
      '아이디 찾기는 본인 인증 기반 안내가 준비되는 대로 로그인 화면과 고객센터 안내를 통해 제공될 예정입니다.\n현재는 가입 시 사용한 이름과 닉네임 정보를 먼저 확인해 주세요.',
  },
  {
    id: 'forgot-password',
    label: '비밀번호가 기억이 안나요.',
    keywords: [
      '비밀번호',
      '기억이 안나',
      '기억이 안 나',
      '비밀번호 찾기',
      '재설정',
    ],
    answer:
      '비밀번호가 기억나지 않으시면 로그인 화면 또는 마이페이지의 비밀번호 변경 흐름을 이용해 주세요.\n소셜 로그인 계정은 자체 비밀번호가 없을 수 있으니, 가입하신 로그인 방식을 먼저 확인해 주세요.',
  },
  {
    id: 'google-login',
    label: '구글 로그인은 어떻게 하나요?',
    keywords: ['구글 로그인', '구글', 'google', '소셜 로그인'],
    answer:
      '로그인 화면 상단의 구글 로그인 버튼을 누르면 구글 계정으로 바로 로그인할 수 있습니다.\n소셜 로그인 사용자는 별도 비밀번호 없이 구글 인증만으로 계정에 접속하실 수 있습니다.',
  },
];

const normalizeQuestion = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[?!.,]/g, '');

export const findSupportFaqEntry = (message: string) => {
  const normalizedMessage = normalizeQuestion(message);

  return (
    SUPPORT_FAQ_ENTRIES.find((entry) =>
      entry.keywords.some((keyword) =>
        normalizedMessage.includes(normalizeQuestion(keyword)),
      ),
    ) ?? null
  );
};

export const buildSupportChatFallbackMessage = (
  routeContext: SupportChatRouteContext,
) =>
  `${routeContext.pageLabel} 화면과 관련된 문의를 도와드릴 수 있어요.\n현재 챗봇은 고객센터 FAQ 기반으로 동작하고 있습니다. 아래 예시 질문을 눌러주시거나, 문의 내용을 조금 더 구체적으로 적어주시면 비슷한 도움말을 안내해 드릴게요.`;

export const createDefaultRouteContext = (): SupportChatRouteContext => ({
  pathname: ROUTE_PATHS.HOME,
  pageLabel: '현재',
});
