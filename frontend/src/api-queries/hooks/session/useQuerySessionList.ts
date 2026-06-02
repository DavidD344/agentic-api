import { useQuery } from "@tanstack/react-query";
import { Session } from "@/api-queries/models/Session";
import { getSessionList } from "@/api-queries/requests/session/getSessionList";

export function useQuerySessionList() {
  return useQuery<Session[]>({
    queryKey: ["sessionList"],
    queryFn: () => getSessionList(),
  });
}
