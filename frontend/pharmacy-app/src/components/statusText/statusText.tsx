import { NycbsStatus } from "../../enums/nycbsStatus";
import ChevronDown from "../../svg/chevron-down";

interface StatusTextProps {
  status: number;
}
const StatusText = (props: StatusTextProps) => {
  switch (props.status) {
    case NycbsStatus.UNASSIGNED:
      return (
        <div className="w-fit max-w-full truncate text-h11 font-normal italic leading-h12 text-primaryGray-6">
          Unassigned
        </div>
      );

    case NycbsStatus.DENIED:
      return (
        <div className="flex w-fit max-w-full items-center gap-[0.125rem] rounded border border-tertiaryRed-600 bg-tertiaryRed-50 px-[0.375rem] py-[0.25rem]">
          <div className="status-text truncate text-x-tiny font-semibold text-tertiaryRed-600">
            Denied
          </div>
          <div className="icon">
            <ChevronDown stroke={"#BB0202"} />
          </div>
        </div>
      );

    case NycbsStatus.APPROVED:
      return (
        <div className="flex w-fit max-w-full items-center gap-[0.125rem] rounded border border-tertiaryGreen-700 bg-tertiaryGreen-50 px-[0.375rem] py-[0.25rem]">
          <div className="status-text truncate text-x-tiny font-semibold text-tertiaryGreen-700">
            Approved
          </div>
          <div className="icon">
            <ChevronDown stroke={"#005D49"} />
          </div>
        </div>
      );

    case NycbsStatus.DECSISION_PENDING:
      return (
        <div className="flex w-fit max-w-full items-center gap-[0.125rem] rounded border border-secondaryYellow-2 bg-secondaryYellow-11 px-[0.375rem] py-[0.25rem]">
          <div className="status-text truncate text-x-tiny font-semibold text-secondaryYellow-2">
            Decision Awaiting
          </div>
          <div className="icon">
            <ChevronDown stroke={"#665D00"} />
          </div>
        </div>
      );

    case NycbsStatus.MARK_AS_COMPLETED:
      return (
        <div className="w-fit max-w-full truncate text-h12 font-semibold text-tertiaryBlue-4">
          Mark as Completed
        </div>
      );

    default:
      return <div>Unknown</div>;
  }
};

export default StatusText;
