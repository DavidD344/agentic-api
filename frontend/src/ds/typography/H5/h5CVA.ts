import { cva } from 'class-variance-authority';

export const h5CVA = cva('', {
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
      Default: "lg:text-[1.8rem] text-[1.6rem]",
    },
    font: {
      poppins: "font-poppins",
      source: "font-source",
    },
  },
  defaultVariants: { font: "source", size: "Default" },
});
