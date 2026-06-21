import { TableHeader } from "../../../components/custom-table/table";

export const calculateTotalColumnWidth = (headers: TableHeader[]): number => {
  return headers.reduce((sum, header) => sum + header.width, 0);
};
