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
    description: "Controle de caixa, movimentações financeiras e auditoria.",
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
        title: "🔒 Fechamento de Caixa",
        content: "No final do dia, clique em 'Fechar Caixa'. Informe o valor conferido fisicamente. O sistema compara com o saldo calculado e mostra eventuais diferenças.",
      },
      {
        title: "📊 Totalizadores",
        content: "Visualize o total de entradas, saídas e saldo líquido. O resumo mostra quanto entrou por cada método de pagamento (Pix, Cartão, Dinheiro, etc.).",
      },
      {
        title: "🔍 Filtros Avançados",
        content: "Use os filtros rápidos (Hoje, Semana, Mês) ou personalize o período. Filtre por forma de pagamento e tipo de movimentação.",
      },
      {
        title: "👤 Auditoria de Usuários",
        content: "Cada movimentação registra o usuário responsável. A coluna 'Responsável' mostra quem realizou a operação, garantindo total rastreabilidade para auditorias.",
      },
      {
        title: "🏦 Conciliação Bancária",
        content: "Compare o saldo do sistema com seu extrato bancário. Use os filtros por forma de pagamento para reconciliar: filtre 'Pix' e compare com sua conta. Diferenças indicam lançamentos pendentes.",
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
