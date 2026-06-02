import { cva } from 'class-variance-authority';

export const captionCVA = cva('text-[1.2rem] leading-[1.6rem]', {
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
});
