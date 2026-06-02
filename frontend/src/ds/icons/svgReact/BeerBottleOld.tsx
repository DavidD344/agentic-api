import type { SVGProps } from "react";
const SvgBeerBottleOld = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 53 54"
    {...props}
  >
    <g filter="url(#beerBottleOld_svg__a)">
      <path d="m37.49 19.135-3.125-3.125a.782.782 0 0 0-1.105 1.105l.144.144-5.387 4.04-3.733.748a.8.8 0 0 0-.4.213l-8.138 8.136a2.344 2.344 0 0 0 0 3.315l4.043 4.043a2.344 2.344 0 0 0 3.315 0l8.136-8.136a.8.8 0 0 0 .213-.4l.747-3.732 4.041-5.387.144.144a.782.782 0 0 0 1.105-1.105zm-14.615 6.344 5.145 5.146-4.364 4.364-5.145-5.145zm-1.429 11.396a.77.77 0 0 1-.551-.229l-4.041-4.04a.78.78 0 0 1 0-1.105l.552-.553 5.146 5.146-.556.552a.78.78 0 0 1-.55.229m9.398-12.188a.8.8 0 0 0-.14.316l-.736 3.675-.843.842-5.145-5.145.842-.843 3.675-.735a.8.8 0 0 0 .316-.14l5.708-4.282.604.604z" />
    </g>
    <defs>
      <filter
        id="beerBottleOld_svg__a"
        width={55}
        height={55}
        x={-1.5}
        y={0}
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset />
        <feGaussianBlur stdDeviation={7.5} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix values="0 0 0 0 0.501961 0 0 0 0 0.352941 0 0 0 0 0.796078 0 0 0 0.5 0" />
        <feBlend
          in2="BackgroundImageFix"
          result="effect1_dropShadow_885_5266"
        />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_885_5266"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);
export default SvgBeerBottleOld;
