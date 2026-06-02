import { RefreshTokenResponse } from '../../models/User';
import { RefreshTokenParams } from '../../modules/auth/params/RefreshTokenParams';
import { mainApi } from '../../mainApi';

export const postProfessionalRefreshToken = async ({
  refreshToken,
}: RefreshTokenParams): Promise<RefreshTokenResponse> => {
  const refreshTokenResponse = await mainApi.post<RefreshTokenResponse>(
    '/professional/refresh_token',
    {
      refreshToken,
    },
  );

  return refreshTokenResponse.data;
};
