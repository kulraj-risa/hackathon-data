export function compareObjects(obj1, obj2) {
  const result = {};

  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]); // Combine keys from both objects

  allKeys.forEach((key) => {
    const oldValue = obj1[key] ?? "";
    const newValue = obj2[key] ?? "";

    if (oldValue !== newValue) {
      result[key] = {
        newValue,
        oldValue,
      };
    }
  });

  return result;
}
