import "@/App.css";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import { AppRoutes } from "@/routes/app-routes";
import { BrowserRouterProvider } from "@/routes/browser-router";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouterProvider>
          <AppRoutes />
        </BrowserRouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
