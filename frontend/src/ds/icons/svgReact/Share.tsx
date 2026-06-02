import type { SVGProps } from "react";
const SvgShare = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 31 31"
    {...props}
  >
    <path fill="currentColor" d="m21.125 18.313 5.625-5.625-5.625-5.626" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.875}
      d="m21.125 18.313 5.625-5.625-5.625-5.626M23 25.813H5.188a.94.94 0 0 1-.938-.938V10.813"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.875}
      d="M9.29 21.125a11.26 11.26 0 0 1 10.898-8.437h6.562"
    />
  </svg>
);
export default SvgShare;
