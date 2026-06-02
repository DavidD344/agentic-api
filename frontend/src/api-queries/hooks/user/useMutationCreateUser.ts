import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../queryClient";
import { postUser } from "../../requests/user/postUser";
import { useNotification } from "./../../../stores/notifications/useNotification";
import { CreateUserParams } from "@/api-queries/models/User";
interface CreateUserWithHandleParams extends CreateUserParams {
  onSuccessNavigation?: () => void;
  onErrorNavigation?: () => void;
}
export function useMutationCreateUser() {
  const { addNotification } = useNotification();
  return useMutation({
    mutationKey: ["createUser"],
    mutationFn: async ({
      onSuccessNavigation,
      onErrorNavigation,
      email,
      name,
      role,
      password,
    }: CreateUserWithHandleParams) => {
      try {
        await postUser({
          email,
          name,
          role,
          password,
        });
        queryClient.invalidateQueries({
          queryKey: ["userById", "userList"],
        });
        addNotification({
          title: "Sucesso",
          children: "Conta criada com sucesso",
          variant: "success",
        });
        onSuccessNavigation && onSuccessNavigation();
      } catch (error) {
        addNotification({
          title: "Ocorreu um erro",
          children: "Não foi possível realizar esta ação",
          variant: "error",
        });
        console.log(error);

        onErrorNavigation && onErrorNavigation();
        // const err = error as AxiosError<{ message: string }>;
        // const errorCode = err.response?.data?.message.trim().split(" ")[0];
        // if (errorCode === "P2002") {
        //   onErrorNavigation && onErrorNavigation();
        // }
      }
    },
  });
}
