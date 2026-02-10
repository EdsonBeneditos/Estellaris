import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const focusNfeToken = Deno.env.get("FOCUSNFE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...payload } = await req.json();

    // ── ACTION: create_company ──
    if (action === "create_company") {
      const { organization_id, cnpj, inscricao_municipal, regime_tributario, ambiente_nfe } = payload;

      if (!organization_id) {
        return new Response(
          JSON.stringify({ error: "organization_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseAdmin
        .from("organizations")
        .update({ cnpj, inscricao_municipal, regime_tributario, ambiente_nfe })
        .eq("id", organization_id);

      if (error) {
        return new Response(
          JSON.stringify({ error: "Erro ao salvar dados fiscais", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Dados fiscais salvos com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: create_nfe ──
    if (action === "create_nfe") {
      const { movimentacao_id, organization_id, ref, destinatario_nome, destinatario_cnpj, valor, descricao, observacoes } = payload;

      if (!movimentacao_id || !organization_id || !destinatario_nome) {
        return new Response(
          JSON.stringify({ error: "Campos obrigatórios: movimentacao_id, organization_id, destinatario_nome" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch organization fiscal data
      const { data: org, error: orgErr } = await supabaseAdmin
        .from("organizations")
        .select("*")
        .eq("id", organization_id)
        .single();

      if (orgErr || !org) {
        return new Response(
          JSON.stringify({ error: "Organização não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create pending log
      const { data: logEntry, error: logErr } = await supabaseAdmin
        .from("notas_fiscais_logs")
        .insert({ movimentacao_id, organization_id, status: "Pendente" })
        .select()
        .single();

      if (logErr) {
        return new Response(
          JSON.stringify({ error: "Erro ao criar log", details: logErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create nota fiscal record
      const { data: nota, error: nfErr } = await supabaseAdmin
        .from("notas_fiscais")
        .insert({
          destinatario_nome,
          destinatario_cnpj: destinatario_cnpj || null,
          valor_produtos: Number(valor),
          valor_total: Number(valor),
          status: "Pendente",
          informacoes_adicionais: observacoes || null,
          organization_id,
          emitente_razao_social: org.nome || null,
          emitente_cnpj: org.cnpj || null,
        })
        .select()
        .single();

      if (nfErr) {
        await supabaseAdmin
          .from("notas_fiscais_logs")
          .update({ status: "Erro", mensagem_erro: nfErr.message })
          .eq("id", logEntry.id);

        return new Response(
          JSON.stringify({ error: "Erro ao criar nota fiscal", details: nfErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Call Focus NFe API (if token configured) ──
      if (focusNfeToken) {
        try {
          const ambiente = org.ambiente_nfe === "producao" ? "production" : "homologation";
          const focusBaseUrl = ambiente === "production"
            ? "https://api.focusnfe.com.br"
            : "https://homologacao.focusnfe.com.br";

          const nfePayload = {
            natureza_operacao: "Venda de produtos",
            forma_pagamento: "0",
            tipo_documento: "1",
            finalidade_emissao: "1",
            cnpj_emitente: (org.cnpj || "").replace(/\D/g, ""),
            inscricao_municipal_emitente: org.inscricao_municipal || "",
            regime_tributario: org.regime_tributario === "simples_nacional" ? "1" :
                               org.regime_tributario === "lucro_presumido" ? "2" : "3",
            items: [{
              numero_item: "1",
              codigo_produto: movimentacao_id.substring(0, 8),
              descricao: descricao || `Movimentação #${movimentacao_id.substring(0, 8)}`,
              quantidade: "1.00",
              unidade_comercial: "UN",
              valor_unitario_comercial: Number(valor).toFixed(2),
              valor_bruto: Number(valor).toFixed(2),
            }],
            nome_destinatario: destinatario_nome,
            cnpj_destinatario: (destinatario_cnpj || "").replace(/\D/g, "") || undefined,
            informacoes_adicionais_contribuinte: observacoes || "",
          };

          const nfeRef = ref || `nfe-${nota.id.substring(0, 8)}`;
          const focusRes = await fetch(`${focusBaseUrl}/v2/nfe?ref=${nfeRef}`, {
            method: "POST",
            headers: {
              Authorization: `Token token=${focusNfeToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(nfePayload),
          });

          const focusData = await focusRes.json();

          if (focusRes.ok && !focusData.erros) {
            await supabaseAdmin
              .from("notas_fiscais_logs")
              .update({
                status: "Autorizada",
                protocolo: focusData.protocolo || focusData.ref || nfeRef,
                pdf_url: focusData.caminho_danfe || null,
                xml_url: focusData.caminho_xml_nota_fiscal || null,
              })
              .eq("id", logEntry.id);

            await supabaseAdmin
              .from("notas_fiscais")
              .update({
                status: "Autorizada",
                chave_acesso: focusData.chave_nfe || null,
                data_emissao: new Date().toISOString(),
              })
              .eq("id", nota.id);

            return new Response(
              JSON.stringify({
                success: true, nota_id: nota.id, numero_nota: nota.numero_nota,
                status: "Autorizada", protocolo: focusData.protocolo || null,
                pdf_url: focusData.caminho_danfe || null,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            const errorMsg = focusData.erros
              ? focusData.erros.map((e: any) => e.mensagem || JSON.stringify(e)).join("; ")
              : focusData.mensagem || "Erro desconhecido da Focus NFe";

            await supabaseAdmin
              .from("notas_fiscais_logs")
              .update({ status: "Erro", mensagem_erro: errorMsg })
              .eq("id", logEntry.id);

            await supabaseAdmin
              .from("notas_fiscais")
              .update({ status: "Erro" })
              .eq("id", nota.id);

            return new Response(
              JSON.stringify({
                success: false, nota_id: nota.id, numero_nota: nota.numero_nota,
                status: "Erro", error: errorMsg,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (focusErr: any) {
          const errMsg = focusErr.message || "Falha ao comunicar com Focus NFe";
          await supabaseAdmin
            .from("notas_fiscais_logs")
            .update({ status: "Erro", mensagem_erro: errMsg })
            .eq("id", logEntry.id);

          return new Response(
            JSON.stringify({
              success: false, nota_id: nota.id, numero_nota: nota.numero_nota,
              status: "Erro", error: errMsg,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // No Focus NFe token – local only
      await supabaseAdmin
        .from("notas_fiscais_logs")
        .update({ status: "Autorizada" })
        .eq("id", logEntry.id);

      return new Response(
        JSON.stringify({
          success: true, nota_id: nota.id, numero_nota: nota.numero_nota,
          status: "Autorizada", message: "Nota criada localmente (Focus NFe não configurada)",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: cancel_nfe ──
    if (action === "cancel_nfe") {
      const { nota_id, organization_id, justificativa } = payload;

      if (!nota_id || !organization_id || !justificativa) {
        return new Response(
          JSON.stringify({ error: "Campos obrigatórios: nota_id, organization_id, justificativa" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (justificativa.length < 15) {
        return new Response(
          JSON.stringify({ error: "A justificativa deve ter pelo menos 15 caracteres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the nota fiscal
      const { data: nota, error: notaErr } = await supabaseAdmin
        .from("notas_fiscais")
        .select("*")
        .eq("id", nota_id)
        .eq("organization_id", organization_id)
        .single();

      if (notaErr || !nota) {
        return new Response(
          JSON.stringify({ error: "Nota fiscal não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (nota.status !== "Autorizada") {
        return new Response(
          JSON.stringify({ error: "Apenas notas autorizadas podem ser canceladas" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update nota status
      await supabaseAdmin
        .from("notas_fiscais")
        .update({ status: "Cancelada", informacoes_adicionais: justificativa })
        .eq("id", nota_id);

      // Log the cancellation
      await supabaseAdmin
        .from("notas_fiscais_logs")
        .insert({
          organization_id,
          status: "Cancelada",
          mensagem_erro: `Cancelamento: ${justificativa}`,
        });

      // Call Focus NFe cancellation if token available
      if (focusNfeToken && nota.chave_acesso) {
        try {
          const { data: org } = await supabaseAdmin
            .from("organizations")
            .select("ambiente_nfe")
            .eq("id", organization_id)
            .single();

          const ambiente = org?.ambiente_nfe === "producao" ? "production" : "homologation";
          const focusBaseUrl = ambiente === "production"
            ? "https://api.focusnfe.com.br"
            : "https://homologacao.focusnfe.com.br";

          await fetch(`${focusBaseUrl}/v2/nfe/${nota.chave_acesso}`, {
            method: "DELETE",
            headers: {
              Authorization: `Token token=${focusNfeToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ justificativa }),
          });
        } catch (e) {
          console.error("Focus NFe cancel error:", e);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Nota fiscal cancelada com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Ação desconhecida: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
