function deepSearch(obj: Object, searchTerm: string) {
  const term = searchTerm.toLowerCase();

  function searchInObject(obj) {
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        if (searchInObject(obj[key])) {
          return true;
        }
      } else if (
        typeof obj[key] === "string" &&
        obj[key].toLowerCase().includes(term)
      ) {
        return true;
      }
    }
    return false;
  }

  return searchInObject(obj);
}

export function searchForRecords(query: string, dataToPerformSearchOn) {
  const searchTerm = query.toLowerCase().trim();
  const results = dataToPerformSearchOn.filter((record) => {
    return deepSearch(record, searchTerm);
  });

  return results;
}
