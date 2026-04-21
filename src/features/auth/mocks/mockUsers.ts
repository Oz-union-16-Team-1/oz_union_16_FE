import type { AuthGender } from '../types/auth';

export type MockUserRecord = {
  id: number;
  loginId: string;
  password: string;
  name: string;
  nickname: string;
  gender: AuthGender;
  email: string;
  profileImageUrl: string | null;
  note: string;
};

export type MockLoginAccount = Pick<
  MockUserRecord,
  'loginId' | 'password' | 'name' | 'nickname' | 'gender' | 'note'
>;

export const mockAuthSeedUsers: MockUserRecord[] = [
  {
    id: 1,
    loginId: 'pgti-demo',
    password: 'demo12345',
    name: 'PGTI 데모',
    nickname: '데모유저',
    gender: 'M',
    email: 'pgti-demo@example.com',
    profileImageUrl:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    note: '기본 로그인, 추천, 설문, 마이페이지 확인용 계정',
  },
  {
    id: 2,
    loginId: 'pgti-tester',
    password: 'tester12345',
    name: 'PGTI 테스터',
    nickname: '테스트유저',
    gender: 'W',
    email: 'pgti-tester@example.com',
    profileImageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    note: '중복 확인, 계정 전환, 비교 테스트용 계정',
  },
];

export const mockLoginAccounts: MockLoginAccount[] = mockAuthSeedUsers.map(
  ({ loginId, password, name, nickname, gender, note }) => ({
    loginId,
    password,
    name,
    nickname,
    gender,
    note,
  }),
);

export const createMockUserMap = () =>
  new Map<string, MockUserRecord>(
    mockAuthSeedUsers.map((user) => [user.loginId, { ...user }]),
  );
