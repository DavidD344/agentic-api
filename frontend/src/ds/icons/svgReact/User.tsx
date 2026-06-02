import type { SVGProps } from "react";
const SvgUser = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 31 31"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M15.5 5.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10m-7.5 5a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0m-.234 10.77c2.038-1.273 4.776-2.02 7.734-2.02s5.696.747 7.734 2.02c2.02 1.263 3.516 3.168 3.516 5.48a1.25 1.25 0 1 1-2.5 0c0-1.14-.742-2.36-2.341-3.36-1.582-.988-3.844-1.64-6.409-1.64s-4.827.652-6.409 1.64c-1.599 1-2.341 2.22-2.341 3.36a1.25 1.25 0 1 1-2.5 0c0-2.312 1.496-4.217 3.516-5.48"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgUser;
