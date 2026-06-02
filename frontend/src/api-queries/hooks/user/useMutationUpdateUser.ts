import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../queryClient";
import { putUser } from "../../requests/user/putUser";
import { useNotification } from "./../../../stores/notifications/useNotification";
import { UpdateUserParams } from "@/api-queries/models/User";
interface UpdateUserWithHandleParams extends UpdateUserParams  {
  onSuccessNavigation?: () => void;
  onErrorNavigation?: () => void;
}
export function useMutationUpdateUser() {
  const { addNotification } = useNotification();
  return useMutation({
    mutationKey: ["createUser"],
    mutationFn: async ({
      onSuccessNavigation,
      onErrorNavigation,
      cargo,
      cidade,
      data_nascimento,
      estado,
      foto,
      nome,
      id,
    }: UpdateUserWithHandleParams) => {
      try {
        await putUser({
          cargo,
          cidade,
          data_nascimento,
          estado,
          foto,
          nome,
          id,
        });
        queryClient.invalidateQueries({
          queryKey: ["userById", "userList"],
        });
        addNotification({
          title: "Sucesso",
          children: "Dados atualizados com sucesso",
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
      }
    },
  });
}
