import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../../requests/user/getUserById";
import { GetUserByIdParams, User } from "@/api-queries/models/User";

export function useQueryUserById(data: GetUserByIdParams) {
  return useQuery<User>({
    queryKey: ["userById", data.id],
    queryFn: () => getUserById(data),
  });
}
