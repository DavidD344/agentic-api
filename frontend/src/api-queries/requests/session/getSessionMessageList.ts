import { Message } from "@/api-queries/models/Message";
import { mainApi } from "../../mainApi";

export const getSessionMessageList = async ({
  id,
}: {
  id: string;
}): Promise<Message[]> => {
  const response = await mainApi.get<Message[]>(`/session/${id}/message`);
  return response.data;
};
