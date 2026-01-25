import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { AccessControlGuard } from "@/components/layout/AccessControlGuard";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import FuturosLeads from "@/pages/FuturosLeads";
import Clientes from "@/pages/Clientes";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";
import Estoque from "@/pages/Estoque";
import Orcamentos from "@/pages/Orcamentos";
import NotasFiscais from "@/pages/NotasFiscais";
import Financeiro from "@/pages/Financeiro";
import Equipe from "@/pages/Equipe";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AccessControlGuard>
                        <MainLayout>
                          <Dashboard />
                        </MainLayout>
                      </AccessControlGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leads"
                  element={
                    <ProtectedRoute>
                      <AccessControlGuard>
                        <MainLayout>
                          <Leads />
                        </MainLayout>
                      </AccessControlGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/futuros-leads"
                  element={
                    <ProtectedRoute>
                      <AccessControlGuard>
                        <MainLayout>
                          <FuturosLeads />
                        </MainLayout>
                      </AccessControlGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clientes"
                  element={
                    <ProtectedRoute>
                      <AccessControlGuard>
                        <MainLayout>
                          <Clientes />
                        </MainLayout>
                      </AccessControlGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/relatorios"
                  element={
                    <ProtectedRoute>
                      <AccessControlGuard>
                        <MainLayout>
                          <Relatorios />
                        </MainLayout>
                      </AccessControlGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estoque"
                  element={
                    <ProtectedRoute>
                      <AccessControlGuard>
                        <MainLayout>
                          <Estoque />
                        </MainLayout>
                      </AccessControlGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orcamentos"
                  element={
                    <ProtectedRoute>
                      <AccessControlGuard>
                        <MainLayout>
                          <Orcamentos />
                        </MainLayout>
                      </AccessControlGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notas-fiscais"
                  element={
                    <ProtectedRoute>
                      <AccessControlGuard>
                        <NotasFiscais />
                      </AccessControlGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/financeiro"
                  element={
                    <ProtectedRoute>
                      <AccessControlGuard>
                        <MainLayout>
                          <Financeiro />
                        </MainLayout>
                      </AccessControlGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/equipe"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AccessControlGuard>
                          <MainLayout>
                            <Equipe />
                          </MainLayout>
                        </AccessControlGuard>
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/configuracoes"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AccessControlGuard>
                          <MainLayout>
                            <Configuracoes />
                          </MainLayout>
                        </AccessControlGuard>
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
