import type { SVGProps } from "react";
const SvgArrowDown = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 26 25"
    {...props}
  >
    <path d="m20.584 14.615-7.031 7.031a.783.783 0 0 1-1.106 0l-7.031-7.03a.782.782 0 1 1 1.105-1.106l5.698 5.698V3.906a.781.781 0 1 1 1.562 0v15.302l5.698-5.698a.782.782 0 1 1 1.105 1.105" />
  </svg>
);
export default SvgArrowDown;
