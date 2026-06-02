import { cva } from 'class-variance-authority';

export const h4CVA = cva('', {
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
    size: {
      Default: "lg:text-[2.0rem] text-[1.6rem]",
    },
    font: {
      poppins: "font-poppins",
      source: "font-source",
    },
  },
  defaultVariants: { font: "poppins", size: "Default" },
});
