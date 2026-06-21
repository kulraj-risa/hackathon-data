import { PushToSftpTableDataModel } from "../../../../data-model/pushToSftpDataModel";
import { PushToSftpModalTableColumnKeys } from "../../../../enums/tableColumnKeys";

/**
 * Toggles the checkbox selection state for a specific row in the Push to SFTP modal table.
 *
 * @param {string} id - The unique identifier of the row whose checkbox should be toggled
 * @param {React.Dispatch<React.SetStateAction<PushToSftpTableDataModel[]>>} setTableData - The state setter function for updating the table data
 *
 * @returns {void}
 *
 * @example
 * toggleCheckboxSelection("order-123", setTableData);
 */
export const toggleCheckboxSelection = (
  id: string,
  setTableData: React.Dispatch<
    React.SetStateAction<PushToSftpTableDataModel[]>
  >,
) => {
  setTableData((prevData) => {
    return prevData.map((item) => {
      if (item[PushToSftpModalTableColumnKeys.SELECT]?.id === id) {
        return {
          ...item,
          [PushToSftpModalTableColumnKeys.SELECT]: {
            ...item[PushToSftpModalTableColumnKeys.SELECT],
            isChecked: !item[PushToSftpModalTableColumnKeys.SELECT].isChecked,
          },
        };
      }
      return item;
    });
  });
};
