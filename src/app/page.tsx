import { getDashboardData } from "./actions";
import DashboardClient from "./DashboardClient";

export const revalidate = 0; // Ensures fresh data always

export default async function DashboardPage() {
  const { devices, stats } = await getDashboardData();
  
  return (
    <DashboardClient devices={devices} stats={stats} />
  );
}
