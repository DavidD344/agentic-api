"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { ButtonDefault } from "@/ds/components/buttons/Default/ButtonDefault";
import { InputCheckBox } from "@/ds/components/inputs/CheckBox/InputCheckBox";
import { InputDefault } from "@/ds/components/inputs/Default/InputDefault";
import SvgEnvelopeSimple from "@/ds/icons/svgReact/EnvelopeSimple";
import SvgLockKey from "@/ds/icons/svgReact/LockKey";
import SvgNotWatchEye from "@/ds/icons/svgReact/NotWatchEye";
import SvgWatchEye from "@/ds/icons/svgReact/WatchEye";
import { Body } from "@/ds/typography/Body/Body";
import { H5 } from "@/ds/typography/H5/H5";
import { cn } from "@/ds/utils/cnMerge";

import { ChildAccordion } from "@/ds/animations/ChildAccordion/ChildAccordion";
import { NoteMessage } from "@/ds/components/noteMessage/NoteMessage";
import { H1 } from "@/ds/typography/H1/H1";
import { H6 } from "@/ds/typography/H6/H6";
import { useSession } from "@/stores/auth/useSession";
import { useSessionValidation } from "../validations/useSessionValidation";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const [visiblePassword, setVisiblePassword] = useState<boolean>(false);
  const [stayLogged, setStayLogged] = useState<boolean>(false);

  const [loginError, setLoginError] = useState<boolean>(false);
  const router = useRouter();

  const { signIn, loading } = useSession();
  const { sessionValidation } = useSessionValidation();
  type ValidationSchemaType = z.infer<typeof sessionValidation>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidationSchemaType>({
    resolver: zodResolver(sessionValidation),
  });

  const onSubmitRequest: SubmitHandler<ValidationSchemaType> = async (
    data: ValidationSchemaType
  ) => {
    try {
      const resp = await signIn({
        email: data.email,
        password: data.password,
      });
      console.log(resp);
      router.push("/dashboard");
    } catch (error) {
      console.log(error);
      setLoginError(true);
    }
  };

  return (
    <div className="w-full max-w-[64.5rem] px-[var(--pading-section)] lg:px-0">
      {loading && (
        <div className="pb-8 pt-12 flex flex-col justify-center items-center">
          <div className="loader_primary"></div>
          <div className="w-full py-6 flex justify-center items-center mt-[4.8rem]">
            <H5 weight={"Regular"} className={cn("text-[#0B090D] text-center")}>
              Carregando suas informações
            </H5>
          </div>
        </div>
      )}

      <div
        className="col-span-1 flex flex-col items-start gap-2 w-full pb-6"
        // data-aos-delay="200"
        // data-aos-duration="1100"
        // data-aos="fade-left"
      >
        <H1 size={"Huge"} weight={"SemiBold"} className="text-DSGlobalPrimary">
          Acessar sistema
        </H1>
        <H6 weight={"Regular"} className="text-DSGlobalText">
          Informe as credenciais de demonstracao para entrar na ferramenta
        </H6>
      </div>
      <form
        onSubmit={handleSubmit(onSubmitRequest)}
        className={cn(
          "h-fit w-full flex flex-col gap-3",
          loading ? "hidden" : ""
        )}
        noValidate
      >
        <div className="w-full h-fit flex justify-center items-center">
          <ChildAccordion active={loginError}>
            <NoteMessage variant={"dangerous"}>
              Email ou senha incorretos, tente novamente
            </NoteMessage>
          </ChildAccordion>
        </div>
        <InputDefault
          disabled={loading}
          variant={"left"}
          variantColor={"white"}
          leftIcon={
            <div className="w-fit h-fit !cursor-default">
              <SvgEnvelopeSimple
                className=""
                style={{ fill: "#1A1123" }}
                width={20}
                height={20}
              />
            </div>
          }
          note={errors.email ? "dangerous" : "none"}
          label="E-mail"
          id="email"
          message={errors.email?.message ? errors.email.message : undefined}
          type="email"
          placeholder={"Digite seu e-mail"}
          required={false}
          {...register("email")}
        />

        <InputDefault
          disabled={loading}
          variant={"twoSidesIcon"}
          variantColor={"white"}
          note={errors.password ? "dangerous" : "none"}
          label="Senha"
          message={
            errors.password?.message ? errors.password.message : undefined
          }
          type={visiblePassword ? "text" : "password"}
          placeholder="Digite senha"
          leftIcon={
            <div className="w-fit h-fit !cursor-default">
              <SvgLockKey
                className=""
                style={{ fill: "#1A1123" }}
                width={20}
                height={20}
              />
            </div>
          }
          rightIcon={
            <div
              onClick={() => {
                setVisiblePassword(!visiblePassword);
              }}
            >
              {visiblePassword ? (
                <SvgWatchEye
                  className=""
                  style={{ fill: "#5E5E5E" }}
                  width={20}
                  height={20}
                />
              ) : (
                <SvgNotWatchEye
                  className=""
                  style={{ fill: "#5E5E5E" }}
                  width={20}
                  height={20}
                />
              )}
            </div>
          }
          {...register("password")}
          required={false}
        />
        <div className="flex flex-row justify-between items-center">
          <label
            htmlFor={"stayLogged"}
            className="flex flex-row justify-start items-center gap-2 py-2 w-fit pr-2 cursor-pointer"
          >
            <InputCheckBox
              value={"on"}
              id={"stayLogged"}
              checked={stayLogged}
              onChange={() => {
                setStayLogged(!stayLogged);
              }}
              className="px-1 py-1 cursor-pointer"
            />
            <Body
              weight={"Regular"}
              className="text-[#0B090D] truncate w-fit whitespace-nowrap"
            >
              Manter conectado
            </Body>
          </label>
        </div>
        <div className="w-full flex flex-col gap-4 pt-2">
          <ButtonDefault type="submit" variant={"default"} isLoading={loading}>
            Entrar na minha conta
          </ButtonDefault>
        </div>
        <button
          aria-label={""}
          type="button"
          onClick={() => {
            // navigate(`/forgot_password?email=${getValues("email")}`);
          }}
          className="text-center hidden"
        ></button>
      </form>
    </div>
  );
};

export { LoginForm };
