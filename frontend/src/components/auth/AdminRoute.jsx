import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AccessDenied from "./AccessDenied";

export default function AdminRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isAdmin, selectedStation } = useAuth();

  // 1. Check if authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, station: selectedStation }}
      />
    );
  }

  // 2. Check if user has ADMIN role
  if (!isAdmin) {
    return (
      <AccessDenied
        type="role"
        requiredRole="ADMIN"
        customReason="Administrator authorization (LEVEL-4 POLAR COMMAND) is strictly required to view this module."
      />
    );
  }

  // 3. Authorized admin
  return children;
}
