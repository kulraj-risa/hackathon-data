import WarningIcon from "../../../../svg/warningIcon";

interface ErrorContentProps {
  message: string;
  filesWithMissingCmmId?: string[];
  filesValidated?: number;
  totalRowsChecked?: number;
  rowsMissingCmmId?: number;
}

const ErrorContent = (props: ErrorContentProps) => {
  const {
    message,
    filesWithMissingCmmId,
    filesValidated,
    totalRowsChecked,
    rowsMissingCmmId,
  } = props;
  return (
    <div className="sftp-status__error-container flex w-full flex-col items-center gap-4 rounded-lg p-2">
      <div>
        <WarningIcon height="60" width="60" />
      </div>
      <div className="text-center text-sm font-medium text-primaryGray-4">
        {message}
      </div>

      {/* Validation Stats */}
      {(filesValidated !== undefined ||
        totalRowsChecked !== undefined ||
        rowsMissingCmmId !== undefined) && (
        <div className="mt-2 w-full rounded-lg bg-tertiaryRed-11 p-3">
          <div className="text-xs text-primaryGray-5">
            {filesValidated !== undefined && (
              <div className="mb-1">
                <span className="font-semibold">Files Validated: </span>
                {filesValidated}
              </div>
            )}
            {totalRowsChecked !== undefined && (
              <div className="mb-1">
                <span className="font-semibold">Total Rows Checked: </span>
                {totalRowsChecked}
              </div>
            )}
            {rowsMissingCmmId !== undefined && (
              <div className="mb-1">
                <span className="font-semibold">Rows Missing CMM ID: </span>
                {rowsMissingCmmId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Files with Missing CMM IDs */}
      {filesWithMissingCmmId && filesWithMissingCmmId.length > 0 && (
        <div className="mt-2 w-full rounded-lg bg-primaryGray-16 p-3">
          <div className="mb-2 text-xs font-semibold text-primaryGray-4">
            Files with Missing CoverMyMeds ID:
          </div>
          <div className="max-h-40 overflow-y-auto text-xs text-primaryGray-7">
            {filesWithMissingCmmId.map((file, index) => (
              <div key={index} className="mb-1 break-all">
                • {file}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorContent;
