import { getDashboardData, getCurrentUser } from "../actions";
import DevicesClient from "./DevicesClient";

export default async function DevicesManagerPage() {
  const [{ devices }, user] = await Promise.all([
    getDashboardData(),
    getCurrentUser()
  ]);
  return <DevicesClient initialDevices={devices} user={user} />;
}
