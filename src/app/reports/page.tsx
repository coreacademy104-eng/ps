import { getReportData } from "../actions";
import ReportsClient from "./ReportsClient";
import { subDays, startOfDay, endOfDay } from "date-fns";

export default async function ReportsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ start?: string, end?: string }> 
}) {
  const params = await searchParams;
  
  // Default to TODAY only if no params provided
  const startDate = params.start ? new Date(params.start) : startOfDay(new Date());
  const endDate = params.end ? new Date(params.end) : endOfDay(new Date());

  const data = await getReportData(startDate, endDate);

  return <ReportsClient data={data} />;
}
