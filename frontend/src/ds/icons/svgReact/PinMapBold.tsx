import type { SVGProps } from "react";
const SvgPinMapBold = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 21 20"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.875}
      d="M10.125 10.625a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.875}
      d="M16.375 8.125c0 5.625-6.25 10-6.25 10s-6.25-4.375-6.25-10a6.25 6.25 0 0 1 12.5 0"
    />
  </svg>
);
export default SvgPinMapBold;
