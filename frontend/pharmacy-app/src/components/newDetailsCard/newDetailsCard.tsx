interface NewDetailsCardProps {
  header: string;
  body: string;
  className?: string;
}
const NewDetailsCard = ({ header, body, className }: NewDetailsCardProps) => {
  return (
    <div className={`new-details-card__container w-full ${className}`}>
      <div className="new-details-card__header mb-1 text-tiny font-normal text-primaryGray-3">
        {header}
      </div>
      <div className="new-details-card__body whitespace-pre-line text-tiny font-bold text-primaryGray-1">
        {body}
      </div>
    </div>
  );
};

export default NewDetailsCard;
