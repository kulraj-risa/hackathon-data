import NewDetailsCard from "../../../newDetailsCard/newDetailsCard";

interface PatientDetailsProps {
  data: {
    header: string;
    body: string;
  }[];
}
const PatientDetails = ({ data }: PatientDetailsProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="patient-details__container flex flex-wrap gap-y-4">
      {data.map((item) => (
        <div className="patient-details w-1/2" key={item.header}>
          <NewDetailsCard header={item.header} body={item.body} />
        </div>
      ))}
    </div>
  );
};

export default PatientDetails;
