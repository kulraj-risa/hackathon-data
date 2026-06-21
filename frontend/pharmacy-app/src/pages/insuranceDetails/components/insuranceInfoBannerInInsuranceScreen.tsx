import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { openModal } from "risa-oasis-ui_v2";
import InsuranceDetailsErrorModal from "../../../components/modals/insuranceDetailsErrorModal/insuranceDetailsErrorModal";
import InsuranceModal from "../../../components/modals/insuranceModal/insuranceModal";
import { NycbsPharmaOrderKeys } from "../../../enums/nycbsPharmaOrder";
import { RootState } from "../../../redux/store/store";

const InsuranceInfoBannerInInsuranceScreen = () => {
  const { data: singleCmmOrderData } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );

  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const checkIfAnyInsuranceDataMising = () => {
    if (
      singleCmmOrderData?.[NycbsPharmaOrderKeys.FormName] === "" ||
      singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientInsuranceState] === ""
    ) {
      return true;
    }
    if (singleCmmOrderData?.[NycbsPharmaOrderKeys.PlanName] !== "") {
      return false;
    }
    if (
      singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientRxBin] === "" ||
      singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientRxGroup] === "" ||
      singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientRxPcn] === ""
    ) {
      return true;
    }

    return false;
  };
  useEffect(() => {
    showInsuranceModal && openModal("insurance-modal");
    showModal && openModal("insurance-details-error-modal");
  }, [showInsuranceModal, showModal]);
  return (
    <div
      className={`info-banner__container mb-4 flex justify-between rounded bg-secondaryYellow-11 p-3 ${
        checkIfAnyInsuranceDataMising() ? "border border-red-500" : ""
      }`}
    >
      <div className="info-banner__heading">
        {/* Line 1: form_picked */}
        <div className="info-banner__heading-header text-body font-semibold">
          {singleCmmOrderData?.[NycbsPharmaOrderKeys.FormPicked] ||
            singleCmmOrderData?.[NycbsPharmaOrderKeys.FormName] ||
            "Please select a PA form"}
        </div>

        {/* Line 2: Type = insurance.form_picked_flag */}
        <div className="info-banner__heading-sub-header text-h12 font-regular">
          {`Type: ${singleCmmOrderData?.[NycbsPharmaOrderKeys.FormPickedFlag] ?? ""}`}
        </div>

        {/* Line 3: Conditional – PBM Name or RxBin/RxGroup/RxPcn + Member ID */}
        <div className="info-banner__heading-sub-header text-h12 font-regular">
          {singleCmmOrderData?.[
            NycbsPharmaOrderKeys.FormPickedFlag
          ]?.toLowerCase() === "pbm eligibility" ? (
            <>
              <span>
                {`PBM Name: ${singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientRxBin] ?? ""}`}
              </span>
              <span>
                &#160;<span>&#8226;</span>&#160;
                {`Member ID: ••••••`}
              </span>
            </>
          ) : (
            <>
              <span>
                {`Rx Bin: ${singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientRxBin] ?? ""}`}
              </span>
              <span>
                &#160;<span>&#8226;</span>&#160;
                {`Rx Group: ${singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientRxGroup] ?? ""}`}
              </span>
              <span>
                &#160;<span>&#8226;</span>&#160;
                {`Rx Pcn: ${singleCmmOrderData?.[NycbsPharmaOrderKeys.PatientRxPcn] ?? ""}`}
              </span>
              <span>
                &#160;<span>&#8226;</span>&#160;
                {`Member ID: ••••••`}
              </span>
            </>
          )}
        </div>

        <div className="info-banner__heading-sub-header mt-1 text-xs font-normal text-tertiaryRed-3">
          {singleCmmOrderData?.[NycbsPharmaOrderKeys.ErrorText] ?? ""}
        </div>
      </div>
      <div
        className="info-banner__action whitespace-nowrap text-[0.875rem] font-semibold leading-5 text-tertiaryRed-3 hover:cursor-pointer hover:font-bold"
        onClick={() => setShowModal(true)}
      >
        Report Inaccuracy
      </div>
      {showModal && (
        <InsuranceDetailsErrorModal
          onCloseModal={() => setShowModal(() => false)}
          onSuccessfullSave={() => {
            setShowModal(() => false);
            setShowInsuranceModal(() => true);
          }}
        />
      )}
      {showInsuranceModal && (
        <InsuranceModal
          isModalOpen={(value) => setShowInsuranceModal(value)}
          id={singleCmmOrderData?.[NycbsPharmaOrderKeys.Identifier] ?? ""}
          docId={singleCmmOrderData?.[NycbsPharmaOrderKeys.Identifier] ?? ""}
        />
      )}
    </div>
  );
};

export default InsuranceInfoBannerInInsuranceScreen;
