import { useConfirmationMessage } from "@/stores/confirmationMessage/useConfirmationMessage";

const ConfirmationMessageContainer = () => {
  const { confirmationMessages, clearConfirmationMessage } =
    useConfirmationMessage();
  if (confirmationMessages.length >= 1) {
    return (
      <>
        <div
          className="fixed left-0 top-0  w-screen h-screen flex justify-center items-center z-40 bg-[#47405366]"
          onClick={() => {
            clearConfirmationMessage();
          }}
        />
        <div className="fixed left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-50 w-full flex justify-center items-center">
 
            <div className="p-0 rounded-[3px] w-fit max-w-[90vw]">
              {confirmationMessages[0].children}
            </div>
        </div>
      </>
    );
  }
};

export { ConfirmationMessageContainer };
