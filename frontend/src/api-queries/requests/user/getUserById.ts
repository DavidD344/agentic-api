import { GetUserByIdParams, User } from "@/api-queries/models/User";
import { mainApi } from "../../mainApi";

export const getUserById = async ({ id }: GetUserByIdParams): Promise<User> => {
  const response = await mainApi.get<User>(`/usuario/${id}`);
  return response.data;
};
