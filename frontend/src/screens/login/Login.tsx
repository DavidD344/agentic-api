import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthLayoutModal } from "@/features/auth/components/authLayoutModal";

const LoginScreen = () => {
  return (
    <>
      <AuthLayoutModal>
        <LoginForm />
      </AuthLayoutModal>
    </>
  );
};

export { LoginScreen };
