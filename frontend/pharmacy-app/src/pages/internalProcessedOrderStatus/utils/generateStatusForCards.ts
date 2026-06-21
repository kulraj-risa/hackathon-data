import { CmmProcessedOrderModel } from "../../../data-model/cmmProcessedOrderModel";

export const generateStatusForCurrentDate = (
  data: CmmProcessedOrderModel[],
) => {
  // Data is already filtered for current date at the database level
  // No need to re-filter here
  const totalRuns = data.length;
  const successfulRuns = data.filter(
    (item) => item.status === "success",
  ).length;

  const failedRuns = data.filter((item) => item.status !== "success").length;

  return { totalRuns, successfulRuns, failedRuns };
};

export const generateStatusForLast3Days = (data: CmmProcessedOrderModel[]) => {
  // Data is already filtered for last 3 days at the database level
  // No need to re-filter here
  const totalRuns = data.length;
  const successfulRuns = data.filter(
    (item) => item.status === "success",
  ).length;

  const failedRuns = data.filter((item) => item.status !== "success").length;

  return { totalRuns, successfulRuns, failedRuns };
};

export const generateStatusForLastDay = (data: CmmProcessedOrderModel[]) => {
  // Data is already filtered for last day at the database level
  // No need to re-filter here
  const totalRuns = data.length;
  const successfulRuns = data.filter(
    (item) => item.status === "success",
  ).length;

  const failedRuns = data.filter((item) => item.status !== "success").length;

  return { totalRuns, successfulRuns, failedRuns };
};
