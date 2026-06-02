import { cva } from 'class-variance-authority';

export const chatContainerCVA = cva(
  `flex-1 flex flex-col gap-2 w-full items-center h-screen overflow-y-auto not_show_scrollbar relative`,
  {
    variants: {
      typeContainer: {
        none: '',
      },
    },
    defaultVariants: { typeContainer: 'none' },
  },
);
