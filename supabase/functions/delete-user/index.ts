import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Gestion du CORS
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Initialisation avec tes secrets MY_PROJECT_URL et MY_SERVICE_ROLE
    const supabaseAdmin = createClient(
      Deno.env.get("MY_PROJECT_URL") ?? '',
      Deno.env.get("MY_SERVICE_ROLE") ?? ''
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Jeton d'autorisation manquant");
    }

    const jwt = authHeader.replace('Bearer ', '');

    // Récupérer l'utilisateur pour valider la requête
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401, headers: corsHeaders });
    }

    // SUPPRESSION avec les droits admin complets
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ message: "Compte supprimé" }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
  }
});