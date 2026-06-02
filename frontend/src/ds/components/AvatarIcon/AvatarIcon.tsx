import { Body } from "@/ds/typography/Body/Body";
import { Caption } from "@/ds/typography/Caption/Caption";
import { cn } from "@/ds/utils/cnMerge";
import { type HTMLAttributes } from "react";
interface AvatarIconProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  description: string;
  linkImg?: string;
  smallSize?: boolean;
  borderSquare?: boolean;
  name?: string;
}

const AvatarIcon = ({
  description,
  borderSquare,
  name,
  linkImg,
  className,
  smallSize,
  ...restProps
}: AvatarIconProps) => {
  return (
    <div
      className={cn(
        `${smallSize ? "h-8 w-8" : "w-9.4 h-9.4"} ${
          name && "bg-DSGlobalPrimary"
        } flex justify-center items-center ${
          borderSquare ? "rounded-[0.3rem]" : "rounded-full"
        }`,
        className
      )}
      {...restProps}
    >
      {name && !linkImg ? (
        smallSize ? (
          <Caption
            weight={"Regular"}
            className={`text-center ${
              smallSize ? "h-8 w-8" : "w-9.4 h-9.4"
            }  h-fit text-GrayScale-TextIcon-Negative`}
          >
            {name}
          </Caption>
        ) : (
          <Body
            weight={"Regular"}
            className={`text-center ${
              smallSize ? "h-8 w-8" : "w-9.4 h-9.4"
            }  h-fit text-GrayScale-TextIcon-Negative`}
          >
            {name}
          </Body>
        )
      ) : (
        <img
          src={linkImg || "/avatarIconDefault.png"}
          alt={description}
          className={cn(
            `${smallSize ? "h-8 w-8" : "w-9.4 h-9.4"}  ${
              borderSquare ? "rounded-[0.3rem]" : "rounded-full"
            }`
          )}
        />
      )}
    </div>
  );
};

export { AvatarIcon };
