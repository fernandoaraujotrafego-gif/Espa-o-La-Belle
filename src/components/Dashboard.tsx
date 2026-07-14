/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp, addMinutesToTime } from '../context/AppContext';
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Activity,
  Award
} from 'lucide-react';

export default function Dashboard({ setTab }: { setTab: (tab: string) => void }) {
  const {
    bookings,
    clients,
    products,
    getBirthdayList,
    getLowStockProducts,
    getUpcomingMaintenanceList,
    settings,
    currentUser
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const getFormattedToday = () => {
    const d = new Date();
    const day = d.getDate();
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${day} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  };

  const isMale = currentUser?.name?.toLowerCase().includes('fernando') || currentUser?.name?.split(' ')[0]?.toLowerCase().endsWith('o');
  const welcomeWord = isMale ? 'Bem-vindo' : 'Bem-vinda';

  // Filter bookings for today
  const todayBookings = bookings.filter(b => b.date === todayStr);

  // Statistics calculations
  const totalBookings = todayBookings.length;
  
  const completedServices = todayBookings.filter(b => b.status === 'finalizado').length;
  
  const pendingServices = todayBookings.filter(
    b => ['agendado', 'confirmado', 'em_atendimento', 'reagendado'].includes(b.status)
  ).length;

  const confirmedClients = todayBookings.filter(
    b => ['confirmado', 'finalizado', 'em_atendimento'].includes(b.status)
  ).length;

  const noShowClients = todayBookings.filter(b => b.status === 'faltou').length;

  // Revenue computations
  const totalRevenue = todayBookings
    .filter(b => b.isPaid && b.paymentDetails)
    .reduce((sum, b) => sum + (b.paymentDetails?.gross ?? 0), 0);

  // Cashier transactions calculation (including manual cashier additions if today)
  const revenueByMethod: Record<string, number> = {};
  todayBookings.forEach(b => {
    if (b.isPaid && b.paymentDetails) {
      const method = b.paymentDetails.method;
      revenueByMethod[method] = (revenueByMethod[method] || 0) + b.paymentDetails.gross;
    }
  });

  // Unique active professionals today
  const activeProfs = Array.from(new Set(todayBookings.map(b => b.professionalName)));

  // Alerts data
  const birthdaysToday = getBirthdayList();
  const lowStock = getLowStockProducts();
  const maintenanceOverdue = getUpcomingMaintenanceList();

  // Upcoming appointments (not finished, not cancelled/failed) sorted by time
  const upcomingAppointments = todayBookings
    .filter(b => ['agendado', 'confirmado', 'em_atendimento'].includes(b.status))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Quick WhatsApp message generator helper
  const handleSendWhatsApp = (phone: string, text: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      // Já possui DDI 55
    } else {
      cleanPhone = `55${cleanPhone}`;
    }
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'confirmado': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'em_atendimento': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'finalizado': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'faltou': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'cancelado': return 'bg-slate-50 text-slate-400 border-slate-200';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#2B4C7E] to-[#1E293B] rounded-2xl p-6 shadow-md border border-[#D4AF37]/10 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold italic tracking-wide flex items-center gap-2 text-white">
            Olá, {currentUser?.name || 'Juliana'}! ✨ <span className="text-sm font-sans font-normal text-[#D4AF37]">Espaço La Belle Agenda</span>
          </h2>
          <p className="text-xs text-[#F0F4F8]/80 mt-1 max-w-xl">
            {welcomeWord} ao seu painel administrativo. Veja o resumo operacional e financeiro do salão para hoje, <strong>{getFormattedToday()}</strong>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setTab('agenda')}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Novo Agendamento
          </button>
          <button
            onClick={() => setTab('caixa')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Fluxo de Caixa
          </button>
        </div>
      </div>

      {/* Main KPI Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Agendamentos</span>
            <Calendar className="w-5 h-5 text-sky-700" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-sky-950">{totalBookings}</span>
            <span className="text-[10px] text-slate-400 font-mono">hoje</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-600">{completedServices}</span> realizados / 
            <span className="font-semibold text-amber-600">{pendingServices}</span> pendentes
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Faturamento</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-sky-950">{formatBRL(totalRevenue)}</span>
            <span className="text-[10px] text-slate-400 font-mono">caixa</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Vendas consolidadas do dia
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Presença</span>
            <CheckCircle className="w-5 h-5 text-teal-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-sky-950">{confirmedClients}</span>
            <span className="text-[10px] text-slate-400 font-mono">presenças</span>
          </div>
          <div className="mt-1.5 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
            <XCircle className="w-3.5 h-3.5" />
            {noShowClients} {noShowClients === 1 ? 'cliente faltou' : 'clientes faltaram'} hoje
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Profissionais</span>
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-sky-950">{activeProfs.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">com agenda</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 truncate">
            {activeProfs.join(', ') || 'Nenhum com atendimento'}
          </div>
        </div>
      </div>

      {/* Grid: Alerts & Important lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Alerts Panel */}
        <div className="space-y-4 lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alertas Importantes</h3>

          {/* Birthday list alerts */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs uppercase tracking-wider">
              <Gift className="w-4 h-4 text-rose-500 animate-bounce" />
              <span>Aniversariantes ({birthdaysToday.length})</span>
            </div>
            {birthdaysToday.length === 0 ? (
              <p className="text-xs text-slate-400 font-light">Nenhum cliente faz aniversário hoje.</p>
            ) : (
              <div className="space-y-2">
                {birthdaysToday.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 border border-rose-100 text-xs">
                    <div>
                      <p className="font-semibold text-rose-950">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.phone}</p>
                    </div>
                    <button
                      onClick={() => {
                        const msg = `Olá, ${c.name}! Tudo bem? 🌸 Nós do Espaço La Belle desejamos um feliz aniversário! Que seu dia seja cheio de luz e beleza. Como presente, temos um mimo especial reservado para você em sua próxima visita. Vamos agendar seu horário? 💕`;
                        handleSendWhatsApp(c.phone, msg);
                      }}
                      className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                      title="Parabenizar no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 fill-emerald-500/15" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock alerts */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Estoque Baixo ({lowStock.length})</span>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-xs text-slate-400 font-light">Todos os insumos e produtos estão com estoque ideal.</p>
            ) : (
              <div className="space-y-2">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100 text-xs">
                    <div>
                      <p className="font-semibold text-amber-950 truncate max-w-[150px]">{p.name}</p>
                      <p className="text-[10px] text-amber-600 font-medium">Qtd atual: {p.quantity} (Mín: {p.minQuantity})</p>
                    </div>
                    <button
                      onClick={() => setTab('estoque')}
                      className="p-1 px-2 text-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-sky-950 rounded-md transition-colors cursor-pointer"
                    >
                      Abastecer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manutenções a Vencer alerts */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Manutenções a Vencer ({maintenanceOverdue.length})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">prazo 5 dias</span>
            </div>
            {maintenanceOverdue.length === 0 ? (
              <p className="text-xs text-slate-400 font-light text-left py-2">Nenhuma cliente com manutenção a vencer.</p>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {maintenanceOverdue.map(({ client, date, serviceName, category, lastServiceDate, lastServiceTime, professionalName, overdue }, idx) => {
                  const lastDateFormatted = lastServiceDate.split('-').reverse().join('/');
                  const msg = `Olá, ${client.name}! Tudo bem? 💙\n\nSua última manutenção foi ${lastDateFormatted}.\nEstamos entrando em contato para verificar se deseja realizar seu agendamento.\nManter as manutenções em dia é fundamental 💙`;
                  
                  return (
                    <div key={`${client.id}-${category}-${idx}`} className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2.5 ${
                      overdue ? 'bg-rose-50/20 border-rose-100 text-rose-950' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="space-y-1 text-left">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-slate-900 text-xs">{client.name}</p>
                          <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded border ${
                            overdue 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {overdue ? 'Vencido' : 'A Vencer'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span className="font-semibold text-sky-950">{serviceName}</span> com <span className="font-medium text-slate-600">{professionalName}</span>
                        </p>
                        <p className="text-[9.5px] text-slate-400">
                          Último serviço: {lastDateFormatted} às {lastServiceTime}
                        </p>
                        <p className="text-[10px] font-mono font-bold text-rose-700">
                          Prazo Limite: {date.split('-').reverse().join('/')}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleSendWhatsApp(client.phone, msg)}
                        className="w-full py-1.5 px-3 bg-[#2B4C7E] hover:bg-[#1E293B] text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[10px]"
                        title="Enviar mensagem para o WhatsApp da cliente"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white/10" /> Enviar WhatsApp
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Upcoming Bookings lists & Financial breakdown */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Upcoming Bookings panel */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-serif font-semibold text-sky-950">Próximos Agendamentos de Hoje</h3>
                <p className="text-xs text-slate-400">Total de {upcomingAppointments.length} restantes na fila</p>
              </div>
              <button
                onClick={() => setTab('agenda')}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
              >
                Ver Agenda Completa <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Sem agendamentos pendentes para hoje.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingAppointments.slice(0, 5).map((b, idx) => (
                  <div key={`${b.id}-${idx}`} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="px-2.5 py-1.5 bg-slate-100 font-mono text-xs font-bold text-slate-700 rounded-lg text-center shrink-0">
                        {b.time}
                        <span className="block text-[9px] text-slate-400 font-light mt-0.5">{addMinutesToTime(b.time, b.duration)}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-sky-950">{b.clientName}</h4>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-sky-700">{b.serviceName}</span> com {b.professionalName}
                        </p>
                        {b.obs && <p className="text-[10px] text-slate-400 italic mt-0.5">Obs: "{b.obs}"</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full border ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                      <button
                        onClick={() => {
                          let msg = settings.defaultMessages?.confirmation || 'Olá {cliente}, seu agendamento de {servico} com {profissional} está marcado para o dia {data} às {hora}.';
                          const replacements: Record<string, string> = {
                            '\\{cliente\\}': b.clientName || '',
                            '\\{servico\\}': b.serviceName || '',
                            '\\{profissional\\}': b.professionalName || '',
                            '\\{data\\}': b.date ? b.date.split('-').reverse().join('/') : '',
                            '\\{hora\\}': b.time || '',
                            '\\{valor\\}': formatBRL(b.value || 0)
                          };
                          Object.entries(replacements).forEach(([placeholder, val]) => {
                            msg = msg.replace(new RegExp(placeholder, 'gi'), val);
                          });
                          handleSendWhatsApp(b.clientPhone, msg);
                        }}
                        className="p-1 px-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                        title="Enviar mensagem de agendamento"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-500/10" /> Confirmar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Cash Flow Breakdown */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-serif font-semibold text-sky-950">Faturamento por Forma de Pagamento (Hoje)</h3>
            
            {Object.keys(revenueByMethod).length === 0 ? (
              <p className="text-xs text-slate-400 font-light text-center py-4 bg-slate-50/50 rounded-xl">Nenhuma venda faturada hoje.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(revenueByMethod).map(([method, amount]) => {
                    const percentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                    return (
                      <div key={method} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate">{method}</span>
                        <p className="text-base font-bold text-sky-950 mt-1">{formatBRL(amount)}</p>
                        <span className="text-[10px] font-mono text-emerald-600 mt-0.5">{percentage.toFixed(1)}% do dia</span>
                      </div>
                    );
                  })}
                </div>

                {/* Interactive bar graphical representation */}
                <div className="h-2 bg-slate-100 rounded-full flex overflow-hidden mt-4">
                  {Object.entries(revenueByMethod).map(([method, amount], idx) => {
                    const widthPct = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                    const colors = ['bg-sky-700', 'bg-amber-500', 'bg-indigo-600', 'bg-emerald-500', 'bg-rose-500'];
                    const colorClass = colors[idx % colors.length];
                    return (
                      <div
                        key={method}
                        className={`${colorClass}`}
                        style={{ width: `${widthPct}%` }}
                        title={`${method}: ${formatBRL(amount)}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
