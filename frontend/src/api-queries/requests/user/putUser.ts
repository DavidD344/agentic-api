import { UpdateUserParams, User } from "@/api-queries/models/User";
import { mainApi } from "../../mainApi";

export const putUser = async (data: UpdateUserParams): Promise<User> => {
  const { id, ...restData } = data;
  const response = await mainApi.put<User>("/usuario/" + id, {
    ...restData,
  });
  return response.data;
};
