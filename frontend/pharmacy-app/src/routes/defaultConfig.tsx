import DefaultPage from "../components/defaultPage/defaultPage";

export const DefaultRouteConfig = [
  { index: true, element: <DefaultPage /> },
  {
    path: "*",
    element: <DefaultPage />,
  },
];
