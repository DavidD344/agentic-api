import type { SVGProps } from "react";
const SvgIphone = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 25 26"
    {...props}
  >
    <g clipPath="url(#iphone_svg__a)">
      <path d="M17.5.602h-10a2.504 2.504 0 0 0-2.5 2.5v20c0 1.379 1.122 2.5 2.5 2.5h10c1.379 0 2.5-1.121 2.5-2.5v-20c0-1.378-1.121-2.5-2.5-2.5m1.5 22.5c0 .827-.673 1.5-1.5 1.5h-10c-.827 0-1.5-.673-1.5-1.5v-20c0-.827.673-1.5 1.5-1.5h10c.827 0 1.5.673 1.5 1.5z" />
      <path d="M13.5 2.602h-2a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1M12.5 22.602a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1M19.5 4.602h-14a.5.5 0 0 0 0 1h14a.5.5 0 0 0 0-1M19.5 20.602h-14a.5.5 0 0 0 0 1h14a.5.5 0 0 0 0-1" />
    </g>
    <defs>
      <clipPath id="iphone_svg__a">
        <path d="M0 .602h25v25H0z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgIphone;
