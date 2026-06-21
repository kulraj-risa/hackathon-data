import { InfoGridData } from "../../data-model/infoGrid";

const InfoGrid = (props: { infoGridData: InfoGridData[] | null }) => {
  return (
    <div className="info-grid--container">
      {props?.infoGridData?.map((data, index) => (
        <>
          <div
            className="info-grid--singleDetail"
            key={`${index}_${data?.header}`}
          >
            <div className="info-grid--singleDetail--header">
              {data?.header}
            </div>
            <div className="info-grid--singleDetail--text">{data?.text}</div>
          </div>
        </>
      ))}
    </div>
  );
};

export default InfoGrid;
