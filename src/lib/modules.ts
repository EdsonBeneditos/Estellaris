// Fonte Única de Verdade: Módulos disponíveis no sistema
export const AVAILABLE_MODULES = [
  "dashboard",
  "leads",
  "futuros_leads",
  "clientes",
  "colaboradores",
  "estoque",
  "orcamentos",
  "notas_fiscais",
  "financeiro",
  "relatorios_leads",
  "relatorios_financeiro",
  "equipe",
  "configuracoes",
  "super_admin",
] as const;

export type ModuleKey = (typeof AVAILABLE_MODULES)[number];

// Configuração detalhada de cada módulo
export const MODULE_CONFIG: Record<
  ModuleKey,
  {
    label: string;
    description: string;
    route: string;
    category: "core" | "comercial" | "operacional" | "financeiro" | "analytics" | "admin";
  }
> = {
  dashboard: {
    label: "Dashboard",
    description: "Painel principal com resumos e indicadores",
    route: "/",
    category: "core",
  },
  leads: {
    label: "Leads",
    description: "Gestão de leads e prospecção de clientes",
    route: "/leads",
    category: "comercial",
  },
  futuros_leads: {
    label: "Futuros Leads",
    description: "Pipeline de leads para contato futuro",
    route: "/futuros-leads",
    category: "comercial",
  },
  clientes: {
    label: "Clientes",
    description: "Carteira de clientes e contratos",
    route: "/clientes",
    category: "comercial",
  },
  colaboradores: {
    label: "Colaboradores",
    description: "Gestão de funcionários e equipe",
    route: "/colaboradores",
    category: "operacional",
  },
  estoque: {
    label: "Estoque",
    description: "Controle de produtos e inventário",
    route: "/estoque",
    category: "operacional",
  },
  orcamentos: {
    label: "Orçamentos",
    description: "Propostas comerciais e vendas",
    route: "/orcamentos",
    category: "financeiro",
  },
  notas_fiscais: {
    label: "Notas Fiscais",
    description: "Emissão e gestão de NF-e",
    route: "/notas-fiscais",
    category: "financeiro",
  },
  financeiro: {
    label: "Financeiro",
    description: "Controle de caixa e movimentações",
    route: "/financeiro",
    category: "financeiro",
  },
  relatorios_leads: {
    label: "Relatórios Leads",
    description: "Analytics de vendas e conversões",
    route: "/relatorios",
    category: "analytics",
  },
  relatorios_financeiro: {
    label: "Relatório Financeiro",
    description: "Análises e projeções financeiras",
    route: "/relatorios",
    category: "analytics",
  },
  equipe: {
    label: "Equipe",
    description: "Gestão de membros da organização",
    route: "/equipe",
    category: "admin",
  },
  configuracoes: {
    label: "Configurações",
    description: "Ajustes da organização e sistema",
    route: "/configuracoes",
    category: "admin",
  },
  super_admin: {
    label: "Super Admin",
    description: "Gestão central de todas as organizações",
    route: "/super-admin",
    category: "admin",
  },
};

// Módulos padrão para novas organizações
export const DEFAULT_MODULES: ModuleKey[] = [
  "dashboard",
  "leads",
  "financeiro",
  "relatorios_leads",
  "clientes",
  "colaboradores",
  "configuracoes",
];

// Helper para verificar se um módulo está habilitado
export function isModuleEnabled(
  enabledModules: string[] | null | undefined,
  moduleKey: ModuleKey
): boolean {
  if (!enabledModules || enabledModules.length === 0) {
    // Se não há módulos definidos, usa os padrões
    return DEFAULT_MODULES.includes(moduleKey);
  }
  return enabledModules.includes(moduleKey);
}

// Helper para verificar se algum relatório está habilitado
export function hasAnyReport(enabledModules: string[] | null | undefined): {
  hasLeads: boolean;
  hasFinanceiro: boolean;
  hasBoth: boolean;
  hasAny: boolean;
} {
  const hasLeads = isModuleEnabled(enabledModules, "relatorios_leads");
  const hasFinanceiro = isModuleEnabled(enabledModules, "relatorios_financeiro");
  return {
    hasLeads,
    hasFinanceiro,
    hasBoth: hasLeads && hasFinanceiro,
    hasAny: hasLeads || hasFinanceiro,
  };
}
