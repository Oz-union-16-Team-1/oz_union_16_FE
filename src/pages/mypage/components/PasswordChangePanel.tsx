import type { FormEvent, RefObject } from 'react';

import AuthButton from '../../../components/auth/AuthButton';
import AuthFormMessage from '../../../components/auth/AuthFormMessage';
import AuthInputField from '../../../components/auth/AuthInputField';

export type PasswordChangeValues = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type PasswordChangeFieldName = keyof PasswordChangeValues;

type PasswordChangePanelProps = {
  values: PasswordChangeValues;
  errors: Partial<Record<PasswordChangeFieldName, string>>;
  fieldRefs: Record<
    PasswordChangeFieldName,
    RefObject<HTMLInputElement | null>
  >;
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
  fieldRefs,
  message,
  messageTone = 'error',
  isPending,
  onValueChange,
  onFieldBlur,
  onCancel,
  onSubmit,
}: PasswordChangePanelProps) {
  return (
    <section className="bg-mypage-card border-mypage-panel mt-5 w-full max-w-full min-w-0 overflow-hidden rounded-[28px] border px-3.5 py-5 text-left sm:mt-6 sm:rounded-3xl sm:px-5 sm:py-6">
      <div className="mb-6 sm:mb-5">
        <h2 className="text-xl font-semibold text-white">비밀번호 변경</h2>
        <p className="text-mypage-muted mt-2 text-sm/6">
          현재 비밀번호를 확인한 뒤 새 비밀번호로 변경할 수 있습니다.
        </p>
      </div>

      <form
        className="grid w-full min-w-0 grid-cols-1 gap-5 sm:gap-4"
        onSubmit={onSubmit}
      >
        <AuthInputField
          id="current-password"
          name="old_password"
          type="password"
          label="현재 비밀번호"
          placeholder="현재 비밀번호를 입력하세요"
          value={values.currentPassword}
          inputRef={fieldRefs.currentPassword}
          onChange={(event) =>
            onValueChange('currentPassword', event.target.value)
          }
          onBlur={() => onFieldBlur('currentPassword')}
          errorMessage={errors.currentPassword}
          disabled={isPending}
          containerClassName="w-full min-w-0 max-w-none"
          className="w-full max-w-none min-w-0"
        />

        <AuthInputField
          id="new-password"
          name="new_password"
          type="password"
          label="새 비밀번호"
          placeholder="새 비밀번호를 입력하세요"
          value={values.newPassword}
          inputRef={fieldRefs.newPassword}
          onChange={(event) => onValueChange('newPassword', event.target.value)}
          onBlur={() => onFieldBlur('newPassword')}
          errorMessage={errors.newPassword}
          disabled={isPending}
          containerClassName="w-full min-w-0 max-w-none"
          className="w-full max-w-none min-w-0"
        />

        <AuthInputField
          id="new-password-confirm"
          name="new_password_check"
          type="password"
          label="새 비밀번호 확인"
          placeholder="새 비밀번호를 한번 더 입력하세요"
          value={values.newPasswordConfirm}
          inputRef={fieldRefs.newPasswordConfirm}
          onChange={(event) =>
            onValueChange('newPasswordConfirm', event.target.value)
          }
          onBlur={() => onFieldBlur('newPasswordConfirm')}
          errorMessage={errors.newPasswordConfirm}
          disabled={isPending}
          containerClassName="w-full min-w-0 max-w-none"
          className="w-full max-w-none min-w-0"
        />

        {message ? (
          <AuthFormMessage tone={messageTone}>{message}</AuthFormMessage>
        ) : null}

        <div className="flex w-full min-w-0 flex-col gap-3 pt-3 sm:flex-row sm:flex-nowrap sm:justify-end sm:pt-2">
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
