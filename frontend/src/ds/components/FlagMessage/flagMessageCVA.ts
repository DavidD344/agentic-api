import { cva } from "class-variance-authority";

export const flagMessageCVA = cva(
  `flex flex-row gap-x-2 py-3 pl-2 pr-3 rounded-[3px]  max-w-[28.4rem]`,
  {
    variants: {
      variant: {
        none: "opacity-0",
        success: "border-l-2 bg-[#EDFFF7] border-[#00643A] text-[#00643A]",
        error: "border-l-2 bg-[#FFE8D9] border-[#B70C1D] text-[#B70C1D]",
        info: "bg-[#DBEAFF] border-[#0055CC] text-[#0055CC]",
      },
    },
    defaultVariants: {
      variant: "none",
    },
  }
);
