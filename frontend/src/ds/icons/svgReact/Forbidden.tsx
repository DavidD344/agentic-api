import type { SVGProps } from "react";
const SvgForbidden = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 26 26"
    {...props}
  >
    <g clipPath="url(#forbidden_svg__a)">
      <path d="M13 .719C6.097.719.5 6.315.5 13.219c0 6.903 5.597 12.5 12.5 12.5s12.5-5.597 12.5-12.5c0-6.904-5.597-12.5-12.5-12.5m-10.345 12.5C2.655 7.515 7.296 2.874 13 2.874c2.52 0 4.831.906 6.627 2.409L5.064 19.846a10.3 10.3 0 0 1-2.409-6.627M13 23.564c-2.41 0-4.628-.831-6.388-2.218L21.128 6.83a10.3 10.3 0 0 1 2.217 6.389c0 5.704-4.641 10.345-10.345 10.345" />
    </g>
    <defs>
      <clipPath id="forbidden_svg__a">
        <path d="M.5.719h25v25H.5z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgForbidden;
