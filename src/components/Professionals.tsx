/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Professional } from '../types';
import {
  Sparkles,
  User,
  Plus,
  Phone,
  CheckCircle,
  Briefcase,
  DollarSign,
  TrendingUp,
  Percent,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function Professionals() {
  const {
    professionals,
    bookings,
    services,
    categories,
    addProfessional,
    updateProfessional,
    updateBooking
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSpecialty, setFormSpecialty] = useState(() => categories[0]?.name || 'Manicure');
  const [formCommission, setFormCommission] = useState(40);
  const [formSelectedServices, setFormSelectedServices] = useState<string[]>([]);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

    if (editingProfId) {
      updateProfessional(editingProfId, {
        name: formName,
        phone: formPhone,
        specialties: [formSpecialty],
        commission: formCommission,
        services: formSelectedServices
      });
    } else {
      addProfessional({
        name: formName,
        phone: formPhone,
        specialties: [formSpecialty],
        commission: formCommission,
        services: formSelectedServices,
        active: true
      });
    }

    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingProfId(null);
    setFormName('');
    setFormPhone('');
    setFormSpecialty(categories[0]?.name || 'Manicure');
    setFormCommission(40);
    setFormSelectedServices([]);
  };

  const handleEdit = (p: Professional) => {
    setEditingProfId(p.id);
    setFormName(p.name);
    setFormPhone(p.phone);
    setFormSpecialty(p.specialties[0] || 'Manicure');
    setFormCommission(p.commission);
    setFormSelectedServices(p.services);
    setIsFormOpen(true);
  };

  const toggleStatus = (p: Professional) => {
    if (p.active) {
      const todayStr = new Date().toISOString().split('T')[0];
      const futureBks = bookings.filter(
        b => b.professionalId === p.id && 
             b.date >= todayStr && 
             b.status !== 'cancelado' && 
             b.status !== 'faltou' && 
             b.status !== 'finalizado'
      );

      if (futureBks.length > 0) {
        const otherProfs = professionals.filter(o => o.id !== p.id && o.active);
        if (otherProfs.length > 0) {
          const confirmTransfer = window.confirm(
            `Atenção: A profissional ${p.name} possui ${futureBks.length} agendamento(s) futuro(s).\n\nDeseja transferir esses agendamentos para outra profissional ativa? Clique em OK para transferir ou CANCELAR para inativar sem transferir.`
          );

          if (confirmTransfer) {
            const targetProf = otherProfs[0];
            futureBks.forEach(fb => {
              updateBooking(fb.id, {
                professionalId: targetProf.id,
                professionalName: targetProf.name
              });
            });
            alert(`Todos os ${futureBks.length} agendamento(s) futuros foram transferidos para a profissional ${targetProf.name} com sucesso!`);
          }
        } else {
          alert(`Atenção: A profissional ${p.name} possui ${futureBks.length} agendamento(s) futuro(s), mas não há outra profissional ativa para quem transferir.`);
        }
      }
    }
    updateProfessional(p.id, { active: !p.active });
  };

  // Compute stats for each professional
  const getProfessionalStats = (profId: string) => {
    const historical = bookings.filter(b => b.professionalId === profId && b.status === 'finalizado');
    
    let totalRevenue = 0;
    let totalCommission = 0;

    historical.forEach(h => {
      // Use checkout receipt math if available
      if (h.isPaid && h.paymentDetails) {
        // Base procedural price minus procedural discounts
        const proceduralBase = Math.max(0, h.value - h.paymentDetails.discount);
        totalRevenue += h.value;
        totalCommission += h.paymentDetails.commission;
      } else {
        totalRevenue += h.value;
        const rate = h.paymentDetails?.commission ?? 40;
        totalCommission += (h.value * rate) / 100;
      }
    });

    return {
      appointmentsCount: historical.length,
      totalRevenue,
      totalCommission
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header Action board */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-serif font-semibold text-sky-950">Quadro de Profissionais</h3>
          <p className="text-xs text-slate-400">Gerencie especialidades de atendimento, porcentagens de comissionamento e faturamento de equipe.</p>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" /> Adicionar Profissional
        </button>
      </div>

      {/* Grid of Professionals cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {professionals.map(p => {
          const stats = getProfessionalStats(p.id);
          
          return (
            <div
              key={p.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between h-72 relative transition-all hover:shadow-md ${
                p.active ? 'border-slate-100' : 'border-slate-200 bg-slate-50/50 opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-sky-950 flex items-center gap-1">
                        {p.name}
                        {p.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Ativo no salão" />}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{p.specialties.join(', ')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStatus(p)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500"
                    title={p.active ? "Inativar" : "Ativar"}
                  >
                    {p.active ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400 cursor-pointer" />
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {p.phone}
                </p>

                {/* Substantive list of skills taggings */}
                <div className="flex flex-wrap gap-1 pt-1 max-h-[50px] overflow-y-auto">
                  {p.services.map(id => {
                    const s = services.find(srv => srv.id === id);
                    return s ? (
                      <span key={id} className="text-[9px] font-semibold bg-sky-50 text-sky-800 rounded px-1.5 py-0.5 border border-sky-100/50">
                        {s.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Stats Counters cumulative */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs mt-3">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100/60">
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Faturou Proc.</span>
                  <strong className="text-slate-800 text-xs">{formatBRL(stats.totalRevenue)}</strong>
                </div>
                <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                  <span className="text-[9px] text-emerald-600 block uppercase font-mono">Comissão Devida</span>
                  <strong className="text-emerald-700 text-xs">{formatBRL(stats.totalCommission)}</strong>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-2 pt-2">
                <span>Comissão Padrão: <strong>{p.commission}%</strong></span>
                <button
                  onClick={() => handleEdit(p)}
                  className="text-sky-800 hover:underline font-bold"
                >
                  Configurações e Especialidade &rarr;
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL: Add/Edit Professional */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-sky-950">
              {editingProfId ? 'Editar Profissional' : 'Cadastrar Profissional'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do colaborador"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Celular / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98888-7777"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Especialidade Principal</label>
                  <select
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {categories.length === 0 && (
                      <>
                        <option value="Manicure">Manicure</option>
                        <option value="Designer de Cílios">Designer de Cílios</option>
                        <option value="Cabeleireira">Cabeleireira</option>
                        <option value="Esteticista">Esteticista</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Porcentagem de Comissão Padrão (%) *</label>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formCommission}
                    onChange={(e) => setFormCommission(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="bg-transparent border-none focus:outline-none w-full font-bold text-slate-700"
                  />
                </div>
              </div>

              {/* List of services she performs */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Vincular Serviços Habilitados</label>
                <select
                  multiple
                  value={formSelectedServices}
                  onChange={(e) => setFormSelectedServices(
                    Array.from(e.target.selectedOptions, option => (option as HTMLOptionElement).value)
                  )}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-24"
                >
                  {services.filter(s => s.active).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-light mt-0.5">Segure CTRL para marcar múltiplas atribuições.</p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-sky-950 hover:bg-sky-900 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Confirmar Cadastro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
