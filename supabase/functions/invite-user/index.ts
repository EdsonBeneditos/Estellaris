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
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas Super Admins podem convidar usuários." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, organizationId, role, nome } = await req.json();

    if (!email || !organizationId || !role) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user with Supabase Admin API
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: organizationId,
        role: role,
        nome: nome || email.split("@")[0],
      },
      redirectTo: `${req.headers.get("origin") || supabaseUrl}/login`,
    });

    if (inviteError) {
      console.error("Error inviting user:", inviteError);
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create profile for the new user
    if (inviteData.user) {
      const { error: profileError } = await adminClient.from("profiles").insert({
        id: inviteData.user.id,
        email: email,
        nome: nome || email.split("@")[0],
        organization_id: organizationId,
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }

      // Create role for the new user
      const { error: roleError } = await adminClient.from("user_roles").insert({
        user_id: inviteData.user.id,
        role: role,
      });

      if (roleError) {
        console.error("Error creating role:", roleError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Convite enviado para ${email}`,
      userId: inviteData.user?.id 
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
