import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HelpContent {
  title: string;
  description: string;
  sections: {
    title: string;
    content: string;
  }[];
}

const helpContents: Record<string, HelpContent> = {
  "/": {
    title: "Dashboard - Manual Rápido",
    description: "Visão geral do sistema com indicadores de performance.",
    sections: [
      {
        title: "📊 Métricas",
        content: "O dashboard exibe indicadores-chave como total de leads, taxa de conversão e vendas do período. Utilize os filtros de data para análises específicas.",
      },
      {
        title: "📈 Gráficos",
        content: "Os gráficos mostram a evolução temporal dos seus leads e vendas. Clique nas legendas para filtrar categorias específicas.",
      },
      {
        title: "⚡ Ações Rápidas",
        content: "Use os atalhos para acessar rapidamente as funcionalidades mais utilizadas como criar lead ou novo orçamento.",
      },
    ],
  },
  "/super-admin": {
    title: "Central Super Admin - Manual Rápido",
    description: "Painel exclusivo para gestão global do sistema.",
    sections: [
      {
        title: "🏢 Gestão de Empresas",
        content: "Visualize todas as organizações cadastradas no sistema. Crie novas empresas definindo nome, CNPJ e plano (Básico, Pro ou Enterprise). Cada empresa opera de forma totalmente isolada com seus próprios dados.",
      },
      {
        title: "👤 Criação de Usuários Mestres",
        content: "Convide usuários por e-mail e vincule-os automaticamente a uma organização com cargo definido (Admin, Gerente, Vendedor). O usuário receberá um link para definir sua senha e acessar o sistema.",
      },
      {
        title: "🔍 Simular Acesso (Suporte)",
        content: "Use o botão 'Simular Acesso' ao lado de cada empresa para visualizar o sistema exatamente como o cliente vê. Uma barra amarela no topo indica que você está em modo de simulação. Clique em 'Sair da Simulação' para retornar ao painel Super Admin.",
      },
      {
        title: "⚠️ Segurança",
        content: "O acesso a esta área é restrito exclusivamente a Super Administradores autorizados. Todas as ações são registradas para auditoria.",
      },
    ],
  },
  "/colaboradores": {
    title: "Colaboradores - Manual Rápido",
    description: "Gestão completa de RH e ficha funcional dos colaboradores.",
    sections: [
      {
        title: "📋 Cadastro de Ficha Funcional",
        content: "Cadastre colaboradores com informações completas: nome, código de cadastro, cargo, data de admissão, telefone e e-mail pessoal. Todos os campos são editáveis através do botão 'Editar' no card.",
      },
      {
        title: "🚗 Categorias de CNH",
        content: "Selecione múltiplas categorias de CNH (A, B, C, D, E) usando as tags. Isso permite registrar motoristas habilitados para diferentes tipos de veículos.",
      },
      {
        title: "⏰ Gestão de Turnos",
        content: "Defina o turno de trabalho (Manhã, Tarde, Noite, 12x36) e a preferência de turno do colaborador. Marque se ele aceita troca de turno para facilitar escalas.",
      },
      {
        title: "♿ Indicador PCD",
        content: "Marque colaboradores como PCD (Pessoa com Deficiência) para controle de cotas legais e adaptações necessárias.",
      },
      {
        title: "🏝️ Alerta Automático de Férias",
        content: "O sistema calcula automaticamente o tempo desde a admissão. Quando um colaborador atinge 11 meses de empresa, uma badge 'Próximo a Férias' aparece no card e um alerta é exibido no topo da página.",
      },
      {
        title: "🎨 Status com Cores",
        content: "Status visual por cores: Ativo (Verde), Férias (Azul), Afastado (Amarelo) e Demitido (Vermelho). Facilita a identificação rápida da situação de cada colaborador.",
      },
    ],
  },
  "/leads": {
    title: "Leads - Manual Rápido",
    description: "Gerencie todos os seus leads e oportunidades de negócio.",
    sections: [
      {
        title: "➕ Criar Lead",
        content: "Clique em 'Novo Lead' para adicionar um novo contato. Preencha os dados obrigatórios: nome do contato e empresa. Os demais campos são opcionais.",
      },
      {
        title: "🔍 Busca e Filtros",
        content: "Use a barra de busca para encontrar leads por nome, empresa ou CNPJ. Aplique filtros por status, vendedor ou origem para refinar sua busca.",
      },
      {
        title: "📝 Editar Lead",
        content: "Clique no ícone de edição (lápis) ou no menu de ações para alterar os dados do lead. As alterações são salvas automaticamente.",
      },
      {
        title: "🔄 Status e Funil",
        content: "Acompanhe o progresso dos leads através dos status: Novo → Em negociação → Proposta enviada → Fechado/Perdido.",
      },
    ],
  },
  "/futuros-leads": {
    title: "Futuros Leads - Manual Rápido",
    description: "Agende contatos futuros e gerencie leads programados.",
    sections: [
      {
        title: "📅 Agendamento",
        content: "Cadastre leads para contato futuro informando a data prevista. O sistema alertará quando chegar o momento do contato.",
      },
      {
        title: "🔔 Notificações",
        content: "Leads com data de contato próxima aparecem destacados. Não perca nenhuma oportunidade de negócio.",
      },
      {
        title: "➡️ Converter para Lead",
        content: "Quando chegar o momento, converta o futuro lead em um lead ativo para iniciar o processo de vendas.",
      },
    ],
  },
  "/clientes": {
    title: "Clientes - Manual Rápido",
    description: "Gerencie clientes, contratos e histórico de fidelidade.",
    sections: [
      {
        title: "👤 Cadastro de Clientes",
        content: "Cadastre novos clientes com dados completos: nome, CNPJ/CPF, telefone, e-mail e endereço. Configure também a rotina de visitas se aplicável.",
      },
      {
        title: "📋 Gestão de Contratos",
        content: "Cada cliente pode ter múltiplos contratos com serviços, valores e datas de vencimento. O sistema exibe automaticamente um alerta de 'Renovação Próxima' quando faltam menos de 60 dias para o vencimento.",
      },
      {
        title: "🔄 Renovação de Contratos",
        content: "Ao renovar um contrato, o sistema finaliza o contrato atual e cria um novo automaticamente. Todo o histórico é preservado para cálculo do tempo total de fidelidade do cliente.",
      },
      {
        title: "🏆 Histórico de Fidelidade",
        content: "O tempo de fidelidade é calculado automaticamente somando todos os períodos de contrato do cliente, incluindo renovações. Essa informação aparece como badge no card do cliente.",
      },
      {
        title: "📥 Importação via CSV",
        content: "Importe múltiplos clientes de uma planilha CSV. Baixe o modelo, preencha os dados (Nome, Documento, Contato, Serviço, Valor, Vencimento) e faça o upload. O sistema valida CNPJ/CPF e exibe erros específicos por linha antes de importar.",
      },
    ],
  },
  "/equipe": {
    title: "Equipe - Manual Rápido",
    description: "Gerencie os membros da sua organização e controle de acessos.",
    sections: [
      {
        title: "👥 Gestão de Membros",
        content: "Visualize todos os membros da sua organização. Administradores podem alterar cargos e remover membros. Cada membro possui um cargo que define suas permissões no sistema.",
      },
      {
        title: "🔑 Diferença entre Cargos",
        content: "Admin: Acesso total, pode gerenciar membros, configurações e excluir dados. Gerente: Acesso a relatórios e gestão de leads/clientes, sem acesso a configurações críticas. Vendedor: Acesso básico para cadastro e acompanhamento de leads e orçamentos.",
      },
      {
        title: "🔐 Segurança e Rastro de Auditoria",
        content: "Toda ação no sistema é registrada com o login do usuário responsável. O rastro de auditoria é imutável e não pode ser alterado, garantindo total rastreabilidade para fins de compliance e segurança.",
      },
      {
        title: "⚠️ Proteção de Dados",
        content: "O isolamento multi-tenant garante que cada organização acesse apenas seus próprios dados. Membros removidos perdem acesso imediato ao sistema.",
      },
    ],
  },
  "/estoque": {
    title: "Estoque/Cadastro - Manual Rápido",
    description: "Gerencie produtos e grupos do seu catálogo.",
    sections: [
      {
        title: "📦 Cadastrar Produto",
        content: "Clique em 'Novo Produto' e preencha: Nome, SKU (código único), preços de custo e venda, quantidade em estoque e unidade de medida.",
      },
      {
        title: "🏷️ Grupos/Departamentos",
        content: "Organize seus produtos em grupos. Clique em 'Grupos' para criar categorias como 'Filtros', 'Acessórios', etc. Cada grupo tem um número de referência único.",
      },
      {
        title: "📋 Dados Fiscais",
        content: "Preencha NCM (8 dígitos), CEST, Origem da Mercadoria e CST/CSOSN para cada produto. Esses dados são usados automaticamente na emissão de NF-e.",
      },
      {
        title: "🔄 Controle de Estoque",
        content: "O estoque é atualizado automaticamente quando um orçamento é aprovado (baixa) ou cancelado (estorno).",
      },
    ],
  },
  "/orcamentos": {
    title: "Orçamentos - Manual Rápido",
    description: "Crie e gerencie orçamentos e vendas.",
    sections: [
      {
        title: "📝 Novo Orçamento",
        content: "Clique em 'Novo Orçamento'. Busque um lead existente ou preencha manualmente os dados do cliente (Venda de Balcão).",
      },
      {
        title: "🛒 Adicionar Produtos",
        content: "Clique em 'Adicionar Produto' para selecionar itens do estoque. Defina quantidade e desconto para cada item.",
      },
      {
        title: "✅ Aprovar Venda",
        content: "Ao aprovar um orçamento, o status muda para 'Aprovado' e as quantidades são automaticamente subtraídas do estoque.",
      },
      {
        title: "📄 Gerar PDF",
        content: "Clique em 'Gerar PDF' para criar um documento profissional com todos os dados do orçamento para enviar ao cliente.",
      },
      {
        title: "🧾 Gerar NF-e",
        content: "Após aprovar, clique em 'Gerar NF-e' para criar uma nota fiscal com os dados do orçamento já preenchidos.",
      },
    ],
  },
  "/notas-fiscais": {
    title: "Notas Fiscais - Manual Rápido",
    description: "Emita e gerencie notas fiscais eletrônicas.",
    sections: [
      {
        title: "📄 Nova Nota Manual",
        content: "Crie uma NF-e do zero preenchendo todos os dados: emitente, destinatário, produtos e tributos.",
      },
      {
        title: "🔗 NF-e via Orçamento",
        content: "A partir de um orçamento aprovado, clique em 'Gerar NF-e' para preencher automaticamente os dados do cliente e produtos.",
      },
      {
        title: "🏢 Dados do Emitente",
        content: "Configure os dados da sua empresa: Razão Social, CNPJ, Endereço e Inscrição Estadual.",
      },
      {
        title: "📊 Tributos",
        content: "O sistema calcula automaticamente ICMS com base nas alíquotas configuradas. Ajuste NCM, CFOP e CST conforme necessário.",
      },
      {
        title: "🖨️ DANFE e PDF",
        content: "Visualize o rascunho da DANFE e baixe o PDF para impressão ou envio ao cliente.",
      },
    ],
  },
  "/financeiro": {
    title: "Financeiro / Caixa - Manual Rápido",
    description: "Controle de caixa, movimentações financeiras e auditoria empresarial.",
    sections: [
      {
        title: "🔓 Abertura de Caixa",
        content: "Inicie o dia clicando em 'Abrir Caixa' e informe o saldo inicial em dinheiro. O caixa precisa estar aberto para registrar movimentações.",
      },
      {
        title: "💵 Registrar Movimentação",
        content: "Clique em 'Nova Movimentação' para registrar entradas ou saídas. O sistema captura automaticamente o usuário responsável para rastreabilidade.",
      },
      {
        title: "🔗 Vendas Automáticas",
        content: "Quando um orçamento é aprovado, uma entrada é criada automaticamente no caixa com os dados da venda e o vendedor responsável é registrado.",
      },
      {
        title: "🔒 Fechamento Cego (Contagem)",
        content: "No final do dia, inicie o Fechamento Cego. O saldo do sistema fica OCULTO enquanto você conta fisicamente cada forma de pagamento (Dinheiro, PIX, Cartão). Só após confirmar, o sistema revela as diferenças - garantindo contagem imparcial.",
      },
      {
        title: "📊 Diferenças de Caixa",
        content: "Após o fechamento, o sistema gera um relatório detalhado por forma de pagamento mostrando: valor contado, valor do sistema e diferença. Sobras ou faltas ficam registradas permanentemente.",
      },
      {
        title: "👤 Auditoria Dupla",
        content: "Cada movimentação registra DOIS campos: 'Quem Fez' (quem realizou) e 'Quem Autorizou' (quem aprovou). Na tabela de movimentações você vê ambas colunas para total rastreabilidade.",
      },
      {
        title: "🔐 Rastro Imutável",
        content: "IMPORTANTE: O registro de auditoria é automático e imutável. Toda movimentação captura o ID do usuário logado no momento. Esses dados não podem ser alterados, garantindo segurança para auditorias.",
      },
      {
        title: "🏦 Conciliação Bancária",
        content: "Compare o saldo do sistema com seu extrato bancário. Use os filtros por forma de pagamento para reconciliar: filtre 'Pix' e compare com sua conta. Diferenças indicam lançamentos pendentes.",
      },
      {
        title: "📋 Plano de Contas",
        content: "As categorias são divididas em Entradas (vendas, serviços, etc) e Saídas (despesas, salários, etc). Use categorias apropriadas para relatórios gerenciais precisos.",
      },
    ],
  },
  "/relatorios": {
    title: "Relatórios - Manual Rápido",
    description: "Análises e relatórios gerenciais.",
    sections: [
      {
        title: "📊 Relatório de Vendas",
        content: "Visualize o faturamento por período, produto ou vendedor. Exporte para Excel ou PDF.",
      },
      {
        title: "📈 Métricas de Performance",
        content: "Acompanhe taxa de conversão, ticket médio e tempo médio de fechamento.",
      },
      {
        title: "📅 Filtros de Período",
        content: "Selecione o período desejado para análise: hoje, semana, mês ou intervalo personalizado.",
      },
    ],
  },
  "/configuracoes": {
    title: "Configurações - Manual Rápido",
    description: "Configure o sistema conforme suas necessidades.",
    sections: [
      {
        title: "👥 Vendedores",
        content: "Cadastre sua equipe de vendas. Cada vendedor pode ter uma cor identificadora.",
      },
      {
        title: "📍 Origens",
        content: "Configure as origens dos leads: Site, Indicação, Google, etc.",
      },
      {
        title: "🏷️ Tipos de Serviço",
        content: "Defina os tipos de serviço oferecidos pela empresa.",
      },
      {
        title: "🔐 Permissões",
        content: "Esta área é restrita a administradores do sistema.",
      },
    ],
  },
};

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Encontra o conteúdo de ajuda baseado na rota atual
  const currentPath = location.pathname;
  const helpContent = helpContents[currentPath] || helpContents["/"];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-all duration-200"
        title="Ajuda"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              {helpContent.title}
            </DialogTitle>
            <DialogDescription>{helpContent.description}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {helpContent.sections.map((section, index) => (
                <div key={index} className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold text-foreground mb-2">
                    {section.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              💡 Dica: Este ícone de ajuda está disponível em todas as páginas do sistema.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
