import { createClient } from "@/lib/supabase/server";
import ChatInterface from "./chat-interface";

async function checkHasStatements() {
  try {
    const supabase = await createClient();
    // RLS automatically filters by user_id
    const { count } = await supabase
      .from("statements")
      .select("*", { count: "exact", head: true });
    return (count || 0) > 0;
  } catch (error) {
    console.error("Error checking statements:", error);
    return false;
  }
}

export default async function ChatPage() {
  const hasStatements = await checkHasStatements();

  return <ChatInterface hasStatements={hasStatements} />;
}
