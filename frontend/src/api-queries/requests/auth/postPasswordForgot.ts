import { PasswordForgotParams } from '../../modules/auth/params/PasswordForgotParams';
import { mainApi } from '../../mainApi';

export const postPasswordForgot = async ({
  email,
}: PasswordForgotParams): Promise<void> => {
  const PasswordForgotResponse = await mainApi.post<void>(
    '/v1/password/forgot',
    {
      email,
    },
  );
  return PasswordForgotResponse.data;
};
