import { useNotification } from '@/stores/notifications/useNotification';
import { NotificationPopUp } from './NotificationPopUp';

const NotificationContainer = () => {
  const { notifications, delNotification } = useNotification();
  return (
    <div className="fixed  z-40 bottom-8 left-8 ">
      {[...notifications]
        .reverse()
        .map(({ title, id, variant, children, isClosing }) => {
          return (
            <NotificationPopUp
              key={id}
              id={id}
              title={title}
              variant={variant}
              isClosing={isClosing}
              delNotification={() => {
                delNotification(id);
              }}
            >
              {children}
            </NotificationPopUp>
          );
        })}
    </div>
  );
};

export { NotificationContainer };
