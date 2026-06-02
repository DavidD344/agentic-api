import { ChildAccordion } from "@/ds/animations/ChildAccordion/ChildAccordion";
import { FlagMessage } from "@/ds/components/FlagMessage/FlagMessage";

const NotificationPopUp = ({
  id,
  variant,
  title,
  children,
  delNotification,
  isClosing,
}: {
  id: string;
  variant: 'success' | 'none' | 'error' | 'info';
  title: string;
  children: React.ReactNode;
  isClosing: boolean;
  delNotification: () => void;
}) => {
  setTimeout(() => {
    delNotification();
  }, 5000);

  return (
    <ChildAccordion
      className="notification transition-all"
      active={!isClosing}
      key={id}
    >
      <div className="px-4 pb-4 w-fit h-fit ">
        <FlagMessage
          onClick={() => {
            delNotification();
          }}
          variant={variant}
          title={title}
          className="cursor-pointer"
        >
          {children}
        </FlagMessage>
      </div>
    </ChildAccordion>
  );
};

export { NotificationPopUp };
