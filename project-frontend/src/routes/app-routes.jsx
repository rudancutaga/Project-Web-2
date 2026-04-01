import { lazy, Suspense, useEffect } from "react";
import ClientLayout from "@/components/layout/client-layout";
import AdminLayout from "@/components/layout/admin-layout";
import ProtectedRoute from "@/routes/guards/protected-route";
import RoleRoute from "@/routes/guards/role-route";
import { useCurrentPath, useNavigate } from "@/routes/browser-router";
import { matchPath } from "@/utils/route-utils";

const HomePage = lazy(() => import("@/pages/home-page"));
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));
const UnauthorizedPage = lazy(() => import("@/pages/unauthorized-page"));
const LoginPage = lazy(() => import("@/features/auth/pages/login-page"));
const RegisterPage = lazy(() => import("@/features/auth/pages/register-page"));
const GamesPage = lazy(() => import("@/features/games/pages/games-page"));
const GameDetailPage = lazy(() => import("@/features/games/pages/game-detail-page"));
const ProfilePage = lazy(() => import("@/features/users/pages/profile-page"));
const FriendsPage = lazy(() => import("@/features/social/pages/friends-page"));
const MessagesPage = lazy(() => import("@/features/social/pages/messages-page"));
const RankingsPage = lazy(() => import("@/features/social/pages/rankings-page"));
const AdminPage = lazy(() => import("@/features/admin/pages/admin-page"));

const routeTable = [
  { path: "/", component: HomePage, layout: "client" },
  { path: "/login", component: LoginPage, layout: "client" },
  { path: "/register", component: RegisterPage, layout: "client" },
  { path: "/games", component: GamesPage, layout: "client" },
  {
    path: "/games/:id",
    component: GameDetailPage,
    layout: "client",
    getProps: ({ params }) => ({ gameId: params.id }),
  },
  { path: "/profile", component: ProfilePage, layout: "client", access: "protected" },
  { path: "/friends", component: FriendsPage, layout: "client", access: "protected" },
  { path: "/messages", component: MessagesPage, layout: "client", access: "protected" },
  { path: "/rankings", component: RankingsPage, layout: "client", access: "protected" },
  {
    path: "/admin/users",
    component: AdminPage,
    layout: "admin",
    access: "admin",
    getProps: () => ({ section: "users" }),
  },
  {
    path: "/admin/games",
    component: AdminPage,
    layout: "admin",
    access: "admin",
    getProps: () => ({ section: "games" }),
  },
  {
    path: "/admin/statistics",
    component: AdminPage,
    layout: "admin",
    access: "admin",
    getProps: () => ({ section: "statistics" }),
  },
  { path: "/unauthorized", component: UnauthorizedPage, layout: "client" },
];

function RouteFallback() {
  return (
    <section className="w-full rounded-[30px] border border-amber-200/60 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
      Dang tai route...
    </section>
  );
}

function RedirectRoute({ to }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);

  return <RouteFallback />;
}

function decorateRoute(access, content) {
  if (access === "admin") {
    return (
      <ProtectedRoute>
        <RoleRoute allow={["admin"]}>{content}</RoleRoute>
      </ProtectedRoute>
    );
  }

  if (access === "protected") {
    return <ProtectedRoute>{content}</ProtectedRoute>;
  }

  return content;
}

export function AppRoutes() {
  const pathname = useCurrentPath();
  const navigate = useNavigate();

  if (pathname === "/admin") {
    return (
      <AdminLayout>
        <RedirectRoute to="/admin/statistics" />
      </AdminLayout>
    );
  }

  const matchedRoute =
    routeTable.find((route) => matchPath(route.path, pathname) !== null) || {
      path: "*",
      component: NotFoundPage,
      layout: "client",
    };

  const params = matchPath(matchedRoute.path, pathname) || {};
  const Component = matchedRoute.component;
  const componentProps = {
    onNavigate: navigate,
    ...(matchedRoute.getProps?.({ params }) || {}),
  };

  const content = decorateRoute(
    matchedRoute.access,
    (
      <Suspense fallback={<RouteFallback />}>
        <Component {...componentProps} />
      </Suspense>
    ),
  );

  if (matchedRoute.layout === "admin") {
    return <AdminLayout>{content}</AdminLayout>;
  }

  return <ClientLayout>{content}</ClientLayout>;
}
