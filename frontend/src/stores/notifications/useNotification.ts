import { create } from 'zustand';

interface notificationWithIdProps {
  variant: 'success' | 'none' | 'error' | 'info';
  title: string;
  children: React.ReactNode;
}

interface notificationProps extends notificationWithIdProps {
  id: string;
  isClosing: boolean;
}

interface State {
  notifications: notificationProps[];
  addNotification: (params: notificationWithIdProps) => void;
  delNotification: (id: string) => void;
  clearNotification: () => void;
}

export const useNotification = create<State>((set, get) => ({
  notifications: [],
  addNotification: ({ children, title, variant }: notificationWithIdProps) => {
    const { notifications } = get();
    const timestamp = Date.now();
    set({
      notifications: [
        ...notifications,
        {
          children,
          title,
          variant,
          id: `${timestamp}${title}`,
          isClosing: false,
        },
      ],
    });
  },
  delNotification: (id: string) => {
    set((state) => {
      const updatedNotifications = state.notifications.map((notification) => {
        if (notification.id === id) {
          return { ...notification, isClosing: true };
        }
        return notification;
      });
      setTimeout(() => {
        set((currentState) => ({
          notifications: currentState.notifications.filter(
            (notification) => notification.id !== id,
          ),
        }));
      }, 350);
      return {
        notifications: updatedNotifications,
      };
    });
  },
  clearNotification: () => {
    set({
      notifications: [],
    });
  },
}));
