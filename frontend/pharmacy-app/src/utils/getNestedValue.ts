export const getNestedValue = (
  obj: any,
  path: string,
  defaultValue?: any,
): any => {
  const parts = path
    .replace(/\[(\w+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);

  const result = parts.reduce((acc, key) => acc?.[key], obj);

  return result === undefined || result === null || result === ""
    ? (defaultValue ?? "")
    : result;
};

export const setNestedValue = (
  obj: any,
  path: string,
  value: any,
  shouldOverwrite = false,
) => {
  const parts = path
    .replace(/\[(\w+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);

  const lastKey = parts.pop();

  // Create a deep copy of the object
  const newObj = JSON.parse(JSON.stringify(obj));

  // Navigate to the target object
  let current = newObj;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];

    if (!(key in current)) {
      // Check if the next key is a numeric string (array index)
      const isNextKeyArrayIndex = nextKey && /^\d+$/.test(nextKey);
      current[key] = isNextKeyArrayIndex ? [] : {};
    }
    current = current[key];
  }

  // Set the value
  if (lastKey) {
    if (Array.isArray(current)) {
      // If current is an array, set the value at the specified index
      const index = parseInt(lastKey);
      if (!isNaN(index)) {
        current[index] = value;
      }
    } else if (Array.isArray(current[lastKey])) {
      if (shouldOverwrite) {
        // Overwrite the entire array with new value
        current[lastKey] = Array.isArray(value) ? value : [value];
      } else {
        // Push the new value to the array
        current[lastKey].push(value);
      }
    } else {
      // If it's not an array, set the value directly
      current[lastKey] = value;
    }
  }

  return newObj;
};

export const deleteNestedValue = (obj: any, path: string) => {
  const parts = path
    .replace(/\[(\w+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  const lastKey = parts.pop();

  // Create a deep copy of the object
  const newObj = JSON.parse(JSON.stringify(obj));

  // Navigate to the target object
  let current = newObj;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];

    if (!(key in current)) {
      // Check if the next key is a numeric string (array index)
      const isNextKeyArrayIndex = nextKey && /^\d+$/.test(nextKey);
      current[key] = isNextKeyArrayIndex ? [] : {};
    }
    current = current[key];
  }

  // Delete the value
  if (lastKey) {
    if (Array.isArray(current)) {
      // If current is an array, splice the element at the specified index
      const index = parseInt(lastKey);
      if (!isNaN(index)) {
        current.splice(index, 1);
      }
    } else if (Array.isArray(current[lastKey])) {
      // If the target is an array, empty it
      current[lastKey] = [];
    } else {
      delete current[lastKey];
    }
  }

  return newObj;
};
