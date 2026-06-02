"use client";
import { type HTMLAttributes } from "react";

import { cn } from "@/ds/utils/cnMerge";
import SvgHeart from "@/ds/icons/svgReact/Heart";
import SvgHeartFill from "@/ds/icons/svgReact/HeartFill";

interface FavoritedProps extends HTMLAttributes<HTMLDivElement> {
  toggleActiveFunction: () => void;
  isFavorited: boolean;
  whiteBorder?: boolean;
}

const Favorited = ({
  className,
  toggleActiveFunction,
  isFavorited,
  whiteBorder,
  ...restProps
}: FavoritedProps) => {
  return (
    <div
      {...restProps}
      onClick={(e) => {
        e.stopPropagation(); // Impede o clique de se propagar
        e.preventDefault(); // Impede o comportamento padrão do Link
        toggleActiveFunction();
      }}
      className={cn(
        "h-[2.4rem] w-[2.4rem] relative flex justify-center items-center cursor-pointer",
        className
      )}
    >
      <SvgHeart
        className="absolute"
        style={{
          fill: `${
            isFavorited
              ? "var(--dfds-card-heart-fill-border)"
              : whiteBorder?"var(--dfds-card-heart-border-white)": "var(--dfds-card-heart-border)"
          }`,
        }}
        width={24}
        height={24}
      />
      <SvgHeartFill
        className={`absolute transition-all duration-200 ${
          isFavorited ? "opacity-100" : "opacity-0"
        }`}
        style={{ fill: "var(--dfds-card-heart-border)" }}
        width={24}
        height={24}
      />
    </div>
  );
};
export { Favorited };
