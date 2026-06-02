import { cva } from 'class-variance-authority';

export const confirmationMessageCVA = cva(
  `flex flex-row gap-x-4 py-5 px-4 rounded-[3px] text-GrayScale-TextIcon-Title bg-GrayScale-Surface-Subtle shadow-Flag w-full max-w-[46rem]`,
  {
    variants: {
      variant: {
        none: 'opacity-0',
        success: '',
        warning: '',
        danger: '',
        simple: '',
        error: '',
        empty: '',
        info: '',
      },
    },
    defaultVariants: {
      variant: 'none',
    },
  },
);
