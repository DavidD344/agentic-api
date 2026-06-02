import type { SVGProps } from "react";
const SvgGroup = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 26 18"
    {...props}
  >
    <path d="M23.665.763H2.335A1.837 1.837 0 0 0 .5 2.597V15.84c0 1.012.823 1.835 1.835 1.835h21.33A1.837 1.837 0 0 0 25.5 15.84V2.597A1.837 1.837 0 0 0 23.665.763m.758 15.077c0 .418-.34.758-.758.758H2.335a.76.76 0 0 1-.758-.758V2.597c0-.418.34-.758.758-.758h21.33c.418 0 .758.34.758.758z" />
  </svg>
);
export default SvgGroup;
