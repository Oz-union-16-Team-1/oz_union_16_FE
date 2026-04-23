import { ShieldAlert } from 'lucide-react';

import AuthButton from '../../../components/auth/AuthButton';
import InputControl from '../../../components/common/InputControl';
import ConfirmModal from '../../../components/mypage/ConfirmModal';

type MyPageAccountDangerZoneProps = {
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
            더 이상 서비스를 이용하지 않으려면 회원탈퇴를 진행할 수 있습니다.
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
        title="회원탈퇴 하시겠습니까?"
        description={
          <div className="space-y-3">
            <p>
              탈퇴를 진행하면 현재 로그인 세션이 종료되고, 로그인 화면으로
              이동합니다.
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
        }
        confirmLabel="회원탈퇴"
        isPending={isDeletePending}
        onClose={onCloseDeleteModal}
        onConfirm={() => {
          void onConfirmDeleteAccount();
        }}
      />
    </>
  );
}

export default MyPageAccountDangerZone;
