import { createContext, useContext, useState } from "react";

interface UserThemeContextType {
  showHeader: boolean;
  setShowHeader: (showHeader: boolean) => void;
  showSideNav: boolean;
  setShowSideNav: (showSideNav: boolean) => void;
  showWorklistNavigation: boolean;
  setShowWorklistNavigation: (showWorklistNavigation: boolean) => void;
}

const UserThemeContext = createContext<UserThemeContextType>({
  showHeader: true,
  setShowHeader: () => {},
  showSideNav: true,
  setShowSideNav: () => {},
  showWorklistNavigation: false,
  setShowWorklistNavigation: () => {},
});

export const UserThemeContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [showHeader, setShowHeader] = useState(true);
  const [showSideNav, setShowSideNav] = useState(true);
  const [showWorklistNavigation, setShowWorklistNavigation] = useState(true);
  return (
    <UserThemeContext.Provider
      value={{
        showHeader,
        setShowHeader,
        showSideNav,
        setShowSideNav,
        showWorklistNavigation,
        setShowWorklistNavigation,
      }}
    >
      {children}
    </UserThemeContext.Provider>
  );
};

export const useUserThemeContext = () => useContext(UserThemeContext);
