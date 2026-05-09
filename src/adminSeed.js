import { supabase } from "./supabase";

export async function testSupabase() {
  const { data, error } = await supabase
    .from("categories")
    .select("*");

  if (error) {
    console.error("Erreur Supabase :", error);
  } else {
    console.log("Connexion Supabase OK :", data);
  }
}