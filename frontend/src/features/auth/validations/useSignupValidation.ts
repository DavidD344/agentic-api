// import { verifyZodImplementsInterface } from "@/libs/helpers/validations/interface/verifyZodImplementsInterface";
import { z } from "zod";

export const useSignupValidation = () => {
  const signupValidation = z
    .object({
      email: z.string().min(3, { message: "Campo obrigatório" }).email({
        message: "Tente utilizar um e-mail válido!",
      }),
      name: z.string().min(3, { message: "Campo obrigatório" }),

      password: z.string().min(6, { message: "Deve ter no mínimo 6 caracteres" }),
      passwordConfirmation: z.string().min(6, { message: "Deve ter no mínimo 6 caracteres" }),
    })
    .refine(
      ({ password, passwordConfirmation }) => password === passwordConfirmation,
      {
        message: "As senhas não coincidem",
        path: ["passwordConfirmation"],
      }
    )
    // .refine(({ password }) => regexPasswordComplete.test(password), {
    //   message: "A senha é fraca",
    //   path: ["password"],
    // });
  // verifyZodImplementsInterface<SignupDTO>(
  //   {} as z.infer<typeof signupValidation>
  // );
  return { signupValidation };
};
