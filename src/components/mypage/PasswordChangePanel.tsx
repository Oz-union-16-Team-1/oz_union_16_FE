import type { FormEvent } from 'react';

import AuthButton from '../auth/AuthButton';
import AuthFormMessage from '../auth/AuthFormMessage';
import AuthInputField from '../auth/AuthInputField';

export type PasswordChangeValues = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type PasswordChangeFieldName = keyof PasswordChangeValues;

type PasswordChangePanelProps = {
  values: PasswordChangeValues;
  errors: Partial<Record<PasswordChangeFieldName, string>>;
  message?: string;
  messageTone?: 'success' | 'error';
  isPending: boolean;
  onValueChange: (fieldName: PasswordChangeFieldName, value: string) => void;
  onFieldBlur: (fieldName: PasswordChangeFieldName) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function PasswordChangePanel({
  values,
  errors,
  message,
  messageTone = 'error',
  isPending,
  onValueChange,
  onFieldBlur,
  onCancel,
  onSubmit,
}: PasswordChangePanelProps) {
  return (
    <section className="bg-mypage-card border-mypage-panel mt-6 w-full max-w-full min-w-0 overflow-hidden rounded-3xl border px-4 py-5 text-left sm:px-5 sm:py-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">비밀번호 변경</h2>
        <p className="text-mypage-muted mt-2 text-sm/6">
          현재 비밀번호를 확인한 뒤 새 비밀번호로 변경할 수 있습니다.
        </p>
      </div>

      <form className="grid w-full min-w-0 gap-4" onSubmit={onSubmit}>
        <AuthInputField
          id="current-password"
          name="old_password"
          type="password"
          label="현재 비밀번호"
          placeholder="현재 비밀번호를 입력하세요"
          value={values.currentPassword}
          onChange={(event) =>
            onValueChange('currentPassword', event.target.value)
          }
          onBlur={() => onFieldBlur('currentPassword')}
          errorMessage={errors.currentPassword}
          disabled={isPending}
        />

        <AuthInputField
          id="new-password"
          name="new_password"
          type="password"
          label="새 비밀번호"
          placeholder="새 비밀번호를 입력하세요"
          value={values.newPassword}
          onChange={(event) => onValueChange('newPassword', event.target.value)}
          onBlur={() => onFieldBlur('newPassword')}
          errorMessage={errors.newPassword}
          disabled={isPending}
        />

        <AuthInputField
          id="new-password-confirm"
          name="new_password_check"
          type="password"
          label="새 비밀번호 확인"
          placeholder="새 비밀번호를 한번 더 입력하세요"
          value={values.newPasswordConfirm}
          onChange={(event) =>
            onValueChange('newPasswordConfirm', event.target.value)
          }
          onBlur={() => onFieldBlur('newPasswordConfirm')}
          errorMessage={errors.newPasswordConfirm}
          disabled={isPending}
        />

        {message ? (
          <AuthFormMessage tone={messageTone}>{message}</AuthFormMessage>
        ) : null}

        <div className="flex w-full min-w-0 flex-col gap-3 pt-2 sm:flex-row sm:flex-nowrap sm:justify-end">
          <AuthButton
            type="button"
            variant="secondary"
            className="w-full sm:w-auto sm:min-w-28 sm:flex-none"
            onClick={onCancel}
            disabled={isPending}
          >
            취소
          </AuthButton>
          <AuthButton
            type="submit"
            className="w-full sm:w-auto sm:min-w-32 sm:flex-none"
            disabled={isPending}
          >
            {isPending ? '변경 중...' : '저장'}
          </AuthButton>
        </div>
      </form>
    </section>
  );
}

export default PasswordChangePanel;
