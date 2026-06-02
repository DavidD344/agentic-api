import { H3 } from "@/ds/typography/H3/H3";
import { cn } from '@/ds/utils/cnMerge';
import { type HTMLAttributes } from 'react';

interface BigAvatarIconProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  description: string;
  linkImg?: string;
  borderSquare?: boolean;
  name?: string;
}

const BigAvatarIcon = ({
  description,
  borderSquare,
  name,
  linkImg,
  className,
  ...restProps
}: BigAvatarIconProps) => {
  return (
    <div
      className={cn(
        `
        sm:w-14 sm:h-14 w-8 h-8 ${
          name && 'bg-DSGlobalPrimary'
        } flex justify-center items-center ${
          borderSquare ? 'rounded-[0.3rem]' : 'rounded-full'
        }`,
        className,
      )}
      {...restProps}
    >
      {name && !linkImg ? (
        <H3
          weight={'Regular'}
          className={`text-center tracking-wider sm:w-14 w-8 h-fit text-GrayScale-TextIcon-Negative`}
        >
          {name}
        </H3>
      ) : (
        <img
          src={linkImg || '/avatarIconDefault.png'}
          alt={description}
          className={cn(
            ` 'h-8 sm:h-14 w-auto' ${
              borderSquare ? 'rounded-[0.3rem]' : 'rounded-full'
            }`,
          )}
        />
      )}
    </div>
  );
};

export { BigAvatarIcon };
