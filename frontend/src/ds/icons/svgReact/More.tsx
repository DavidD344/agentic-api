import type { SVGProps } from "react";
const SvgMore = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 25 26"
    {...props}
  >
    <g clipPath="url(#more_svg__a)">
      <path d="M12.5.602C5.596.602 0 6.198 0 13.102c0 6.903 5.596 12.5 12.5 12.5S25 20.005 25 13.102c0-6.904-5.596-12.5-12.5-12.5m0 23.437c-6.04 0-10.937-4.897-10.937-10.937C1.563 7.06 6.459 2.164 12.5 2.164s10.938 4.897 10.938 10.938c0 6.04-4.897 10.937-10.938 10.937" />
      <path d="M12.5 14.664a1.563 1.563 0 1 0 0-3.125 1.563 1.563 0 0 0 0 3.125M17.969 14.664a1.562 1.562 0 1 0 0-3.125 1.562 1.562 0 0 0 0 3.125M7.031 14.664a1.563 1.563 0 1 0 0-3.125 1.563 1.563 0 0 0 0 3.125" />
    </g>
    <defs>
      <clipPath id="more_svg__a">
        <path d="M0 .602h25v25H0z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgMore;
