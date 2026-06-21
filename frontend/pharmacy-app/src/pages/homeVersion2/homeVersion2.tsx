import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { useUserThemeContext } from "../../context/userThemeContext";
import HeaderVersion2 from "../headerVersion2/headerVersion2";

const HomeVersion2 = () => {
  const { showHeader, setShowHeader } = useUserThemeContext();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Show when mouse is near left edge
  useEffect(() => {
    if (position.x <= 15) {
      setShowHeader(true);
    }
  }, [position]);

  useEffect(() => {
    setShowHeader(true);
  }, []);

  // Track mouse position globally
  useEffect(() => {
    const updateMousePosition = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <div className="home-version-2 main-container flex h-full w-full">
      <div
        className={`home-version-2__header overflow-hidden transition-all duration-300 ease-in-out ${showHeader ? "w-[4.5rem] px-[0.62rem] opacity-100" : "w-0 opacity-0"} py-2`}
        style={{
          background:
            "linear-gradient(180deg, #090E17 0%, #090E16 3.88%, #010101 100%)",
        }}
        onMouseLeave={() => {}}
        onMouseEnter={() => {}}
      >
        <HeaderVersion2 />
      </div>

      <div
        className={`home-version-2__outlet transition-all duration-300 ease-in-out ${showHeader ? "w-[calc(100%-4.5rem)]" : "w-full"} overflow-hidden`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default HomeVersion2;
