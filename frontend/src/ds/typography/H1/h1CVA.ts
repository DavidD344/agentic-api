import { cva } from "class-variance-authority";

export const h1CVA = cva("text-[3.5rem]", {
  variants: {
    weight: {
      Black: "font-black",
      ExtraBold: "font-extrabold",
      Bold: "font-bold",
      SemiBold: "font-semibold",
      Medium: "font-medium",
      Regular: "font-normal",
      Light: "font-light",
      Lighter: "font-extralight",
      none: "",
    },
    size: {
      Huge2xl: "lg:text-[5rem] text-[3.2rem]",
      Huge: "lg:text-[3.8rem] text-[2.4rem]",
      Big: "lg:text-[3.4rem] text-[2.4rem]",
      Small: "lg:text-[3.4rem] text-[2.4rem]",
    },
    font: {
      poppins: "font-poppins",
      source: "font-source",
    },
  },
  compoundVariants: [
    {
      size: "Huge",
      weight: "none",
      className: "font-bold",
    },
    {
      size: "Big",
      weight: "none",
      className: "font-bold",
    },
    {
      size: "Small",
      weight: "none",
      className: "font-normal",
    },
  ],
  defaultVariants: { font: "poppins", weight: "none" },
});
