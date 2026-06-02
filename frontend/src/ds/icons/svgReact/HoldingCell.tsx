import type { SVGProps } from "react";
const SvgHoldingCell = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 26 25"
    {...props}
  >
    <g clipPath="url(#holdingCell_svg__a)">
      <mask
        id="holdingCell_svg__b"
        width={26}
        height={25}
        x={0}
        y={0}
        maskUnits="userSpaceOnUse"
        style={{
          maskType: "luminance",
        }}
      >
        <path fill="#fff" d="M.75 0h25v25h-25z" />
      </mask>
      <g mask="url(#holdingCell_svg__b)">
        <path d="M17.416 10.445a4.69 4.69 0 0 1 4.167 4.66v9.374a.52.52 0 1 1-1.042 0v-9.375a3.65 3.65 0 0 0-3.125-3.609v6.213c0 1.151-.933 2.084-2.083 2.084-.93 0-1.752-.25-2.45-.75a1.56 1.56 0 0 0-.91-.292.57.57 0 0 0-.56.385c-.116.347-.046.685.168.926l3.62 4.072a.52.52 0 1 1-.778.692l-2.632-2.96a.5.5 0 0 1-.104.01H7.52a2.604 2.604 0 0 1-2.604-2.604V2.604A2.604 2.604 0 0 1 7.52 0h7.292a2.604 2.604 0 0 1 2.604 2.604zm-6.613 10.308a1.95 1.95 0 0 1-.392-1.907c.232-.696.846-1.138 1.537-1.138.57 0 1.1.17 1.542.488.516.369 1.125.554 1.843.554.575 0 1.041-.466 1.041-1.042V2.604c0-.863-.7-1.562-1.562-1.562H7.52c-.863 0-1.562.7-1.562 1.562v16.667c0 .863.7 1.562 1.562 1.562h3.354zm-1.2-17.628a.52.52 0 0 1 0-1.042h3.126a.52.52 0 0 1 0 1.042z" />
      </g>
    </g>
    <defs>
      <clipPath id="holdingCell_svg__a">
        <path d="M.75 0h25v25h-25z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgHoldingCell;
