import type { SVGProps } from "react";
const SvgHome = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 20 21"
    {...props}
  >
    <g clipPath="url(#home_svg__a)">
      <path d="m19.787 8.905-9.48-6.941a.52.52 0 0 0-.614 0l-9.48 6.94a.52.52 0 1 0 .614.84L10 3.027l9.173 6.716a.517.517 0 0 0 .727-.112.52.52 0 0 0-.113-.726" />
      <path d="M17.275 9.861a.52.52 0 0 0-.52.52v8.271H12.6v-4.515A2.6 2.6 0 0 0 10 11.54a2.6 2.6 0 0 0-2.598 2.598v4.515H3.244v-8.271a.52.52 0 0 0-1.039 0v8.791c0 .287.233.52.52.52H7.92a.52.52 0 0 0 .52-.52v-5.035c0-.86.7-1.559 1.559-1.559.86 0 1.56.7 1.56 1.56v5.034l.001.04a.52.52 0 0 0 .518.48h5.196a.52.52 0 0 0 .52-.52v-8.791a.52.52 0 0 0-.52-.52" />
    </g>
    <defs>
      <clipPath id="home_svg__a">
        <path d="M0 .777h20v20H0z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgHome;
