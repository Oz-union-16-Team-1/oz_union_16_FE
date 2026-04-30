import { ShieldAlert } from 'lucide-react';

import AuthButton from '../../../components/auth/AuthButton';
import InputControl from '../../../components/common/InputControl';
import ConfirmModal from '../../../components/mypage/ConfirmModal';

type MyPageAccountDangerZoneProps = {
  isSocialAccount: boolean;
  isDeleteModalOpen: boolean;
  deletePassword: string;
  deletePasswordError: string;
  isDeletePending: boolean;
  onOpenDeleteModal: () => void;
  onCloseDeleteModal: () => void;
  onDeletePasswordChange: (value: string) => void;
  onConfirmDeleteAccount: () => Promise<void>;
};

function MyPageAccountDangerZone({
  isSocialAccount,
  isDeleteModalOpen,
  deletePassword,
  deletePasswordError,
  isDeletePending,
  onOpenDeleteModal,
  onCloseDeleteModal,
  onDeletePasswordChange,
  onConfirmDeleteAccount,
}: MyPageAccountDangerZoneProps) {
  return (
    <>
      <section className="mt-8 flex flex-col items-center justify-center gap-3 pb-2 text-center">
        <div className="text-mypage-muted flex items-center gap-2 text-sm/6">
          <ShieldAlert size={16} />
          <span>
            {isSocialAccount
              ? '소셜 계정은 비밀번호 확인 없이 바로 회원탈퇴를 진행할 수 있습니다.'
              : '현재 비밀번호를 확인한 뒤 회원탈퇴를 진행할 수 있습니다.'}
          </span>
        </div>
        <AuthButton
          type="button"
          variant="secondary"
          className="border-mypage-divider text-mypage-muted w-full max-w-44 hover:text-white"
          onClick={onOpenDeleteModal}
        >
          회원탈퇴
        </AuthButton>
      </section>

      <ConfirmModal
        open={isDeleteModalOpen}
        title={
          isSocialAccount
            ? '소셜 계정을 탈퇴할까요?'
            : '현재 비밀번호 확인 후 회원탈퇴'
        }
        description={
          isSocialAccount ? (
            <div className="mx-auto max-w-[23rem]">
              <p>
                소셜 계정은 비밀번호 확인 없이 바로 탈퇴가 진행되며, 완료되면
                로그인 화면으로 이동합니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                현재 비밀번호를 확인한 뒤 탈퇴가 진행되며, 완료되면 로그인
                화면으로 이동합니다.
              </p>
              <div className="space-y-2">
                <label
                  htmlFor="delete-account-password"
                  className="block text-sm font-medium text-white"
                >
                  현재 비밀번호
                </label>
                <InputControl
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(event) => {
                    onDeletePasswordChange(event.target.value);
                  }}
                  hasError={Boolean(deletePasswordError)}
                  className="h-12"
                  placeholder="현재 비밀번호를 입력하세요"
                />
                {deletePasswordError ? (
                  <p className="pl-1 text-sm/5 font-medium text-red-400">
                    {deletePasswordError}
                  </p>
                ) : null}
              </div>
            </div>
          )
        }
        confirmLabel="회원탈퇴"
        isPending={isDeletePending}
        align={isSocialAccount ? 'center' : 'left'}
        onClose={onCloseDeleteModal}
        onConfirm={() => {
          void onConfirmDeleteAccount();
        }}
      />
    </>
  );
}

export default MyPageAccountDangerZone;
