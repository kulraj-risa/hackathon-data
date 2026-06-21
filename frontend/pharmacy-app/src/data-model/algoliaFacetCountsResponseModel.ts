export interface AlgoliaFacetCountsResponseModel {
  facet_results: {
    [key: string]: {
      [key: string]: number;
    };
  };
  facet_attribute: string;
  org_id: string;
  assigned_to?: string;
  success?: boolean;
  message?: string;
  total_count?: number;
}
