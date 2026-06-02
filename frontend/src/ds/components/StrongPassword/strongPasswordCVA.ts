import { cva } from 'class-variance-authority';

export const strongPasswordCVA = cva(` w-full h-0.5 duration-500`, {
  variants: {
    step: {
      // 0: 'bg-[#D9DDE3]',
      // 1: 'bg-[#DB3444]',
      // 2: 'bg-[#DB3444]',
      // 3: 'bg-[#FF8B00]',
      // 4: 'bg-[#00875A]',
      // 5: 'bg-[#00875A]',
      0: 'bg-[#D9DDE3]',
      1: 'bg-[#DB3444]',
      2: 'bg-[#E2B203]',
      3: 'bg-[#E2B203]',
      4: 'bg-[#4BCE97]',
    },
  },
  defaultVariants: {
    step: 1,
  },
});
