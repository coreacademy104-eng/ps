import { getCurrentUser } from "@/app/actions";
import SettingsClient from "./SettingsClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect("/");
  }

  return <SettingsClient />;
}
