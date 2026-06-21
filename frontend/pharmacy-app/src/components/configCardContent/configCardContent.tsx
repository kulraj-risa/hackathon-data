interface ConfigCardContentProps {
  title: string;
  description: string;
  width?: string;
}

const ConfigCardContent = ({
  title,
  description,
  width,
}: ConfigCardContentProps) => {
  return (
    <div
      className={`flex cursor-pointer flex-col gap-1 p-1 ${width ?? "w-full"}`}
    >
      <div className="text-xs font-normal text-primaryGray-4" title={title}>
        {title}
      </div>
      <div className="truncate text-sm font-semibold" title={description}>
        {description}
      </div>
    </div>
  );
};

export default ConfigCardContent;
