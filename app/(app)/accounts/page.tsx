import { createClient } from "@/lib/supabase/server";
import { AccountsTable } from "@/components/accounts/accounts-table";
import type { Account } from "@/lib/types";

async function getAccounts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: false });

  return (data || []) as Account[];
}

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
        <p className="text-muted-foreground">
          Manage your bank and credit card accounts
        </p>
      </div>

      <AccountsTable accounts={accounts} />
    </div>
  );
}
