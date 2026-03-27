"use client";

import React, { useState } from 'react';
import { Users, UserPlus, User, Key, Trash2, Edit2, X } from 'lucide-react';
import { addUser, updateUser, deleteUser } from '../actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' '); }
interface StaffClientProps { users: any[] }

export default function StaffClient({ users }: StaffClientProps) {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'STAFF' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsPending(true);
    try {
      if (editingUser) { await updateUser(editingUser.id, formData); router.refresh(); toast.success('User updated'); }
      else { await addUser(formData); router.refresh(); toast.success('User added'); }
      setShowModal(false); setEditingUser(null);
      setFormData({ username: '', password: '', role: 'STAFF' });
    } catch { toast.error('Operation failed'); }
    finally { setIsPending(false); }
  };

  const handleDelete = async (id: string, username: string) => {
    if (username === 'admin') { toast.error('Cannot delete root admin'); return; }
    if (!confirm(`${t('staff.deleteConfirm')} ${username}?`)) return;
    try { await deleteUser(id); router.refresh(); toast.success('User deleted'); }
    catch { toast.error('Failed to delete user'); }
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setFormData({ username: user.username, password: user.password, role: user.role });
    setShowModal(true);
  };

  const inputCls = "w-full bg-card border border-border rounded-xl py-3 px-4 outline-none text-base font-semibold text-foreground placeholder:text-muted-foreground focus:border-blue-500/50 transition-colors";

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={cn('flex flex-col md:flex-row justify-between items-start md:items-center gap-4', isRTL && 'md:flex-row-reverse')}>
        <div className={isRTL ? 'text-right' : ''}>
          <h2 className="text-2xl font-black text-foreground mb-1">
            {t('staff.title')} <span className="text-violet-400">{t('staff.titleAccent')}</span>
          </h2>
          <p className="text-muted-foreground text-base">{t('staff.subtitle')}</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setFormData({ username: '', password: '', role: 'STAFF' }); setShowModal(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-base text-white transition hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}
        >
          <UserPlus className="w-4 h-4" /> {t('staff.recruitOperator')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((user) => (
          <motion.div layout key={user.id} className="glass-card p-6 rounded-2xl relative group border border-border">
            <div className={cn('flex justify-between items-start mb-5', isRTL && 'flex-row-reverse')}>
              <div className="p-3 rounded-xl bg-violet-500/10">
                <User className="w-6 h-6 text-violet-400" />
              </div>
              <div className={cn(
                'px-3 py-1 rounded-full text-xs font-black tracking-widest',
                user.role === 'ADMIN' ? 'badge badge-purple' : 'badge badge-muted'
              )}>
                {user.role}
              </div>
            </div>

            <h3 className={cn('text-lg font-black text-foreground mb-1 uppercase tracking-tight', isRTL && 'text-right')}>{user.username}</h3>
            <p className={cn('text-xs text-muted-foreground font-bold uppercase tracking-widest mb-6', isRTL && 'text-right')}>
              {t('staff.accessLevel')}: {user.role === 'ADMIN' ? t('staff.rootAccess') : t('staff.limitedAccess')}
            </p>

            <div className="flex gap-2">
              <button onClick={() => openEdit(user)}
                className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-all text-sm font-bold flex items-center justify-center gap-2">
                <Edit2 className="w-4 h-4" /> {t('staff.modify')}
              </button>
              <button onClick={() => handleDelete(user.id, user.username)}
                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/75 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 16 }}
              className="glass-card w-full max-w-sm p-7 rounded-2xl border border-border relative z-10"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={cn('flex justify-between items-center mb-6', isRTL && 'flex-row-reverse')}>
                <h2 className="text-xl font-black text-foreground">
                  {editingUser ? t('staff.modifyOperator') : t('staff.recruitModal')}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-xl text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] text-muted-foreground font-bold uppercase tracking-widest block">{t('staff.identifier')}</label>
                  <div className={cn('flex items-center gap-2 bg-card rounded-xl border border-border px-3 focus-within:border-blue-500/50 transition-colors', isRTL && 'flex-row-reverse')}>
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input type="text" required placeholder={t('staff.username')} value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="bg-transparent border-none outline-none w-full py-3 text-base font-medium text-foreground placeholder:text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] text-muted-foreground font-bold uppercase tracking-widest block">{t('staff.securityKey')}</label>
                  <div className={cn('flex items-center gap-2 bg-card rounded-xl border border-border px-3 focus-within:border-violet-500/50 transition-colors', isRTL && 'flex-row-reverse')}>
                    <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input type="text" required placeholder={t('staff.password')} value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-transparent border-none outline-none w-full py-3 text-base font-medium text-foreground placeholder:text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] text-muted-foreground font-bold uppercase tracking-widest block">{t('staff.accessLevel')}</label>
                  <div className="flex gap-2">
                    {['STAFF', 'ADMIN'].map(role => (
                      <button key={role} type="button" onClick={() => setFormData({ ...formData, role })}
                        className={cn(
                          'flex-1 py-2.5 rounded-xl text-xs font-black tracking-widest border transition-all',
                          formData.role === role
                            ? 'bg-violet-500/15 border-violet-500/40 text-violet-400'
                            : 'bg-card border-border text-muted-foreground'
                        )}>
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <button disabled={isPending}
                  className="w-full py-3.5 rounded-xl text-white font-black tracking-wide shadow-lg transition hover:opacity-90 active:scale-[0.97] disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
                  {isPending ? t('staff.processing') : editingUser ? t('staff.confirmChanges') : t('staff.initializeOperator')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
