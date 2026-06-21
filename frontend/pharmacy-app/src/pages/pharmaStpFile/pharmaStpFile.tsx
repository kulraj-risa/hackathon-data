import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ModalId } from "../../enums/modalId";
import { useModalOpener } from "../../hooks/useModalOpener";
import { setOpenedModalId } from "../../redux/slice/modalSliceNew";
import { AppDispatch } from "../../redux/store/store";
import PharmaStpFileTable from "./components/pharmaStpFileTable";
import RisaTouchlessPanel from "./components/risaTouchlessPanel";

const PharmaStpFile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  useModalOpener();

  const handleOpenModal = () => {
    dispatch(
      setOpenedModalId({
        id: ModalId.SFTP_STATUS_MODAL,
        metaData: {},
      }),
    );
  };
  return (
    <div className="pharma_stp_file__layout h-full w-full bg-primaryGray-16 p-2">
      <div className="pharma_stp_file__inner-container flex h-full flex-col gap-2 overflow-hidden rounded bg-white p-4">
        <div className="pharma_stp_file__heading text-h11 font-bold">
          SFTP Orders
        </div>
        <div className="pharma_stp_file__table-container flex flex-1 flex-col gap-3 overflow-auto">
          <RisaTouchlessPanel />
          <PharmaStpFileTable />
        </div>
      </div>
    </div>
  );
};

export default PharmaStpFile;
