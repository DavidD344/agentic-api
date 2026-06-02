import { cva } from "class-variance-authority";

export const inputDefaultCVA = cva(
  `remove-input-arrow text-[1.4rem] leading-[1.4rem] font-source font-normal w-full rounded-[1rem] ring-0 outline-none focus:ring-0 focus:outline-none block px-5 duration-300 `,
  {
    variants: {
      variant: {
        default: "",
        left: "pl-10.2",
        right: "pr-10.2",
        twoSidesIcon: "pr-10.2 pl-10.2",
        searchInput:
          "pl-10.2 rounded-full",
      },
      variantColor: {
        black:
          "bg-[#0B090D] focus:bg-[#000] hover:bg-[#000] border-[0.1rem] border-[#3a383b] focus:border-[#fff] placeholder-[#5E5E5E] text-[#fff]",
        white: "bg-[#f5f5f5] focus:bg-[#fff] hover:bg-[#fff] border-[0.1rem] border-[#A1A1A1] focus:border-[#000] placeholder-[#5E5E5E]  text-[#000] ",
      },
      note: {
        none: "",
        dangerous: " border-[#DB3444] focus:border-[#DB3444]",
        success: "border-[#00875A] focus:border-[#00875A]",
        disabled:
          "",
      },
      scale: {
        small: "h-9.4",
        medium: "h-10.6",
      },
    },
    defaultVariants: {
      variantColor: "black",
      variant: "default",
      note: "none",
      scale: "medium",
    },
    compoundVariants: [
      {
        variantColor: "black",
        variant: "searchInput",
        className: "bg-[#110E14] focus:bg-[#000] hover:bg-[#000] border-[0.1rem] border-[#AFAFAF] focus:border-[#fff] placeholder-[#5E5E5E]",
      },
      {
        variantColor: "white",
        variant: "searchInput",
        className: "bg-[#f5f5f5] focus:bg-[#fff] hover:bg-[#fff] border-[0.1rem] border-[#A1A1A1] focus:border-[#000] placeholder-[#5E5E5E]  text-[#000] ",
      },
      {
        variantColor: "black",
        note: "disabled",
        className: "bg-[#0B090D] hover:bg-[#0B090D] border-[0.1rem] border-[#3a383b] focus:border-GrayScale-Border-Darker text-[#A5ADBA] placeholder-[#A5ADBA]",
      },
      {
        variantColor: "white",
        note: "disabled",
        className: "bg-[#f5f5f5] hover:bg-[#f5f5f5] border-[0.1rem] border-[#d1d1d1] focus:border-[#d1d1d1] text-[#a3a3a3] placeholder-[#a3a3a3]",
      }
    ],
  }
);
