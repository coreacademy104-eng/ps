import { getInventory } from "../actions";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const inventory = await getInventory();
  return <InventoryClient initialItems={inventory} />;
}
