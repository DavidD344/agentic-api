
import { CreateUserParams, SignupResponse } from "@/api-queries/models/User";
import { mainApi } from "../../mainApi";

export const postUser = async (
  data: CreateUserParams
): Promise<SignupResponse> => {
  const response = await mainApi.post<SignupResponse>("/register", {
    ...data,
  });
  return response.data;
};
