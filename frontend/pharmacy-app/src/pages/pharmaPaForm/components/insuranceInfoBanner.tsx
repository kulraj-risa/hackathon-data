import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { openModal } from "risa-oasis-ui_v2";

import InsuranceDetailsErrorModal from "../../../components/modals/insuranceDetailsErrorModal/insuranceDetailsErrorModal";
import InsuranceModal from "../../../components/modals/insuranceModal/insuranceModal";
import { usePharmaFormFields } from "../../../context/pharmaFormFieldsContext";
import { NycbsPharmaOrderKeys } from "../../../enums/nycbsPharmaOrder";
import { RootState } from "../../../redux/store/store";

interface InsuranceInfoBannerProps {
  docId: string;
}

const InsuranceInfoBanner = (props: InsuranceInfoBannerProps) => {
  const { data: singleCmmOrderData } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );
  const { formFieldsData } = usePharmaFormFields();

  const [showModal, setShowModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  useEffect(() => {
    showModal && openModal("insurance-details-error-modal");
    showInsuranceModal && openModal("insurance-modal");
  }, [showModal, showInsuranceModal]);

  const formPickedFlag =
    singleCmmOrderData?.[NycbsPharmaOrderKeys.FormPickedFlag] ?? "";
  const isPbmEligibility = formPickedFlag.toLowerCase() === "pbm eligibility";

  return (
    <div className="info-banner__container mb-4 flex justify-between rounded bg-secondaryYellow-11 p-3">
      <div className="info-banner__heading">
        {/* Line 1: form_picked */}
        <div className="info-banner__heading-header text-body font-semibold">
          {singleCmmOrderData?.[NycbsPharmaOrderKeys.FormPicked] ||
            "Please select a PA form"}
        </div>

        {/* Line 2: Type = insurance.form_picked_flag */}
        <div className="info-banner__heading-sub-header text-h12 font-regular">
          {`Type: ${formPickedFlag}`}
        </div>

        {/* Line 3: Conditional based on form_picked_flag */}
        <div className="info-banner__heading-sub-header text-h12 font-regular">
          {isPbmEligibility ? (
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
          docId={props.docId}
        />
      )}
    </div>
  );
};

export default InsuranceInfoBanner;
