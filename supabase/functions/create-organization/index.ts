import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the requesting user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user: requestingUser }, error: userError } = await anonClient.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is super admin
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_super_admin")
      .eq("id", requestingUser.id)
      .single();

    if (!profile?.is_super_admin) {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas Super Admins podem criar organizações." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { 
      nome, 
      cnpj, 
      plano, 
      modules_enabled,
      responsavel_nome,
      responsavel_email 
    } = await req.json();

    if (!nome) {
      return new Response(JSON.stringify({ error: "Nome da organização é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Creating organization:", { nome, plano, modules_enabled, responsavel_email });

    // 1. Create organization
    const { data: newOrg, error: orgError } = await adminClient
      .from("organizations")
      .insert({
        nome,
        cnpj: cnpj || null,
        plano: plano || "Basico",
        ativo: true,
        modules_enabled: modules_enabled || null,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      return new Response(JSON.stringify({ error: orgError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Organization created:", newOrg.id);

    // 2. Create default cost centers for this organization
    const costCenters = [
      { nome: "Administrativo", organization_id: newOrg.id },
      { nome: "Operacional", organization_id: newOrg.id },
    ];

    const { error: ccError } = await adminClient
      .from("centros_custo")
      .insert(costCenters);

    if (ccError) {
      console.error("Error creating cost centers:", ccError);
      // Don't fail the whole operation, just log
    } else {
      console.log("Cost centers created for organization:", newOrg.id);
    }

    // 3. If responsible email provided, create admin user
    let adminCreated = false;
    let adminUserId = null;

    if (responsavel_email) {
      console.log("Creating admin user for:", responsavel_email);
      
      try {
        // Invite user via Admin API
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
          responsavel_email, 
          {
            data: {
              organization_id: newOrg.id,
              role: "admin",
              nome: responsavel_nome || responsavel_email.split("@")[0],
            },
            redirectTo: `${req.headers.get("origin") || supabaseUrl}/login`,
          }
        );

        if (inviteError) {
          console.error("Error inviting user:", inviteError);
        } else if (inviteData.user) {
          adminUserId = inviteData.user.id;
          console.log("User invited:", adminUserId);

          // Create profile for the admin user
          const { error: profileError } = await adminClient.from("profiles").insert({
            id: inviteData.user.id,
            email: responsavel_email,
            nome: responsavel_nome || responsavel_email.split("@")[0],
            organization_id: newOrg.id,
            is_super_admin: false,
          });

          if (profileError) {
            console.error("Error creating profile:", profileError);
          } else {
            console.log("Profile created for user:", adminUserId);
          }

          // Create admin role
          const { error: roleError } = await adminClient.from("user_roles").insert({
            user_id: inviteData.user.id,
            role: "admin",
          });

          if (roleError) {
            console.error("Error creating role:", roleError);
          } else {
            console.log("Admin role assigned to user:", adminUserId);
            adminCreated = true;
          }
        }
      } catch (inviteErr) {
        console.error("Exception during user invite:", inviteErr);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      organization: newOrg,
      adminCreated,
      adminUserId,
      message: adminCreated 
        ? `Organização "${nome}" criada com sucesso! Convite enviado para ${responsavel_email}.`
        : `Organização "${nome}" criada com sucesso!`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
