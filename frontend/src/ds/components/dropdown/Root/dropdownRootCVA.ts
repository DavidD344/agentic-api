import { cva } from 'class-variance-authority';

export const dropdownRootCVA = cva(`relative inline-block w-fit`, {
  variants: {
    variant: {
      none: 'opacity-0',
      botBotLeft: '',
      botBotRight: '',
    },
  },
  defaultVariants: {
    variant: 'botBotLeft',
  },
});
