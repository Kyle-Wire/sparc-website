import { ownProfile, currentUser } from "@/lib/house/server";
import { ProfileForm } from "@/components/house/ProfileForm";

export const dynamic = "force-dynamic";

// The buyer's profile (migration 0013): every field optional, and each one
// changes something they can see: the greeting, the wording, the alerts.
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; why?: string }> }) {
  const { saved, error, why } = await searchParams;
  const { user } = await currentUser();
  if (!user) return null;
  const p = await ownProfile();
  return <ProfileForm p={p} email={user.email ?? ""} saved={!!saved} error={error ? why || "That didn’t save. Please try again in a minute." : null} />;
}
