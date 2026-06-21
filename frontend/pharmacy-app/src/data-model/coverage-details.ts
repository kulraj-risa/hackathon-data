import { DetailsCard } from "../components/detailsCard/detailsCard";

export interface CoverageDetailsData {
  primaryData?: DetailsCard[];
  coverageAmountRelatedData?: CoverageAmountData[];
  costSharingName?: string;
  sharedAmountData?: DetailsCard[];
  coverageLevel?: string;
  payerName?: string;
  coverageStatus?: string;
  coInsurance?: string;
  isActive?: "active" | "inactive" | "unknown";
}

export interface CoverageAmountsDataForEachType {
  inNetwork?: DetailsCardWithType[];
  outNetwork?: DetailsCardWithType[];
  noNetwork?: DetailsCardWithType[];
  notApplicable?: DetailsCardWithType[];
  unknown?: DetailsCardWithType[];
}

export interface CoverageAmountCostSharingData {
  sharedAmountData?: DetailsCard[] | null;
}

export interface CoverageAmountData {
  deductible?: CoverageAmountsDataForEachType;
  outOfPocket?: CoverageAmountsDataForEachType;

  // inNetworkCostSharing?: CoverageAmountCostSharingData;
  // outNetworkCostSharing?: CoverageAmountCostSharingData;
  // noNetworkCostSharing?: CoverageAmountCostSharingData;
  // notApplicableCostSharing?: CoverageAmountCostSharingData;
  // benefitName?: string;
  type?: string;
  benefitLevel?: string;
}

export interface DetailsCardWithType {
  type: string;
  amountType: string;
  totalAmount?: number;
  totalAmountUsed?: number;
  card: DetailsCard[];
}
