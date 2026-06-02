import { SessionResponse } from '@/api-queries/models/User';
import { mainApi } from '../../mainApi';
import { SessionParams } from '@/api-queries/modules/auth/params/SessionParams';

export const postSession = async ({
  email,
  password,
}: SessionParams): Promise<SessionResponse> => {
  const sessionResponse = await mainApi.post<SessionResponse>('/login', {
    email,
    password,
  });

  return sessionResponse.data;
};
