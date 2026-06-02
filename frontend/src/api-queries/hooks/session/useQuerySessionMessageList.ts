import { Message } from "@/api-queries/models/Message";
import { GetUserByIdParams } from "@/api-queries/models/User";
import { getSessionMessageList } from "@/api-queries/requests/session/getSessionMessageList";
import { useQuery } from "@tanstack/react-query";

export function useQuerySessionList(data: GetUserByIdParams) {
  return useQuery<Message[]>({
    queryKey: ["sessionMessageList", data.id],
    queryFn: () => getSessionMessageList({ id: data.id }),
  });
}
