import type { SVGProps } from "react";
const SvgForkKnifeBug = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={63}
    height={64}
    fill="currentColor"
    viewBox="0 0 32 34"
    {...props}
  >
    <g filter="url(#forkKnifeBug_svg__a)">
      <path d="M26.531 27.594v-4.688a.781.781 0 1 1 1.563 0v4.688a.782.782 0 0 1-1.563 0m14.063-4.688v17.969a.781.781 0 0 1-1.563 0v-4.687h-4.687a.78.78 0 0 1-.782-.782 26.3 26.3 0 0 1 .706-5.554c.955-3.955 2.765-6.605 5.237-7.663a.78.78 0 0 1 1.089.717m-1.563 1.358c-3.141 2.4-3.757 8.244-3.877 10.361h3.877zm-7.823-1.486a.782.782 0 1 0-1.541.257l.77 4.62a3.125 3.125 0 1 1-6.25 0l.77-4.62a.78.78 0 1 0-1.541-.257l-.781 4.688a1 1 0 0 0-.01.128 4.694 4.694 0 0 0 3.906 4.62v8.661a.781.781 0 1 0 1.563 0v-8.66A4.694 4.694 0 0 0 32 27.594a1 1 0 0 0-.01-.128z" />
    </g>
    <defs>
      <filter
        id="forkKnifeBug_svg__a"
        width={68.636}
        height={68.636}
        x={-2.318}
        y={-2.818}
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
        <feGaussianBlur stdDeviation={10.909} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
        <feBlend
          in2="BackgroundImageFix"
          result="effect1_dropShadow_885_5258"
        />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_885_5258"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);
export default SvgForkKnifeBug;
