import type { SVGProps } from "react";
const SvgActivityIndicator = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 31 31"
    {...props}
  >
    <path
      d="M19.25 16.672V6.125a3.75 3.75 0 0 0-7.5 0v10.547a6.563 6.563 0 1 0 7.5 0m-3.75 8.203a2.812 2.812 0 1 1 0-5.624 2.812 2.812 0 0 1 0 5.624"
      opacity={0.2}
    />
    <path d="M16.438 18.43v-7.617a.938.938 0 0 0-1.875 0v7.617a3.75 3.75 0 1 0 1.874 0m-.938 5.508a1.875 1.875 0 1 1 0-3.751 1.875 1.875 0 0 1 0 3.75m4.688-7.735V6.125a4.688 4.688 0 0 0-9.375 0v10.078a7.5 7.5 0 1 0 9.375 0M15.5 27.688a5.625 5.625 0 0 1-3.213-10.243.94.94 0 0 0 .4-.773V6.125a2.812 2.812 0 1 1 5.626 0v10.547a.94.94 0 0 0 .4.769A5.625 5.625 0 0 1 15.5 27.688" />
  </svg>
);
export default SvgActivityIndicator;
