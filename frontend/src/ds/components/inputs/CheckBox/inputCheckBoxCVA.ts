import { cva } from "class-variance-authority";

export const inputCheckBoxCVA = cva(
  `cursor-pointer overflow-hidden rounded-[0.3rem] border-teal ring-0 outline-none focus:border-teal focus:ring-0 focus:outline-none block px-2 py-2 duration-300 `,
  {
    variants: {
      variantColor: {
        primary:
          "text-DSGlobalPrimary bg-DSGlobalBackgroundColor focus:bg-DSGlobalBackgroundColor hover:bg-DSGlobalBackgroundColor border-2 border-[#231111] focus:border-[#231111] ",
      },
      variant: {
        square: "rounded-[0.3rem]",
        rounded: "rounded-full",
      },

      note: {
        none: "",
        dangerous: "border-[#DE350B] focus:border-[#DE350B]",
        success:
          "border-GrayScale-Border-Default focus:border-GrayScale-Border-Darker",
        disabled:
          "bg-[#FAFBFC] hover:bg-[#FAFBFC] border-2 border-GrayScale-Border-Disabled focus:border-GrayScale-Border-Darker text-[#A5ADBA] cursor-default",
      },
    },
    defaultVariants: {
      variantColor: "primary",
      variant: "square",
      note: "none",
    },
  }
);
