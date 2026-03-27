"use client";

import React, { useState } from 'react';
import { Gamepad2, Plus, Trash2, Edit2, Monitor, X } from 'lucide-react';
import { addDevice, updateDevice, deleteDevice } from '../actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' '); }

interface DevicesPageProps { initialDevices: any[]; user: any; }

export default function DevicesManagerPage({ initialDevices, user }: DevicesPageProps) {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({ number: '', type: 'PS5', hourlyRateSingle: 20, hourlyRateMulti: 30 });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsPending(true);
      await addDevice(formData);
      router.refresh();
      toast.success(`${t('devices.stationNumber')} #${formData.number} added!`);
      setShowAddModal(false); resetForm();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setIsPending(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;
    try {
      setIsPending(true);
      await updateDevice(editingDevice.id, formData);
      router.refresh();
      toast.success(`#${formData.number} updated!`);
      setEditingDevice(null); resetForm();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setIsPending(false); }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`${t('devices.deleteConfirm')}${number}${t('devices.deleteWarning')}`)) return;
    try { setIsPending(true); await deleteDevice(id); router.refresh(); toast.success('Device removed'); }
    catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setIsPending(false); }
  };

  const startEdit = (device: any) => {
    setEditingDevice(device);
    setFormData({ number: device.number, type: device.type, hourlyRateSingle: device.hourlyRateSingle, hourlyRateMulti: device.hourlyRateMulti });
  };

  const resetForm = () => setFormData({ number: '', type: 'PS5', hourlyRateSingle: 20, hourlyRateMulti: 30 });

  const inputCls = "w-full bg-card border border-border rounded-xl py-3 px-4 outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-blue-500/50 transition-colors";

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={cn('flex flex-col md:flex-row justify-between items-start md:items-center gap-4', isRTL && 'md:flex-row-reverse')}>
        <div className={isRTL ? 'text-right' : ''}>
          <h2 className="text-2xl font-black text-foreground mb-1">
            {t('devices.title')} <span className="text-blue-400">{t('devices.titleAccent')}</span>
          </h2>
          <p className="text-muted-foreground text-sm">{t('devices.subtitle')}</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={() => { resetForm(); setShowAddModal(true); }}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-base text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
            <Plus className="w-4 h-4" /> {t('devices.addNew')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {initialDevices.map((device) => (
          <div key={device.id} className="glass-card p-6 rounded-2xl relative group overflow-hidden">
            <div className={cn('flex justify-between items-start mb-5', isRTL && 'flex-row-reverse')}>
              <div className={cn('p-3 rounded-xl', device.type === 'PRIVATE' ? 'bg-amber-500/10' : 'bg-violet-500/10')}>
                {device.type === 'PRIVATE'
                  ? <Monitor className="w-5 h-5 text-amber-500" />
                  : <Gamepad2 className="w-5 h-5 text-violet-400" />}
              </div>
              {user?.role === 'ADMIN' && (
                <div className="flex gap-2">
                  <button onClick={() => startEdit(device)}
                    className="p-2 rounded-lg bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(device.id, device.number)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className={cn('mb-5', isRTL && 'text-right')}>
              <h3 className="text-lg font-black text-foreground mb-0.5">Station #{device.number}</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{device.type} {t('devices.configuration')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border">
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">{t('devices.singleRate')}</p>
                <p className="text-base font-black text-blue-400">{device.hourlyRateSingle} <span className="text-[10px]">EGP/HR</span></p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">{t('devices.multiRate')}</p>
                <p className="text-base font-black text-violet-400">{device.hourlyRateMulti} <span className="text-[10px]">EGP/HR</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {(showAddModal || editingDevice) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setEditingDevice(null); }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card w-full max-w-sm p-7 rounded-2xl border border-border relative z-10"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={cn('flex justify-between items-center mb-6', isRTL && 'flex-row-reverse')}>
                <h2 className="text-xl font-black text-foreground">
                  {editingDevice ? t('devices.editStation') : t('devices.newStation')}
                </h2>
                <button onClick={() => { setShowAddModal(false); setEditingDevice(null); }}
                  className="p-2 hover:bg-muted rounded-xl text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={editingDevice ? handleUpdate : handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest block">{t('devices.stationNumber')}</label>
                  <input type="text" required value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className={inputCls} placeholder="E.g. PS-07" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest block">{t('devices.deviceType')}</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={cn(inputCls, 'cursor-pointer')}>
                    <option className="bg-card" value="PS5">PS5</option>
                    <option className="bg-card" value="PS4">PS4</option>
                    <option className="bg-card" value="PRIVATE">{t('inventory.private')}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest block">{t('devices.singleLabel')}</label>
                    <input type="number" required value={formData.hourlyRateSingle}
                      onChange={(e) => setFormData({ ...formData, hourlyRateSingle: parseInt(e.target.value) })}
                      className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest block">{t('devices.multiLabel')}</label>
                    <input type="number" required value={formData.hourlyRateMulti}
                      onChange={(e) => setFormData({ ...formData, hourlyRateMulti: parseInt(e.target.value) })}
                      className={inputCls} />
                  </div>
                </div>
                <button disabled={isPending}
                  className="w-full py-3.5 rounded-xl text-white font-black tracking-wide shadow-lg transition hover:opacity-90 active:scale-[0.97] disabled:opacity-50 mt-2"
                  style={{ background: editingDevice ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                  {isPending ? t('devices.processing') : editingDevice ? t('devices.saveChanges') : t('devices.commitStation')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
