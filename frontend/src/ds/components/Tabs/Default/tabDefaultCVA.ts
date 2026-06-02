import { cva } from "class-variance-authority";

export const tabDefaultCVA = cva(
  `flex flex-col justify-center items-center gap-y-1 cursor-pointer rounded-t-[1rem] transition-all duration-300 border-DFDSTabBorderTransparent`,
  {
    variants: {
      variant: {
        default: "w-full h-13 px-6 min-w-[12rem]",
      },
      state: {
        none: " hover:bg-DFDSTabTransparent border-b-2 border-DSTransparentBorderTab text-[#da291c]",
        active:
          " bg-DFDSTabTransparent border-b-2 DSGradientBorder text-[#231111]",
      },
      variantColor: {
        default: "",
        white: "",
      },
    },
    defaultVariants: {
      variant: "default",
      variantColor: "default",
    },
  }
);
