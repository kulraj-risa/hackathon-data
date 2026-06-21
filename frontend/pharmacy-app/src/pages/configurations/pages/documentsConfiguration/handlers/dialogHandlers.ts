import { useCrudHandlers } from "./crudHandlers";
import { useListHandlers } from "./listHandlers";

export const useDialogHandlers = (browserState: any) => {
  const crudHandlers = useCrudHandlers(browserState);
  const listHandlers = useListHandlers(browserState);

  return {
    ...crudHandlers,
    ...listHandlers,
  };
};
