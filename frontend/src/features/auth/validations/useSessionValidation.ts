import { z } from "zod";
// import { verifyZodImplementsInterface } from "@/libs/helpers/validations/interface/verifyZodImplementsInterface";

export const useSessionValidation = () => {
  const sessionValidation = z.object({
    email: z.string().min(3, { message: "Campo Obrigatório" }).email({
      message: "Tente utilizar um e-mail válido!",
    }),
    password: z.string().min(3, { message: "Campo Obrigatório" }),
  });
  // verifyZodImplementsInterface<SessionDTO>(
  //   {} as z.infer<typeof sessionValidation>
  // );
  return { sessionValidation };
};
