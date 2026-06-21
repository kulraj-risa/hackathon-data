import JsonView from "@uiw/react-json-view";
import ChevronDown from "../../svg/chevron-down";
import { capitalizeWordsSeperatedByUnderScore } from "../../utils/stringModifications";
import BadgeWithIcon from "../badgeWithIcon/badgeWithIcon";

export interface ApiReponseViewerProps {
  apiName?: string;
  totalEntries?: number;
  selectedApiRequest: number;
  setSelectedApiRequest?: (index: number) => void;
  requestData: any;
  responseData: any;
  statusCode: number;
  shouldHaveTopMargin?: boolean;
}

const ApiReponseViewer = (props: ApiReponseViewerProps) => {
  return (
    <div className="api-detail--container flex h-full flex-col gap-8">
      <div
        className={`api-request--container flex flex-1 flex-col gap-2 overflow-hidden ${props.shouldHaveTopMargin ? "mt-4" : ""}`}
      >
        <div className="api-request--header flex items-center gap-2 text-h12 font-bold">
          Request
          <BadgeWithIcon
            text={capitalizeWordsSeperatedByUnderScore(props.apiName ?? "")}
            id="api-name"
            textColor="black"
            bgColor="#F5F5F5"
          />
          {props.totalEntries && props.totalEntries > 1 && (
            <>
              <div className="navigation ml-auto flex items-center gap-2">
                {props?.selectedApiRequest > 0 && (
                  <div
                    className="cursor-pointer rounded-full bg-primaryGray-16 p-1"
                    onClick={() => {
                      props.setSelectedApiRequest?.(
                        props.selectedApiRequest - 1,
                      );
                    }}
                  >
                    {" "}
                    <ChevronDown height={16} width={16} rotate={90} />
                  </div>
                )}
                <span className="flex text-tiny text-primaryGray-3">
                  {props.selectedApiRequest + 1} / {props.totalEntries}
                </span>
                {props.selectedApiRequest < props.totalEntries - 1 && (
                  <div
                    className="cursor-pointer rounded-full bg-primaryGray-16 p-1"
                    onClick={() => {
                      props.setSelectedApiRequest?.(
                        props.selectedApiRequest + 1,
                      );
                    }}
                  >
                    {" "}
                    <ChevronDown height={16} width={16} rotate={270} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="api-request--raw flex-1 overflow-auto rounded border border-primaryGray-16 bg-[#F7F9FA] p-3">
          <JsonView value={props.requestData ?? {}} />
        </div>
      </div>
      <div className="api-response--container flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="api-response--header flex items-center gap-3 text-h12 font-bold">
          Response
          <BadgeWithIcon
            text={
              props.statusCode >= 200 && props.statusCode < 300
                ? "Success"
                : "Failed"
            }
            id="success-badge"
            textColor={
              props.statusCode >= 200 && props.statusCode < 300
                ? " #005D49"
                : " #D92D20"
            }
            bgColor={
              props.statusCode >= 200 && props.statusCode < 300
                ? "#E6F3F0"
                : "#FEE4E2"
            }
          />
        </div>
        <div className="api-response--raw flex-1 overflow-auto rounded border border-primaryGray-16 bg-[#F7F9FA] p-3">
          <JsonView value={props.responseData ?? {}} />
        </div>
      </div>
    </div>
  );
};

export default ApiReponseViewer;
