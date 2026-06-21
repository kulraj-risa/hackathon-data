import NewDetailsCard from "../../../newDetailsCard/newDetailsCard";
interface DrugDetailsProps {
  data: {
    header: string;
    body: string;
  }[];
}

const DrugDetails = ({ data }: DrugDetailsProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="drug-details__container w-full rounded-xl bg-[#F7F9FA] p-3">
      {data.map((item) => (
        <div className="drug-detail mb-4" key={item.header}>
          <NewDetailsCard header={item.header} body={item.body} />
        </div>
      ))}
    </div>
  );
};

export default DrugDetails;
