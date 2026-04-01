import { BrowserRouter, useLocation, useNavigate as useReactRouterNavigate } from "react-router-dom";

export function BrowserRouterProvider({ children }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

export function useRouter() {
  const location = useLocation();
  const navigate = useReactRouterNavigate();

  return {
    location,
    navigate: (to, options = {}) => navigate(to, options),
  };
}

export function useNavigate() {
  return useRouter().navigate;
}

export function useCurrentPath() {
  return useRouter().location.pathname;
}

export function useLocationState() {
  return useRouter().location.state;
}
