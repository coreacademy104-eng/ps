import { getUsers } from "../actions";
import StaffClient from "./StaffClient";

export default async function StaffPage() {
  const users = await getUsers();
  return <StaffClient users={users} />;
}
