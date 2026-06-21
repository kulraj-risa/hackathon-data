import { logDataToConsole, logError } from "./customLogger";

export const getItemFromLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    logError(error as Error, "Error getting item from localStorage");
    return null;
  }
};

export const setItemInLocalStorage = (key, value) => {
  try {
    const stringifiedValue = JSON.stringify(value);
    localStorage.setItem(key, stringifiedValue);
  } catch (error) {
    logError(error as Error, "Error setting item in localStorage");
  }
};

export const removeItemFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logError(error as Error, "Error removing item from localStorage");
  }
};

export const clearAllFromLocalStorage = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    logError(error as Error, "Error clearing localStorage and sessionStorage");
  }
};

export const containsItemInLocalStorage = (key) => {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    logError(error as Error, "Error checking item in localStorage");
    return false;
  }
};

export const updateItemInLocalStorage = (key, newValue) => {
  try {
    const existingItem = getItemFromLocalStorage(key);
    if (existingItem) {
      const updatedItem = { ...existingItem, ...newValue };
      setItemInLocalStorage(key, updatedItem);
    } else {
      logDataToConsole(
        `Item with key "${key}" does not exist in localStorage.`,
      );
    }
  } catch (error) {
    logError(error as Error, "Error updating item in localStorage");
  }
};

export const getLocalStorageLength = () => {
  try {
    return localStorage.length;
  } catch (error) {
    logError(error as Error, "Error getting localStorage length");
    return 0;
  }
};

export const getAllItemsFromLocalStorage = () => {
  try {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        items[key] = getItemFromLocalStorage(key);
      }
    }
    return items;
  } catch (error) {
    logError(error as Error, "Error getting all items from localStorage");
    return {};
  }
};
