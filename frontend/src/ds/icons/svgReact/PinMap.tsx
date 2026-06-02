import type { SVGProps } from "react";
const SvgPinMap = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 31 31"
    {...props}
  >
    <g clipPath="url(#pinMap_svg__a)">
      <path d="M15.5 6.594a5.157 5.157 0 1 0 5.156 5.156A5.16 5.16 0 0 0 15.5 6.594m0 9.375a4.22 4.22 0 1 1 0-8.439 4.22 4.22 0 0 1 0 8.439" />
      <path d="M15.5.5A11.263 11.263 0 0 0 4.25 11.75c0 8.076 10.48 18.193 10.926 18.62a.47.47 0 0 0 .648 0c.446-.427 10.926-10.544 10.926-18.62A11.263 11.263 0 0 0 15.5.5m0 28.872c-1.784-1.79-10.312-10.71-10.312-17.622a10.313 10.313 0 0 1 20.625 0c0 6.908-8.53 15.832-10.313 17.622" />
    </g>
    <defs>
      <clipPath id="pinMap_svg__a">
        <path fill="#fff" d="M.5.5h30v30H.5z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgPinMap;
