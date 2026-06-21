# Pharma STP File Hooks Architecture

## Overview

This directory contains a collection of custom React hooks that work together to implement a data table with advanced features including:

- **Initial data fetching** with loading states
- **Dynamic search** capabilities
- **Infinite scroll pagination** (load more on scroll based on rowIndex)
- **State management** for loading, errors, and data
- **BigQuery integration** for backend data fetching
- **Performance optimizations** using refs to avoid unnecessary re-renders
- **Context integration** for state persistence across navigation

The hooks follow a **compositional pattern** where smaller, focused hooks are combined into larger orchestrator hooks, creating a clean separation of concerns and making the pattern highly reusable.

### Key Improvements

- ✅ **Ref-based optimization**: Uses refs for stable references to avoid re-renders
- ✅ **Row-based pagination**: Pagination triggers based on row index (endIndex)
- ✅ **No Redux dependencies**: Self-contained without external store requirements
- ✅ **Context persistence**: Saves pagination state for navigation restoration
- ✅ **Memoized callbacks**: Prevents unnecessary function recreations

---

## Architecture Diagram

```
Component (pharmaStpFileTable.tsx)
│
├─► usePharmaStpFileTableData()
│   └─► Manages: tableData, pharmaStpFileState
│
├─► useInitialDataFetchingForTable()
│   └─► Triggers: Initial data fetch on mount
│
├─► useFilterAndSearch()
│   ├─► useSearchTerm()
│   ├─► usePaginationReset()
│   ├─► useFilterPayload()
│   └─► useFilterAndSearchEffect()
│       └─► Triggers: Data refetch on search changes
│
└─► useNextPageDataFetch()
    ├─► useFilterPayload()
    └─► Triggers: Pagination (load next page on scroll)
```

---

## Hook Responsibilities

### 1. **usePharmaStpFileTableData** (State Container)

**Purpose:** Central state management for table data and API response state.

**What it does:**

- Creates and manages two primary state objects:
  - `tableData`: Array of processed table records
  - `pharmaStpFileState`: API response metadata (loading, error, pagination info)

**Returns:**

```typescript
{
  pharmaStpFileState: PharmaStpFileTableState,
  setPharmaStpFileState: Dispatch<SetStateAction<PharmaStpFileTableState>>,
  tableData: PharmaStpFileModel[],
  setTableData: Dispatch<SetStateAction<PharmaStpFileModel[]>>
}
```

**When to use:** This is the foundation hook - always use it first to create the state containers.

**File:** `usePharmaStpFileTableData.tsx`

---

### 2. **useInitialDataFetchingForTable** (Initial Load)

**Purpose:** Handles the first data fetch when component mounts.

**What it does:**

- Waits for date range parameters to be available
- Generates initial payload for page 1
- Fetches first page of data
- Sets `initialDataFetchingExecuted` flag to `true` when complete
- Updates table context with initial batch loaded (page 1)
- Uses refs to avoid re-renders when callbacks change

**Parameters:**

- `setPharmaStpFileState` - State setter for API response
- `setTableData` - State setter for table data
- `dateFromStart` - Start date for filtering (YYYYMMDD format)
- `dateFromEnd` - End date for filtering (YYYYMMDD format)
- `pageSize` - Number of items per page (default: 100)

**Returns:**

```typescript
{
  initialDataFetchingExecuted: boolean,
  setInitialDataFetchingExecuted: Dispatch<SetStateAction<boolean>>
}
```

**Why return the setter?** The setter is exposed to allow the component to manually trigger a data refresh (e.g., via a refresh button) by setting `initialDataFetchingExecuted` back to `false`.

**File:** `useInitialDataFetchingForTable.tsx`

---

### 3. **useFilterAndSearch** (Orchestrator Hook)

**Purpose:** Orchestrates all search-related functionality by composing smaller hooks.

**What it does:**

- Combines multiple sub-hooks into a single interface
- Manages the lifecycle of searching
- Provides a clean API for the component

**Sub-hooks used:**

1. `useSearchTerm()` - Search text state
2. `usePaginationReset()` - Pagination reset counter
3. `useFilterPayload()` - Generates API payload
4. `useFilterAndSearchEffect()` - Triggers API calls

**Parameters:**

- `initialDataFetchingExecuted` - Whether initial fetch is complete
- `setTableData` - State setter for table data
- `setPharmaStpFileState` - State setter for API response
- `dateFromStart` - Start date for filtering
- `dateFromEnd` - End date for filtering
- `pageSize` - Number of items per page

**Returns:**

```typescript
{
  filterPayload: PharmaStpFileFilterPayload | null,
  searchTerm: string,
  setSearchTerm: Dispatch<SetStateAction<string>>,
  paginationResetCount: number
}
```

**Why this pattern?** This orchestrator pattern keeps the component clean while maintaining flexibility to use individual hooks if needed.

**File:** `useFilterAndSearch.tsx`

---

### 4. **useSearchTerm** (Search State)

**Purpose:** Manages search text state.

**What it does:**

- Provides search term state
- Provides setter for updating search term

**Returns:**

```typescript
{
  searchTerm: string,
  setSearchTerm: Dispatch<SetStateAction<string>>
}
```

**File:** `useSearchTerm.tsx`

---

### 5. **usePaginationReset** (Reset Counter)

**Purpose:** Provides a counter to trigger pagination resets in the table component.

**What it does:**

- Maintains a simple counter state
- When incremented, signals the table to reset to page 1
- Used when search changes

**Returns:**

```typescript
{
  paginationResetCount: number,
  setPaginationResetCount: Dispatch<SetStateAction<number>>
}
```

**Usage pattern:**

```typescript
// When search changes, increment to reset pagination
setPaginationResetCount((prev) => prev + 1);
```

**File:** `usePaginationReset.tsx`

---

### 6. **useFilterPayload** (Payload Generator)

**Purpose:** Generates the API request payload based on current search term and date range.

**What it does:**

- Waits for `initialDataFetchingExecuted` to be `true`
- Combines search term, date range, and pagination params
- Generates BigQuery-compatible request payload
- Updates whenever search term changes

**Parameters:**

- `searchTerm` - Current search term
- `initialDataFetchingExecuted` - Whether initial fetch is complete
- `dateFromStart` - Start date for filtering
- `dateFromEnd` - End date for filtering
- `pageSize` - Number of items per page

**Returns:**

```typescript
{
  filterPayload: PharmaStpFileFilterPayload | null,
  setFilterPayload: Dispatch<SetStateAction<PharmaStpFileFilterPayload | null>>
}
```

**Key logic:**

```typescript
const payload: PharmaStpFileFilterPayload = {
  date_from_filename_start: dateFromStart,
  date_from_filename_end: dateFromEnd,
  filters: {},
  page: 1,
  page_size: pageSize,
};
```

**Why null initially?** Returns `null` before initial fetch to prevent premature API calls.

**File:** `useFilterPayload.tsx`

---

### 7. **useFilterAndSearchEffect** (Effect Hook)

**Purpose:** Triggers API calls when search term changes.

**What it does:**

- Watches `filterPayload` for changes
- Only runs after initial data fetch is complete
- Calls API to fetch fresh data
- Resets pagination when search changes
- Uses refs to avoid unnecessary re-renders
- Memoizes fetch callback for performance

**Parameters:**

- `filterPayload` - Current filter payload
- `initialDataFetchingExecuted` - Whether initial fetch is complete
- `setTableData` - State setter for table data
- `setPharmaStpFileState` - State setter for API response
- `setPaginationResetCount` - Function to reset pagination

**Dependencies:**

```typescript
useEffect(() => {
  if (filterPayload && initialDataFetchingExecuted) {
    makePostCallForPharmaStpFile(
      filterPayload,
      setPharmaStpFileState,
      setTableData,
      setPaginationResetCount,
    );
  }
}, [filterPayload, initialDataFetchingExecuted]);
```

**Why separate from useFilterPayload?** Separating payload generation from effect execution makes testing easier and logic clearer.

**File:** `useFilterAndSearchEffect.tsx`

---

### 8. **useNextPageDataFetch** (Infinite Scroll)

**Purpose:** Implements infinite scroll by fetching next page when user scrolls to the end.

**What it does:**

- Tracks `endIndex` (last visible row in table) - **based on rowIndex**
- Uses `useFilterPayload()` internally to generate the payload for pagination
- Calculates if more data should be fetched:
  - User scrolled to last row (endIndex === totalRowsLoaded - 1)
  - More pages are available (currentPage < totalPages)
  - Not currently loading (prevents duplicate requests)
- Generates a final payload with incremented page number
- Fetches next page automatically
- Appends new data to existing table data
- Updates table context with last batch fetched
- Uses refs to avoid unnecessary re-renders
- Memoizes fetch callback for performance

**Parameters:**

- `searchTerm` - Current search term
- `initialDataFetchingExecuted` - Whether initial fetch is complete
- `pharmaStpFileState` - Current API state with pagination info
- `setPharmaStpFileState` - State setter for API response
- `setTableData` - State setter for table data (appends)
- `dateFromStart` - Start date for filtering
- `dateFromEnd` - End date for filtering
- `pageSize` - Number of items per page

**Key logic:**

```typescript
const shouldFetchMoreData = useMemo(() => {
  const totalRows = pharmaStpFileState.data?.row_count ?? 0;
  const currentPage = pharmaStpFileState.data?.page ?? 1;
  const totalPages = pharmaStpFileState.data?.total_pages ?? 1;

  return (
    endIndex === totalRows - 1 &&
    currentPage < totalPages &&
    !pharmaStpFileState.loading &&
    !pharmaStpFileState.showInlineLoader
  );
}, [endIndex, pharmaStpFileState]);

const payloadFinalWithPage = useMemo(() => {
  return {
    ...payloadFinal,
    page: (pharmaStpFileState.data?.page ?? 0) + 1,
  };
}, [payloadFinal, pharmaStpFileState.data?.page]);
```

**Returns:**

```typescript
{
  endIndex: number,
  setEndIndex: Dispatch<SetStateAction<number>>
}
```

**Integration with table:**

```typescript
<CustomTable
  endIndexOfTable={setEndIndex} // Table calls this with last visible row
  // ... other props
/>
```

**File:** `useNextPageDataFetch.tsx`

---

## API Functions

### 1. **makePostCallForInitialDataFetch**

**Purpose:** Fetches initial data when component mounts.

**Parameters:**

- `payload` - Filter payload containing search params
- `setPharmaStpFileState` - State setter for API response
- `setTableData` - State setter for table data

**What it does:**

- Sets loading state to true
- Calls `fetchPharmaStpFileData` API
- Updates state with response data
- Handles errors appropriately

**File:** `../apis/makePostCallForInitialDataFetch.ts`

---

### 2. **makePostCallForPharmaStpFile**

**Purpose:** Fetches data when search term changes.

**Parameters:**

- `payload` - Filter payload containing search params
- `setPharmaStpFileState` - State setter for API response
- `setTableData` - State setter for table data
- `setPaginationResetCount` - Function to reset pagination

**What it does:**

- Sets loading state to true
- Calls `fetchPharmaStpFileData` API
- Replaces existing table data with new results
- Increments pagination reset count to reset table to page 1
- Handles errors appropriately

**File:** `../apis/makePostCallForPharmaStpFile.ts`

---

### 3. **makePostCallForNextPagesDataFetch**

**Purpose:** Fetches next page of data for infinite scroll.

**Parameters:**

- `payload` - Filter payload with incremented page number
- `setPharmaStpFileState` - State setter for API response
- `setTableData` - State setter for table data

**What it does:**

- Sets inline loader state to true
- Calls `fetchPharmaStpFileData` API
- **Appends** new data to existing table data (doesn't replace)
- Handles errors appropriately

**File:** `../apis/makePostCallForNextPagesDataFetch.ts`

---

## Data Flow

### Initial Load Flow

```
1. Component mounts
2. usePharmaStpFileTableData() creates state containers
3. useInitialDataFetchingForTable() triggers:
   ├─► Waits for dateFromStart and dateFromEnd
   ├─► Generates payload for page 1
   ├─► Fetches first page
   ├─► Sets tableData and pharmaStpFileState
   └─► Sets initialDataFetchingExecuted = true
4. Other hooks now activate (they wait for initialDataFetchingExecuted)
```

### Search Change Flow

```
1. User types in search box
2. setSearchTerm() called with new value
3. useFilterPayload() detects change:
   └─► Generates new API payload
4. useFilterAndSearchEffect() detects payload change:
   ├─► Calls API with new payload
   ├─► Resets tableData to new results
   └─► Increments paginationResetCount
5. Table resets to page 1 and displays new data
```

### Pagination Flow (Infinite Scroll)

```
1. User scrolls down in table
2. Table calls setEndIndex() with last visible row
3. useNextPageDataFetch() detects:
   ├─► endIndex === last row in current data
   ├─► More pages available
   └─► Not currently loading
4. Hook fetches next page:
   ├─► Uses current filterPayload
   ├─► Increments page number
   └─► Appends results to existing tableData
5. Table displays more rows without resetting scroll position
```

---

## Component Integration Example

```typescript
const PharmaStpFileTable = () => {
  const { startDate, endDate } = getCurrentMonthDateRange();
  const pageSize = 100;

  // 1. Create state containers
  const {
    pharmaStpFileState,
    setPharmaStpFileState,
    tableData,
    setTableData,
  } = usePharmaStpFileTableData();

  // 2. Handle initial data fetch
  const { initialDataFetchingExecuted, setInitialDataFetchingExecuted } =
    useInitialDataFetchingForTable(
      setPharmaStpFileState,
      setTableData,
      startDate,
      endDate,
      pageSize,
    );

  // 3. Handle searching
  const {
    filterPayload,
    paginationResetCount,
    setSearchTerm,
    searchTerm,
  } = useFilterAndSearch(
    initialDataFetchingExecuted,
    setTableData,
    setPharmaStpFileState,
    startDate,
    endDate,
    pageSize,
  );

  // 4. Handle pagination (load more on scroll)
  const { setEndIndex } = useNextPageDataFetch(
    searchTerm,
    initialDataFetchingExecuted,
    pharmaStpFileState,
    setPharmaStpFileState,
    setTableData,
    startDate,
    endDate,
    pageSize,
  );

  // 5. Render table with all the wired-up state and handlers
  return (
    <CustomTable
      tableData={tableData}
      totalCount={pharmaStpFileState?.data?.total_count ?? 0}
      endIndexOfTable={setEndIndex}
      searchingText={setSearchTerm}
      isFetching={pharmaStpFileState.loading}
      requestForPaginationReset={paginationResetCount}
      onRefreshButton={() => {
        setInitialDataFetchingExecuted(false);
      }}
      showRefreshButton={true}
      showInLineLoader={pharmaStpFileState.showInlineLoader}
      // ... other props
    />
  );
};
```

---

## Key Design Principles

### 1. **Single Responsibility**

Each hook has ONE clear purpose. This makes them easy to understand, test, and maintain.

### 2. **Composition Over Complexity**

Complex functionality is built by composing simple hooks rather than creating monolithic hooks.

### 3. **Explicit Dependencies**

All dependencies are passed as parameters, making data flow clear and testable.

### 4. **Separation of Concerns**

- **State** (usePharmaStpFileTableData)
- **Data fetching** (useInitialDataFetchingForTable, useNextPageDataFetch)
- **User input** (useSearchTerm)
- **Side effects** (useFilterAndSearchEffect)

### 5. **Orchestration Pattern**

`useFilterAndSearch` demonstrates the orchestrator pattern - combining multiple hooks into a cohesive API.

### 6. **Performance Optimization**

- `useMemo` for expensive computations
- Conditional effects to prevent unnecessary API calls
- Incremental data loading (pagination)
- Inline loaders for better UX during pagination

---

## Common Patterns

### Pattern 1: Conditional Effect Execution

```typescript
useEffect(() => {
  if (condition1 && condition2 && condition3) {
    // Only execute when all conditions are met
    performAction();
  }
}, [dependencies]);
```

### Pattern 2: Null Payload Guard

```typescript
const [payload, setPayload] = useState<PayloadType | null>(null);

useEffect(() => {
  if (!initialDataFetchingExecuted) {
    setPayload(null); // Prevent premature execution
  } else {
    setPayload(generatePayload());
  }
}, [dependencies]);
```

### Pattern 3: Pagination Reset Counter

```typescript
// Increment counter to signal reset
setPaginationResetCount((prev) => prev + 1);

// In table component
useEffect(() => {
  resetToPageOne();
}, [requestForPaginationReset]);
```

### Pattern 4: Data Appending for Infinite Scroll

```typescript
// Replace data (for search/filter changes)
setTableData(newData);

// Append data (for pagination)
setTableData((prevData) => [...prevData, ...newData]);
```

---

## API Endpoint

The hooks interact with the BigQuery API endpoint:

**Endpoint:** `API_ENDPOINTS.GET_PHARMA_STP_FILE_DATA`

**Request Payload:**

```typescript
{
  date_from_filename_start: string,  // YYYYMMDD format
  date_from_filename_end: string,    // YYYYMMDD format
  filters: {
    patient_mrn?: string[],
    [key: string]: any
  },
  page: number,
  page_size: number
}
```

**Response:**

```typescript
{
  success: boolean,
  message: string,
  rows: PharmaStpFileModel[],
  row_count: number,
  page: number,
  page_size: number,
  total_pages: number,
  total_count: number
}
```

---

## Troubleshooting

### Issue: Initial data not loading

**Check:**

- Is `dateFromStart` and `dateFromEnd` formatted correctly (YYYYMMDD)?
- Is `initialDataFetchingExecuted` set to `true`?
- Are there any errors in the API call?
- Check browser console for error messages

### Issue: Search not working

**Check:**

- Is `setSearchTerm` being called?
- Is `useFilterPayload` detecting the change?
- Is `useFilterAndSearchEffect` running?
- Check if API is receiving the correct payload

### Issue: Pagination not loading more data

**Check:**

- Is `setEndIndex` being called by the table?
- Is `shouldFetchMoreData` calculating correctly?
- Are there more pages available (`page < total_pages`)?
- Is the component already loading? (prevents duplicate requests)

### Issue: Data not refreshing on refresh button

**Check:**

- Is `setInitialDataFetchingExecuted(false)` being called?
- Does the effect in `useInitialDataFetchingForTable` re-run?

---

## Performance Considerations

1. **Memoization**: Use `useMemo` for expensive computations (pagination checks, payload generation)
2. **Lazy Loading**: Only fetch data when needed (initial load, search change, pagination)
3. **State Updates**: Batch state updates when possible to reduce re-renders
4. **Inline Loaders**: Show inline loaders during pagination to improve UX

---

## Future Enhancements

1. **Debounced Search**: Add debouncing to search term changes to reduce API calls
2. **Error Retry Logic**: Implement automatic retry for failed requests
3. **Cache Management**: Add caching layer for frequently accessed data
4. **Virtualization**: Implement virtual scrolling for very large datasets
5. **Export Functionality**: Add hooks for exporting table data
6. **Filter Integration**: Add support for complex filtering with Redux

---

## Related Files

- **API Implementation**: `../../../api/bigQuery/pharmaStpFileOrders.ts`
- **Table Component**: `../components/pharmaStpFileTable.tsx`
- **Table Data Generation**: `../table/pharmaStpFileTableData.ts`
- **Data Models**: `../../../data-model/nycbsPharmaOrder.ts`

---

## Conclusion

This hooks architecture provides a robust, scalable, and maintainable solution for complex table implementations with BigQuery backend. By following the compositional pattern and separating concerns, you can easily adapt this pattern to any similar use case in your application.

The key to success is understanding the data flow and the role each hook plays in the overall system. Start with the state container, add initial fetching, then layer on searching and pagination.

Happy coding! 🚀
