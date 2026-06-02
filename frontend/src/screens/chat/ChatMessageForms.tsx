"use client";
import { InputDefault } from "@/ds/components/inputs/Default/InputDefault";
import { useState } from "react";
const ChatMessageForms = ({
  useSubmitButtonRef,
  blockSendMessage,
  onSubmit,
}: {
  useSubmitButtonRef: React.RefObject<HTMLButtonElement | null>;
  blockSendMessage: boolean;
  onSubmit: (text: string) => void;
}) => {
  const [message, setMessage] = useState<string>("");
  const onSubmitRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(message);
    setMessage("");

    if (message.length >= 1) {
      onSubmit(message);
    }
  };

  return (
    <form
      onSubmit={onSubmitRequest}
      noValidate
      className="w-full h-fit flex flex-row justify-between gap-2 items-center"
    >
      <InputDefault
        variant={"right"}
        className="rounded-full bg-white"
        variantColor={"white"}
        id="message"
        type="text"
        disabled={blockSendMessage}
        name="message"
        maxLength={500}
        placeholder={"Digitar mensagem..."}
        autoComplete="off"
        required={false}
        rightIcon={
          <div
            onClick={() => {
              useSubmitButtonRef.current?.click();
            }}
            className="pr-5 cursor-pointer text-[1.3rem] font-semibold text-[#175CD3]"
          >
            Enviar
          </div>
        }
        value={message}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setMessage(e.target.value);
        }}
      />

      <button type="submit" className="hidden" ref={useSubmitButtonRef} />
    </form>
  );
};

export { ChatMessageForms };
