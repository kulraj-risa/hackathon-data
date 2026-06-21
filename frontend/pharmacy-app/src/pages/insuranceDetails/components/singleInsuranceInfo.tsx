import NewDetailsCard from "../../../components/newDetailsCard/newDetailsCard";
import Tag from "../../../components/tag/tag";

export interface SingleInsuranceInfoProps {
  insurerName: string;
  insurerTag: {
    tagText: string;
    tagColor: string;
    tagBgColor: string;
  };
  insuranceDetails: {
    header: string;
    body: string;
  }[];
  lastVerifiedOn?: string;
}

const SingleInsuranceInfo = (props: SingleInsuranceInfoProps) => {
  return (
    <div className="single-insurance--container">
      <div className="single-insurance--header mb-2 flex items-center gap-4">
        <div className="single-insurance--header-text text-h12 font-bold text-primaryGray-1">
          {props.insurerName}
        </div>
        <div className="single-insurance--header-tag">
          <Tag
            text={props.insurerTag.tagText}
            backgroundColor={props.insurerTag.tagBgColor}
            textColor={props.insurerTag.tagColor}
          />
        </div>
        {props.lastVerifiedOn && (
          <div className="single-insurance--last-verified-on ml-auto italic text-primaryGray-6">
            Last Verified On : {props.lastVerifiedOn}
          </div>
        )}
      </div>
      <div className="single-insurance--body mb-6 grid grid-cols-3 gap-4">
        {props.insuranceDetails.map((detail, index) => (
          <NewDetailsCard
            header={detail.header}
            body={detail.body}
            key={detail.header + "_" + detail.body + "_" + index}
          />
        ))}
      </div>
      <div className="w-full border-t-2 border-dashed border-primaryGray-15"></div>
    </div>
  );
};

export default SingleInsuranceInfo;
