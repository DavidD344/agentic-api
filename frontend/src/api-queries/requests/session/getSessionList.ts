import { Session, SessionApi } from "@/api-queries/models/Session";
import { mainApi } from "../../mainApi";

export const getSessionList = async (): Promise<Session[]> => {
  const response = await mainApi.get<SessionApi[]>(`/session`);

  return response.data.map((session) => ({
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
  }));
};
