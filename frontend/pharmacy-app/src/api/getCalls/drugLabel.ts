export const fetchDrugLabel = async (drugName: string): Promise<string> => {
  const requestOptions: RequestInit = {
    method: "GET",
    redirect: "follow" as RequestRedirect,
  };

  try {
    const response = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${drugName}"`,
      requestOptions,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    return result;
  } catch (error) {
    console.error("Error fetching drug label:", error);
    throw error;
  }
};
