"use client";

import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, DollarSign, Clock, Package, Filter, FileText, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' '); }

interface ReportsClientProps { data: { sessions: any[]; sales: any[] } }

export default function ReportsClient({ data }: ReportsClientProps) {
  const { t, isRTL } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: searchParams.get('start') || format(new Date(), 'yyyy-MM-dd'),
    end: searchParams.get('end') || format(new Date(), 'yyyy-MM-dd'),
  });

  const handleFilter = () => router.push(`/reports?start=${dateRange.start}&end=${dateRange.end}`);

  const stats = useMemo(() => {
    let gamingTimeRevenue = 0, cafeteriaRevenue = 0, totalHours = 0;
    data.sessions.forEach(session => {
      const start = new Date(session.startTime);
      const end = session.endTime ? new Date(session.endTime) : new Date();
      const durationHrs = (end.getTime() - start.getTime()) / 3600000;
      totalHours += durationHrs;
      const rate = session.isMulti ? session.device.hourlyRateMulti : session.device.hourlyRateSingle;
      gamingTimeRevenue += durationHrs * rate;
      cafeteriaRevenue += session.orders.reduce((acc: number, o: any) => acc + o.priceAtTime * o.quantity, 0);
    });
    data.sales.forEach(sale => { cafeteriaRevenue += sale.totalAmount; });
    const totalRevenue = gamingTimeRevenue + cafeteriaRevenue;
    const trendMap = new Map();
    [...data.sessions, ...data.sales].forEach(item => {
      const date = format(new Date(item.startTime || item.createdAt), 'MMM dd');
      let amount = 0;
      if (item.startTime) {
        const s = new Date(item.startTime), e = item.endTime ? new Date(item.endTime) : new Date();
        const dh = (e.getTime() - s.getTime()) / 3600000;
        const rate = item.isMulti ? item.device.hourlyRateMulti : item.device.hourlyRateSingle;
        amount = dh * rate + item.orders.reduce((a: number, o: any) => a + o.priceAtTime * o.quantity, 0);
      } else { amount = item.totalAmount; }
      trendMap.set(date, (trendMap.get(date) || 0) + amount);
    });
    const trendData = Array.from(trendMap.entries()).map(([name, value]) => ({ name, value }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
    return { totalRevenue, gamingTimeRevenue, cafeteriaRevenue, totalHours, trendData };
  }, [data]);

  const statCards = [
    { label: t('reports.totalSales'), value: `${stats.totalRevenue.toFixed(2)} EGP`, icon: DollarSign, color: 'text-blue-400', glow: 'glow-blue' },
    { label: t('reports.gamingUnits'), value: `${stats.gamingTimeRevenue.toFixed(2)} EGP`, icon: Clock, color: 'text-violet-400', glow: 'glow-purple' },
    { label: t('reports.cafeteria'), value: `${stats.cafeteriaRevenue.toFixed(2)} EGP`, icon: Package, color: 'text-amber-400', glow: 'glow-amber' },
    { label: t('reports.gamingHours'), value: `${stats.totalHours.toFixed(1)} ${t('reports.hrs')}`, icon: TrendingUp, color: 'text-teal-400', glow: 'glow-green' },
  ];

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={cn('flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6', isRTL && 'xl:flex-row-reverse')}>
        <div className={isRTL ? 'text-right' : ''}>
          <h2 className="text-2xl font-black text-foreground mb-1">
            {t('reports.title')} <span className="text-blue-400">{t('reports.titleAccent')}</span>
          </h2>
          <p className="text-muted-foreground text-sm">{t('reports.subtitle')}</p>
        </div>

        <div className={cn('w-full xl:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 glass-card p-2 rounded-2xl border border-border', isRTL && 'sm:flex-row-reverse')}>
          <div className={cn('flex items-center gap-3 px-3 py-2 sm:py-0 bg-card/50 sm:bg-transparent rounded-xl sm:rounded-none', isRTL && 'flex-row-reverse')}>
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <input type="date" value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent border-none outline-none text-xs font-bold text-foreground w-full" />
          </div>
          <div className="hidden sm:block w-px h-4 bg-muted" />
          <div className={cn('flex items-center gap-3 px-3 py-2 sm:py-0 bg-card/50 sm:bg-transparent rounded-xl sm:rounded-none', isRTL && 'flex-row-reverse')}>
            <Calendar className="sm:hidden w-4 h-4 text-muted-foreground shrink-0" />
            <input type="date" value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent border-none outline-none text-xs font-bold text-foreground w-full" />
          </div>
          <button onClick={handleFilter}
            className="w-full sm:w-auto flex items-center justify-center py-3 sm:p-2.5 bg-blue-500 text-white sm:bg-blue-500/15 sm:text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
            <Filter className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="sm:hidden ms-2 font-bold text-xs uppercase tracking-widest">Apply Filter</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110', stat.glow)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-xl font-black text-foreground">{stat.value}</h3>
            <div className={cn('absolute -right-4 -bottom-4 w-16 h-16 blur-2xl rounded-full opacity-30', stat.glow)} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-7 rounded-2xl border border-border min-h-[380px] flex flex-col">
          <h3 className={cn('text-base font-black mb-6 flex items-center gap-2 text-foreground', isRTL && 'flex-row-reverse')}>
            <TrendingUp className="w-5 h-5 text-blue-400" /> {t('reports.revenueFlow')}
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4d5b80', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4d5b80', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f0f4ff', fontSize: 12 }} itemStyle={{ color: '#60a5fa' }} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-7 rounded-2xl border border-border flex flex-col">
          <h3 className={cn('text-base font-black mb-6 flex items-center gap-2 text-foreground', isRTL && 'flex-row-reverse')}>
            <DollarSign className="w-5 h-5 text-violet-400" /> {t('reports.revenueSplit')}
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={[{ name: 'Time', value: stats.gamingTimeRevenue }, { name: 'Cafeteria', value: stats.cafeteriaRevenue }]}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value">
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip contentStyle={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f0f4ff', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 pt-4 border-t border-border">
            <div className={cn('flex justify-between items-center text-xs', isRTL && 'flex-row-reverse')}>
              <span className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 rounded-full bg-blue-400" /> {t('reports.gamingTimeOnly')}</span>
              <span className="font-bold text-foreground">{((stats.gamingTimeRevenue / stats.totalRevenue) * 100 || 0).toFixed(0)}%</span>
            </div>
            <div className={cn('flex justify-between items-center text-xs', isRTL && 'flex-row-reverse')}>
              <span className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 rounded-full bg-violet-400" /> {t('reports.cafeteriaAll')}</span>
              <span className="font-bold text-foreground">{((stats.cafeteriaRevenue / stats.totalRevenue) * 100 || 0).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className={cn('p-6 border-b border-border flex justify-between items-center bg-card/30', isRTL && 'flex-row-reverse')}>
          <h3 className="text-base font-black text-foreground">
            {t('reports.recentInvoices')}
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-card/30 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-bold">{t('reports.invoiceId')}</th>
                <th className="px-6 py-4 font-bold">{t('reports.source')}</th>
                <th className="px-6 py-4 font-bold">{t('reports.dateTime')}</th>
                <th className="px-6 py-4 font-bold">{t('reports.grandTotal')}</th>
                <th className={cn('px-6 py-4 font-bold', isRTL ? 'text-left' : 'text-right')}>{t('reports.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...data.sessions, ...data.sales]
                .sort((a, b) => new Date(b.startTime || b.createdAt).getTime() - new Date(a.startTime || a.createdAt).getTime())
                .map((item, i) => {
                  const isSession = !!item.startTime;
                  const date = new Date(item.startTime || item.createdAt);
                  let total = item.totalAmount || 0;
                  if (isSession) {
                    const end = item.endTime ? new Date(item.endTime) : new Date();
                    const dh = (end.getTime() - date.getTime()) / 3600000;
                    const rate = item.isMulti ? item.device.hourlyRateMulti : item.device.hourlyRateSingle;
                    total = dh * rate + item.orders.reduce((a: number, o: any) => a + o.priceAtTime * o.quantity, 0);
                  }
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.015] transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted text-muted-foreground"><FileText className="w-4 h-4" /></div>
                          <span className="font-black text-sm text-foreground">#INV-{i + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-muted-foreground">
                        {isSession ? `${t('reports.stationSource')}${item.device.number}` : t('reports.quickSale')}
                      </td>
                      <td className="px-6 py-5 text-xs text-muted-foreground">{format(date, 'MMM dd, HH:mm')}</td>
                      <td className="px-6 py-5 font-mono font-bold text-blue-400 text-sm">{total.toFixed(2)} EGP</td>
                      <td className={cn('px-6 py-5', isRTL ? 'text-left' : 'text-right')}>
                        <button onClick={() => setSelectedInvoice({ ...item, actualTotal: total })}
                          className="px-3 py-1.5 rounded-xl bg-muted hover:bg-blue-500 text-muted-foreground hover:text-white text-[10px] font-black tracking-wide transition-all inline-flex items-center gap-1.5">
                          <Eye className="w-3 h-3" /> {t('reports.viewInvoice')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)} className="absolute inset-0 bg-black/75 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card w-full max-w-sm p-7 rounded-2xl relative z-10"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={cn('flex justify-between items-center mb-7', isRTL && 'flex-row-reverse')}>
                <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
                  <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400"><FileText className="w-5 h-5" /></div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <h2 className="text-lg font-black text-foreground">{t('reports.invoice')}</h2>
                    <p className="text-[10px] text-muted-foreground font-mono">#{selectedInvoice.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-muted rounded-xl text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3 mb-6">
                <div className={cn('flex justify-between text-xs pb-3 border-b border-border', isRTL && 'flex-row-reverse')}>
                  <span className="text-muted-foreground font-bold uppercase">{t('reports.source')}</span>
                  <span className="text-foreground font-black">{selectedInvoice.startTime ? `${t('reports.stationSource')}${selectedInvoice.device.number}` : t('reports.quickSale')}</span>
                </div>
                <div className={cn('flex justify-between text-xs pb-3 border-b border-border', isRTL && 'flex-row-reverse')}>
                  <span className="text-muted-foreground font-bold uppercase">{t('reports.date')}</span>
                  <span className="text-foreground font-black">{format(new Date(selectedInvoice.startTime || selectedInvoice.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('reports.billingItems')}</p>
                  {selectedInvoice.startTime && (() => {
                    const start = new Date(selectedInvoice.startTime);
                    const end = selectedInvoice.endTime ? new Date(selectedInvoice.endTime) : new Date();
                    const dh = (end.getTime() - start.getTime()) / 3600000;
                    const rate = selectedInvoice.isMulti ? selectedInvoice.device.hourlyRateMulti : selectedInvoice.device.hourlyRateSingle;
                    return (
                      <div className={cn('flex justify-between text-sm py-1', isRTL && 'flex-row-reverse')}>
                        <span className="text-muted-foreground">{t('reports.gamingTime')} ({dh.toFixed(1)}h × {rate} EGP)</span>
                        <span className="font-mono text-blue-400 font-bold">{(dh * rate).toFixed(2)} EGP</span>
                      </div>
                    );
                  })()}
                  {(selectedInvoice.orders || selectedInvoice.items || []).map((o: any, i: number) => (
                    <div key={i} className={cn('flex justify-between text-sm py-1', isRTL && 'flex-row-reverse')}>
                      <span className="text-muted-foreground">{o.inventoryItem?.name || 'Item'} x{o.quantity}</span>
                      <span className="font-mono text-muted-foreground">{(o.priceAtTime * o.quantity).toFixed(2)} EGP</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t-2 border-dashed border-border mb-5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('reports.grandTotal')}</p>
                <span className="text-4xl font-black text-foreground tracking-tighter">{selectedInvoice.actualTotal.toFixed(2)} <span className="text-base text-blue-400">EGP</span></span>
              </div>
              <button onClick={() => setSelectedInvoice(null)}
                className="w-full py-3 rounded-xl bg-muted border border-border hover:bg-muted text-muted-foreground font-bold transition-all">
                {t('reports.closeInvoice')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
