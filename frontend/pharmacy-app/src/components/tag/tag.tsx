interface TagProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
}

const Tag = ({
  text,
  backgroundColor = "bg-slate-300",
  textColor = "text-black",
}: TagProps) => {
  return (
    <div className="tag--container flex items-center justify-center">
      <div
        className={`tag-text rounded-[0.25rem] ${backgroundColor} ${textColor} px-[0.375rem] py-[0.125rem] text-x-tiny font-bold`}
      >
        {text}
      </div>
    </div>
  );
};

export default Tag;
