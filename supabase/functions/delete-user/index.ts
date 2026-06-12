import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("MY_PROJECT_URL") ?? '',
      Deno.env.get("MY_SERVICE_ROLE") ?? ''
    );

    // 1. Récupérer l'utilisateur via son token
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401, headers: corsHeaders });
    }

    // 2. Supprimer l'utilisateur (Auth + tout ce qui est en cascade)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ message: "Compte supprimé avec succès" }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
  }
});