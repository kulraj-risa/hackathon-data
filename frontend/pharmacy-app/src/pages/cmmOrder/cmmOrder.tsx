import { useNavigate } from "react-router-dom";
import RisaTouchlessPanel from "../pharmaStpFile/components/risaTouchlessPanel";
import CmmOrderTable from "./components/cmmOrderTable";

const CmmOrder = () => {
  const navigate = useNavigate();
  return (
    <div className="cmm_order__layout h-full w-full bg-primaryGray-16 p-2">
      <div className="cmm_order__inner-container flex h-full flex-col gap-2 overflow-hidden rounded bg-white p-4">
        <div className="cmm_order__heading text-h11 font-bold">PA Orders</div>
        <div className="cmm_order__table-container flex flex-1 flex-col gap-3 overflow-auto">
          <RisaTouchlessPanel />
          <CmmOrderTable />
        </div>
      </div>
    </div>
  );
};

export default CmmOrder;
