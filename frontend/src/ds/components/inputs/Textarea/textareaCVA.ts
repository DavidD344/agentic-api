import { cva } from 'class-variance-authority';

export const textareaCVA = cva(
  `resize-none overflow-hidden text-[1.4rem] leading-[1.4rem] font-source font-normal w-full rounded-[1rem] border-teal ring-0 outline-none focus:border-teal focus:ring-0 focus:outline-none block px-4 py-5 duration-300 `,
  {
    variants: {
      variant: {
        default:
          '',
      },
      variantColor: {
        black:
          "bg-[#0B090D] focus:bg-[#000] hover:bg-[#000] border-[0.1rem] border-[#3a383b] focus:border-[#fff] placeholder-[#5E5E5E] text-[#fff]",
        white: "bg-[#f5f5f5] focus:bg-[#fff] hover:bg-[#fff] border-[0.1rem] border-[#A1A1A1] focus:border-[#000] placeholder-[#5E5E5E]  text-[#000] ",
      },
      note: {
        none: '',
        dangerous: 'text-[#fff] border-[#DB3444] focus:border-[#DB3444]',
        success:
          ' text-[#fff] border-[#00875A] focus:border-[#00875A]',
        disabled:
          'bg-[#0B090D] hover:bg-[#0B090D] border-[0.1rem] border-[#3a383b] focus:border-GrayScale-Border-Darker text-[#A5ADBA] placeholder-[#A5ADBA]',
      },
    },
    defaultVariants: {
      variant: 'default',
      note: 'none',
    },
  },
);

