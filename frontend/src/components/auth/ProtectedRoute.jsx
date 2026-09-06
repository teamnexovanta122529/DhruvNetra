import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AccessDenied from "./AccessDenied";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isStationAuthorized, selectedStation } = useAuth();

  // 1. Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, station: selectedStation }}
      />
    );
  }

  // 2. Check if user is authorized for the active station
  if (!isStationAuthorized(selectedStation)) {
    return <AccessDenied type="station" deniedStation={selectedStation} />;
  }

  // 3. Authorized -> render child routes / components
  return children ? children : <Outlet />;
}
