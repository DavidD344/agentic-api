import type { SVGProps } from "react";
const SvgChevron = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 31 31"
    {...props}
  >
    <path d="M10.813 25.813a.937.937 0 0 1-.663-1.6l8.712-8.713-8.712-8.712a.937.937 0 1 1 1.325-1.326l9.375 9.375a.937.937 0 0 1 0 1.326l-9.375 9.375a.94.94 0 0 1-.662.274" />
  </svg>
);
export default SvgChevron;
