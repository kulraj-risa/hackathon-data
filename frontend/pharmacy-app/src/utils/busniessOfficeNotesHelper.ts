import { BOOptionModel } from "../data-model/boOptionModel";

export function getLowestPriorityOption(
  options: BOOptionModel[],
  values: string[],
): BOOptionModel | undefined {
  const filtered = options.filter(
    (opt) => values.includes(opt.value) && opt.priority !== undefined,
  );

  if (filtered.length === 0) {
    return options.find((opt) => opt.value === "Required"); // no match
  }

  return filtered.reduce((lowest, current) =>
    current.priority! < lowest.priority! ? current : lowest,
  );
}
