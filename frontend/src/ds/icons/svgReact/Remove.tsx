import type { SVGProps } from "react";
const SvgRemove = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 21 21"
    {...props}
  >
    <g clipPath="url(#remove_svg__a)">
      <path d="M10.125.15c-5.514 0-10 4.486-10 10s4.486 10 10 10 10-4.485 10-10-4.486-10-10-10m3.683 12.505a.833.833 0 1 1-1.179 1.178l-2.504-2.504-2.504 2.504a.83.83 0 0 1-1.179 0 .833.833 0 0 1 0-1.178l2.505-2.505-2.505-2.504a.833.833 0 1 1 1.179-1.178l2.504 2.504 2.504-2.504a.833.833 0 1 1 1.179 1.178l-2.505 2.504z" />
    </g>
    <defs>
      <clipPath id="remove_svg__a">
        <path d="M.125.15h20v20h-20z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgRemove;
