"use client";

import React, { useState } from 'react';
import { 
  ChevronRight, 
  Trash2, 
  RefreshCcw, 
  Settings, 
  Database, 
  ShieldAlert,
  CheckCircle2,
  X
} from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { clearBillingData, factoryReset } from "@/app/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SettingsClient() {
  const { t, isRTL } = useLang();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'CLEAR' | 'RESET' | null>(null);

  const handleAction = async (type: 'CLEAR' | 'RESET') => {
    setIsPending(true);
    try {
      if (type === 'CLEAR') {
        const res = await clearBillingData();
        if (res.success) toast.success(t('settings.success'));
      } else {
        const res = await factoryReset();
        if (res.success) {
          toast.success(t('settings.success'));
          router.push("/");
        }
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsPending(false);
      setConfirmModal(null);
    }
  };

  const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={cn("flex flex-col gap-1", isRTL && "text-right")}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 shadow-[0_0_20px_rgba(217,70,239,0.2)]">
            <Settings className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase italic">
              {t('settings.title')} <span className="text-fuchsia-400">{t('settings.titleAccent')}</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm font-medium tracking-wide">
              {t('settings.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clear Billing Data Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="glass-card p-6 rounded-3xl border border-border/50 bg-card/30 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Database className="w-16 h-16 text-blue-400" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className={cn("flex items-center gap-3 mb-4", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-black text-white">{t('settings.clearBills')}</h3>
            </div>
            <p className={cn("text-muted-foreground text-sm leading-relaxed mb-8 flex-grow", isRTL && "text-right")}>
              {t('settings.clearBillsDesc')}
            </p>
            <button 
              onClick={() => setConfirmModal('CLEAR')}
              className="w-full py-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500 border border-blue-500/20 text-blue-400 hover:text-white transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('settings.clearBillsBtn')}
            </button>
          </div>
        </motion.div>

        {/* Factory Reset Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="glass-card p-6 rounded-3xl border border-border/50 bg-card/30 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <RefreshCcw className="w-16 h-16 text-red-400" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className={cn("flex items-center gap-3 mb-4", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <RefreshCcw className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-black text-white">{t('settings.factoryReset')}</h3>
            </div>
            <p className={cn("text-muted-foreground text-sm leading-relaxed mb-8 flex-grow", isRTL && "text-right")}>
              {t('settings.factoryResetDesc')}
            </p>
            <button 
              onClick={() => setConfirmModal('RESET')}
              className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(239,68,68,0.1)]"
            >
              <ShieldAlert className="w-4 h-4" />
              {t('settings.factoryResetBtn')}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => !isPending && setConfirmModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-card border border-border rounded-[32px] p-8 max-w-md w-full shadow-2xl overflow-hidden"
              style={{ borderTop: `6px solid ${confirmModal === 'RESET' ? '#ef4444' : '#3b82f6'}` }}
            >
              {/* Decorative Glow */}
              <div className={cn(
                "absolute -top-24 -right-24 w-48 h-48 blur-[80px] opacity-20",
                confirmModal === 'RESET' ? "bg-red-500" : "bg-blue-500"
              )} />

              <div className="flex flex-col items-center text-center">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-6 border",
                  confirmModal === 'RESET' ? "bg-red-500/10 border-red-500/20" : "bg-blue-500/10 border-blue-500/20"
                )}>
                  <ShieldAlert className={cn("w-8 h-8", confirmModal === 'RESET' ? "text-red-400" : "text-blue-400")} />
                </div>
                
                <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
                  {t('settings.confirmTitle')}
                </h2>
                <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-8">
                  {t('settings.confirmDesc')}
                </p>

                <div className={cn("flex gap-3 w-full", isRTL && "flex-row-reverse")}>
                  <button 
                    disabled={isPending}
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 py-3.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-black text-xs uppercase tracking-widest transition-all"
                  >
                    {t('settings.cancel')}
                  </button>
                  <button 
                    disabled={isPending}
                    onClick={() => handleAction(confirmModal)}
                    className={cn(
                      "flex-1 py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2",
                      confirmModal === 'RESET' 
                        ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                        : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
                    )}
                  >
                    {isPending ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {t('settings.confirm')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
