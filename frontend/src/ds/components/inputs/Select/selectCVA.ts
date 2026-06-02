import { cva } from "class-variance-authority";

export const selectCVA = cva(
  `cursor-pointer overflow-hidden text-[1.4rem] leading-[1.4rem] font-source font-normal w-full rounded-[1rem] ring-0 outline-none focus:ring-0 focus:outline-none block px-5 duration-300`,
  {
    variants: {
      variant: {
        default: "",
      },

      variantColor: {
        black:
          "bg-[#0B090D] focus:bg-[#000] hover:bg-[#000] border-[0.1rem] border-[#3a383b] focus:border-[#fff] placeholder-[#5E5E5E] text-[#fff] [&_option]:text-[#fff] [&_option]:bg-[#0B090D] [&_option]:hover:bg-[#000]",
        white:
          "bg-[#f5f5f5] focus:bg-[#fff] hover:bg-[#fff] border-[0.1rem] border-[#A1A1A1] focus:border-[#000] placeholder-[#000]  text-[#000] [&_option]:text-[#000] [&_option]:bg-[#fff] [&_option]:hover:bg-[#f0f0f0]",
      },
      note: {
        none: "",
        dangerous: "border-[#DB3444] focus:border-[#DB3444]",
        success: "  border-[#00875A] focus:border-[#00875A]",
        disabled:
          "opacity-100",
      },
      scale: {
        small: "h-9.4",
        medium: "h-10.6",
      },
    },
    defaultVariants: {
      variant: "default",
      note: "none",
      scale: "medium",
      variantColor: "black",
    },
    compoundVariants: [

      {
        variantColor: "black",
        note: "disabled",
        className:
          "bg-[#0B090D] cursor-not-allowed hover:bg-[#0B090D] border-[#3a383b] text-[#5E5E5E] placeholder-[#5E5E5E] [&_option]:text-[#5E5E5E] [&_option]:bg-[#0B090D]",
      },
      {
        variantColor: "white",
        note: "disabled",
        className:
          "bg-[#f5f5f5] cursor-not-allowed hover:bg-[#f5f5f5] border-[#d1d1d1] text-[#a3a3a3] placeholder-[#a3a3a3] [&_option]:text-[#a3a3a3] [&_option]:bg-[#f5f5f5]",
      },
    ],
  }
);
