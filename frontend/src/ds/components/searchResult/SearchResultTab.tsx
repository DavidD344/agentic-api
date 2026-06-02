import { cn } from "@/ds/utils/cnMerge";
import { type HTMLAttributes } from "react";
import SvgPinMap from "@/ds/icons/svgReact/PinMap";
import SvgHome from "@/ds/icons/svgReact/Home";
import { H6 } from "@/ds/typography/H6/H6";
import { Body } from "@/ds/typography/Body/Body";

interface SearchResultTabProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  title: string;
  text: string;
  type: string;
}
export enum SearchResultTabType {
  CITY = "CITY",
  NEIGHBORHOOD = "NEIGHBORHOOD",
  ESTABLISHMENT = "ESTABLISHMENT",
}
const SearchResultTab = ({
  className,
  text,
  title,
  type,
  ...restProps
}: SearchResultTabProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        " flex flex-row justify-start items-center px-3 h-[6.4rem] w-full  cursor-pointer transition-all hover:bg-DFDSTabTransparent rounded-[1.0rem] ",
        className
      )}
    >
      <div className="bg-[#47405366] flex justify-center items-center w-9.4 h-9.4 rounded-[0.5rem] text-DSGlobalText">
        {(type === SearchResultTabType.NEIGHBORHOOD ||
          type === SearchResultTabType.CITY) && (
          <SvgPinMap
            className=""
            style={{ fill: "var(--dfds-card-text)" }}
            width={20}
            height={20}
          />
        )}

        {type === SearchResultTabType.ESTABLISHMENT && (
          <SvgHome
            className=""
            style={{ fill: "var(--dfds-card-text)" }}
            width={20}
            height={20}
          />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center h-9.4 pl-3">
        <H6 weight={"Bold"} className="text-DSGlobalText whitespace-nowrap">
          {title}
        </H6>
        <Body
          weight={"Regular"}
          className="text-DSGlobalText  whitespace-nowrap"
        >
          {text}
        </Body>
      </div>
    </div>
  );
};

export { SearchResultTab };
