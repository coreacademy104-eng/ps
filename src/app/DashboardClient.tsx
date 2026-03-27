"use client";

import { DeviceCard } from "@/components/DeviceCard";
import { Cpu, Users, BarChart3, TrendingUp } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}


export default function DashboardClient({ devices, stats }: { devices: any[]; stats: any }) {
  const { t, isRTL } = useLang();

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Real-Time Panel */}
      <section>
        <div className={cn('flex justify-between items-end mb-6', isRTL && 'flex-row-reverse')}>
          <div className={isRTL ? 'text-right' : ''}>
            <h2 className="text-2xl font-black tracking-tight text-foreground mb-1">
              {t('dashboard.realTimePanel')}
            </h2>
            <p className="text-muted-foreground text-sm">{t('dashboard.liveStatus')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {devices.map((device: any) => (
            <DeviceCard
              key={device.id}
              device={device}
              session={device.sessions[0]}
              allDevices={devices}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
