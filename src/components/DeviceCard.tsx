"use client";

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Gamepad2,
  Play,
  Clock,
  Beer,
  Settings,
  ArrowRightLeft,
  Square,
  Coffee,
  X,
  Crown,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { intervalToDuration } from 'date-fns';
import { toast } from 'sonner';
import {
  startSession,
  endSession,
  addOrderToSession,
  getInventory,
  transferSession,
  toggleSessionMode,
  removeOrderFromSession,
} from '@/app/actions';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/LanguageContext';

interface DeviceCardProps {
  device: {
    id: string;
    number: string;
    type: string;
    hourlyRateSingle: number;
    hourlyRateMulti: number;
  };
  session?: any;
  allDevices?: any[];
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, session, allDevices = [] }) => {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [elapsed, setElapsed] = useState('00:00:00');
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [fixedMinutes, setFixedMinutes] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTransferMode, setShowTransferMode] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const isPrivate = device.type === 'PRIVATE';

  // ── Colors ───────────────────────────────────────
  const getAccent = () => {
    switch (device.type) {
      case 'PS5':
        return {
          text: 'text-pink-400',
          bg: 'bg-pink-500/10',
          border: 'border-pink-500/30',
          glow: 'shadow-pink-500/20',
          hex: '#ec4899',
          tagBg: 'bg-pink-600',
          tagText: 'text-white',
        };
      case 'PS4':
        return {
          text: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          glow: 'shadow-blue-500/20',
          hex: '#3b82f6',
          tagBg: 'bg-blue-600',
          tagText: 'text-white',
        };
      case 'PRIVATE':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          glow: 'shadow-amber-500/20',
          hex: '#fbbf24',
          tagBg: 'bg-amber-500',
          tagText: 'text-black font-black',
        };
      default:
        return {
          text: 'text-pink-400',
          bg: 'bg-pink-500/10',
          border: 'border-pink-500/30',
          glow: 'shadow-pink-500/20',
          hex: '#ec4899',
          tagBg: 'bg-pink-500',
          tagText: 'text-white',
        };
    }
  };
  const accent = getAccent();

  const getDeviceImage = () => {
    switch (device.type) {
      case 'PS5':
        return <img src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=200&auto=format&fit=crop" alt="PS5" className="w-12 h-12 object-cover rounded-lg shadow-lg" />;
      case 'PS4':
        return <img src="https://images.unsplash.com/photo-1507457379470-08b800bebc67?q=80&w=200&auto=format&fit=crop" alt="PS4" className="w-12 h-12 object-cover rounded-lg shadow-lg" />;
      case 'PRIVATE':
      default:
        return <img src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=200&auto=format&fit=crop" alt="Private" className="w-12 h-12 object-cover rounded-lg shadow-lg" />;
    }
  };

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) { console.error('Audio failed', e); }
  };

  const calculateTotal = () => {
    if (!session) return '0.00';
    const currentNow = now || new Date(session.lastRateChangeTime || session.startTime).getTime();
    const lastChange = new Date(session.lastRateChangeTime || session.startTime).getTime();
    let end = session.isActive ? currentNow : new Date(session.endTime).getTime();

    if (session.type === 'FIXED' && session.durationMinutes) {
      const start = new Date(session.startTime).getTime();
      const maxEnd = start + session.durationMinutes * 60000;
      if (end > maxEnd) end = maxEnd;
    }

    const currentSegmentHours = Math.max(0, (end - lastChange) / 3600000);
    const rate = session.isMulti ? device.hourlyRateMulti : device.hourlyRateSingle;
    const currentSegmentCost = currentSegmentHours * rate;
    
    const accumulatedCost = session.accumulatedTimeCost || 0;
    const itemsCost = (session.orders || []).reduce((acc: number, o: any) => acc + o.priceAtTime * o.quantity, 0);
    
    return (accumulatedCost + currentSegmentCost + itemsCost).toFixed(2);
  };

  const getTimeCost = () => {
    if (!session) return '0.00';
    const currentNow = now || new Date(session.lastRateChangeTime || session.startTime).getTime();
    const lastChange = new Date(session.lastRateChangeTime || session.startTime).getTime();
    let end = session.isActive ? currentNow : new Date(session.endTime).getTime();

    if (session.type === 'FIXED' && session.durationMinutes) {
      const start = new Date(session.startTime).getTime();
      const maxEnd = start + session.durationMinutes * 60000;
      if (end > maxEnd) end = maxEnd;
    }

    const currentSegmentHours = Math.max(0, (end - lastChange) / 3600000);
    const rate = session.isMulti ? device.hourlyRateMulti : device.hourlyRateSingle;
    const currentSegmentCost = currentSegmentHours * rate;
    
    const accumulatedCost = session.accumulatedTimeCost || 0;
    return (accumulatedCost + currentSegmentCost).toFixed(2);
  };

  useEffect(() => {
    if (showOrderModal) getInventory().then(setInventory);
  }, [showOrderModal]);

  const handleAddOrder = async () => {
    if (!session) return;
    try {
      setIsPending(true);
      const items = Object.entries(selectedItems).filter(([_, qty]) => qty > 0).map(([itemId, qty]) => ({ itemId, quantity: qty }));
      if (items.length === 0) return;
      await addOrderToSession(session.id, items);
      router.refresh();
      toast.success('Added to bill');
      setShowOrderModal(false);
      setSelectedItems({});
    } catch { toast.error('Failed to add order'); }
    finally { setIsPending(false); }
  };

  const handleStart = async (type: 'OPEN' | 'FIXED') => {
    try {
      setIsPending(true);
      const minutes = type === 'FIXED' ? parseInt(fixedMinutes) : undefined;
      if (type === 'FIXED' && (!minutes || minutes <= 0)) {
        toast.error('Please enter valid positive minutes');
        setFixedMinutes('');
        return;
      }
      await startSession(device.id, type, minutes, isMultiMode);
      router.refresh();
      toast.success(`${isMultiMode ? 'Multi' : 'Single'} session started`);
      setFixedMinutes('');
    } catch { toast.error('Failed to start session'); }
    finally { setIsPending(false); }
  };

  const handleTransfer = async (targetDeviceId: string) => {
    if (!session) return;
    try {
      setIsPending(true);
      await transferSession(session.id, targetDeviceId);
      router.refresh();
      toast.success('Session transferred successfully');
      setShowTransferMode(false);
    } catch (err) { toast.error('Failed to transfer: ' + (err as Error).message); }
    finally { setIsPending(false); }
  };

  const handleEnd = async () => {
    if (!session) return;
    try {
      setIsPending(true);
      await endSession(session.id);
      router.refresh();
      toast.success('Session ended and billed');
      setShowCheckoutModal(false);
    } catch { toast.error('Failed to end session'); }
    finally { setIsPending(false); }
  };

  const handleToggleMode = async () => {
    if (!session) return;
    try {
      setIsPending(true);
      await toggleSessionMode(session.id);
      router.refresh();
      toast.success(t('device.modeSwitched'));
    } catch { toast.error('Failed to switch mode'); }
    finally { setIsPending(false); }
  };

  const handleRemoveOrder = async (orderId: string) => {
    try {
      setIsPending(true);
      await removeOrderFromSession(orderId);
      router.refresh();
      toast.success(t('device.orderRemoved'));
    } catch { toast.error('Failed to remove order'); }
    finally { setIsPending(false); }
  };

  useEffect(() => {
    if (!session || !session.isActive) return;
    setNow(Date.now()); // Set initial client-side time
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      const start = new Date(session.startTime).getTime();
      let diff = currentNow - start;
      const totalMs = session.type === 'FIXED' && session.durationMinutes ? session.durationMinutes * 60000 : Infinity;

      if (diff >= totalMs) {
        diff = totalMs;
        if (!showCheckoutModal && session.type === 'FIXED') {
          setShowCheckoutModal(true);
        }
      }

      const duration = intervalToDuration({ start: 0, end: diff });
      const h = String(duration.hours || 0).padStart(2, '0');
      const m = String(duration.minutes || 0).padStart(2, '0');
      const s = String(duration.seconds || 0).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);

      if (session.type === 'FIXED' && session.durationMinutes) {
        const remainingMs = totalMs - diff;
        if (remainingMs > 0) {
          const rd = intervalToDuration({ start: 0, end: remainingMs });
          const rm = String(rd.minutes || 0).padStart(2, '0');
          const rs = String(rd.seconds || 0).padStart(2, '0');
          setRemainingLabel(`-${rm}:${rs}`);
        } else {
          setRemainingLabel(t('device.timeUp'));
        }
        if (Math.abs(remainingMs - 60000) < 500) {
          toast.warning(`DEVICE #${device.number} - 1 MINUTE LEFT`, { description: 'Session is almost over.', duration: 5000 });
          playAlertSound();
        }
        if (Math.abs(remainingMs - 0) < 500) {
          toast.error(`DEVICE #${device.number} - TIME IS UP!`, { description: 'Session finished.', duration: 0 });
          playAlertSound();
        }
      } else {
        setRemainingLabel(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session, showCheckoutModal]);

  // ── Modal button base styles ──────────────────────
  const inputCls = "w-full bg-card border border-border rounded-xl py-3 px-4 outline-none text-base font-semibold text-white placeholder:text-muted-foreground/80 focus:border-blue-500/50 transition-colors";
  const selectCls = `${inputCls} cursor-pointer`;

  const renderModals = () => {
    if (!isMounted) return null;
    return createPortal(
      <AnimatePresence>
        {/* ── Checkout Modal ─────────────────────────── */}
        {showCheckoutModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isPending && setShowCheckoutModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-md p-6 sm:p-8 rounded-2xl relative z-[10000] border-t-4 max-h-[90vh] overflow-y-auto scrollbar-hide"
              style={{ borderTopColor: accent.hex, boxShadow: `0 20px 50px -12px ${accent.hex}33` }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={cn('flex justify-between items-center mb-6', isRTL && 'flex-row-reverse')}>
                <div className={isRTL ? 'text-right' : ''}>
                  <h2 className="text-xl font-black text-foreground">
                    {t('device.checkoutSettlement')} <span style={{ color: accent.hex }}>#{device.number}</span>
                  </h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">{t('device.finalizingDevice')}{device.number}</p>
                </div>
                <button onClick={() => setShowCheckoutModal(false)} className="p-2 hover:bg-muted rounded-xl transition text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('device.duration')}</p>
                    <p className="text-lg font-black text-foreground font-mono">{elapsed}</p>
                  </div>
                  <div className={cn('p-4 rounded-xl bg-card border border-border', isRTL ? 'text-left' : 'text-right')}>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('device.mode')}</p>
                    <p className="text-lg font-black" style={{ color: accent.hex }}>
                      {isMultiMode ? t('device.multi') : t('device.single')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={cn('flex justify-between text-base py-2 border-b border-border', isRTL && 'flex-row-reverse')}>
                    <span className="text-muted-foreground">{t('device.gamingTimeCost')}</span>
                    <span className="font-bold text-foreground">{getTimeCost()} EGP</span>
                  </div>

                  <div>
                    <span className="text-[13px] text-muted-foreground font-bold uppercase tracking-widest block mb-2">{t('device.orderItems')}</span>
                    {session && (session.orders || []).length > 0 ? (
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {session.orders.map((o: any, idx: number) => (
                          <div key={idx} className={cn('flex justify-between items-center text-base text-foreground/90 group', isRTL && 'flex-row-reverse')}>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleRemoveOrder(o.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all">
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <span>{o.inventoryItem?.name} x{o.quantity}</span>
                            </div>
                            <span>{(o.priceAtTime * o.quantity).toFixed(2)} EGP</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground/80 italic">{t('device.noCafeteriaItems')}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-dashed border-border">
                  <p className="text-[13px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('device.totalToCollect')}</p>
                  <div className="text-4xl font-black tracking-tighter" style={{ color: accent.hex }}>
                    {calculateTotal()} <span className="text-base">EGP</span>
                  </div>
                </div>
              </div>

              <div className={cn("grid gap-3", (session?.type === 'FIXED' && remainingLabel === t('device.timeUp')) ? "grid-cols-1" : "grid-cols-2")}>
                {!(session?.type === 'FIXED' && remainingLabel === t('device.timeUp')) && (
                  <button onClick={() => setShowCheckoutModal(false)}
                    className="py-3 rounded-xl border border-border text-muted-foreground font-bold hover:bg-muted transition-all">
                    {t('device.back')}
                  </button>
                )}
                <button disabled={isPending} onClick={handleEnd}
                  className="py-3 rounded-xl text-white font-black tracking-wide shadow-lg transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                  {isPending ? t('device.finishing') : t('device.collectEnd')}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Bill Summary Modal ──────────────────────── */}
        {showDetails && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card w-full max-w-sm p-7 rounded-2xl relative z-[10000] border-t-4"
              style={{ borderTopColor: accent.hex, boxShadow: `0 20px 50px -12px ${accent.hex}33` }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={cn('flex justify-between items-center mb-6', isRTL && 'flex-row-reverse')}>
                <h2 className="text-xl font-black text-foreground">{t('device.billSummary')}</h2>
                <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-muted rounded-xl text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                <div className={cn('flex justify-between text-base pb-3 border-b border-border', isRTL && 'flex-row-reverse')}>
                  <span className="text-muted-foreground text-sm font-bold uppercase">{t('device.station')}</span>
                  <span className="font-black" style={{ color: accent.hex }}>#{device.number} ({device.type})</span>
                </div>
                <div className={cn('flex justify-between text-base pb-3 border-b border-border', isRTL && 'flex-row-reverse')}>
                  <span className="text-muted-foreground text-sm font-bold uppercase">{t('device.startedAt')}</span>
                  <span className="font-bold text-white">{new Date(session.startTime).toLocaleTimeString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm font-bold uppercase block mb-2">{t('device.consumables')}</span>
                  {session && session.orders?.length > 0 ? (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {session.orders.map((o: any, i: number) => (
                        <div key={i} className={cn('flex justify-between items-center text-base group', isRTL && 'flex-row-reverse')}>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleRemoveOrder(o.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-foreground/90">{o.inventoryItem?.name || 'Item'} x{o.quantity}</span>
                          </div>
                          <span className="font-mono text-muted-foreground">{(o.priceAtTime * o.quantity).toFixed(2)} EGP</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base text-muted-foreground/80 italic">{t('device.noItemsOrdered')}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-dashed border-border mb-2 mt-4">
                <p className="text-[13px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('device.grandTotal')}</p>
                <div className="text-3xl font-black tracking-tighter text-foreground">
                  {calculateTotal()} <span className="text-base" style={{ color: accent.hex }}>EGP</span>
                </div>
              </div>

              <button onClick={() => setShowDetails(false)}
                className="w-full py-3 rounded-xl border border-border text-muted-foreground font-bold hover:bg-muted transition-all mt-4">
                {t('device.closeView')}
              </button>
            </motion.div>
          </div>
        )}

        {/* ── Order Modal ─────────────────────────────── */}
        {showOrderModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowOrderModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 16 }}
              className="glass-card w-full max-w-sm p-7 rounded-2xl relative z-[10000] border-t-4"
              style={{ borderTopColor: '#f59e0b', boxShadow: '0 20px 50px -12px rgba(245, 158, 11, 0.2)' }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={cn('flex justify-between items-center mb-5', isRTL && 'flex-row-reverse')}>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-amber-400" /> {t('nav.cafeteria')}
                </h2>
                <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-muted rounded-xl text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-3 mb-5 pr-1 scrollbar-hide">
                {inventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-border transition-all">
                    <div className={isRTL ? 'text-right' : ''}>
                      <h4 className="font-bold text-base text-foreground">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{item.price} EGP · {item.stock} left</p>
                    </div>
                    <div className="flex items-center gap-2 bg-background rounded-xl px-1 py-1">
                      <button onClick={() => setSelectedItems(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                        className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted text-muted-foreground font-bold">−</button>
                      <span className="w-6 text-center font-mono font-bold text-base text-foreground">{selectedItems[item.id] || 0}</span>
                      <button onClick={() => setSelectedItems(prev => ({ ...prev, [item.id]: Math.min(item.stock, (prev[item.id] || 0) + 1) }))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white"
                        style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <button disabled={isPending || Object.values(selectedItems).every(v => v === 0)} onClick={handleAddOrder}
                className="w-full py-3.5 rounded-xl font-black tracking-wide text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                {isPending ? t('device.adding') : t('device.addToSessionBill')}
              </button>
            </motion.div>
          </div>
        )}

        {/* ── Transfer Modal ──────────────────────────── */}
        {showTransferMode && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTransferMode(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 16 }}
              className="glass-card w-full max-w-sm p-7 rounded-2xl relative z-[10000] border-t-4"
              style={{ borderTopColor: '#818cf8', boxShadow: '0 20px 50px -12px rgba(129, 140, 248, 0.2)' }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={cn('flex justify-between items-center mb-5', isRTL && 'flex-row-reverse')}>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-violet-400" /> {t('device.transferStation')}
                </h2>
                <button onClick={() => setShowTransferMode(false)} className="p-2 hover:bg-muted rounded-xl text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-hide">
                {allDevices.filter(d => d.id !== device.id && d.sessions.length === 0).map(d => (
                  <button key={d.id} onClick={() => handleTransfer(d.id)}
                    className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted transition-all flex justify-between items-center group">
                    <span className="font-bold text-base text-foreground">Station #{d.number} ({d.type})</span>
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                  </button>
                ))}
                {allDevices.filter(d => d.id !== device.id && d.sessions.length === 0).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8 uppercase tracking-widest">{t('device.noAvailableStations')}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ 
        y: -5, 
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: session?.isActive ? accent.hex : '#475569',
        boxShadow: session?.isActive ? `0 10px 30px -10px ${accent.hex}44` : '0 10px 30px -10px rgba(0,0,0,0.5)'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ 
        backgroundColor: `rgba(${accent.hex === '#ec4899' ? '236, 72, 153' : accent.hex === '#3b82f6' ? '59, 130, 246' : '251, 191, 36'}, 0.08)`,
        borderLeft: `4px solid ${accent.hex}`,
        boxShadow: `inset 0 0 40px ${accent.hex}10, 0 8px 32px -4px rgba(0,0,0,0.3)`
      }}
      className={cn(
        'glass-card p-5 rounded-2xl relative overflow-hidden transition-all duration-300',
        session?.isActive ? accent.border : 'border-border'
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Type Tag */}
      <div className={cn(
        'absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl font-black text-base z-10',
        accent.tagBg, accent.tagText,
        isRTL && 'right-auto left-0 rounded-bl-none rounded-br-2xl'
      )}>
        {device.type === 'PRIVATE' ? t('inventory.private') : device.type}
      </div>

      {/* Header */}
      <div className={cn('flex items-center gap-4 mb-5 mt-1', isRTL && 'flex-row-reverse')}>
        <div className={cn('p-1 rounded-xl', accent.bg)}>
          {getDeviceImage()}
        </div>
        <div className={isRTL ? 'text-right' : ''}>
          <h3 className="text-xl font-black text-white">#{device.number}</h3>
          <p className={cn('text-sm uppercase tracking-widest font-bold', session?.isActive ? accent.text : 'text-muted-foreground/80')}>
            {session?.isActive ? t('device.inSession') : t('device.available')}
          </p>
        </div>
      </div>

      {/* Body */}
      {session?.isActive ? (
        <div className="space-y-4">
          {/* Timer */}
          <div className="relative text-center py-2">
            <div className="font-mono text-4xl font-black tracking-tighter text-foreground">{elapsed}</div>
            {remainingLabel && (
              <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'absolute -top-2 right-0 font-black text-[10px] px-2 py-0.5 rounded-lg',
                  remainingLabel === t('device.timeUp')
                    ? 'bg-red-500 text-white animate-bounce'
                    : 'bg-blue-500/20 text-blue-400'
                )}>
                {remainingLabel}
              </motion.div>
            )}
          </div>

          {/* Mode Toggle Switch */}
          <div className="bg-card/40 p-1.5 rounded-2xl border border-border/50 relative flex items-center gap-1">
            <button 
              disabled={isPending || !session.isMulti}
              onClick={handleToggleMode}
              className={cn(
                "flex-1 py-1.5 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all relative z-10",
                !session.isMulti ? "text-white" : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
            >
              {t('device.single')}
            </button>
            <button 
              disabled={isPending || session.isMulti}
              onClick={handleToggleMode}
              className={cn(
                "flex-1 py-1.5 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all relative z-10",
                session.isMulti ? "text-white" : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
            >
              {t('device.multi')}
            </button>
            
            {/* Animated Slider */}
            <motion.div
              initial={false}
              animate={{ x: session.isMulti ? '100%' : '0%' }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl z-0"
              style={{ 
                background: session.isMulti ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                boxShadow: session.isMulti ? '0 0 15px rgba(99, 102, 241, 0.4)' : '0 0 15px rgba(56, 189, 248, 0.4)'
              }}
            />
            
            {isPending && (
              <div className="absolute inset-x-0 -bottom-1 flex justify-center">
                <motion.div animate={{ scaleX: [0, 1, 0], x: [-100, 100] }} transition={{ repeat: Infinity, duration: 1 }} className="h-0.5 w-1/3 bg-white/40 blur-[1px]" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowOrderModal(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all text-sm font-bold group">
              <Beer className="w-4 h-4 transition-transform group-hover:scale-110" /> {t('device.cafeteria')}
            </button>
            <button onClick={() => setShowTransferMode(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white transition-all text-sm font-bold group">
              <ArrowRightLeft className="w-4 h-4 transition-transform group-hover:rotate-90" /> {t('device.transfer')}
            </button>
          </div>

          {/* Bill snippet */}
          <div className={cn(
            'flex justify-between items-center py-2.5 px-3 rounded-xl bg-card border border-border cursor-pointer hover:border-border transition',
            isRTL && 'flex-row-reverse'
          )} onClick={() => setShowDetails(true)}>
            <span className="text-[12px] text-muted-foreground font-bold uppercase">{t('device.currentBill')}</span>
            <span className="text-lg font-black" style={{ color: accent.hex }}>{calculateTotal()} EGP</span>
          </div>

          {/* Finish */}
          <button disabled={isPending} onClick={() => setShowCheckoutModal(true)}
            className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all font-bold flex items-center justify-center gap-2 group disabled:opacity-50">
            <Square className="w-4 h-4" /> {t('device.finishBill')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => setIsMultiMode(false)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-[12px] font-black tracking-widest border transition-all',
                !isMultiMode ? 'bg-blue-500/15 border-blue-500/40 text-blue-400' : 'bg-card border-border text-muted-foreground'
              )}>
              {t('device.single')}
            </button>
            <button onClick={() => setIsMultiMode(true)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-[12px] font-black tracking-widest border transition-all',
                isMultiMode ? 'bg-violet-500/15 border-violet-500/40 text-violet-400' : 'bg-card border-border text-muted-foreground'
              )}>
              {t('device.multi')}
            </button>
          </div>

          {/* Fixed time input */}
          <div className="flex gap-2">
            <div className="flex-1 bg-card rounded-xl border border-border flex items-center px-3 focus-within:border-blue-500/40 transition-colors">
              <Clock className="w-5 h-5 text-muted-foreground/80 mr-2 shrink-0" />
              <input
                type="number"
                placeholder={t('device.minutes')}
                value={fixedMinutes}
                onChange={(e) => setFixedMinutes(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-base font-medium text-white placeholder:text-foreground/80 py-3"
              />
            </div>
            <button disabled={isPending} onClick={() => handleStart('FIXED')}
              className="p-3 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white transition-all disabled:opacity-50 group">
              <Play className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button disabled={isPending} onClick={() => handleStart('OPEN')}
              className="flex-1 py-3 rounded-xl font-black text-sm tracking-widest flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] active:scale-[0.97] disabled:opacity-50 text-white group"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              <Play className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              {isPending ? t('device.starting') : t('device.startOpen')}
            </button>
            <button className="p-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all group">
              <Settings className="w-5 h-5 transition-transform group-hover:rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* Decorative glow */}
      <div className={cn('absolute -bottom-8 -left-8 w-24 h-24 blur-3xl rounded-full opacity-20 pointer-events-none', accent.bg)} />

      {renderModals()}
    </motion.div>
  );
};
