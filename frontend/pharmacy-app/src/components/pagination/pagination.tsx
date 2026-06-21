import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { BackArrow } from "../../svg/back-arrow";
import { NextArrow } from "../../svg/next-arrow";

import { useTablesContext } from "../../context/tablesContextProvider";

export default function Pagination(props) {
  const {
    getTableDataFromContext: getTableData,
    setTableDataForContext: setTableData,
  } = useTablesContext();
  const [PagesArray, setPagesArray] = useState<any[]>([]);
  const [ActivePageArrayIndex, setActivePageArrayIndex] = useState<number>(0);
  const [ActivePage, setActivePage] = useState<number>(1);
  const pages = Math.ceil(props.itemsCount / props.itemsPerPage);

  useEffect(() => {
    if (props?.tableName) {
      setActivePage(getTableData(props?.tableName)["currentStartPage"] || 1);
      setActivePageArrayIndex(
        getTableData(props?.tableName)["currentActiveArrayIndex"] || 0,
      );
    }
  }, [props?.tableName]);

  useEffect(() => {
    if (props.itemsCount > 0) {
      const results = generatePagesArray(pages, props.pagesPerView);

      const startIndex = (ActivePage - 1) * props.itemsPerPage;

      const endIndex =
        ActivePage * props.itemsPerPage - 1 > props.itemsCount
          ? props.itemsCount - 1
          : ActivePage * props.itemsPerPage - 1;

      setTableData(props?.tableName, {
        currentStartPage: ActivePage,
        startIndex,
        endIndex,
      });

      setPagesArray(results);
      if (props.sendStartAndEndIndex) {
        props.sendStartAndEndIndex(startIndex, endIndex);
      }
    }
  }, [props.itemsCount, ActivePage]);

  useEffect(() => {
    if (props.triggerHandlePageChange > 0) {
      setActivePage(1);
      setActivePageArrayIndex(0);
      setTableData(props.tableName, {
        currentStartPage: 1,
        currentActiveArrayIndex: 0,
      });
    }
  }, [props.triggerHandlePageChange]);

  const generatePagesArray = (pages: number, size: number) => {
    if (pages < size) {
      return [Array.from({ length: pages }, (_, index) => index + 1)];
    } else {
      const sequenceArray = Array.from(
        { length: pages },
        (_, index) => index + 1,
      );
      const result: any[] = [];
      for (let i = 0; i < sequenceArray.length; i += size) {
        const currentArray = sequenceArray.slice(i, i + size);
        result.push(currentArray);
      }

      return result;
    }
  };

  const handlePageChange = (page: number, type?: string) => {
    switch (type) {
      case "previous":
        if (ActivePage % props.pagesPerView === 1 && ActivePageArrayIndex > 0) {
          setActivePageArrayIndex(ActivePageArrayIndex - 1);
          setActivePage(page - 1);
          setTableData(props.tableName, {
            currentActiveArrayIndex: ActivePageArrayIndex - 1,
          });
        } else {
          handlePageChange(page - 1);
        }
        break;
      case "next":
        if (
          ActivePage % props.pagesPerView === 0 &&
          ActivePageArrayIndex < PagesArray.length - 1
        ) {
          setActivePageArrayIndex(ActivePageArrayIndex + 1);
          setActivePage(page + 1);
          setTableData(props.tableName, {
            currentActiveArrayIndex: ActivePageArrayIndex + 1,
          });
        } else {
          handlePageChange(page + 1);
        }
        break;
      default:
        setActivePage(page);
        break;
    }
  };

  return (
    <>
      <div className="pagination-table-container">
        <div
          className={
            ActivePage === 1 || props.isPreviousButtonDisabled
              ? "previous disabled"
              : "previous"
          }
          onClick={() => handlePageChange(ActivePage, "previous")}
        >
          <BackArrow />
          Previous
        </div>
        {PagesArray[ActivePageArrayIndex]?.map((page, index) => (
          <>
            <div
              className={ActivePage === page ? "pages active" : "pages"}
              onClick={() => handlePageChange(page)}
              key={index}
            >
              {page}
            </div>
          </>
        ))}

        <div
          className={ActivePage === pages ? "next disabled" : "next"}
          onClick={() => handlePageChange(ActivePage, "next")}
        >
          Next
          <NextArrow />
        </div>
      </div>
    </>
  );
}

Pagination.propTypes = {
  itemsCount: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  pagesPerView: PropTypes.number.isRequired,
  sendStartAndEndIndex: PropTypes.func.isRequired,
  triggerHandlePageChange: PropTypes.number,
  tableName: PropTypes.string.isRequired,
  isPreviousButtonDisabled: PropTypes.bool,
};
