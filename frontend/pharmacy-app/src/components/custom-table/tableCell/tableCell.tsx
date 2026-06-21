import PropTypes from "prop-types";
import { TableCellType } from "../table";

// Import individual cell components
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openModal, ToggleSwitch } from "risa-oasis-ui_v2";
import { DocWriteBackStatus } from "../../../enums/evBvWriteBackStatus";
import { ModalId } from "../../../enums/modalId";
import { setOpenedModalId } from "../../../redux/slice/modalSliceNew";
import { AppDispatch, RootState } from "../../../redux/store/store";
import TableDocIcon from "../../../svg/table-doc-icon";
import ToolTipUsingPortal from "../../toolTipUsingPortal/toolTipUsingPortal";
import BadgeCell from "./cellTypes/BadgeCell";
import BadgeWithICell from "./cellTypes/BadgeWithICell";
import ButtonLinkCell from "./cellTypes/ButtonLinkCell";
import CheckboxCell from "./cellTypes/CheckboxCell";
import ClickableBadgeCell from "./cellTypes/ClickableBadgeCell";
import ClickableBadgeForFinalStatusCell from "./cellTypes/ClickableBadgeForFinalStatusCell";
import ClickableBadgeModalCell from "./cellTypes/ClickableBadgeModalCell";
import ClickableTextWithDisabledStatusCell from "./cellTypes/ClickableTextWithDisabledStatusCell";
import ColoredTextCell from "./cellTypes/ColoredTextCell";
import CopyDataCell from "./cellTypes/CopyDataCell";
import DateCell from "./cellTypes/DateCell";
import DeleteIconCell from "./cellTypes/DeleteIconCell";
import DocListCell from "./cellTypes/DocListCell";
import DocNameWithIcon from "./cellTypes/DocNameWithIcon";
import DocWithUploadIconCell from "./cellTypes/DocWithUploadIconCell";
import DownloadButtonCell from "./cellTypes/DownloadButtonCell";
import EditableTextCellComponent from "./cellTypes/EditableTextCell";
import ErrorModalCell from "./cellTypes/ErrorModalCell";
import IconCell from "./cellTypes/IconCell";
import InfoCell from "./cellTypes/InfoCell";
import MultilineCell from "./cellTypes/MultilineCell";
import NycbsStatusCell from "./cellTypes/NycbsStatusCell";
import RpaStatusCell from "./cellTypes/RpaStatusCell";
import { RpaStatusForExternalCell } from "./cellTypes/RpaStatusTwoCell";
import SelectableBadgeCell from "./cellTypes/SelectableBadgeCell";

import { MedicalPaOrdersAuthStatus } from "../../../enums/medicalPaOrdersAuthStatus";

import AddKeyButtonCell from "./cellTypes/AddKeyButtonCell";
import ButtonWithThreeDotsCell from "./cellTypes/ButtonWithThreeDotsCell";
import CmmInputViewIconCell from "./cellTypes/CmmInputViewIconCell";
import ExpandableRowIconCell from "./cellTypes/ExpandableRowIconCell";
import RecordClosedByCell from "./cellTypes/RecordClosedByCell";
import StringBadgeCell from "./cellTypes/StringBadgeCell";
import StringCell from "./cellTypes/StringCell";
import StringWithCustomToolTipCell from "./cellTypes/StringWithCustomToolTipCell";
import StringWithIconCell from "./cellTypes/StringWithIconCell";
import TagWithIconCell from "./cellTypes/tagWithIconCell";
import TextCellWithInput from "./cellTypes/TextCellWithInput";
import ThinkingButtonCell from "./cellTypes/ThinkingButtonCell";
import ViewIconCell from "./cellTypes/ViewIconCell";
import ViewIconForScreenshotOrApiResponse from "./cellTypes/ViewIconForScreenshotOrApiResponse";

// TODO: File should be 150 lines or less, divide into smaller files

export const TableCell = (props) => {
  // const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const { openedModalId } = useSelector(
    (state: RootState) => state.modalSliceNew,
  );

  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const commentModalRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const { data: authStatusOptions } = useSelector(
    (state: RootState) => state.authStatusOptions,
  );

  const handleReviewClick = () => {
    if (props.onReviewClick) {
      props.onReviewClick();
    }
  };

  const handleDownloadButtonClick = (id: string) => {
    if (props.onDownloadButtonClick) {
      props.onDownloadButtonClick(id);
    }
  };

  const handleAssignToClick = (data: { id: string; assignee: string }) => {
    if (props.handleAssignToClick) {
      props.handleAssignToClick(data);
    }
  };

  const handleStatusClick = (data: { id: string; status: number }) => {
    if (props.handleStatusClick) {
      props.handleStatusClick(data);
    }
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  useEffect(() => {
    if (openedModalId === ModalId.NAR_LETTER_MODAL) {
      openModal(ModalId.NAR_LETTER_MODAL);
    }
  }, [openedModalId]);

  useEffect(() => {
    if (openedModalId === ModalId.DOC_VIEWER_MODAL_WITH_TITLE) {
      openModal(ModalId.DOC_VIEWER_MODAL_WITH_TITLE);
    }
  }, [openedModalId]);

  switch (props.type) {
    case TableCellType.STRING:
      return <StringCell value={props.value} />;
    case TableCellType.BUTTON_LINK:
      return (
        <ButtonLinkCell
          value={props.value}
          onReviewClick={props.onReviewClick}
        />
      );
    case TableCellType.DATE:
      return <DateCell value={props.value} />;
    case TableCellType.DOWNLOAD_BUTTON:
      return (
        <DownloadButtonCell
          value={props.value}
          onDownloadButtonClick={props.handleDownloadButtonClick}
        />
      );
    case TableCellType.BUTTON_WITH_THREE_DOTS:
      return (
        <ButtonWithThreeDotsCell
          value={props.value}
          onThreeDotsOptionClick={props.onButtonWithThreeDotsOptionClick}
        />
      );

    case TableCellType.CMM_INPUT_VIEW_ICON:
      return <CmmInputViewIconCell value={props.value} />;
    case TableCellType.INFO:
      return <InfoCell value={props.value} />;
    case TableCellType.MULTILINE:
      return (
        <MultilineCell
          value={props.value}
          shouldShowLeftBorder={props.value?.shouldShowLeftBorder}
          leftBorderColor={props.value?.leftBorderColor}
        />
      );

    case TableCellType.TOGGLE_SWITCH:
      return (
        <ToggleSwitch
          id={props.value.id}
          defaultChecked={props.value.defaultChecked}
          onChangeEmit={props.onChangeEmit}
        />
      );
    case TableCellType.STRING_WITH_ICON:
      return <StringWithIconCell value={props.value} />;
    case TableCellType.COLORED_TEXT:
      return <ColoredTextCell value={props.value} />;
    case TableCellType.BADGE:
      return <BadgeCell value={props.value} />;
    case TableCellType.BADGE_WITH_I:
      return <BadgeWithICell value={props.value} />;
    case TableCellType.CLICKABLE_BADGE:
      return (
        <ClickableBadgeCell value={props.value} onComplete={props.onComplete} />
      );
    case TableCellType.CLICKABLE_BADGE_FOR_FINAL_STATUS:
      return (
        <ClickableBadgeForFinalStatusCell
          value={props.value}
          onComplete={props.onComplete}
        />
      );
    case TableCellType.CLICKABLE_BADGE_MODAL:
      return (
        <ClickableBadgeModalCell
          value={props.value}
          rowIndex={props.rowIndex}
          header={props.header}
          onTableRowUpdate={props.onTableRowUpdate}
          onValueChange={props.onValueChange}
        />
      );
    case TableCellType.ICON:
      return <IconCell value={props.value} />;
    case TableCellType.STRING_BADGE:
      return <StringBadgeCell value={props.value} />;
    case TableCellType.ERROR_MODAL:
      return <ErrorModalCell value={props.value} />;
    case TableCellType.COPY_DATA:
      return <CopyDataCell value={props.value} />;

    case TableCellType.NYCBS_STATUS:
      return (
        <NycbsStatusCell
          value={props.value}
          handleStatusClick={props.handleStatusClick}
        />
      );
    case TableCellType.DELETE_ICON:
      return (
        <DeleteIconCell
          value={props.value}
          handleDeleteIconClick={props.handleDeleteIconClick}
        />
      );
    case TableCellType.CLICKABLE_TEXT_WITH_DISABLED_STATUS:
      return (
        <ClickableTextWithDisabledStatusCell
          value={props.value}
          handleClickableTextWithDisabledStatusClick={
            props.handleClickableTextWithDisabledStatusClick
          }
        />
      );
    case TableCellType.CHECKBOX:
      return (
        <CheckboxCell
          value={props.value}
          toggleCheckboxSelection={props.toggleCheckboxSelection}
        />
      );
    case TableCellType.EDITABLE_TEXT:
      return (
        <EditableTextCellComponent
          value={props.value}
          onValueChange={props.onValueChange ?? (() => {})}
          header={props.header}
          rowIndex={props.rowIndex}
          onTableRowUpdate={props.onTableRowUpdate}
        />
      );
    case TableCellType.SELECTABLE_BADGE:
      return (
        <SelectableBadgeCell
          value={props.value}
          rowIndex={props.rowIndex}
          header={props.header}
          onValueChange={props.onValueChange}
          onTableRowUpdate={props.onTableRowUpdate}
        />
      );
    case TableCellType.THINKING_BUTTON:
      return <ThinkingButtonCell value={props.value} />;
    case TableCellType.RPA_STATUS:
      return (
        <RpaStatusCell
          value={props.value}
          propagateEventOnClickInRpaStatusCell={
            props.onPropagateEventOnClickInRpaStatusCell
          }
        />
      );
    case TableCellType.VIEW_ICON:
      return <ViewIconCell value={props.value} />;
    case TableCellType.DOC_NAME_WITH_ICON:
      return <DocNameWithIcon docDetails={props.value} />;

    case TableCellType.TAG_WITH_ICON:
      return <TagWithIconCell value={props.value} />;

    case TableCellType.RPA_STATUS_FOR_EXTERNAL:
      return <RpaStatusForExternalCell value={props.value} />;

    case TableCellType.DOC_LIST:
      return <DocListCell docList={props.value} />;
    case TableCellType.STRING_WITH_CUSTOM_TOOLTIP:
      return <StringWithCustomToolTipCell value={props.value} />;
    case TableCellType.VIEW_ICON_FOR_SCREENSHOT_OR_API_RESPONSE:
      return <ViewIconForScreenshotOrApiResponse value={props.value} />;

    case TableCellType.ADD_KEY_BUTTON:
      return (
        <AddKeyButtonCell
          value={props.value?.value}
          isDisabled={props.value?.isDisabled}
          title={props.value?.title}
          isSftp={props.value?.isSftp}
          sftpStatus={props.value?.sftpStatus}
        />
      );

    case TableCellType.TEXT_CELL_WITH_INPUT:
      return (
        <TextCellWithInput
          value={props.value}
          onValueChangeOfTextField={props.onValueChangeOfTextField}
        />
      );

    case TableCellType.RPA_STATUS_TWO:
      const shiftMasterQueueStatusForWhichModalShouldOpen = [
        MedicalPaOrdersAuthStatus.Pending,
        MedicalPaOrdersAuthStatus.AuthRequired,
        MedicalPaOrdersAuthStatus.Query,
        MedicalPaOrdersAuthStatus.Hold,
      ];

      const getColorBasedOnStatusTwo = () => {
        switch (props.value.status) {
          case DocWriteBackStatus.SUCCESS:
            return "#00775E";
          case DocWriteBackStatus.ERROR:
            return "#CC0300";
          case DocWriteBackStatus.IN_PROGRESS:
            return "#0056D6";
          case DocWriteBackStatus.QUEUED:
            return "#4b00cc";
          default:
            return "#999999";
        }
      };

      const getStatusTextTwo = () => {
        switch (props.value.status) {
          case DocWriteBackStatus.SUCCESS:
            return "Doc(s) are added";
          case DocWriteBackStatus.ERROR:
            return "Failed to add doc(s)";
          case DocWriteBackStatus.IN_PROGRESS:
            return "Doc(s) are being added";
          case DocWriteBackStatus.QUEUED:
            return "Doc(s) are queued";
          default:
            return "Doc(s) not initiated";
        }
      };

      const shouldPropagateEventOrOpenModal = () => {
        if (props.value.shouldPropagate === true) {
          props.onPropagateEventOnClickInRpaStatusTwoCell?.(props.value.id);
        } else {
          dispatch(
            setOpenedModalId({
              id: ModalId.IMAGE_VIEWER_MODAL,
              metaData: { filePaths: props.value.files },
            }),
          );
        }
      };

      return (
        <div
          className="table-cell-rpa-status ml-auto h-fit w-fit"
          onMouseEnter={() => setIsCommentModalOpen(true)}
          onMouseLeave={() => setIsCommentModalOpen(false)}
          ref={commentModalRef}
          onClick={() => {
            if (
              shiftMasterQueueStatusForWhichModalShouldOpen.includes(
                props.value.masterAuthStatus,
              ) &&
              props.value.status === DocWriteBackStatus.NOT_INITIATED
            ) {
              shouldPropagateEventOrOpenModal();
            } else if (props.value.status === DocWriteBackStatus.SUCCESS) {
              shouldPropagateEventOrOpenModal();
            }
          }}
        >
          <TableDocIcon
            color={getColorBasedOnStatusTwo()}
            height={"24px"}
            width={"24px"}
          />

          <ToolTipUsingPortal
            children={getStatusTextTwo()}
            placement={"left"}
            showTooltip={isCommentModalOpen}
            parentRef={commentModalRef}
          />
        </div>
      );

    case TableCellType.DOC_WITH_UPLOAD_ICON:
      return <DocWithUploadIconCell value={props.value} />;

    case TableCellType.EXPANDABLE_ROW_ICON:
      return (
        <ExpandableRowIconCell
          value={props.value}
          onRowExpandChange={props.onRowExpandChange}
          // key={props.value.id + "_" + props.value.isExpanded}
        />
      );

    case TableCellType.RECORD_CLOSED_BY:
      return <RecordClosedByCell value={props.value} />;

    default:
      return <></>;
  }
};

TableCell.propTypes = {
  type: PropTypes.string.isRequired,
  id: PropTypes.string,
  value: PropTypes.any.isRequired,
  header: PropTypes.string,
  rowIndex: PropTypes.number,
  globalRowIndex: PropTypes.number,
  rowData: PropTypes.any,
  onReviewClick: PropTypes.func,
  handleAssignToClick: PropTypes.func,
  handleStatusClick: PropTypes.func,
  handleDeleteIconClick: PropTypes.func,
  handleClickableTextWithDisabledStatusClick: PropTypes.func,
  onComplete: PropTypes.func,
  toggleCheckboxSelection: PropTypes.func,
  handleDownloadButtonClick: PropTypes.func,
  onTableRowUpdate: PropTypes.func,
  onValueChange: PropTypes.func,
  onPropagateEventOnClickInRpaStatusCell: PropTypes.func,
  onPropagateEventOnClickInRpaStatusTwoCell: PropTypes.func,
  onSideModalClose: PropTypes.func,
  onChangeEmit: PropTypes.func,
  onValueChangeOfTextField: PropTypes.func,
  onRowExpandChange: PropTypes.func,
  onButtonWithThreeDotsOptionClick: PropTypes.func,
};
