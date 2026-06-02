import { cva } from 'class-variance-authority';

export const linkDefaultCVA = cva(
  'text-[1.4rem] leading-[2rem] text-B700 hover:text-B400 text-center cursor-pointer duration-300 inline',
  {
    variants: {
      weight: {
        Black: 'font-black',
        ExtraBold:'font-extrabold',
        Bold: 'font-bold',
        SemiBold: 'font-semibold',
        Medium: 'font-medium',
        Regular: 'font-normal',
        Light: 'font-light',
        Lighter: 'font-extralight',
        none:''
      },
      font: {
        poppins: "font-poppins",
        source: "font-source",
      },
    },
    defaultVariants: { font: 'source' },
  },
);
