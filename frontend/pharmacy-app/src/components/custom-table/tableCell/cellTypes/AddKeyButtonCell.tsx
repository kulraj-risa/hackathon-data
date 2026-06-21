import { getSftpBadgeStyles } from "../../../../pages/pharmaStpFile/table/utils/getSftpBadgeStyles";

interface AddKeyButtonCellProps {
  value: any;
  isDisabled?: boolean;
  title?: string;
  isSftp?: boolean;
  sftpStatus?: string | null;
  [key: string]: any;
}

const getSftpStyles = (sftpStatus: string | null | undefined) => {
  return getSftpBadgeStyles(sftpStatus);
};

const getButtonClassName = (isDisabled: boolean, isSftp: boolean) => {
  const baseClasses =
    "flex w-fit items-center justify-center rounded-md px-2 py-1 text-tiny";

  if (isSftp) {
    // For SFTP, only use base classes - colors will be applied via inline styles
    return baseClasses;
  }

  if (isDisabled) {
    return `${baseClasses} cursor-not-allowed bg-black text-white opacity-50`;
  }

  return `${baseClasses} cursor-pointer bg-black text-white hover:bg-gray-800`;
};

export const AddKeyButtonCell = (props: AddKeyButtonCellProps) => {
  const { isDisabled = false, title, isSftp = false, sftpStatus } = props;

  const handleClick = (e: React.MouseEvent) => {
    if (isSftp) {
      // Completely prevent any interaction for SFTP badges
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      return false;
    }
    if (isDisabled) {
      e.stopPropagation();
      return;
    }
    // Click will be handled by parent table cell onClick
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSftp) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      return false;
    }
  };

  // For SFTP badge mode
  if (isSftp) {
    const { bgColor, textColor, title: sftpTitle } = getSftpStyles(sftpStatus);

    return (
      <div
        className={getButtonClassName(isDisabled, isSftp)}
        style={{
          backgroundColor: bgColor,
          color: textColor,
          cursor: "default",
          border: "none",
          outline: "none",
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleMouseDown}
        onPointerDown={handleMouseDown}
      >
        {sftpTitle}
      </div>
    );
  }

  // Regular button mode
  return (
    <div
      className={getButtonClassName(isDisabled, isSftp)}
      onClick={handleClick}
    >
      {title}
    </div>
  );
};

export default AddKeyButtonCell;
