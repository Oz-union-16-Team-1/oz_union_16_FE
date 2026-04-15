import AuthButton from './AuthButton';

type AuthInputActionButtonProps = {
  label: string;
};

function AuthInputActionButton({ label }: AuthInputActionButtonProps) {
  return (
    <AuthButton variant="secondary" className="w-24 shrink-0">
      {label}
    </AuthButton>
  );
}

export default AuthInputActionButton;
