import { create } from 'zustand';

interface confirmationMessageProps {
  title?: string;
  message?: string;
  variant:
    | 'none'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'danger'
    | 'simple'
    | 'empty'
    | null
    | undefined;
  children: React.ReactNode;
}

interface State {
  confirmationMessages: confirmationMessageProps[];
  addConfirmationMessage: (params: confirmationMessageProps) => void;
  clearConfirmationMessage: () => void;
}

export const useConfirmationMessage = create<State>((set) => ({
  confirmationMessages: [],
  addConfirmationMessage: ({
    children,
    title,
    variant,
    message,
  }: confirmationMessageProps) => {
    set({
      confirmationMessages: [
        {
          children,
          title,
          variant,
          message,
        },
      ],
    });
  },
  clearConfirmationMessage: () => {
    set({
      confirmationMessages: [],
    });
  },
}));
