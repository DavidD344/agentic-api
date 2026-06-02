import { cva } from 'class-variance-authority';

export const verificationCodeCVA = cva(
  `text-[2.4rem] md:text-[3rem] text-[#F5F5F5] leading-[2.4rem]  font-source font-normal w-11 md:w-13 h-11 md:h-13 rounded-lg flex  text-center caret-transparent border-teal ring-0 outline-none  focus:border-teal focus:ring-0 focus:outline-none duration-100 `,
  {
    variants: {
      variant: {
        default:
          'bg-[#0B090D] focus:bg-[#000] hover:bg-[#000] border-[0.1rem] border-[#3a383b] focus:border-[#fff] placeholder-[#5E5E5E]',
      },
      note: {
        none: '',
        dangerous: 'border-[#DB3444] focus:border-[#DB3444]',
        success:
          'border-GrayScale-Border-Default focus:border-GrayScale-Border-Darker',
      },
    },
    defaultVariants: {
      variant: 'default',
      note: 'none',
    },
  },
);
