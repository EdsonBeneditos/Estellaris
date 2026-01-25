import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractData {
  id: string;
  organization_id: string;
  cliente_id: string;
  servico_prestado: string;
  valor: number;
  data_fim: string;
  cliente_nome: string;
  cliente_email: string | null;
}

interface AdminData {
  email: string;
  nome: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY não configurada");
      throw new Error("RESEND_API_KEY não configurada");
    }

    const resend = new Resend(resendApiKey);

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 60 days from now
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 60);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    console.log(`Verificando contratos com vencimento em: ${targetDateStr}`);

    // Fetch contracts expiring in exactly 60 days
    const { data: contracts, error: contractsError } = await supabase
      .from("contratos_historico")
      .select(`
        id,
        organization_id,
        cliente_id,
        servico_prestado,
        valor,
        data_fim
      `)
      .eq("data_fim", targetDateStr)
      .eq("status", "Ativo");

    if (contractsError) {
      console.error("Erro ao buscar contratos:", contractsError);
      throw contractsError;
    }

    if (!contracts || contracts.length === 0) {
      console.log("Nenhum contrato encontrado para vencer em 60 dias");
      return new Response(
        JSON.stringify({ message: "Nenhum contrato para notificar", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Encontrados ${contracts.length} contratos para notificar`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const contract of contracts) {
      try {
        // Check if notification was already sent today
        const { data: existingNotification } = await supabase
          .from("notificacoes_contratos")
          .select("id")
          .eq("contrato_id", contract.id)
          .eq("tipo_notificacao", "vencimento_60_dias")
          .eq("data_envio", today.toISOString().split("T")[0])
          .maybeSingle();

        if (existingNotification) {
          console.log(`Notificação já enviada hoje para contrato ${contract.id}`);
          continue;
        }

        // Fetch client name
        const { data: cliente, error: clienteError } = await supabase
          .from("clientes")
          .select("nome, email")
          .eq("id", contract.cliente_id)
          .single();

        if (clienteError || !cliente) {
          console.error(`Cliente não encontrado para contrato ${contract.id}`);
          continue;
        }

        // Fetch organization admins
        const { data: admins, error: adminsError } = await supabase
          .from("profiles")
          .select("id, email, nome")
          .eq("organization_id", contract.organization_id);

        if (adminsError || !admins || admins.length === 0) {
          console.error(`Nenhum perfil encontrado para org ${contract.organization_id}`);
          continue;
        }

        // Get admin user IDs
        const adminUserIds = admins.map((a) => a.id);

        // Check which ones are actually admins
        const { data: adminRoles, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("user_id", adminUserIds)
          .eq("role", "admin");

        if (rolesError || !adminRoles || adminRoles.length === 0) {
          console.error(`Nenhum admin encontrado para org ${contract.organization_id}`);
          continue;
        }

        const adminIds = adminRoles.map((r) => r.user_id);
        const adminEmails = admins
          .filter((a) => adminIds.includes(a.id))
          .map((a) => ({ email: a.email, nome: a.nome }));

        // Format value as BRL currency
        const valorFormatado = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(contract.valor);

        // Format date
        const dataVencimento = new Date(contract.data_fim + "T00:00:00");
        const dataFormatada = dataVencimento.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

        // Send email to each admin
        for (const admin of adminEmails) {
          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
        ⚠️ Alerta de Vencimento de Contrato
      </h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Olá, <strong>${admin.nome}</strong>!
      </p>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Este é um lembrete automático de que o contrato abaixo vencerá em <strong style="color: #dc2626;">60 dias</strong>:
      </p>
      
      <!-- Contract Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Cliente:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${cliente.nome}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Serviço:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${contract.servico_prestado}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Valor:</td>
            <td style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 600; text-align: right;">${valorFormatado}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Vencimento:</td>
            <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right;">${dataFormatada}</td>
          </tr>
        </table>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="https://acqualeads.lovable.app/clientes" 
           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
          📋 Ir para Renegociação
        </a>
      </div>
      
      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
        Acesse o sistema para renovar o contrato e manter a fidelidade do cliente.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        Esta é uma notificação automática do sistema Acqua Leads.<br>
        Você recebeu este e-mail porque é administrador da sua organização.
      </p>
    </div>
  </div>
</body>
</html>
          `;

          try {
            const { error: emailError } = await resend.emails.send({
              from: "Acqua Leads <noreply@resend.dev>",
              to: [admin.email],
              subject: `⚠️ Atenção: Contrato de ${cliente.nome} vence em 60 dias`,
              html: emailHtml,
            });

            if (emailError) {
              console.error(`Erro ao enviar email para ${admin.email}:`, emailError);
              errors.push(`Falha ao enviar para ${admin.email}: ${emailError.message}`);
              errorCount++;
              continue;
            }

            // Log the notification
            const { error: logError } = await supabase
              .from("notificacoes_contratos")
              .insert({
                organization_id: contract.organization_id,
                contrato_id: contract.id,
                cliente_id: contract.cliente_id,
                admin_email: admin.email,
                tipo_notificacao: "vencimento_60_dias",
                data_vencimento: contract.data_fim,
                data_envio: today.toISOString().split("T")[0],
              });

            if (logError) {
              console.error(`Erro ao registrar log de notificação:`, logError);
            }

            console.log(`Email enviado com sucesso para ${admin.email} sobre contrato ${contract.id}`);
            successCount++;
          } catch (sendError) {
            console.error(`Exceção ao enviar email:`, sendError);
            errors.push(`Exceção ao enviar para ${admin.email}`);
            errorCount++;
          }
        }
      } catch (contractError) {
        console.error(`Erro ao processar contrato ${contract.id}:`, contractError);
        errorCount++;
      }
    }

    const result = {
      message: "Processamento concluído",
      totalContratos: contracts.length,
      emailsEnviados: successCount,
      erros: errorCount,
      detalhesErros: errors,
    };

    console.log("Resultado final:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro geral na função:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
