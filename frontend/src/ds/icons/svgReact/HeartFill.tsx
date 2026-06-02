import type { SVGProps } from "react";
const SvgHeartFill = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 25 21"
    {...props}
  >
    <path
      fill="#FF0097"
      d="M24.688 6.516c0 7.734-12.188 14.297-12.188 14.297S.313 14.25.313 6.515A6.33 6.33 0 0 1 6.64.188c2.647 0 4.915 1.442 5.859 3.75.944-2.308 3.212-3.75 5.86-3.75a6.33 6.33 0 0 1 6.328 6.328"
      opacity={0.5}
    />
  </svg>
);
export default SvgHeartFill;
