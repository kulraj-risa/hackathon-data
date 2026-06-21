interface NewTabElementsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

const NewTabElements = (props: NewTabElementsProps) => {
  return (
    <>
      {props.tabs.map((tab) => (
        <div
          key={tab.id}
          className={`status-log--tab cursor-pointer px-4 py-2 text-h12 font-normal transition-colors ${props.className} ${
            props.activeTab === tab.id
              ? "border-b-2 border-tertiaryBlue-4 bg-tertiaryBlue-13 font-bold text-tertiaryBlue-4"
              : "text-primaryGray-6 hover:border-transparent"
          }`}
          onClick={() => props.onTabChange(tab.id)}
        >
          {tab.label}
        </div>
      ))}
    </>
  );
};

export default NewTabElements;
