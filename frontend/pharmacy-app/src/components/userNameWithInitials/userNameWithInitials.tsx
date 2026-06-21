import { useMemo } from "react";

interface UserNameWithInitialsProps {
  height?: string;
  name: string;
  imageUrl?: string;
}

const getRandomColor = () => {
  const bgColors = ["#006400", "#003366", "#800080", "#B35C00", "#3E1B41"];
  const randomIndex = Math.floor(Math.random() * bgColors.length);
  return bgColors[randomIndex];
};

const UserNameWithInitials: React.FC<UserNameWithInitialsProps> = ({
  height = "1.25rem",
  name,
  imageUrl,
}) => {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const randomColor = useMemo(() => getRandomColor(), [name]);

  return (
    <div className="user-name-container flex max-w-full items-center gap-1">
      <div
        className={`user-name-initials leading-1 flex aspect-square items-center justify-center rounded-full p-[0.1rem] text-overline font-normal text-white`}
        style={{ height, width: height, backgroundColor: randomColor }}
      >
        {!imageUrl ? initials : null}
      </div>

      {imageUrl && (
        <div className="user-name-image">
          <img
            src={imageUrl}
            alt={name}
            className="user-image aspect-square rounded-full"
            style={{ height, width: height }}
          />
        </div>
      )}

      <div className="user-name-fullname truncate text-small font-normal text-primaryGray-4">
        {name}
      </div>
    </div>
  );
};

export default UserNameWithInitials;
