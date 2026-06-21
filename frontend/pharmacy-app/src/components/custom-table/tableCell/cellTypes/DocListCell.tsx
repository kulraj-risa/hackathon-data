import { DocumentsForOrder } from "../../../../data-model/documentModalWithSideBav";
import FileIcon from "../../../../svg/fileIcon";

interface DocListCellProps {
  docList?: DocumentsForOrder[];
}
const DocListCell = (props: DocListCellProps) => {
  return (
    <div>
      <FileIcon strokeColor="#0056D6" width={16} height={18.5} />
    </div>
  );
};

export default DocListCell;
