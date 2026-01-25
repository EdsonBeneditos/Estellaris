import { useEffect } from "react";
import { useAccessControl } from "@/hooks/useAccessControl";
import AccessBlocked from "@/pages/AccessBlocked";
import { Skeleton } from "@/components/ui/skeleton";

interface AccessControlGuardProps {
  children: React.ReactNode;
}

export function AccessControlGuard({ children }: AccessControlGuardProps) {
  const { isLoading, allowed, settings } = useAccessControl();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <AccessBlocked settings={settings} />;
  }

  return <>{children}</>;
}
