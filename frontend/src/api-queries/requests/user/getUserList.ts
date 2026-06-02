import { User } from "@/api-queries/models/User";
import { mainApi } from "../../mainApi";

export const getUserList = async (): Promise<User[]> => {
  const response = await mainApi.get<User[]>(`/users`);
  return response.data;
};
