import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useCurrentPath, useNavigate } from "@/routes/browser-router";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = useCurrentPath();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: { redirectTo: pathname },
      });
    }
  }, [isAuthenticated, isLoading, navigate, pathname]);

  if (isLoading) {
    return <p className="text-sm text-slate-500 dark:text-slate-300">Dang kiem tra dang nhap...</p>;
  }

  if (!isAuthenticated) {
    return <p className="text-sm text-slate-500 dark:text-slate-300">Dang chuyen den trang dang nhap...</p>;
  }

  return children;
}
