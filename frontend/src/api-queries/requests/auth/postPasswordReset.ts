import { PasswordResetParams } from '../../modules/auth/params/PasswordResetParams';
import { mainApi } from '../../mainApi';

export const postPasswordReset = async ({
  password,
  passwordConfirmation,
  token,
}: PasswordResetParams): Promise<void> => {
  const PasswordResetResponse = await mainApi.post<void>('/v1/password/reset', {
    password,
    passwordConfirmation,
    token,
  });
  return PasswordResetResponse.data;
};
