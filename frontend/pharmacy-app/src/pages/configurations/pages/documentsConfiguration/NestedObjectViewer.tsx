import React, { useEffect, useRef, useState } from "react";
import { Button } from "risa-oasis-ui_v2";
import { AddIcon } from "../../../../svg/add-icon";
import { BackArrow } from "../../../../svg/back-arrow";
import { CrossIcon } from "../../../../svg/cross-icon";
import { Delete } from "../../../../svg/delete";
import { NextArrow } from "../../../../svg/next-arrow";

interface NestedObjectViewerProps {
  data: any;
  excludeFields?: string[];
  onEdit?: () => void;
  showEditButton?: boolean;
  onAddToList?: (path: string[], currentValue: any[]) => void;
  onAddKeywordDocument?: (path: string[], currentValue: any[]) => void;
  onAddCategory?: () => void;
  onDeleteItem?: (
    itemPath: string[],
    itemName: string,
    itemIndex?: number,
    itemType?: "list-item" | "keyword-document" | "category",
  ) => void;
  parentPath?: string[];
  shouldScroll?: boolean;
  selectedLevel3Id?: string;
}

const NestedObjectViewer: React.FC<NestedObjectViewerProps> = ({
  data,
  excludeFields = [],
  onEdit,
  showEditButton = false,
  onAddToList,
  onAddKeywordDocument,
  onAddCategory,
  onDeleteItem,
  parentPath = [],
  shouldScroll = false,
  selectedLevel3Id,
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  const formatKey = (key: string): string => {
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
      );
  };

  // Helper function to sort object entries with priority order
  const sortObjectEntries = (entries: [string, any][]): [string, any][] => {
    return entries.sort(([a], [b]) => {
      // Define the desired order for specific keys
      const priorityOrder = [
        "drugs",
        "keyword_documents",
        "category_documents",
      ];
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);

      // If both keys are in priority list, sort by their priority order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only 'a' is in priority list, 'a' comes first
      if (aIndex !== -1) {
        return -1;
      }

      // If only 'b' is in priority list, 'b' comes first
      if (bIndex !== -1) {
        return 1;
      }

      // If neither is in priority list, sort alphabetically
      return a.localeCompare(b);
    });
  };
  const validKeys =
    data && typeof data === "object"
      ? Object.keys(data).filter((key) => !excludeFields.includes(key))
      : [];

  const totalCards = validKeys.length;
  // Auto-scroll effect
  useEffect(() => {
    if (shouldScroll && viewerRef.current) {
      viewerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [shouldScroll]);

  useEffect(() => {
    if (currentCardIndex >= validKeys.length) {
      setCurrentCardIndex(0);
    }
  }, [validKeys.length, currentCardIndex]);

  if (!data || typeof data !== "object") {
    return <div className="no-data">No data available</div>;
  }

  // Helper function to format keys for display

  // Get all valid keys (excluding excluded fields)
  // const validKeys = Object.keys(data).filter(key => !excludeFields.includes(key));
  // const totalCards = validKeys.length;
  // Handle navigation
  const handleNext = () => {
    setCurrentCardIndex((prev) => (prev + 1) % totalCards);
  };

  const handlePrevious = () => {
    setCurrentCardIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  // Function to render different types of values
  const renderValue = (
    key: string,
    value: any,
    currentPath: string[] = [],
  ): JSX.Element => {
    if (excludeFields.includes(key)) {
      return <></>;
    }

    // Build the path for this value
    const valuePath =
      currentPath.length > 0 ? currentPath : [...parentPath, key];

    // Special handling for keyword_documents
    if (
      key === "keyword_documents" &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return (
        <div className="keyword-documents-container">
          {Object.entries(value).map(([docKey, docValue]: [string, any]) => {
            if (typeof docValue !== "object" || docValue === null) return null;

            const typeValue = docValue.type || "Unknown Type";
            const { type, ...contentData } = docValue;

            return (
              <div key={docKey} className="keyword-document-item">
                <h4 className="keyword-document-heading">{typeValue}</h4>
                <div className="keyword-document-content">
                  {Object.keys(contentData).length > 0 ? (
                    <dl className="property-list">
                      {Object.entries(contentData).map(
                        ([fieldKey, fieldValue]) => (
                          <div key={fieldKey} className="property-item">
                            <dt>{formatKey(fieldKey)}</dt>
                            <dd>
                              {renderValue(fieldKey, fieldValue, [
                                ...valuePath,
                                docKey,
                              ])}
                            </dd>
                          </div>
                        ),
                      )}
                    </dl>
                  ) : (
                    <div className="no-additional-data">No additional data</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (value === null || value === undefined) {
      return <span className="text-muted">None</span>;
    } else if (typeof value === "boolean") {
      return (
        <span className={`badge ${value ? "badge-success" : "badge-danger"}`}>
          {value ? "Yes" : "No"}
        </span>
      );
    } else if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        try {
          const date = new Date(value);
          return <span className="date-value">{date.toLocaleString()}</span>;
        } catch (e) {
          return <span className="string-value">{value}</span>;
        }
      }
      return <span className="string-value">{value}</span>;
    } else if (typeof value === "number") {
      return <span className="number-value">{value}</span>;
    } else if (Array.isArray(value)) {
      // Special handling for keyword_documents array
      if (key === "keyword_documents") {
        return (
          <div className="keyword-documents-array-container">
            {value.length === 0 ? (
              <div className="empty-array">No keyword documents</div>
            ) : (
              <>
                {value.map((item, index) => {
                  if (typeof item !== "object" || item === null) return null;

                  const typeValue = item.type || "Unknown Type";
                  const { type, ...otherFields } = item;

                  return (
                    <div key={index} className="keyword-document-item">
                      <div className="keyword-document-header">
                        <h4 className="keyword-document-heading">
                          {typeValue}
                        </h4>
                        {onDeleteItem && (
                          <button
                            className="delete-item-btn"
                            onClick={() => {
                              onDeleteItem(
                                valuePath,
                                typeValue,
                                index,
                                "keyword-document",
                              );
                            }}
                            title="Delete this keyword document"
                          >
                            <Delete />
                          </button>
                        )}
                      </div>
                      <div className="keyword-document-content">
                        {Object.keys(otherFields).length > 0 ? (
                          <dl className="property-list">
                            {Object.entries(otherFields).map(
                              ([fieldKey, fieldValue]) => (
                                <div key={fieldKey} className="property-item">
                                  <dt>{formatKey(fieldKey)}</dt>
                                  <dd>
                                    {Array.isArray(fieldValue) ? (
                                      <div className="array-container">
                                        <div className="array-items-wrapper">
                                          {fieldValue.length === 0 ? (
                                            <div className="empty-array">
                                              No items
                                            </div>
                                          ) : (
                                            fieldValue.map(
                                              (arrItem, arrIndex) => (
                                                <div
                                                  key={arrIndex}
                                                  className="array-item"
                                                >
                                                  <div className="array-item-content">
                                                    {typeof arrItem === "object"
                                                      ? JSON.stringify(arrItem)
                                                      : String(arrItem)}
                                                  </div>
                                                  {onDeleteItem && (
                                                    <button
                                                      className="delete-item-btn"
                                                      onClick={() => {
                                                        const itemName =
                                                          typeof arrItem ===
                                                          "object"
                                                            ? JSON.stringify(
                                                                arrItem,
                                                              )
                                                            : String(arrItem);
                                                        onDeleteItem(
                                                          [
                                                            ...valuePath,
                                                            index.toString(),
                                                            fieldKey,
                                                          ],
                                                          itemName,
                                                          arrIndex,
                                                          "list-item",
                                                        );
                                                      }}
                                                      title="Delete this item"
                                                    >
                                                      <CrossIcon
                                                        width="16"
                                                        height="16"
                                                        fillColor="#e74c3c"
                                                      />
                                                    </button>
                                                  )}
                                                </div>
                                              ),
                                            )
                                          )}
                                          {onAddToList && (
                                            <Button
                                              buttonType="secondary"
                                              size="small"
                                              onClick={() => {
                                                // Build the correct path from valuePath
                                                const fullPath = [
                                                  ...valuePath,
                                                  index.toString(),
                                                  fieldKey,
                                                ];
                                                onAddToList(
                                                  fullPath,
                                                  fieldValue,
                                                );
                                              }}
                                              disabled={false}
                                            >
                                              <AddIcon
                                                width="16"
                                                height="16"
                                                color="#0056d6"
                                              />
                                              &nbsp;Add New{" "}
                                              {formatKey(fieldKey).slice(0, -1)}
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      renderValue(fieldKey, fieldValue, [
                                        ...valuePath,
                                        index.toString(),
                                      ])
                                    )}
                                  </dd>
                                </div>
                              ),
                            )}
                          </dl>
                        ) : (
                          <div className="no-additional-data">
                            No additional data
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {/* {onAddToList && key!=="keyword_document" && (
                            <Button
                                buttonType="primary"
                                size="small"
                                onClick={() => {
                                    onAddToList(valuePath, value);
                                }}
                                disabled={false}
                            >
                                
                                Add New {formatKey(key).slice(0, -1)}
                            </Button>
                        )} */}
            {onAddKeywordDocument && (
              <Button
                buttonType="secondary"
                size="small"
                onClick={() => {
                  onAddKeywordDocument(valuePath, value);
                }}
                disabled={false}
              >
                <AddIcon width="16" height="16" color="#0056d6" />
                &nbsp;Add New Keyword Document
              </Button>
            )}
          </div>
        );
      }

      // Default array rendering
      return (
        <div className="array-container horizontal-array">
          <div className="array-items-wrapper">
            {value.length === 0 ? (
              <div className="empty-array">No items</div>
            ) : (
              <>
                {value.map((item, index) => (
                  <div key={index} className="array-item">
                    <div className="array-item-content">
                      {typeof item === "object" ? (
                        <NestedObjectViewer
                          data={item}
                          excludeFields={excludeFields}
                          onAddToList={onAddToList}
                          onAddKeywordDocument={onAddKeywordDocument}
                          onDeleteItem={onDeleteItem}
                          parentPath={[...valuePath, index.toString()]}
                        />
                      ) : (
                        String(item)
                      )}
                    </div>
                    {onDeleteItem && (
                      <button
                        className="delete-item-btn"
                        onClick={() => {
                          const itemName =
                            typeof item === "object"
                              ? item.type || item.name || `Item ${index + 1}`
                              : String(item);
                          onDeleteItem(valuePath, itemName, index, "list-item");
                        }}
                        title="Delete this item"
                      >
                        <CrossIcon width="16" height="16" fillColor="#e74c3c" />
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
            {onAddToList && (
              <Button
                buttonType="secondary"
                size="small"
                onClick={() => {
                  onAddToList(valuePath, value);
                }}
                disabled={false}
              >
                <AddIcon width="16" height="16" color="#0056d6" />
                &nbsp;Add New {formatKey(key).slice(0, -1)}
              </Button>
            )}
          </div>
        </div>
      );
    } else if (typeof value === "object" && value instanceof Date) {
      return <span className="date-value">{value.toLocaleString()}</span>;
    } else if (typeof value === "object") {
      return (
        <dl className="property-list">
          {sortObjectEntries(Object.entries(value)).map(
            ([nestedKey, nestedValue]) => {
              if (excludeFields.includes(nestedKey)) return null;
              return (
                <div key={nestedKey} className="property-item">
                  <dt>{formatKey(nestedKey)}</dt>
                  <dd>
                    {renderValue(nestedKey, nestedValue, [
                      ...valuePath,
                      nestedKey,
                    ])}
                  </dd>
                </div>
              );
            },
          )}
        </dl>
      );
    } else {
      return <span>{String(value)}</span>;
    }
  };

  // If this is a nested object (has parentPath), render in detailed format
  if (parentPath.length > 0) {
    return (
      <dl className="property-list">
        {sortObjectEntries(Object.entries(data)).map(([key, value]) => {
          if (excludeFields.includes(key)) return null;
          return (
            <div key={key} className="property-item">
              <dt>{formatKey(key)}</dt>
              <dd>{renderValue(key, value, [key])}</dd>
            </div>
          );
        })}
      </dl>
    );
  }

  // For the outermost level, show card navigation
  return (
    <div className="nested-object-viewer" ref={viewerRef}>
      {showEditButton && onEdit && (
        <div className="viewer-actions">
          <Button
            buttonType="secondary"
            onClick={onEdit}
            size="small"
            disabled={false}
          >
            Edit Details
          </Button>
        </div>
      )}

      {totalCards > 0 && (
        <div className="card-navigation">
          <div className="card-counter">
            {currentCardIndex + 1} of {totalCards}
          </div>
          <div className="navigation-buttons">
            <Button
              buttonType="tertiary"
              onClick={handlePrevious}
              disabled={totalCards <= 1}
              size="small"
            >
              <BackArrow color="#9CA3AF" />
            </Button>
            <Button
              buttonType="tertiary"
              onClick={handleNext}
              disabled={totalCards <= 1}
              size="small"
            >
              <NextArrow color="#9CA3AF" />
            </Button>
          </div>
        </div>
      )}

      {totalCards > 0 && validKeys[currentCardIndex] && (
        <div className="nested-object-card">
          <div className="card-header">
            <h3>{formatKey(validKeys[currentCardIndex])}</h3>
            {onDeleteItem && parentPath.length === 0 && (
              <button
                className="delete-category-btn"
                onClick={() => {
                  const categoryName = validKeys[currentCardIndex];
                  onDeleteItem(
                    [categoryName],
                    formatKey(categoryName),
                    undefined,
                    "category",
                  );
                }}
                title="Delete this category"
              >
                <Delete />
              </button>
            )}
          </div>
          <div className="card-content">
            {renderValue(
              validKeys[currentCardIndex],
              data[validKeys[currentCardIndex]],
              [],
            )}
          </div>
        </div>
      )}

      {/* Add New Category button - only show at top level and when onAddCategory is provided */}
      {parentPath.length === 0 && onAddCategory && (
        <div className="add-category-section">
          <Button
            buttonType="tertiary"
            size="medium"
            onClick={() => onAddCategory()}
            disabled={false}
          >
            <AddIcon width="16" height="16" color="#0056d6" />
            &nbsp;Add New Category
          </Button>
        </div>
      )}
    </div>
  );
};

export default NestedObjectViewer;
