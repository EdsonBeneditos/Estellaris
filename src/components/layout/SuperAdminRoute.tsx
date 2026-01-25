import { Navigate } from "react-router-dom";
import { useIsSuperAdmin } from "@/hooks/useSuperAdmin";
import { useAuthContext } from "@/contexts/AuthContext";

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { loading } = useAuthContext();
  const { data: isSuperAdmin, isLoading } = useIsSuperAdmin();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
