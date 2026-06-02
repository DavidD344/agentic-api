import type { SVGProps } from "react";
const SvgInfo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 25 26"
    {...props}
  >
    <path d="M13.281 12.06a.781.781 0 1 0-1.562 0v6.25a.781.781 0 1 0 1.562 0z" />
    <path
      fillRule="evenodd"
      d="M12.499 1.903C6.314 1.903 1.3 6.917 1.3 13.101S6.314 24.3 12.499 24.3c6.184 0 11.198-5.013 11.198-11.198 0-6.184-5.014-11.198-11.198-11.198M2.863 13.101a9.635 9.635 0 0 1 19.271 0c0 5.322-4.314 9.636-9.635 9.636-5.322 0-9.636-4.314-9.636-9.636"
      clipRule="evenodd"
    />
    <path d="M13.54 8.934a1.042 1.042 0 1 1-2.083 0 1.042 1.042 0 0 1 2.083 0" />
  </svg>
);
export default SvgInfo;
