import SvgChevronDown from "@/ds/icons/svgReact/ChevronDown";
import { Caption } from "@/ds/typography/Caption/Caption";
import { H5 } from "@/ds/typography/H5/H5";

const FilterTabStack = ({
  active,
  toggleActive,
  children,
  selectFiltersNumber,
  tooltip,
}: {
  active: boolean;
  toggleActive?: () => void;
  children: React.ReactNode;
  selectFiltersNumber?: number;
  tooltip?: React.ReactNode;
}) => {
  return (
    <div
      className="flex w-full flex-row justify-between items-center px-2 py-3  cursor-pointer"
      onClick={() => {
        if (toggleActive) {
          toggleActive();
        }
      }}
    >
      <H5 weight={"Regular"} className="text-DSGlobalText w-full">
        {children}
      </H5>

      <div className="h-fit w-fit flex flex-row items-center transition-all">
        {selectFiltersNumber && selectFiltersNumber > 0 ? (
          <div className="w-6 h-6 rounded-full bg-[#DFE1E6] flex justify-center items-center">
            <Caption
              weight={"Black"}
              className="text-DSGlobalText truncate w-fit "
            >
              {selectFiltersNumber}
            </Caption>
          </div>
        ) : null}
        {toggleActive && (
          <span
            className={`h-fit w-fit transition-all ${active && "-rotate-180"}`}
          >
            <SvgChevronDown
              className=""
              style={{ fill: "var(--ds-global-text)" }}
              width={25}
              height={25}
            />
          </span>
        )}
      </div>
      {tooltip}
    </div>
  );
};
export { FilterTabStack };
