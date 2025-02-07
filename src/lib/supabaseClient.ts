import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ufmqcvxijnrfgtpgpbje.supabase.co";
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbXFjdnhpam5yZmd0cGdwYmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MTk4ODAsImV4cCI6MjA1NDQ5NTg4MH0.EBhRK5brz5eQMHWYqPZ71z3bEp8CM5ZUEuoTLSHUSoY";
console.log("Supabase client initialized");

export const supabase = createClient(supabaseUrl, supabaseKey);
