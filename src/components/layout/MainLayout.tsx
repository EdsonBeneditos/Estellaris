import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { HelpButton } from "./HelpButton";
import { VisitasAlertPopover } from "./VisitasAlertPopover";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors duration-200 hover:scale-110" />
            <div className="flex items-center gap-2">
              <VisitasAlertPopover />
              <HelpButton />
            </div>
          </header>
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden bg-background w-full">
            <div className="w-full max-w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
