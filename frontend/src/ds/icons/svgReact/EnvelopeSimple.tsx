import type { SVGProps } from "react";
const SvgEnvelopeSimple = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 20 21"
    {...props}
  >
    <path d="M17.5 4.496h-15a.625.625 0 0 0-.625.625v10.625a1.25 1.25 0 0 0 1.25 1.25h13.75a1.25 1.25 0 0 0 1.25-1.25V5.121a.625.625 0 0 0-.625-.625m-1.607 1.25L10 11.148 4.107 5.746zm.982 10H3.125V6.542l6.452 5.915a.625.625 0 0 0 .846 0l6.452-5.915z" />
  </svg>
);
export default SvgEnvelopeSimple;
