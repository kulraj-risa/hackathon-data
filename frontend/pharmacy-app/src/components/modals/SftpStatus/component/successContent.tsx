import TickWithGreenBg from "../../../../svg/tickWithGreenBg";

interface SuccessContentProps {
  message: string;
  filename?: string;
  totalFilesPushed?: number;
}

const SuccessContent = (props: SuccessContentProps) => {
  const { message, filename, totalFilesPushed } = props;
  return (
    <div className="sftp-status__success-container flex w-full flex-col items-center gap-4 rounded-lg p-6">
      <div>
        <TickWithGreenBg width="60" height="60" />
      </div>
      <div className="text-center text-sm font-medium text-primaryGray-4">
        {message}
      </div>

      {totalFilesPushed !== undefined && (
        <div className="bg-secondaryGreen-11 rounded-lg px-4 py-2">
          <span className="text-xs font-semibold text-primaryGray-4">
            Total Files Pushed: {totalFilesPushed}
          </span>
        </div>
      )}

      {filename && (
        <div className="w-full rounded-lg bg-primaryGray-16 p-4">
          <div className="mb-2 text-xs font-semibold text-primaryGray-4">
            Files Pushed:
          </div>
          <div className="max-h-40 overflow-y-auto text-xs text-primaryGray-7">
            {filename.split(", ").map((file, index) => (
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

export default SuccessContent;
