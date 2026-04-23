export type MyPageToast = {
  tone: 'success' | 'error';
  message: string;
} | null;

export type MyPageToastPayload = Exclude<MyPageToast, null>;
