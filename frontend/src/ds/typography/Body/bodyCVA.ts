import { cva } from "class-variance-authority";

export const bodyCVA = cva("", {
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
      Default: "md:text-[1.4rem] text-[1.2rem]",
      Big: "md:text-[1.6rem] text-[1.4rem]",

    },
    font: {
      poppins: "font-poppins",
      source: "font-source",
    },
  },
  defaultVariants: { font: "source", size: "Default" },
});
