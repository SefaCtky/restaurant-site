import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://insnsionazkpxjwaemrp.supabase.co";
const supabaseKey = "sb_publishable_QzozWLspFp5uoZIXaI_W8Q_dAeYKdLe";

export const supabase = createClient(supabaseUrl, supabaseKey);