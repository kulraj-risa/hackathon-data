import moment from "moment";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import CustomRadioButton from "../../components/customRadioButton/customRadioButton";
import { LoaderMessage } from "../../components/loaderMessage/loaderMessage";
import { NycbsPharmaOrderKeys } from "../../enums/nycbsPharmaOrder";
import { fetchCmmDiffDataForGivenOrder } from "../../redux/slice/cmm/cmmDiffDataSlice";
import { AppDispatch, RootState } from "../../redux/store/store";
import BackArrowBlue from "../../svg/back-arrow-blue";
import { CopyIcon } from "../../svg/copy-icon";
import { generateFullName } from "../../utils/generateOrderDataForTable";
import { capitalizeString } from "../../utils/stringModifications";
import CmmInputDiffViewer from "./components/cmmInputDiffViewer";
import QuestionnaireDiffViewer from "./components/questionnaireDiffViewer";
import ScreenshotDiffViewer from "./components/screenshotDiffViewer";
const PharmaPaDiffViewer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams();
  const { baselineData, currentData, loading, error } = useSelector(
    (state: RootState) => state.cmmDiffData,
  );

  useEffect(() => {
    id && dispatch(fetchCmmDiffDataForGivenOrder(id));
  }, [id]);

  const [selectedDataType, setSelectedDataType] = useState<string>("cmm-input");
  const navigate = useNavigate();
  return (
    <div className="pharma-pa-diff-viewer__container flex h-full flex-col bg-[#F7F9FA] px-[0.9375rem] py-[0.625rem]">
      {loading ? (
        <>
          <div className="pharma-pa-diff-viewer__loading h-full w-full">
            <LoaderMessage message="Creating Diff Data Overview..." />
          </div>
        </>
      ) : (
        <>
          <>
            <div className="pharma-pa-diff-viewer__header mb-4">
              <div
                className="pharma-pa-diff-viewer__header-content flex items-center gap-1 text-h12 font-bold text-tertiaryBlue-4 hover:cursor-pointer"
                onClick={() => {
                  navigate("/pharma-pa-diff-data/diff-data-table");
                }}
              >
                <BackArrowBlue />
                Go Back
              </div>
            </div>
            <div className="pharma-pa-diff-viewer__body flex flex-1 flex-col overflow-hidden rounded bg-white p-4">
              <div className="pharma-pa-diff-viewer__body--header mb-4">
                <div className="pharma-pa-diff-viewer__body--header-details flex items-center justify-between gap-2">
                  <div className="pharma-pa-diff-viewer__body--header titles flex w-full gap-2">
                    <div className="pharma-pa-diff-viewer__body-page-name flex text-large font-semiBold leading-6 text-black">
                      Pharma PA Validator
                    </div>
                    <div className="pharma-pa-diff-viewer__body-patient-name h-7 rounded-[1.875rem] bg-primaryGray-16 px-4 text-small font-semibold leading-6 text-primaryGray-1">
                      {capitalizeString(
                        generateFullName(
                          baselineData?.data?.cmm_input?.[
                            NycbsPharmaOrderKeys.PatientFirstName
                          ],
                          "",
                          baselineData?.data?.cmm_input?.[
                            NycbsPharmaOrderKeys.PatientLastName
                          ],
                        ),
                      )}
                      &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
                      {
                        baselineData?.data?.cmm_input?.[
                          NycbsPharmaOrderKeys.PatientMrn
                        ]
                      }
                      &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
                      {baselineData?.data?.cmm_input?.["drug_name_onco_emr"]}
                    </div>
                    <div className="ml-auto flex flex-col items-center gap-2">
                      <div className="cmm-result-key ml-auto flex items-center gap-2 text-small">
                        Baseline Cmm Key:{" "}
                        <span className="font-bold">
                          {baselineData?.data?.cmm_input?.[
                            NycbsPharmaOrderKeys.CmmResultKey
                          ] ?? ""}
                        </span>
                        <div
                          className="cmm-result-key copy-icon hover:cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              baselineData?.data?.cmm_input?.[
                                NycbsPharmaOrderKeys.CmmResultKey
                              ] ?? "",
                            );
                          }}
                        >
                          <CopyIcon />
                        </div>
                      </div>
                      <div className="cmm-result-key ml-auto flex items-center gap-2 text-small">
                        Date of Service:{" "}
                        <span className="font-bold">
                          {moment(
                            baselineData?.data?.cmm_input?.[
                              NycbsPharmaOrderKeys.CreatedAt
                            ],
                          ).format("MM/DD/YYYY") ?? ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pharma-pa-diff-viewer__body-content flex flex-1 flex-col gap-2 overflow-hidden">
                <div className="data-type flex flex-1 flex-col gap-2 overflow-hidden">
                  <div className="data-type-title flex items-center gap-2">
                    <div className="data-type-select header mb-2 text-sm">
                      Select the data on which diff should be displayed :
                    </div>
                    <div className="flex items-center gap-2">
                      <CustomRadioButton
                        name={"data-type"}
                        value={"cmm-input"}
                        checked={selectedDataType === "cmm-input"}
                        label={"Basic Form Details"}
                        onChange={() => setSelectedDataType("cmm-input")}
                      />

                      <CustomRadioButton
                        name={"data-type"}
                        value={"questionnaire-data"}
                        checked={selectedDataType === "questionnaire-data"}
                        label={"Questionnaire Data"}
                        onChange={() =>
                          setSelectedDataType("questionnaire-data")
                        }
                      />

                      <CustomRadioButton
                        name={"data-type"}
                        value={"screenshots"}
                        checked={selectedDataType === "screenshots"}
                        label={"Screenshots"}
                        onChange={() => setSelectedDataType("screenshots")}
                      />
                    </div>
                  </div>
                  <div className="data-type-content flex flex-1 gap-4 overflow-auto">
                    {selectedDataType === "cmm-input" && <CmmInputDiffViewer />}
                    {selectedDataType === "questionnaire-data" && (
                      <QuestionnaireDiffViewer />
                    )}
                    {selectedDataType === "screenshots" && (
                      <ScreenshotDiffViewer />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        </>
      )}
    </div>
  );
};

export default PharmaPaDiffViewer;
