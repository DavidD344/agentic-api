import { useQuery } from "@tanstack/react-query";
import { getUserList } from "../../requests/user/getUserList";
import { User } from "@/api-queries/models/User";

export function useQueryUserList() {
  return useQuery<User[]>({
    queryKey: ["userList"],
    queryFn: () => getUserList(),
  });
}
