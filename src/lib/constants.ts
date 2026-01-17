// Vendedores oficiais da Acqua Nobilis Ambiental
export const VENDEDORES = [
  "Maria Victoria",
  "Francielli",
  "Mikaela Deodato",
  "Cleriston",
  "Roberto Roberti",
] as const;

// Tipos de serviço ambiental
export const TIPOS_SERVICO = [
  "Outorga de Água",
  "Licenciamento Ambiental",
  "PGRS (Resíduos Sólidos)",
  "Tratamento de Efluentes",
  "Projetos de Reuso",
  "Consultoria Ambiental",
] as const;

// Origens dos leads
export const ORIGENS = [
  "WhatsApp",
  "Site",
  "Indicação",
  "LinkedIn",
  "Google",
  "Evento",
  "Telefone",
  "Outro",
] as const;

// Meios de contato
export const MEIOS_CONTATO = [
  "WhatsApp",
  "Email",
  "Telefone",
  "Reunião",
  "Visita",
] as const;

// Tipos de atendimento
export const TIPOS_ATENDIMENTO = ["Ativo", "Receptivo"] as const;

// Status do lead
export const STATUS_OPTIONS = [
  "Novo",
  "Em Contato",
  "Qualificado",
  "Proposta Enviada",
  "Negociação",
  "Convertido",
  "Perdido",
] as const;

// Prioridades
export const PRIORIDADES = ["Alta", "Média", "Baixa"] as const;

// Motivos de perda
export const MOTIVOS_PERDA = [
  "Preço Elevado",
  "Prazo de Execução",
  "Concorrência",
  "Falta de Retorno",
  "Decisão Adiada",
  "Outros",
] as const;

// Types
export type Vendedor = (typeof VENDEDORES)[number];
export type TipoServico = (typeof TIPOS_SERVICO)[number];
export type Origem = (typeof ORIGENS)[number];
export type MeioContato = (typeof MEIOS_CONTATO)[number];
export type TipoAtendimento = (typeof TIPOS_ATENDIMENTO)[number];
export type StatusOption = (typeof STATUS_OPTIONS)[number];
export type Prioridade = (typeof PRIORIDADES)[number];
export type MotivoPerda = (typeof MOTIVOS_PERDA)[number];
