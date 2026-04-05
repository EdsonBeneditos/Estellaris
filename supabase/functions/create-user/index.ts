import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateIdNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the requesting user via Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await anonClient.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve caller's profile (is_super_admin + organization_id)
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("is_super_admin, organization_id")
      .eq("id", requestingUser.id)
      .single();

    const isSuperAdmin = callerProfile?.is_super_admin === true;

    // Check if caller is an org admin (role = 'admin' in user_roles)
    let isOrgAdmin = false;
    if (!isSuperAdmin && callerProfile?.organization_id) {
      const { data: callerRole } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", requestingUser.id)
        .eq("role", "admin")
        .maybeSingle();
      isOrgAdmin = callerRole?.role === "admin";
    }

    if (!isSuperAdmin && !isOrgAdmin) {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas Super Admins ou Administradores da organização podem criar usuários." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, nome, organization_id: requestedOrgId, role } = await req.json();

    // Resolve the target organization_id based on who is calling
    const organization_id = isSuperAdmin
      ? requestedOrgId           // super admin must provide the org
      : callerProfile!.organization_id; // org admin always uses their own org

    if (!email || !password || !nome || !organization_id || !role) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: email, password, nome, organization_id (super admin), role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "A senha deve ter no mínimo 6 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Org admins cannot create other admins
    if (isOrgAdmin && role === "admin") {
      return new Response(JSON.stringify({ error: "Administradores da organização só podem criar usuários com cargo Gerente ou Vendedor." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create the auth user — already confirmed, no email sent
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome, organization_id, role },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = authData.user.id;
    console.log("Auth user created:", newUserId);

    // 2. Create profile
    const id_nome = generateIdNome(nome);
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: newUserId,
      email,
      nome,
      organization_id,
      id_nome,
      is_super_admin: false,
    });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Rollback: delete the auth user to avoid orphaned records
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: `Erro ao criar perfil: ${profileError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Profile created for user:", newUserId);

    // 3. Create user role
    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: newUserId,
      role,
    });

    if (roleError) {
      console.error("Error creating role:", roleError);
      // Non-fatal: profile exists, user can log in, admin can fix role manually
    } else {
      console.log("Role assigned:", role, "to user:", newUserId);
    }

    return new Response(JSON.stringify({
      success: true,
      userId: newUserId,
      email,
      nome,
      id_nome,
      role,
      organization_id,
      message: `Usuário "${nome}" criado com sucesso e pronto para login.`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
