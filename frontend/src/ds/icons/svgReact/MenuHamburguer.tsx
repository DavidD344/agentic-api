import type { SVGProps } from "react";
const SvgMenuHamburguer = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 15 16"
    {...props}
  >
    <g clipPath="url(#menuHamburguer_svg__a)">
      <path d="M14.063 13.925H.938a.937.937 0 1 1 0-1.875h13.125a.938.938 0 0 1 0 1.875M14.063 9.237H.938a.937.937 0 1 1 0-1.875h13.125a.937.937 0 1 1 0 1.875M14.063 4.55H.938a.937.937 0 1 1 0-1.875h13.125a.937.937 0 1 1 0 1.875" />
    </g>
    <defs>
      <clipPath id="menuHamburguer_svg__a">
        <path fill="#fff" d="M0 .8h15v15H0z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgMenuHamburguer;
