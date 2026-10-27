import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./app/AppProviders";
import { ThemeProvider } from "./components/Themes/ThemeProvider";
import { router } from "./app/router";

export default function App() {
  return (
    <AppProviders>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AppProviders>
  );
}
