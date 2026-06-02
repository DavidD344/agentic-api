import { cva } from "class-variance-authority";

export const alertRootCVA = cva(`bg-DSGlobalBackgroundColor flex flex-col justify-start items-center`, {
  variants: {
    variant: {
      none: "",
    },
    borderContainer: {
      none: "",
      default: "border-DSGlobalText border-[0.1rem]",
    },
    borderRounded: {
      none: "",
      min: "rounded-[0.5rem]",
      medium: "rounded-[1rem]",
      max: "rounded-[1.5rem]",
    },
    paddingDefault: {
      none: "",
      medium: "p-4",
      max: "p-6",
    },
    header: {
      none: "",
      default: "",
    },
  },
  defaultVariants: {
    variant: "none",
    borderContainer: "none",
    borderRounded: "none",
    paddingDefault: "none",
  },
});
