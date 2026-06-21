import { useState } from "react";

export interface UsePaginationResetReturn {
  paginationResetCount: number;
  setPaginationResetCount: React.Dispatch<React.SetStateAction<number>>;
}

export const usePaginationReset = (): UsePaginationResetReturn => {
  const [paginationResetCount, setPaginationResetCount] = useState<number>(0);

  return {
    paginationResetCount,
    setPaginationResetCount,
  };
};
