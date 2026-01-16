import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthContext } from "@/contexts/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { loading } = useAuthContext();
  const { canViewSettings } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canViewSettings) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
