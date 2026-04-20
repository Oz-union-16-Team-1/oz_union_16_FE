import type { AuthGender } from '../types/auth';

export type MockUserRecord = {
  id: number;
  loginId: string;
  password: string;
  name: string;
  nickname: string;
  gender: AuthGender;
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
    note: '기본 로그인, 추천, 설문, 마이페이지 확인용 계정',
  },
  {
    id: 2,
    loginId: 'pgti-tester',
    password: 'tester12345',
    name: 'PGTI 테스터',
    nickname: '테스트유저',
    gender: 'W',
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
