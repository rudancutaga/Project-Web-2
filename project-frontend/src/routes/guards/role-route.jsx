import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useNavigate } from "@/routes/browser-router";

export default function RoleRoute({ allow = [], children }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const canAccess = allow.includes(user?.role);

  useEffect(() => {
    if (!isLoading && !canAccess) {
      navigate("/unauthorized", { replace: true });
    }
  }, [canAccess, isLoading, navigate]);

  if (isLoading) {
    return <p className="text-sm text-slate-500 dark:text-slate-300">Dang kiem tra quyen truy cap...</p>;
  }

  if (!canAccess) {
    return <p className="text-sm text-slate-500 dark:text-slate-300">Dang chuyen den trang thong bao quyen...</p>;
  }

  return children;
}
