import type { SVGProps } from "react";
const SvgLandingPage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 20 21"
    {...props}
  >
    <g clipPath="url(#landing-page_svg__a)">
      <path d="M17.5 1.234h-15a2.503 2.503 0 0 0-2.5 2.5v13a2.503 2.503 0 0 0 2.5 2.5h15a2.503 2.503 0 0 0 2.5-2.5v-13a2.503 2.503 0 0 0-2.5-2.5m-15 1h15c.828.001 1.499.672 1.5 1.5v.5H1v-.5c0-.828.672-1.499 1.5-1.5m15 16h-15c-.828 0-1.5-.672-1.5-1.5v-11.5h18v11.5c-.001.828-.672 1.5-1.5 1.5" />
      <path d="M3.5 12.234h4a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5m.5-3h3v2H4zM16.5 8.234h-6a.5.5 0 1 0 0 1h6a.5.5 0 0 0 0-1M16.5 11.234h-6a.5.5 0 1 0 0 1h6a.5.5 0 0 0 0-1M16.5 14.234h-13a.5.5 0 1 0 0 1h13a.5.5 0 0 0 0-1" />
    </g>
    <defs>
      <clipPath id="landing-page_svg__a">
        <path d="M0 .219h20v20H0z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgLandingPage;
