import { RefreshTokenResponse } from '../../models/User';
import { RefreshTokenParams } from '../../modules/auth/params/RefreshTokenParams';
import { mainApi } from '../../mainApi';

export const postRefreshToken = async ({
  refreshToken,
}: RefreshTokenParams): Promise<RefreshTokenResponse> => {
  const refreshTokenResponse = await mainApi.post<RefreshTokenResponse>(
    '/refresh_token',
    {
      refreshToken,
    },
  );

  return refreshTokenResponse.data;
};
