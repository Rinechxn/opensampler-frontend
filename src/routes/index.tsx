import { createBrowserRouter } from "react-router-dom";
import App from "@/webview/App";
import SettingsPage from "@/pages/settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  }
]);
