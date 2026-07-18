/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Client, Booking } from '../types';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Gift,
  Calendar,
  AlertTriangle,
  History,
  FileText,
  UserCheck,
  Package,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Filter
} from 'lucide-react';

export default function Clients() {
  const {
    clients,
    bookings,
    addClient,
    updateClient,
    deleteClient,
    packages,
    currentUser
  } = useApp();

  const canManageClients = currentUser?.role !== 'profissional';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'timeline'>('profile');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'services' | 'packages' | 'returns'>('all');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBirth, setFormBirth] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formObs, setFormObs] = useState('');
  const [formAllergies, setFormAllergies] = useState('');

  const formatPhone = (val: string) => {
    return val.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return c.status === 'ativo';
    return (
      (c.name.toLowerCase().includes(q) || c.phone.includes(q)) &&
      c.status === 'ativo'
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients) return;
    if (!formName || !formPhone) return;

    // Formato do celular / telefone
    const cleanPhone = (p: string) => p.replace(/\D/g, '');
    const cleanFormPhone = cleanPhone(formPhone);

    if (cleanFormPhone.length < 10) {
      alert('Por favor, insira um número de telefone válido com DDD (mínimo de 10 dígitos).');
      return;
    }

    if (formEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formEmail)) {
        alert('Por favor, insira um e-mail em formato válido.');
        return;
      }
    }

    // Validação de duplicidade de telefone
    const duplicatePhone = clients.find(
      c => c.id !== editingClientId && cleanPhone(c.phone) === cleanFormPhone
    );
    if (duplicatePhone) {
      alert(`Já existe um cadastro de cliente com o telefone ${formPhone} (Cliente: ${duplicatePhone.name}).`);
      return;
    }

    // Validação de duplicidade de e-mail
    if (formEmail) {
      const duplicateEmail = clients.find(
        c => c.id !== editingClientId && c.email && c.email.toLowerCase().trim() === formEmail.toLowerCase().trim()
      );
      if (duplicateEmail) {
        alert(`Já existe um cadastro de cliente com o e-mail ${formEmail} (Cliente: ${duplicateEmail.name}).`);
        return;
      }
    }

    try {
      if (editingClientId) {
        await updateClient(editingClientId, {
          name: formName,
          phone: formPhone,
          birthDate: formBirth,
          email: formEmail,
          address: formAddress,
          obs: formObs,
          allergies: formAllergies
        });
      } else {
        await addClient({
          name: formName,
          phone: formPhone,
          birthDate: formBirth || '1990-01-01',
          email: formEmail,
          address: formAddress,
          obs: formObs,
          allergies: formAllergies,
          status: 'ativo'
        });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível salvar a cliente.');
      return;
    }

    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingClientId(null);
    setFormName('');
    setFormPhone('');
    setFormBirth('');
    setFormEmail('');
    setFormAddress('');
    setFormObs('');
    setFormAllergies('');
  };

  const handleEdit = (c: Client) => {
    setEditingClientId(c.id);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormBirth(c.birthDate);
    setFormEmail(c.email || '');
    setFormAddress(c.address || '');
    setFormObs(c.obs || '');
    setFormAllergies(c.allergies || '');
    setIsFormOpen(true);
  };

  const getClientStats = (clientId: string) => {
    const history = bookings.filter(b => b.clientId === clientId && b.status === 'finalizado');
    const totalSpent = history.reduce((sum, b) => sum + b.value, 0);
    const lastVisit = history.length > 0 ? history[0].date : undefined;

    // Detect preferred professional
    const counts: Record<string, number> = {};
    history.forEach(h => {
      counts[h.professionalName] = (counts[h.professionalName] || 0) + 1;
    });
    let preferredProf = 'Não definida';
    let max = 0;
    Object.entries(counts).forEach(([prof, count]) => {
      if (count > max) {
        max = count;
        preferredProf = prof;
      }
    });

    return {
      totalVisits: history.length,
      totalSpent,
      lastVisit,
      preferredProf,
      history
    };
  };

  const getClientTimeline = (clientId: string) => {
    interface TimelineEvent {
      id: string;
      type: 'service' | 'package_purchase' | 'package_usage' | 'return_alert';
      date: string;
      title: string;
      subtitle?: string;
      value?: number;
      badge?: string;
      badgeColor?: string;
      obs?: string;
      professional?: string;
    }

    const events: TimelineEvent[] = [];

    // 1. Service history (Bookings)
    const clientBookings = bookings.filter(b => b.clientId === clientId);
    clientBookings.forEach(b => {
      let badge = '';
      let badgeColor = '';
      if (b.status === 'finalizado') {
        badge = 'Realizado';
        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
      } else if (b.status === 'cancelado') {
        badge = 'Cancelado';
        badgeColor = 'bg-rose-50 text-rose-600 border-rose-100';
      } else if (b.status === 'faltou') {
        badge = 'Faltou';
        badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
      } else if (b.status === 'agendado' || b.status === 'confirmado') {
        badge = 'Agendado';
        badgeColor = 'bg-sky-50 text-sky-700 border-sky-100';
      } else if (b.status === 'em_atendimento') {
        badge = 'Em Atendimento';
        badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
      } else {
        badge = b.status;
        badgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
      }

      events.push({
        id: `booking-${b.id}`,
        type: 'service',
        date: `${b.date} ${b.time}`,
        title: `${b.serviceName}`,
        subtitle: `Profissional: ${b.professionalName}`,
        value: b.value,
        badge,
        badgeColor,
        obs: b.obs,
        professional: b.professionalName
      });
    });

    // 2. Packages purchased
    const clientPackages = (packages || []).filter(p => p.clientId === clientId);
    clientPackages.forEach(p => {
      let purchaseDate = p.validityDate; // fallback
      if (p.usageHistory && p.usageHistory.length > 0) {
        const sortedHistory = [...p.usageHistory].sort((a, b) => a.date.localeCompare(b.date));
        if (sortedHistory[0]) {
          purchaseDate = sortedHistory[0].date.split(' ')[0];
        }
      } else {
        try {
          const valDate = new Date(p.validityDate + 'T00:00:00');
          valDate.setMonth(valDate.getMonth() - 2); // approximate purchase date
          purchaseDate = valDate.toISOString().split('T')[0];
        } catch (e) {
          purchaseDate = p.validityDate;
        }
      }

      let pBadge = 'Ativo';
      let pBadgeColor = 'bg-sky-50 text-sky-700 border-sky-100';
      if (p.status === 'concluido') {
        pBadge = 'Concluído';
        pBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
      } else if (p.status === 'vencido') {
        pBadge = 'Vencido';
        pBadgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
      }

      events.push({
        id: `package-purchase-${p.id}`,
        type: 'package_purchase',
        date: `${purchaseDate} 00:00`,
        title: `Compra de Pacote: ${p.name}`,
        subtitle: `Sessões: ${p.sessionsUsed}/${p.totalSessions} utilizadas`,
        value: p.value,
        badge: pBadge,
        badgeColor: pBadgeColor,
        obs: p.sessionsRemaining > 0 ? `Validade do pacote: ${p.validityDate.split('-').reverse().join('/')}` : `Todas as sessões consumidas.`
      });

      // 2.2 Package sessions usage
      if (p.usageHistory) {
        p.usageHistory.forEach((u, idx) => {
          events.push({
            id: `package-usage-${p.id}-${idx}`,
            type: 'package_usage',
            date: u.date,
            title: `Sessão Consumida: ${u.serviceName}`,
            subtitle: `Pacote: ${p.name} • Profissional: ${u.professionalName}`,
            obs: `Atendimento realizado descontando uma sessão do pacote adquirido.`
          });
        });
      }
    });

    // 3. Return maintenance alerts
    const client = clients.find(c => c.id === clientId);
    if (client && client.nextMaintenance) {
      events.push({
        id: `maintenance-${client.id}`,
        type: 'return_alert',
        date: `${client.nextMaintenance.date} 23:59`, // end of day
        title: `Previsão de Retorno: ${client.nextMaintenance.serviceName}`,
        subtitle: `Prazo recomendado para manutenção/retoque`,
        badge: client.nextMaintenance.notified ? 'Notificado' : 'Retorno Pendente',
        badgeColor: client.nextMaintenance.notified ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100 font-semibold',
        obs: `Período ideal para retorno do cliente para evitar danos ou perda do efeito do procedimento.`
      });
    }

    // Sort descending by date (newest first)
    return events.sort((a, b) => b.date.localeCompare(a.date));
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Top Action bar */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar cliente por nome ou celular..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-950 focus:bg-white transition-all text-slate-700"
          />
        </div>

        {canManageClients && (
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" /> Nova Cliente
          </button>
        )}
      </div>

      {/* Main Grid: list & details split-pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Clients List table */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-semibold text-sky-950 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-700" /> Listagem de Clientes
            </h3>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">{filteredClients.length} ativas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-500 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider text-[10px] uppercase">
                  <th className="py-2.5">Nome</th>
                  <th className="py-2.5">Celular</th>
                  <th className="py-2.5 hidden sm:table-cell">Última Visita</th>
                  <th className="py-2.5 hidden sm:table-cell">Alerta Alergias</th>
                  <th className="py-2.5 text-right">{canManageClients ? 'Ações' : 'Detalhes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map(c => {
                  const stats = getClientStats(c.id);
                  const isBirthdayMonth = c.birthDate && new Date(c.birthDate + 'T00:00:00').getMonth() === new Date().getMonth();
                  
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                        selectedClient?.id === c.id ? 'bg-sky-50/20 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 font-semibold text-sky-950 flex items-center gap-1.5">
                        {c.name}
                        {isBirthdayMonth && (
                          <Gift className="w-3.5 h-3.5 text-rose-500" title="Faz aniversário este mês!" />
                        )}
                      </td>
                      <td className="py-3 text-slate-600 font-mono">{c.phone}</td>
                      <td className="py-3 hidden sm:table-cell text-slate-400">
                        {c.lastVisit ? c.lastVisit.split('-').reverse().join('/') : 'Nunca visitou'}
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        {c.allergies ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[9px] font-semibold animate-pulse">
                            Alergia
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {canManageClients ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEdit(c)}
                              className="p-1 hover:bg-slate-100 rounded text-sky-800"
                              title="Editar Dados"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja inativar o cadastro da cliente ${c.name}?`)) {
                                  deleteClient(c.id);
                                  if (selectedClient?.id === c.id) setSelectedClient(null);
                                }
                              }}
                              className="p-1 hover:bg-rose-50 rounded text-rose-600"
                              title="Inativar Cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedClient(c)}
                            className="text-[10px] font-bold text-sky-800 hover:underline"
                          >
                            Visualizar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: CRM Client Side-Card Panel */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico & Ficha da Cliente</h3>

          {selectedClient ? (
            (() => {
              const stats = getClientStats(selectedClient.id);
              return (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-5 animate-in fade-in duration-200">
                  
                  {/* Header profile info */}
                  <div className="border-b border-slate-100 pb-4 space-y-1.5 text-center sm:text-left">
                    <h4 className="text-base font-serif font-bold text-sky-950">{selectedClient.name}</h4>
                    <p className="text-xs text-slate-500 font-mono flex items-center justify-center sm:justify-start gap-1">
                      <Phone className="w-3.5 h-3.5" /> {selectedClient.phone}
                    </p>
                    {selectedClient.email && <p className="text-xs text-slate-400">{selectedClient.email}</p>}
                    {selectedClient.address && <p className="text-[10px] text-slate-400 leading-relaxed">{selectedClient.address}</p>}
                  </div>

                  {/* Tab Switcher */}
                  <div className="flex border-b border-slate-100/80">
                    <button
                      onClick={() => setActiveDetailTab('profile')}
                      className={`flex-1 pb-2 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
                        activeDetailTab === 'profile'
                          ? 'border-sky-950 text-sky-950'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Cadastro & Ficha
                    </button>
                    <button
                      onClick={() => setActiveDetailTab('timeline')}
                      className={`flex-1 pb-2 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
                        activeDetailTab === 'timeline'
                          ? 'border-sky-950 text-sky-950'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Linha do Tempo
                    </button>
                  </div>

                  {activeDetailTab === 'profile' ? (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      {/* Core CRM statistics counters */}
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Visitas</span>
                          <strong className="text-lg text-sky-950">{stats.totalVisits} sessões</strong>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">Consumo Total</span>
                          <strong className="text-lg text-emerald-700">{stats.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </div>
                      </div>

                      {/* CRM parameters: preferences, allergies */}
                      <div className="space-y-3 text-xs">
                        <div className="flex gap-2">
                          <UserCheck className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-600 block">Profissional Preferida:</span>
                            <p className="text-slate-800">{stats.preferredProf}</p>
                          </div>
                        </div>

                        {selectedClient.birthDate && (
                          <div className="flex gap-2">
                            <Gift className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-slate-600 block">Aniversário:</span>
                              <p className="text-slate-800">
                                {selectedClient.birthDate.split('-').reverse().join('/')}
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedClient.allergies && (
                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold uppercase tracking-wider block text-[10px]">Restrições & Alergias:</span>
                              <p className="mt-0.5 italic text-rose-900 font-semibold">"{selectedClient.allergies}"</p>
                            </div>
                          </div>
                        )}

                        {selectedClient.obs && (
                          <div className="flex gap-2">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-slate-500 block">Observações de Ficha:</span>
                              <p className="text-slate-600 italic">"{selectedClient.obs}"</p>
                            </div>
                          </div>
                        )}

                        {selectedClient.nextMaintenance && (
                          <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-sky-950 block text-[10px] uppercase">Próximo Prazo de Retorno:</span>
                              <p className="text-[11px] text-slate-600 mt-0.5">
                                {selectedClient.nextMaintenance.serviceName} em:{' '}
                                <strong className="text-sky-900">{selectedClient.nextMaintenance.date.split('-').reverse().join('/')}</strong>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* List of past visitation logs */}
                      <div className="space-y-2 border-t border-slate-100 pt-4">
                        <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <History className="w-3.5 h-3.5" /> Histórico Rápido
                        </span>

                        {stats.history.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">Nenhum agendamento finalizado ainda.</p>
                        ) : (
                          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                            {stats.history.map((h, idx) => (
                              <div key={`${h.id}-${idx}`} className="p-2 bg-slate-50 rounded-lg text-[11px] flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-sky-950">{h.serviceName}</p>
                                  <p className="text-[10px] text-slate-400">{h.date.split('-').reverse().join('/')} com {h.professionalName}</p>
                                </div>
                                <span className="font-bold text-slate-600">{h.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      
                      {/* Timeline filter chips */}
                      {(() => {
                        const allEvents = getClientTimeline(selectedClient.id);
                        const servicesCount = allEvents.filter(e => e.type === 'service').length;
                        const packagesCount = allEvents.filter(e => e.type === 'package_purchase' || e.type === 'package_usage').length;
                        const returnsCount = allEvents.filter(e => e.type === 'return_alert').length;

                        const filteredEvents = allEvents.filter(e => {
                          if (timelineFilter === 'all') return true;
                          if (timelineFilter === 'services') return e.type === 'service';
                          if (timelineFilter === 'packages') return e.type === 'package_purchase' || e.type === 'package_usage';
                          if (timelineFilter === 'returns') return e.type === 'return_alert';
                          return true;
                        });

                        return (
                          <>
                            <div className="flex flex-wrap gap-1 items-center bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                              <button
                                onClick={() => setTimelineFilter('all')}
                                className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  timelineFilter === 'all'
                                    ? 'bg-sky-950 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Todos <span className={`px-1 rounded-full text-[8px] ${timelineFilter === 'all' ? 'bg-sky-850 text-amber-100' : 'bg-slate-200 text-slate-600'}`}>{allEvents.length}</span>
                              </button>
                              <button
                                onClick={() => setTimelineFilter('services')}
                                className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  timelineFilter === 'services'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Serviços <span className={`px-1 rounded-full text-[8px] ${timelineFilter === 'services' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'}`}>{servicesCount}</span>
                              </button>
                              <button
                                onClick={() => setTimelineFilter('packages')}
                                className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  timelineFilter === 'packages'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Pacotes <span className={`px-1 rounded-full text-[8px] ${timelineFilter === 'packages' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'}`}>{packagesCount}</span>
                              </button>
                              <button
                                onClick={() => setTimelineFilter('returns')}
                                className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  timelineFilter === 'returns'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Retornos <span className={`px-1 rounded-full text-[8px] ${timelineFilter === 'returns' ? 'bg-rose-700 text-rose-100' : 'bg-slate-200 text-slate-600'}`}>{returnsCount}</span>
                              </button>
                            </div>

                            {/* Timeline Visual Feed */}
                            {filteredEvents.length === 0 ? (
                              <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4">
                                <History className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                                <p className="text-[10px] text-slate-400 italic">Nenhum evento registrado nesta categoria.</p>
                              </div>
                            ) : (
                              <div className="relative border-l-2 border-slate-100 pl-4 ml-2.5 py-1 space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                                {filteredEvents.map((event, idx) => {
                                  let Icon = Calendar;
                                  let iconBg = 'bg-slate-100 text-slate-600';
                                  
                                  if (event.type === 'service') {
                                    Icon = Sparkles;
                                    iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                                  } else if (event.type === 'package_purchase') {
                                    Icon = Package;
                                    iconBg = 'bg-indigo-50 text-indigo-600 border border-indigo-100';
                                  } else if (event.type === 'package_usage') {
                                    Icon = CheckCircle2;
                                    iconBg = 'bg-sky-50 text-sky-600 border border-sky-100';
                                  } else if (event.type === 'return_alert') {
                                    Icon = Clock;
                                    iconBg = 'bg-rose-50 text-rose-600 border border-rose-100';
                                  }

                                  return (
                                    <div key={`${event.id}-${idx}`} className="relative">
                                      {/* Visual Dot Overlap */}
                                      <div className={`absolute -left-[25px] top-0.5 p-1 rounded-full ${iconBg} z-10 flex items-center justify-center shadow-xs`}>
                                        <Icon className="w-3 h-3" />
                                      </div>

                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                          <span>
                                            {event.date.split(' ')[0].split('-').reverse().join('/')} 
                                            {event.date.includes(' ') && event.date.split(' ')[1] !== '00:00' && event.date.split(' ')[1] !== '23:59' 
                                              ? ` às ${event.date.split(' ')[1]}` 
                                              : ''}
                                          </span>
                                          {event.badge && (
                                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${event.badgeColor}`}>
                                              {event.badge}
                                            </span>
                                          )}
                                        </div>

                                        <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl p-2.5 transition-all">
                                          <h5 className="font-bold text-slate-800 text-[11px]">{event.title}</h5>
                                          {event.subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{event.subtitle}</p>}
                                          
                                          {event.value !== undefined && event.value > 0 && (
                                            <p className="text-[10px] font-mono font-bold text-slate-700 mt-0.5">
                                              Valor: {event.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                          )}

                                          {/* Highlighted return/service observations */}
                                          {event.obs && (
                                            <div className="mt-1.5 pt-1.5 border-t border-slate-100/60 text-[10px] text-slate-600">
                                              <span className="font-bold text-slate-400 block text-[8px] uppercase tracking-wider mb-0.5">
                                                {event.type === 'return_alert' ? 'Observações de Retorno:' : 'Observação / Feedback:'}
                                              </span>
                                              <p className="italic bg-white p-1.5 rounded-lg border border-slate-100/50 text-slate-700 font-medium">
                                                "{event.obs}"
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                </div>
              );
            })()
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-xs">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Selecione uma cliente na tabela ao lado para visualizar a ficha cadastral completa, histórico de sessões e faturamento.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL FORM: Add / Edit Client */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <h3 className="text-base font-serif font-bold text-sky-950">
                {editingClientId ? 'Editar Cadastro de Cliente' : 'Cadastrar Nova Cliente'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-600">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome da cliente"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">WhatsApp / Celular *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-8888"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Data de Nascimento</label>
                  <input
                    type="date"
                    value={formBirth}
                    onChange={(e) => setFormBirth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-600">E-mail</label>
                <input
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-600">Endereço Residencial</label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro - Cidade"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-rose-700">Restrições / Alergias Químicas</label>
                <input
                  type="text"
                  placeholder="Ex: Alergia a tolueno, formol, esmaltes acrílicos..."
                  value={formAllergies}
                  onChange={(e) => setFormAllergies(e.target.value)}
                  className="w-full px-3 py-2 bg-rose-50/50 border border-rose-100 rounded-xl focus:outline-none text-rose-950 font-medium placeholder:text-rose-400"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-600">Observações de Prontuário</label>
                <textarea
                  rows={2}
                  placeholder="Preferências de esmalte, temperatura do café, observações importantes..."
                  value={formObs}
                  onChange={(e) => setFormObs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-950 hover:bg-sky-900 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Salvar Cadastro
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
