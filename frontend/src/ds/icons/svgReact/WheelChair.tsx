import type { SVGProps } from "react";
const SvgWheelChair = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 26 26"
    {...props}
  >
    <g clipPath="url(#wheelChair_svg__a)">
      <path d="M17.268 18.802a.995.995 0 0 0-1.314.519A6.48 6.48 0 0 1 10 23.219a6.51 6.51 0 0 1-6.5-6.5 6.5 6.5 0 0 1 3.266-5.632 1 1 0 0 0 .373-1.364.996.996 0 0 0-1.364-.372A8.5 8.5 0 0 0 1.5 16.719c0 4.687 3.813 8.5 8.5 8.5a8.48 8.48 0 0 0 7.788-5.102 1 1 0 0 0-.52-1.315" />
      <path d="M24.429 19.848a1 1 0 0 0-1.3-.558l-1.496.599-2.177-6.968a1 1 0 0 0-.956-.702h-7.142l-.311-2H15a1 1 0 1 0 0-2h-4.263l-.517-3.331a2.49 2.49 0 0 0 1.28-2.17c0-1.378-1.121-2.5-2.5-2.5a2.503 2.503 0 0 0-2.5 2.5c0 1.108.728 2.038 1.727 2.366l1.285 8.288a1 1 0 0 0 .988.847h7.265l2.28 7.298a1.004 1.004 0 0 0 1.327.63l2.5-1a1 1 0 0 0 .557-1.3" />
    </g>
    <defs>
      <clipPath id="wheelChair_svg__a">
        <path d="M.5.219h25v25H.5z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgWheelChair;
