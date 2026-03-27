import { getInventory } from "../actions";
import CafetriaClient from "./CafetriaClient";

export default async function CafetriaPage() {
  const inventory = await getInventory();
  return <CafetriaClient inventory={inventory} />;
}
