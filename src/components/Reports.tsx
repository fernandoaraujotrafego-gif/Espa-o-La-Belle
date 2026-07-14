/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Layers,
  Calendar,
  MessageCircle,
  Clock,
  Sparkles,
  Award,
  Filter,
  Download,
  Printer,
  Users,
  Search,
  ChevronRight,
  Package,
  ShoppingBag,
  Percent,
  Activity,
  AlertTriangle,
  FileText,
  UserCheck,
  UserX,
  PlusCircle,
  ArrowRight
} from 'lucide-react';

interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface ReportCategory {
  title: string;
  reports: ReportDefinition[];
}

export default function Reports() {
  const {
    bookings,
    clients,
    products,
    professionals,
    services,
    settings,
    packages
  } = useApp();

  const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getFirstDayOfMonthString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  };

  // State
  const [selectedReportId, setSelectedReportId] = useState<string>('agendamentos_periodo');
  const [startDate, setStartDate] = useState<string>(getFirstDayOfMonthString());
  const [endDate, setEndDate] = useState<string>(getTodayString());
  const [filterProfId, setFilterProfId] = useState<string>('all');
  const [filterServiceId, setFilterServiceId] = useState<string>('all');
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [filterPayMethod, setFilterPayMethod] = useState<string>('all');
  const [reportSearch, setReportSearch] = useState<string>('');

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const getDayOfWeekName = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return 'Desconhecido';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const days = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado'
    ];
    return days[d.getDay()];
  };

  // Quick Date Selectors
  const setQuickRange = (range: 'hoje' | 'ontem' | '7dias' | 'esteMes' | 'mesPassado' | 'tudo') => {
    const today = new Date();
    const todayStr = getTodayString();

    if (range === 'hoje') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (range === 'ontem') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (range === '7dias') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      const past7Str = `${past7.getFullYear()}-${String(past7.getMonth() + 1).padStart(2, '0')}-${String(past7.getDate()).padStart(2, '0')}`;
      setStartDate(past7Str);
      setEndDate(todayStr);
    } else if (range === 'esteMes') {
      setStartDate(getFirstDayOfMonthString());
      setEndDate(todayStr);
    } else if (range === 'mesPassado') {
      const firstOfThis = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastOfLast = new Date(firstOfThis.getTime() - 24 * 60 * 60 * 1000);
      const firstOfLast = new Date(lastOfLast.getFullYear(), lastOfLast.getMonth(), 1);

      const fStr = `${firstOfLast.getFullYear()}-${String(firstOfLast.getMonth() + 1).padStart(2, '0')}-01`;
      const lStr = `${lastOfLast.getFullYear()}-${String(lastOfLast.getMonth() + 1).padStart(2, '0')}-${String(lastOfLast.getDate()).padStart(2, '0')}`;
      setStartDate(fStr);
      setEndDate(lStr);
    } else if (range === 'tudo') {
      setStartDate('2025-01-01');
      setEndDate('2028-12-31');
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    const isAfterStart = !startDate || b.date >= startDate;
    const isBeforeEnd = !endDate || b.date <= endDate;
    const matchesProf = filterProfId === 'all' || b.professionalId === filterProfId;
    const matchesSrv = filterServiceId === 'all' || b.serviceId === filterServiceId;
    const matchesClient = filterClientId === 'all' || b.clientId === filterClientId;
    const matchesPay = filterPayMethod === 'all' || (b.paymentDetails && b.paymentDetails.method === filterPayMethod);
    return isAfterStart && isBeforeEnd && matchesProf && matchesSrv && matchesClient && matchesPay;
  });

  // Categories definition
  const categories: ReportCategory[] = [
    {
      title: 'Atendimentos & Agenda',
      reports: [
        { id: 'agendamentos_periodo', name: 'Agendamentos por período', description: 'Visão geral de todos os agendamentos realizados ou planejados no período.', icon: <Calendar className="w-4 h-4 text-[#2B4C7E]" /> },
        { id: 'servicos_realizados', name: 'Serviços realizados', description: 'Apenas agendamentos com status finalizado e seus faturamentos.', icon: <UserCheck className="w-4 h-4 text-emerald-600" /> },
        { id: 'servicos_cancelados', name: 'Serviços cancelados', description: 'Índice de cancelamentos, motivos e valores não convertidos.', icon: <UserX className="w-4 h-4 text-rose-500" /> },
        { id: 'faltas', name: 'Faltas (No-shows)', description: 'Ausências de clientes sem aviso prévio e perda financeira estimada.', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> }
      ]
    },
    {
      title: 'Faturamento & Caixa',
      reports: [
        { id: 'faturamento_bruto', name: 'Faturamento bruto', description: 'Total gerado antes de taxas, custos e comissões.', icon: <DollarSign className="w-4 h-4 text-sky-700" /> },
        { id: 'faturamento_liquido', name: 'Faturamento líquido', description: 'Resultado final após dedução de taxas de cartão e custo de produtos.', icon: <TrendingUp className="w-4 h-4 text-emerald-600" /> },
        { id: 'formas_pagamento', name: 'Formas de pagamento', description: 'Distribuição dos recebimentos por Pix, crédito, débito, etc.', icon: <Activity className="w-4 h-4 text-sky-600" /> },
        { id: 'descontos_concedidos', name: 'Descontos concedidos', description: 'Total de reduções de preço dadas nas vendas de serviços e produtos.', icon: <Percent className="w-4 h-4 text-purple-600" /> },
        { id: 'taxas_pagas', name: 'Taxas pagas', description: 'Taxas de cartão e maquininhas descontadas no período.', icon: <TrendingDown className="w-4 h-4 text-rose-600" /> },
        { id: 'ticket_medio', name: 'Ticket médio', description: 'Valor médio gasto por atendimento realizado.', icon: <Sparkles className="w-4 h-4 text-amber-500" /> }
      ]
    },
    {
      title: 'Profissionais & Equipe',
      reports: [
        { id: 'faturamento_profissional', name: 'Faturamento por profissional', description: 'Montante total gerado em serviços por profissional da equipe.', icon: <Briefcase className="w-4 h-4 text-cyan-600" /> },
        { id: 'comissao_profissional', name: 'Comissão por profissional', description: 'Cálculo de comissões devidas a cada colaboradora no período.', icon: <Award className="w-4 h-4 text-yellow-600" /> },
        { id: 'profissionais_mais_atendimentos', name: 'Profissionais com mais atendimentos', description: 'Ranking de volume de trabalho por profissional da equipe.', icon: <Users className="w-4 h-4 text-[#2B4C7E]" /> }
      ]
    },
    {
      title: 'Serviços & Rankings',
      reports: [
        { id: 'faturamento_servico', name: 'Faturamento por serviço', description: 'Receita acumulada por tipo de serviço do salão.', icon: <Layers className="w-4 h-4 text-purple-700" /> },
        { id: 'servicos_mais_vendidos', name: 'Serviços mais vendidos', description: 'Ranking de popularidade de cada serviço oferecido.', icon: <Award className="w-4 h-4 text-emerald-600" /> },
        { id: 'horarios_movimentados', name: 'Horários mais movimentados', description: 'Distribuição de atendimentos por hora do dia.', icon: <Clock className="w-4 h-4 text-indigo-500" /> },
        { id: 'dias_movimentados', name: 'Dias mais movimentados', description: 'Visualização de movimento por dia da semana.', icon: <Calendar className="w-4 h-4 text-rose-600" /> }
      ]
    },
    {
      title: 'Vendas & Estoque',
      reports: [
        { id: 'produtos_vendidos', name: 'Produtos vendidos', description: 'Vendas de produtos no varejo com margem de lucro.', icon: <ShoppingBag className="w-4 h-4 text-teal-600" /> },
        { id: 'estoque_status', name: 'Estoque', description: 'Status atual das mercadorias, alertas críticos e valor imobilizado.', icon: <Package className="w-4 h-4 text-[#2B4C7E]" /> }
      ]
    },
    {
      title: 'Pacotes de Clientes',
      reports: [
        { id: 'pacotes_vendidos', name: 'Pacotes vendidos', description: 'Venda de pacotes personalizados ou de fidelidade no período.', icon: <Package className="w-4 h-4 text-emerald-600" /> },
        { id: 'pacotes_aberto', name: 'Pacotes em aberto', description: 'Contratos ativos com saldo de sessões remanescentes.', icon: <FileText className="w-4 h-4 text-[#2B4C7E]" /> }
      ]
    },
    {
      title: 'Clientes & CRM',
      reports: [
        { id: 'clientes_novas', name: 'Clientes novas', description: 'Novas clientes que fizeram o primeiro agendamento no período.', icon: <PlusCircle className="w-4 h-4 text-blue-600" /> },
        { id: 'clientes_recorrentes', name: 'Clientes recorrentes', description: 'Clientes fiéis que retornaram mais de uma vez ao salão.', icon: <UserCheck className="w-4 h-4 text-purple-600" /> },
        { id: 'clientes_sem_retorno', name: 'Clientes sem retorno', description: 'Clientes sumidas com última visita há mais de 30 dias.', icon: <UserX className="w-4 h-4 text-rose-600" /> }
      ]
    }
  ];

  // Map active report properties and data
  const getReportData = () => {
    let title = 'Relatório';
    let description = '';
    let kpis: Array<{ label: string; value: string; icon: React.ReactNode; color: string }> = [];
    let headers: string[] = [];
    let rows: Array<any[]> = [];

    switch (selectedReportId) {
      case 'agendamentos_periodo': {
        title = 'Agendamentos por Período';
        description = 'Lista geral de todos os agendamentos cadastrados no período selecionado.';
        const total = filteredBookings.length;
        const fin = filteredBookings.filter(b => b.status === 'finalizado').length;
        const canc = filteredBookings.filter(b => b.status === 'cancelado').length;
        const val = filteredBookings.reduce((sum, b) => sum + b.value, 0);

        kpis = [
          { label: 'Total Agendamentos', value: String(total), icon: <Calendar className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-blue-800' },
          { label: 'Atendimentos Finalizados', value: String(fin), icon: <UserCheck className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
          { label: 'Agendamentos Cancelados', value: String(canc), icon: <UserX className="w-5 h-5 text-rose-600" />, color: 'bg-rose-50 border-rose-100 text-rose-800' },
          { label: 'Valor Total', value: formatBRL(val), icon: <DollarSign className="w-5 h-5 text-teal-600" />, color: 'bg-teal-50 border-teal-100 text-teal-800' }
        ];

        headers = ['ID', 'Data', 'Horário', 'Cliente', 'Profissional', 'Serviço', 'Valor', 'Status'];
        rows = filteredBookings.map(b => [
          b.id,
          formatDateBR(b.date),
          b.time,
          b.clientName,
          b.professionalName,
          b.serviceName,
          formatBRL(b.value),
          b.status.toUpperCase()
        ]);
        break;
      }

      case 'servicos_realizados': {
        title = 'Serviços Realizados';
        description = 'Atendimentos marcados como concluídos/finalizados que geraram faturamento.';
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const count = completed.length;
        const val = completed.reduce((sum, b) => sum + b.value, 0);
        const totalDuration = completed.reduce((sum, b) => sum + b.duration, 0);

        kpis = [
          { label: 'Quantidade Realizada', value: String(count), icon: <UserCheck className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
          { label: 'Faturamento de Serviços', value: formatBRL(val), icon: <DollarSign className="w-5 h-5 text-teal-600" />, color: 'bg-teal-50 border-teal-100 text-teal-800' },
          { label: 'Duração Acumulada', value: `${totalDuration} min`, icon: <Clock className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-blue-800' }
        ];

        headers = ['Data', 'Horário', 'Cliente', 'Profissional', 'Serviço', 'Valor', 'Pagamento'];
        rows = completed.map(b => [
          formatDateBR(b.date),
          b.time,
          b.clientName,
          b.professionalName,
          b.serviceName,
          formatBRL(b.value),
          b.paymentDetails?.method || (b.isPaid ? 'Pago' : 'Pendente')
        ]);
        break;
      }

      case 'servicos_cancelados': {
        title = 'Serviços Cancelados';
        description = 'Agendamentos que foram cancelados no período, mostrando justificativas e receita potencial perdida.';
        const cancelled = filteredBookings.filter(b => b.status === 'cancelado');
        const count = cancelled.length;
        const totalPot = filteredBookings.length;
        const rate = totalPot > 0 ? (count / totalPot) * 100 : 0;
        const lossVal = cancelled.reduce((sum, b) => sum + b.value, 0);

        kpis = [
          { label: 'Cancelamentos', value: String(count), icon: <UserX className="w-5 h-5 text-rose-600" />, color: 'bg-rose-50 border-rose-100 text-rose-800' },
          { label: 'Taxa de Cancelamento', value: `${rate.toFixed(1)}%`, icon: <Activity className="w-5 h-5 text-orange-600" />, color: 'bg-orange-50 border-orange-100 text-orange-800' },
          { label: 'Valor Não Convertido', value: formatBRL(lossVal), icon: <TrendingDown className="w-5 h-5 text-rose-500" />, color: 'bg-red-50 border-red-100 text-red-800' }
        ];

        headers = ['Data', 'Horário', 'Cliente', 'Profissional', 'Serviço', 'Valor Perdido', 'Observação/Motivo'];
        rows = cancelled.map(b => [
          formatDateBR(b.date),
          b.time,
          b.clientName,
          b.professionalName,
          b.serviceName,
          formatBRL(b.value),
          b.obs || 'Não informado'
        ]);
        break;
      }

      case 'faltas': {
        title = 'Faltas (No-shows)';
        description = 'Clientes que agendaram e faltaram ao compromisso sem aviso prévio.';
        const missed = filteredBookings.filter(b => b.status === 'faltou');
        const count = missed.length;
        const totalPot = filteredBookings.length;
        const rate = totalPot > 0 ? (count / totalPot) * 100 : 0;
        const lossVal = missed.reduce((sum, b) => sum + b.value, 0);

        kpis = [
          { label: 'Total de Faltas', value: String(count), icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, color: 'bg-amber-50 border-amber-100 text-amber-800' },
          { label: 'Taxa de Faltou', value: `${rate.toFixed(1)}%`, icon: <Activity className="w-5 h-5 text-rose-600" />, color: 'bg-rose-50 border-rose-100 text-rose-800' },
          { label: 'Valor Desperdiçado', value: formatBRL(lossVal), icon: <TrendingDown className="w-5 h-5 text-rose-500" />, color: 'bg-red-50 border-red-100 text-red-800' }
        ];

        headers = ['Data', 'Horário', 'Cliente', 'Profissional', 'Serviço', 'Valor Perdido', 'Observação'];
        rows = missed.map(b => [
          formatDateBR(b.date),
          b.time,
          b.clientName,
          b.professionalName,
          b.serviceName,
          formatBRL(b.value),
          b.obs || 'Falta injustificada'
        ]);
        break;
      }

      case 'clientes_novas': {
        title = 'Clientes Novas';
        description = 'Clientes cujo primeiro atendimento finalizado na história do salão ocorreu no período selecionado.';
        
        const data = clients.map(client => {
          const clientCompleted = bookings
            .filter(b => b.clientId === client.id && b.status === 'finalizado')
            .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

          const first = clientCompleted[0];
          if (first) {
            const inRange = first.date >= startDate && first.date <= endDate;
            const matchesProf = filterProfId === 'all' || first.professionalId === filterProfId;
            const matchesSrv = filterServiceId === 'all' || first.serviceId === filterServiceId;
            const matchesClient = filterClientId === 'all' || first.clientId === filterClientId;
            const matchesPay = filterPayMethod === 'all' || (first.paymentDetails && first.paymentDetails.method === filterPayMethod);

            if (inRange && matchesProf && matchesSrv && matchesClient && matchesPay) {
              return { client, firstBooking: first };
            }
          }
          return null;
        }).filter(Boolean) as Array<{ client: typeof clients[0]; firstBooking: typeof bookings[0] }>;

        const count = data.length;
        const val = data.reduce((sum, item) => sum + item.firstBooking.value, 0);

        kpis = [
          { label: 'Novas Adquiridas', value: String(count), icon: <PlusCircle className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50 border-blue-100 text-blue-800' },
          { label: 'Faturamento de Novas', value: formatBRL(val), icon: <DollarSign className="w-5 h-5 text-teal-600" />, color: 'bg-teal-50 border-teal-100 text-teal-800' },
          { label: 'Ticket Médio Inicial', value: formatBRL(count > 0 ? val / count : 0), icon: <Sparkles className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-100 text-amber-800' }
        ];

        headers = ['Cliente', 'Telefone', 'Primeira Visita', 'Serviço Realizado', 'Profissional Atendente', 'Valor Pago'];
        rows = data.map(item => [
          item.client.name,
          item.client.phone,
          formatDateBR(item.firstBooking.date),
          item.firstBooking.serviceName,
          item.firstBooking.professionalName,
          formatBRL(item.firstBooking.value)
        ]);
        break;
      }

      case 'clientes_recorrentes': {
        title = 'Clientes Recorrentes';
        description = 'Clientes fiéis com mais de 1 atendimento realizado no salão que realizaram visitas no período.';
        
        const data = clients.map(client => {
          const clientCompleted = bookings.filter(b => b.clientId === client.id && b.status === 'finalizado');
          const isRec = clientCompleted.length > 1;

          const bookingsInPeriod = clientCompleted.filter(b => {
            const inRange = b.date >= startDate && b.date <= endDate;
            const matchesProf = filterProfId === 'all' || b.professionalId === filterProfId;
            const matchesSrv = filterServiceId === 'all' || b.serviceId === filterServiceId;
            const matchesClient = filterClientId === 'all' || b.clientId === filterClientId;
            const matchesPay = filterPayMethod === 'all' || (b.paymentDetails && b.paymentDetails.method === filterPayMethod);
            return inRange && matchesProf && matchesSrv && matchesClient && matchesPay;
          });

          if (isRec && bookingsInPeriod.length > 0) {
            const sorted = [...clientCompleted].sort((a, b) => b.date.localeCompare(a.date));
            const spend = bookingsInPeriod.reduce((sum, b) => sum + b.value, 0);
            return { client, totalVisits: clientCompleted.length, lastVisit: sorted[0].date, spend };
          }
          return null;
        }).filter(Boolean) as Array<{ client: typeof clients[0]; totalVisits: number; lastVisit: string; spend: number }>;

        const count = data.length;
        const totalSpend = data.reduce((sum, x) => sum + x.spend, 0);

        kpis = [
          { label: 'Clientes Recorrentes Ativas', value: String(count), icon: <UserCheck className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50 border-purple-100 text-purple-800' },
          { label: 'Faturamento de Recorrentes', value: formatBRL(totalSpend), icon: <DollarSign className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
          { label: 'Ticket Médio de Recorrentes', value: formatBRL(count > 0 ? totalSpend / count : 0), icon: <Sparkles className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-100 text-amber-800' }
        ];

        headers = ['Cliente', 'Telefone', 'Visitas Históricas', 'Última Visita Realizada', 'Total Gasto no Período'];
        rows = data.map(x => [
          x.client.name,
          x.client.phone,
          x.totalVisits,
          formatDateBR(x.lastVisit),
          formatBRL(x.spend)
        ]);
        break;
      }

      case 'clientes_sem_retorno': {
        title = 'Clientes sem Retorno (CRM de Alerta)';
        description = 'Clientes ativas cuja última visita finalizada foi há mais de 30 dias (do final do período) e sem agendamentos futuros.';
        
        const dEnd = endDate ? new Date(endDate + 'T00:00:00') : new Date('2026-07-08T00:00:00');

        const data = clients.map(client => {
          const completed = bookings
            .filter(b => b.clientId === client.id && b.status === 'finalizado')
            .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));

          if (completed.length === 0) return null;

          const last = completed[completed.length - 1];
          const dLast = new Date(last.date + 'T00:00:00');
          const diffTime = dEnd.getTime() - dLast.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

          const hasFuture = bookings.some(b => b.clientId === client.id && (b.status === 'agendado' || b.status === 'confirmado') && b.date > last.date);

          if (diffDays >= 30 && !hasFuture) {
            const matchesClient = filterClientId === 'all' || client.id === filterClientId;
            if (matchesClient) {
              return { client, lastBooking: last, daysSince: diffDays };
            }
          }
          return null;
        }).filter(Boolean) as Array<{ client: typeof clients[0]; lastBooking: typeof bookings[0]; daysSince: number }>;

        const count = data.length;

        kpis = [
          { label: 'Clientes Afastadas', value: String(count), icon: <UserX className="w-5 h-5 text-rose-600" />, color: 'bg-rose-50 border-rose-100 text-rose-800' },
          { label: 'Média de Dias Ausente', value: `${count > 0 ? Math.round(data.reduce((sum, x) => sum + x.daysSince, 0) / count) : 0} dias`, icon: <Clock className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-blue-800' }
        ];

        headers = ['Cliente', 'Telefone', 'Último Serviço Realizado', 'Profissional', 'Última Visita', 'Dias Ausente'];
        rows = data.map(x => [
          x.client.name,
          x.client.phone,
          x.lastBooking.serviceName,
          x.lastBooking.professionalName,
          formatDateBR(x.lastBooking.date),
          `${x.daysSince} dias`
        ]);
        break;
      }

      case 'faturamento_bruto': {
        title = 'Faturamento Bruto';
        description = 'Todos os valores brutos arrecadados com serviços realizados, produtos de checkout e venda de pacotes.';
        
        // 1. Service Sales
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const serviceGross = completed.reduce((sum, b) => sum + (b.paymentDetails?.gross ?? b.value), 0);

        // 2. Product Sales
        let productGross = 0;
        completed.forEach(b => {
          if (b.paymentDetails?.productsSold) {
            b.paymentDetails.productsSold.forEach(p => {
              productGross += p.price * p.quantity;
            });
          }
        });

        // 3. Packages Sold
        const soldPkgs = packages.filter(p => {
          const idParts = p.id.split('-');
          let timestamp = Date.now();
          if (idParts.length >= 2) {
            const parsed = parseInt(idParts[1], 10);
            if (!isNaN(parsed)) timestamp = parsed;
          }
          const d = new Date(timestamp);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          const inRange = (!startDate || dateStr >= startDate) && (!endDate || dateStr <= endDate);
          const matchesClient = filterClientId === 'all' || p.clientId === filterClientId;
          return inRange && matchesClient;
        });
        const packageGross = soldPkgs.reduce((sum, p) => sum + p.value, 0);
        const grandTotal = serviceGross + productGross + packageGross;

        kpis = [
          { label: 'Faturamento Bruto Total', value: formatBRL(grandTotal), icon: <DollarSign className="w-5 h-5 text-sky-700" />, color: 'bg-sky-50 border-sky-100 text-sky-950 font-black' },
          { label: 'Serviços Prestados', value: formatBRL(serviceGross), icon: <Briefcase className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-blue-800' },
          { label: 'Venda de Produtos', value: formatBRL(productGross), icon: <ShoppingBag className="w-5 h-5 text-teal-600" />, color: 'bg-teal-50 border-teal-100 text-teal-800' },
          { label: 'Pacotes Vendidos', value: formatBRL(packageGross), icon: <Package className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800' }
        ];

        headers = ['Data', 'Categoria', 'Descrição', 'Cliente', 'Valor Bruto'];
        
        const serviceRows = completed.map(b => [
          formatDateBR(b.date),
          'Serviço',
          b.serviceName,
          b.clientName,
          formatBRL(b.paymentDetails?.gross ?? b.value)
        ]);

        const productRows: any[] = [];
        completed.forEach(b => {
          if (b.paymentDetails?.productsSold) {
            b.paymentDetails.productsSold.forEach(p => {
              productRows.push([
                formatDateBR(b.date),
                'Produto',
                `${p.name} (x${p.quantity})`,
                b.clientName,
                formatBRL(p.price * p.quantity)
              ]);
            });
          }
        });

        const packageRows = soldPkgs.map(p => {
          const idParts = p.id.split('-');
          let timestamp = Date.now();
          if (idParts.length >= 2) {
            const parsed = parseInt(idParts[1], 10);
            if (!isNaN(parsed)) timestamp = parsed;
          }
          const d = new Date(timestamp);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return [
            formatDateBR(dateStr),
            'Pacote',
            `Contratação: ${p.name}`,
            p.clientName,
            formatBRL(p.value)
          ];
        });

        rows = [...serviceRows, ...productRows, ...packageRows];
        break;
      }

      case 'faturamento_liquido': {
        title = 'Faturamento Líquido (DRE Simplificada)';
        description = 'Receita total após dedução de taxas de maquininhas/cartões e custos de produtos revendidos.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        
        let grossTotal = 0;
        let totalDeductions = 0;

        const rowData = completed.map(b => {
          const gross = b.paymentDetails?.gross ?? b.value;
          const fee = b.paymentDetails?.fee ?? 0;
          let productCost = 0;

          if (b.paymentDetails?.productsSold) {
            b.paymentDetails.productsSold.forEach(pSold => {
              const pDetails = products.find(prod => prod.id === pSold.id);
              if (pDetails) {
                productCost += pDetails.cost * pSold.quantity;
              }
            });
          }

          const deductions = fee + productCost;
          const net = gross - deductions;

          grossTotal += gross;
          totalDeductions += deductions;

          return {
            date: b.date,
            type: 'Checkout',
            desc: `${b.serviceName} + ${b.paymentDetails?.productsSold?.length || 0} prod`,
            gross,
            deductions,
            net
          };
        });

        const netTotal = grossTotal - totalDeductions;

        kpis = [
          { label: 'Faturamento Bruto', value: formatBRL(grossTotal), icon: <DollarSign className="w-5 h-5 text-slate-500" />, color: 'bg-slate-50 border-slate-200 text-slate-600' },
          { label: 'Taxas & Custos (Reduções)', value: `-${formatBRL(totalDeductions)}`, icon: <TrendingDown className="w-5 h-5 text-rose-500" />, color: 'bg-rose-50 border-rose-100 text-rose-800' },
          { label: 'Faturamento Líquido', value: formatBRL(netTotal), icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
          { label: 'Margem Líquida %', value: `${grossTotal > 0 ? ((netTotal / grossTotal) * 100).toFixed(1) : 0}%`, icon: <Percent className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-[#2B4C7E]' }
        ];

        headers = ['Data', 'Tipo', 'Descrição', 'Valor Bruto', 'Deduções (Taxas+Custos)', 'Faturamento Líquido'];
        rows = rowData.map(r => [
          formatDateBR(r.date),
          r.type,
          r.desc,
          formatBRL(r.gross),
          formatBRL(r.deductions),
          formatBRL(r.net)
        ]);
        break;
      }

      case 'formas_pagamento': {
        title = 'Formas de Pagamento';
        description = 'Análise do volume de transações e valores brutos faturados por cada método de pagamento.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const paySummary: Record<string, { count: number; gross: number; fee: number; net: number }> = {};

        completed.forEach(b => {
          const method = b.paymentDetails?.method || 'Dinheiro';
          const gross = b.paymentDetails?.gross ?? b.value;
          const fee = b.paymentDetails?.fee ?? 0;
          const net = b.paymentDetails?.net ?? b.value;

          if (!paySummary[method]) {
            paySummary[method] = { count: 0, gross: 0, fee: 0, net: 0 };
          }
          paySummary[method].count += 1;
          paySummary[method].gross += gross;
          paySummary[method].fee += fee;
          paySummary[method].net += net;
        });

        const totalGross = Object.values(paySummary).reduce((sum, item) => sum + item.gross, 0);

        kpis = [
          { label: 'Total Faturado', value: formatBRL(totalGross), icon: <DollarSign className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
          { label: 'Canais de Venda', value: `${Object.keys(paySummary).length} ativos`, icon: <Activity className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-blue-800' }
        ];

        headers = ['Forma de Pagamento', 'Transações', 'Faturamento Bruto', '% Participação', 'Taxas Retidas', 'Valor Líquido'];
        rows = Object.entries(paySummary).map(([method, val]) => [
          method,
          val.count,
          formatBRL(val.gross),
          `${totalGross > 0 ? ((val.gross / totalGross) * 100).toFixed(1) : 0}%`,
          formatBRL(val.fee),
          formatBRL(val.net)
        ]);
        break;
      }

      case 'descontos_concedidos': {
        title = 'Descontos Concedidos';
        description = 'Listagem de abatimentos de preço aplicados em serviços e produtos de varejo.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado' && (b.paymentDetails?.discount || b.paymentDetails?.discountProducts));
        const count = completed.length;
        const totalDiscount = completed.reduce((sum, b) => {
          const sD = b.paymentDetails?.discount ?? 0;
          const pD = b.paymentDetails?.discountProducts ?? 0;
          return sum + sD + pD;
        }, 0);

        kpis = [
          { label: 'Vendas com Desconto', value: String(count), icon: <Percent className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50 border-purple-100 text-purple-800' },
          { label: 'Total de Descontos Concedidos', value: formatBRL(totalDiscount), icon: <TrendingDown className="w-5 h-5 text-rose-500" />, color: 'bg-red-50 border-red-100 text-red-800' }
        ];

        headers = ['Data', 'Cliente', 'Serviço', 'Valor Original', 'Desconto Serviço', 'Desconto Produto', 'Total Desconto', 'Valor Pago'];
        rows = completed.map(b => {
          const sD = b.paymentDetails?.discount ?? 0;
          const pD = b.paymentDetails?.discountProducts ?? 0;
          const gross = b.paymentDetails?.gross ?? b.value;
          const original = gross + sD + pD;
          return [
            formatDateBR(b.date),
            b.clientName,
            b.serviceName,
            formatBRL(original),
            formatBRL(sD),
            formatBRL(pD),
            formatBRL(sD + pD),
            formatBRL(gross)
          ];
        });
        break;
      }

      case 'taxas_pagas': {
        title = 'Taxas Pagas';
        description = 'Valores cobrados pelas administradoras de cartão de crédito/débito pelas vendas registradas.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const totalFee = completed.reduce((sum, b) => sum + (b.paymentDetails?.fee ?? 0), 0);
        const totalGross = completed.reduce((sum, b) => sum + (b.paymentDetails?.gross ?? b.value), 0);

        kpis = [
          { label: 'Total de Taxas Pagas', value: formatBRL(totalFee), icon: <TrendingDown className="w-5 h-5 text-rose-500" />, color: 'bg-rose-50 border-rose-100 text-rose-800' },
          { label: 'Custo de Maquininha Médio', value: `${totalGross > 0 ? ((totalFee / totalGross) * 100).toFixed(2) : 0}%`, icon: <Activity className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-[#2B4C7E]' }
        ];

        headers = ['Data', 'Cliente', 'Forma de Pagamento', 'Valor Bruto', 'Taxa Cobrada', 'Valor Líquido'];
        rows = completed.map(b => [
          formatDateBR(b.date),
          b.clientName,
          b.paymentDetails?.method || 'Dinheiro',
          formatBRL(b.paymentDetails?.gross ?? b.value),
          formatBRL(b.paymentDetails?.fee ?? 0),
          formatBRL(b.paymentDetails?.net ?? b.value)
        ]);
        break;
      }

      case 'ticket_medio': {
        title = 'Ticket Médio por Atendimento';
        description = 'Análise analítica diária do ticket médio consumido por cliente no salão.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        
        const daily: Record<string, { count: number; total: number }> = {};
        completed.forEach(b => {
          if (!daily[b.date]) daily[b.date] = { count: 0, total: 0 };
          daily[b.date].count += 1;
          daily[b.date].total += b.paymentDetails?.gross ?? b.value;
        });

        const totalValue = completed.reduce((sum, b) => sum + (b.paymentDetails?.gross ?? b.value), 0);
        const totalCount = completed.length;
        const avg = totalCount > 0 ? totalValue / totalCount : 0;

        kpis = [
          { label: 'Ticket Médio Geral', value: formatBRL(avg), icon: <Sparkles className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-100 text-amber-800 font-bold' },
          { label: 'Total Faturado', value: formatBRL(totalValue), icon: <DollarSign className="w-5 h-5 text-teal-600" />, color: 'bg-teal-50 border-teal-100 text-teal-800' },
          { label: 'Atendimentos Totais', value: String(totalCount), icon: <UserCheck className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-blue-800' }
        ];

        headers = ['Data', 'Atendimentos', 'Faturamento do Dia', 'Ticket Médio Diário'];
        rows = Object.entries(daily)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([date, val]) => [
            formatDateBR(date),
            val.count,
            formatBRL(val.total),
            formatBRL(val.count > 0 ? val.total / val.count : 0)
          ]);
        break;
      }

      case 'faturamento_profissional': {
        title = 'Faturamento por Profissional';
        description = 'Acompanhamento do volume de serviços realizados e o respectivo faturamento bruto gerado por profissional da equipe.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const profSummary: Record<string, { count: number; revenue: number }> = {};

        professionals.forEach(p => {
          profSummary[p.name] = { count: 0, revenue: 0 };
        });

        completed.forEach(b => {
          if (!profSummary[b.professionalName]) {
            profSummary[b.professionalName] = { count: 0, revenue: 0 };
          }
          profSummary[b.professionalName].count += 1;
          profSummary[b.professionalName].revenue += b.value;
        });

        const totalRev = Object.values(profSummary).reduce((sum, item) => sum + item.revenue, 0);

        kpis = [
          { label: 'Faturamento de Equipe', value: formatBRL(totalRev), icon: <Users className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-blue-800 font-bold' },
          { label: 'Média por Profissional', value: formatBRL(Object.keys(profSummary).length > 0 ? totalRev / Object.keys(profSummary).length : 0), icon: <Sparkles className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-100 text-amber-800' }
        ];

        headers = ['Profissional', 'Serviços Realizados', 'Faturamento Bruto', 'Ticket Médio de Atendimento'];
        rows = Object.entries(profSummary).map(([name, val]) => [
          name,
          val.count,
          formatBRL(val.revenue),
          formatBRL(val.count > 0 ? val.revenue / val.count : 0)
        ]);
        break;
      }

      case 'faturamento_servico': {
        title = 'Faturamento por Serviço';
        description = 'Volume e faturamento acumulado detalhado por tipo de serviço prestado no salão.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const srvSummary: Record<string, { count: number; revenue: number; category: string }> = {};

        completed.forEach(b => {
          if (!srvSummary[b.serviceName]) {
            const sDetails = services.find(s => s.id === b.serviceId);
            srvSummary[b.serviceName] = { count: 0, revenue: 0, category: sDetails?.category || 'Outros' };
          }
          srvSummary[b.serviceName].count += 1;
          srvSummary[b.serviceName].revenue += b.value;
        });

        const grandSrvTotal = Object.values(srvSummary).reduce((sum, x) => sum + x.revenue, 0);

        kpis = [
          { label: 'Faturamento de Serviços', value: formatBRL(grandSrvTotal), icon: <Layers className="w-5 h-5 text-purple-700" />, color: 'bg-purple-50 border-purple-100 text-purple-800' },
          { label: 'Serviços Diferentes Prestados', value: String(Object.keys(srvSummary).length), icon: <Activity className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-[#2B4C7E]' }
        ];

        headers = ['Serviço', 'Categoria', 'Atendimentos Realizados', 'Faturamento de Vendas', '% de Participação'];
        rows = Object.entries(srvSummary).map(([name, val]) => [
          name,
          val.category,
          val.count,
          formatBRL(val.revenue),
          `${grandSrvTotal > 0 ? ((val.revenue / grandSrvTotal) * 100).toFixed(1) : 0}%`
        ]);
        break;
      }

      case 'comissao_profissional': {
        title = 'Comissão por Profissional';
        description = 'Cálculo analítico dos repasses e comissões devidos para cada colaboradora pelos serviços finalizados.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const commSummary: Record<string, { count: number; revenue: number; commission: number }> = {};

        professionals.forEach(p => {
          commSummary[p.name] = { count: 0, revenue: 0, commission: 0 };
        });

        completed.forEach(b => {
          if (!commSummary[b.professionalName]) {
            commSummary[b.professionalName] = { count: 0, revenue: 0, commission: 0 };
          }
          commSummary[b.professionalName].count += 1;
          commSummary[b.professionalName].revenue += b.value;
          commSummary[b.professionalName].commission += b.paymentDetails?.commission ?? (b.value * 0.4); // 40% fallback
        });

        const totalCommission = Object.values(commSummary).reduce((sum, item) => sum + item.commission, 0);

        kpis = [
          { label: 'Total de Comissões Devidas', value: formatBRL(totalCommission), icon: <Award className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-100 text-amber-800' },
          { label: 'Retenção de Caixa do Salão', value: formatBRL(Object.values(commSummary).reduce((sum, item) => sum + (item.revenue - item.commission), 0)), icon: <DollarSign className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800' }
        ];

        headers = ['Profissional', 'Atendimentos', 'Faturamento Gerado', 'Comissão Devida', 'Saldo Retido Salão'];
        rows = Object.entries(commSummary).map(([name, val]) => [
          name,
          val.count,
          formatBRL(val.revenue),
          formatBRL(val.commission),
          formatBRL(val.revenue - val.commission)
        ]);
        break;
      }

      case 'produtos_vendidos': {
        title = 'Produtos Vendidos (Vendas Varejo)';
        description = 'Faturamento, volume de saída e lucratividade líquida de todos os cosméticos e produtos revendidos.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const prodSummary: Record<string, { qty: number; revenue: number; cost: number; unitPrice: number }> = {};

        completed.forEach(b => {
          if (b.paymentDetails?.productsSold) {
            b.paymentDetails.productsSold.forEach(pSold => {
              const pDetails = products.find(prod => prod.id === pSold.id);
              const pCost = pDetails ? pDetails.cost : pSold.price * 0.5; // 50% profit margin default fallback

              if (!prodSummary[pSold.name]) {
                prodSummary[pSold.name] = { qty: 0, revenue: 0, cost: 0, unitPrice: pSold.price };
              }
              prodSummary[pSold.name].qty += pSold.quantity;
              prodSummary[pSold.name].revenue += pSold.price * pSold.quantity;
              prodSummary[pSold.name].cost += pCost * pSold.quantity;
            });
          }
        });

        const totalQty = Object.values(prodSummary).reduce((sum, x) => sum + x.qty, 0);
        const totalRev = Object.values(prodSummary).reduce((sum, x) => sum + x.revenue, 0);
        const totalCost = Object.values(prodSummary).reduce((sum, x) => sum + x.cost, 0);

        kpis = [
          { label: 'Itens Vendidos', value: String(totalQty), icon: <ShoppingBag className="w-5 h-5 text-teal-600" />, color: 'bg-teal-50 border-teal-100 text-teal-800' },
          { label: 'Receita Bruta Vendas', value: formatBRL(totalRev), icon: <DollarSign className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
          { label: 'Lucro de Vendas Líquido', value: formatBRL(totalRev - totalCost), icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800 font-bold' }
        ];

        headers = ['Produto', 'Quantidade Vendida', 'Preço Unitário', 'Faturamento de Vendas', 'Custo Total', 'Lucro de Vendas'];
        rows = Object.entries(prodSummary).map(([name, val]) => [
          name,
          val.qty,
          formatBRL(val.unitPrice),
          formatBRL(val.revenue),
          formatBRL(val.cost),
          formatBRL(val.revenue - val.cost)
        ]);
        break;
      }

      case 'estoque_status': {
        title = 'Controle & Relatório de Estoque';
        description = 'Status de nível atual dos produtos cadastrados, mostrando níveis de alerta críticos e capital de insumo imobilizado.';
        
        const totalInStock = products.reduce((sum, p) => sum + p.quantity, 0);
        const costValue = products.reduce((sum, p) => sum + (p.cost * p.quantity), 0);
        const sellValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const criticalCount = products.filter(p => p.quantity <= p.minQuantity).length;

        kpis = [
          { label: 'Produtos Cadastrados', value: String(products.length), icon: <Package className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-blue-800' },
          { label: 'Unidades em Estoque', value: String(totalInStock), icon: <Layers className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50 border-purple-100 text-purple-800' },
          { label: 'Capital Imobilizado (Custo)', value: formatBRL(costValue), icon: <DollarSign className="w-5 h-5 text-teal-600" />, color: 'bg-teal-50 border-teal-100 text-teal-800 font-semibold' },
          { label: 'Itens Críticos (Reposição)', value: String(criticalCount), icon: <AlertTriangle className="w-5 h-5 text-rose-600" />, color: 'bg-rose-50 border-rose-100 text-rose-800' }
        ];

        headers = ['Produto', 'Categoria', 'Estoque Atual', 'Mínimo Aceitável', 'Custo Unitário', 'Preço Venda Varejo', 'Status Estoque'];
        rows = products.map(p => {
          let status = 'Regular';
          if (p.quantity <= p.minQuantity) {
            status = 'CRÍTICO';
          } else if (p.quantity <= p.minQuantity * 1.5) {
            status = 'ALERTA';
          }
          return [
            p.name,
            p.category,
            p.quantity,
            p.minQuantity,
            formatBRL(p.cost),
            formatBRL(p.price),
            status
          ];
        });
        break;
      }

      case 'pacotes_vendidos': {
        title = 'Pacotes de Serviços Vendidos';
        description = 'Histórico de contratação e venda de pacotes de sessões múltiplas fechados no período.';
        
        const soldPkgs = packages.filter(p => {
          const idParts = p.id.split('-');
          let timestamp = Date.now();
          if (idParts.length >= 2) {
            const parsed = parseInt(idParts[1], 10);
            if (!isNaN(parsed)) timestamp = parsed;
          }
          const d = new Date(timestamp);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          const inRange = (!startDate || dateStr >= startDate) && (!endDate || dateStr <= endDate);
          const matchesClient = filterClientId === 'all' || p.clientId === filterClientId;
          return inRange && matchesClient;
        });

        const totalValue = soldPkgs.reduce((sum, p) => sum + p.value, 0);

        kpis = [
          { label: 'Pacotes Comercializados', value: String(soldPkgs.length), icon: <Package className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
          { label: 'Receita Arrecadada', value: formatBRL(totalValue), icon: <DollarSign className="w-5 h-5 text-teal-600" />, color: 'bg-teal-50 border-teal-100 text-teal-800 font-bold' }
        ];

        headers = ['Data Venda', 'Nome do Pacote', 'Cliente', 'Valor Cobrado', 'Sessões Contratadas', 'Status Contrato'];
        rows = soldPkgs.map(p => {
          const idParts = p.id.split('-');
          let timestamp = Date.now();
          if (idParts.length >= 2) {
            const parsed = parseInt(idParts[1], 10);
            if (!isNaN(parsed)) timestamp = parsed;
          }
          const d = new Date(timestamp);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          return [
            formatDateBR(dateStr),
            p.name,
            p.clientName,
            formatBRL(p.value),
            p.totalSessions,
            p.status.toUpperCase()
          ];
        });
        break;
      }

      case 'pacotes_aberto': {
        title = 'Pacotes de Clientes Ativos (Em Aberto)';
        description = 'Todos os contratos de pacotes ativos que possuem sessões remanescentes pendentes de atendimento.';
        
        const activePkgs = packages.filter(p => p.status === 'ativo' && p.sessionsRemaining > 0);
        const count = activePkgs.length;
        const remSessions = activePkgs.reduce((sum, p) => sum + p.sessionsRemaining, 0);
        const activeValue = activePkgs.reduce((sum, p) => sum + p.value, 0);

        kpis = [
          { label: 'Contratos Ativos', value: String(count), icon: <Package className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-[#2B4C7E]' },
          { label: 'Sessões Pendentes Totais', value: `${remSessions} sessões`, icon: <Activity className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-100 text-amber-800' },
          { label: 'Valor sob Contrato', value: formatBRL(activeValue), icon: <DollarSign className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800 font-semibold' }
        ];

        headers = ['Nome do Pacote', 'Cliente Beneficiário', 'Sessões Usadas', 'Sessões Contratadas', 'Sessões Restantes', 'Valor Contrato', 'Data de Validade'];
        rows = activePkgs.map(p => [
          p.name,
          p.clientName,
          p.sessionsUsed,
          p.totalSessions,
          p.sessionsRemaining,
          formatBRL(p.value),
          formatDateBR(p.validityDate)
        ]);
        break;
      }

      case 'servicos_mais_vendidos': {
        title = 'Serviços mais Vendidos (Ranking Popularidade)';
        description = 'Ranking detalhado de popularidade e volume absoluto de atendimentos de cada serviço prestado.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const srvCount: Record<string, { count: number; category: string; revenue: number }> = {};

        completed.forEach(b => {
          if (!srvCount[b.serviceName]) {
            const sDetails = services.find(s => s.id === b.serviceId);
            srvCount[b.serviceName] = { count: 0, category: sDetails?.category || 'Outros', revenue: 0 };
          }
          srvCount[b.serviceName].count += 1;
          srvCount[b.serviceName].revenue += b.value;
        });

        const sorted = Object.entries(srvCount)
          .map(([name, item]) => ({ name, ...item }))
          .sort((a, b) => b.count - a.count);

        const totalAtendimentos = completed.length;

        kpis = [
          { label: 'Serviço Líder', value: sorted[0]?.name || 'Nenhum', icon: <Award className="w-5 h-5 text-amber-500 animate-bounce" />, color: 'bg-amber-50 border-amber-100 text-amber-800 font-bold' },
          { label: 'Volume Atendimentos', value: String(totalAtendimentos), icon: <Activity className="w-5 h-5 text-sky-600" />, color: 'bg-sky-50 border-sky-100 text-sky-850' }
        ];

        headers = ['Posição', 'Serviço de Beleza', 'Categoria', 'Volume de Atendimentos', 'Faturamento Bruto', '% Vol. Geral'];
        rows = sorted.map((item, idx) => [
          `#${idx + 1}`,
          item.name,
          item.category,
          item.count,
          formatBRL(item.revenue),
          `${totalAtendimentos > 0 ? ((item.count / totalAtendimentos) * 100).toFixed(1) : 0}%`
        ]);
        break;
      }

      case 'profissionais_mais_atendimentos': {
        title = 'Profissionais com mais Atendimentos';
        description = 'Ranking de volume total de atendimentos concluídos por profissional da equipe.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const profCount: Record<string, { count: number; revenue: number }> = {};

        professionals.forEach(p => {
          profCount[p.name] = { count: 0, revenue: 0 };
        });

        completed.forEach(b => {
          if (!profCount[b.professionalName]) {
            profCount[b.professionalName] = { count: 0, revenue: 0 };
          }
          profCount[b.professionalName].count += 1;
          profCount[b.professionalName].revenue += b.value;
        });

        const sorted = Object.entries(profCount)
          .map(([name, item]) => ({ name, ...item }))
          .sort((a, b) => b.count - a.count);

        const totalAtendimentos = completed.length;

        kpis = [
          { label: 'Colaboradora Líder', value: sorted[0]?.name || 'Nenhum', icon: <Award className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-100 text-amber-800 font-bold' },
          { label: 'Média de Atendimentos', value: `${sorted.length > 0 ? Math.round(totalAtendimentos / sorted.length) : 0} por profissional`, icon: <Users className="w-5 h-5 text-[#2B4C7E]" />, color: 'bg-blue-50 border-blue-100 text-blue-800' }
        ];

        headers = ['Posição', 'Profissional', 'Atendimentos Concluídos', 'Faturamento Gerado', '% Vol. Atendimentos'];
        rows = sorted.map((item, idx) => [
          `#${idx + 1}`,
          item.name,
          item.count,
          formatBRL(item.revenue),
          `${totalAtendimentos > 0 ? ((item.count / totalAtendimentos) * 100).toFixed(1) : 0}%`
        ]);
        break;
      }

      case 'horarios_movimentados': {
        title = 'Horários mais Movimentados';
        description = 'Análise do movimento e preferência de horários de atendimento pelas clientes para otimizar escalas.';
        
        const completed = filteredBookings.filter(b => b.status === 'finalizado');
        const hoursSummary: Record<string, { count: number; revenue: number }> = {};

        bookings.filter(b => (!startDate || b.date >= startDate) && (!endDate || b.date <= endDate)).forEach(b => {
          const hPrefix = b.time.split(':')[0] + ':00';
          if (!hoursSummary[hPrefix]) {
            hoursSummary[hPrefix] = { count: 0, revenue: 0 };
          }
          hoursSummary[hPrefix].count += 1;
          if (b.status === 'finalizado') {
            hoursSummary[hPrefix].revenue += b.value;
          }
        });

        const sorted = Object.entries(hoursSummary)
          .map(([hour, item]) => ({ hour, ...item }))
          .sort((a, b) => b.count - a.count);

        const totalSlots = bookings.filter(b => (!startDate || b.date >= startDate) && (!endDate || b.date <= endDate)).length;

        kpis = [
          { label: 'Horário de Pico', value: sorted[0]?.hour ? `${sorted[0].hour}h` : 'Nenhum', icon: <Clock className="w-5 h-5 text-[#2B4C7E] animate-pulse" />, color: 'bg-blue-50 border-blue-100 text-blue-800 font-bold' },
          { label: 'Transações no Pico', value: `${sorted[0]?.count || 0} visitas`, icon: <Activity className="w-5 h-5 text-indigo-600" />, color: 'bg-indigo-50 border-indigo-100 text-indigo-850' }
        ];

        headers = ['Faixa Horária', 'Agendamentos Totais', 'Faturamento Estimado Finalizado', '% Ocupação Período'];
        rows = sorted.map(item => [
          `${item.hour} - ${String(parseInt(item.hour.split(':')[0], 10) + 1).padStart(2, '0')}:00`,
          item.count,
          formatBRL(item.revenue),
          `${totalSlots > 0 ? ((item.count / totalSlots) * 100).toFixed(1) : 0}%`
        ]);
        break;
      }

      case 'dias_movimentados': {
        title = 'Dias mais Movimentados';
        description = 'Distribuição e estatísticas de agendamentos e faturamento divididos por dia da semana.';
        
        const periodBookings = bookings.filter(b => (!startDate || b.date >= startDate) && (!endDate || b.date <= endDate));
        const daysSummary: Record<string, { count: number; revenue: number }> = {
          'Domingo': { count: 0, revenue: 0 },
          'Segunda-feira': { count: 0, revenue: 0 },
          'Terça-feira': { count: 0, revenue: 0 },
          'Quarta-feira': { count: 0, revenue: 0 },
          'Quinta-feira': { count: 0, revenue: 0 },
          'Sexta-feira': { count: 0, revenue: 0 },
          'Sábado': { count: 0, revenue: 0 }
        };

        periodBookings.forEach(b => {
          const dName = getDayOfWeekName(b.date);
          if (daysSummary[dName]) {
            daysSummary[dName].count += 1;
            if (b.status === 'finalizado') {
              daysSummary[dName].revenue += b.value;
            }
          }
        });

        const sorted = Object.entries(daysSummary)
          .map(([day, item]) => ({ day, ...item }))
          .sort((a, b) => b.count - a.count);

        const totalAtendimentos = periodBookings.length;

        kpis = [
          { label: 'Dia da Semana Líder', value: sorted[0]?.day || 'Nenhum', icon: <Calendar className="w-5 h-5 text-rose-500" />, color: 'bg-rose-50 border-rose-100 text-rose-800 font-bold' },
          { label: 'Volume no Dia de Pico', value: `${sorted[0]?.count || 0} agendamentos`, icon: <Activity className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-100 text-emerald-800' }
        ];

        headers = ['Dia da Semana', 'Total Agendamentos', 'Faturamento Finalizado', '% Ocupação Volume'];
        rows = sorted.map(item => [
          item.day,
          item.count,
          formatBRL(item.revenue),
          `${totalAtendimentos > 0 ? ((item.count / totalAtendimentos) * 100).toFixed(1) : 0}%`
        ]);
        break;
      }

      default: {
        title = 'Agendamentos por Período';
        description = 'Lista geral de todos os agendamentos cadastrados no período selecionado.';
        headers = ['ID', 'Data', 'Cliente', 'Profissional', 'Serviço', 'Valor', 'Status'];
        rows = filteredBookings.map(b => [b.id, formatDateBR(b.date), b.clientName, b.professionalName, b.serviceName, formatBRL(b.value), b.status]);
        break;
      }
    }

    return { title, description, kpis, headers, rows };
  };

  const { title, description, kpis, headers, rows } = getReportData();

  // Excel / CSV Export handler
  const handleExportCSV = () => {
    // UTF-8 BOM so Excel opens accented characters flawlessly in Portuguese
    const BOM = '\ufeff';
    const cleanRows = rows.map(r =>
      r.map(cell => {
        if (cell === null || cell === undefined) return '';
        const cellStr = String(cell);
        // Semicolon delimited is Portuguese standard for double-click opening in Excel
        if (cellStr.includes(';') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(';')
    );

    const csvContent = BOM + [headers.join(';'), ...cleanRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const cleanFileName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    link.setAttribute('download', `relatorio_${cleanFileName}_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF / Print handler
  const handlePrint = () => {
    window.print();
  };

  // Filter lists of report matching search
  const filteredCategories = categories.map(cat => {
    const matched = cat.reports.filter(r =>
      r.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(reportSearch.toLowerCase())
    );
    return { ...cat, reports: matched };
  }).filter(cat => cat.reports.length > 0);

  return (
    <div className="space-y-6">
      
      {/* 1. FILTER BAR (HIDES ON PRINT) */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#2B4C7E]" /> Filtros Analíticos Globais
            </h3>
            <p className="text-xs text-slate-400">Configure os parâmetros abaixo para gerar relatórios detalhados em tempo real.</p>
          </div>

          {/* Quick ranges */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/50">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: 'ontem', label: 'Ontem' },
              { id: '7dias', label: '7 dias' },
              { id: 'esteMes', label: 'Este Mês' },
              { id: 'mesPassado', label: 'Mês Anterior' },
              { id: 'tudo', label: 'Histórico' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setQuickRange(range.id as any)}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all hover:bg-white text-slate-500 hover:text-sky-950"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input filters row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
          
          <div className="space-y-1">
            <label className="font-bold text-slate-500 block">De *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 block">Até *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="font-bold text-slate-500 block">Profissional</label>
            <select
              value={filterProfId}
              onChange={(e) => setFilterProfId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
            >
              <option value="all">-- Todos --</option>
              {professionals.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="font-bold text-slate-500 block">Serviço</label>
            <select
              value={filterServiceId}
              onChange={(e) => setFilterServiceId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
            >
              <option value="all">-- Todos --</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="font-bold text-slate-500 block">Cliente</label>
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
            >
              <option value="all">-- Todos --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="font-bold text-slate-500 block">Forma de Pagamento</label>
            <select
              value={filterPayMethod}
              onChange={(e) => setFilterPayMethod(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none text-xs"
            >
              <option value="all">-- Todas --</option>
              {Object.keys(settings.cardFees || {}).map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 2. PRINT-ONLY HEADER */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 space-y-1">
        <h1 className="text-xl font-serif font-bold text-slate-900">{settings.name || 'Salão de Beleza'} - Sistema de Gestão</h1>
        <p className="text-xs text-slate-600">CNPJ: {settings.cnpj || settings.salonCNPJ || 'N/A'} | Fone: {settings.phone || settings.salonPhone}</p>
        <div className="flex justify-between items-center pt-2 text-[10px] font-mono text-slate-500">
          <span>Relatório Impresso em: {new Date().toLocaleString('pt-BR')}</span>
          <span>Período da Consulta: {formatDateBR(startDate)} a {formatDateBR(endDate)}</span>
        </div>
      </div>

      {/* 3. SPLIT WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: 24 reports list (HIDES ON PRINT) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-4 print:hidden self-stretch lg:max-h-[82vh] lg:overflow-y-auto">
          
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Buscar Relatórios (24)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Digite o nome do relatório..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Grouped report lists */}
          <div className="space-y-4">
            {filteredCategories.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono border-b border-slate-100 pb-1 pt-1">
                  {cat.title}
                </span>
                
                <div className="space-y-1">
                  {cat.reports.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReportId(r.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                        selectedReportId === r.id
                          ? 'bg-sky-950 text-amber-100 shadow-xs'
                          : 'hover:bg-slate-50 text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${selectedReportId === r.id ? 'bg-sky-900/65' : 'bg-slate-50'}`}>
                          {React.cloneElement(r.icon as React.ReactElement, {
                            className: `w-4 h-4 ${selectedReportId === r.id ? 'text-amber-300' : ''}`
                          })}
                        </div>
                        <span className="text-xs font-semibold truncate">{r.name}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${selectedReportId === r.id ? 'text-amber-100' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-8 text-slate-400 space-y-1 text-xs">
                <AlertTriangle className="w-7 h-7 text-slate-300 mx-auto" />
                <p>Nenhum relatório encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active report container (EXPANDS ON PRINT) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
          
          {/* Active Report Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 print:pb-2">
            <div>
              <h2 className="text-base font-serif font-bold text-sky-950 print:text-lg print:text-slate-900">{title}</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed print:hidden">{description}</p>
            </div>

            {/* Print & Export buttons */}
            <div className="flex gap-2 print:hidden shrink-0">
              <button
                onClick={handleExportCSV}
                disabled={rows.length === 0}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Exportar dados para abrir no Microsoft Excel"
              >
                <Download className="w-4 h-4" /> Exportar Excel (CSV)
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Imprimir relatório completo ou salvar como PDF"
              >
                <Printer className="w-4 h-4" /> Imprimir / PDF
              </button>
            </div>
          </div>

          {/* Active Report KPIs Row */}
          {kpis.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpis.map((kpi, idx) => (
                <div
                  key={idx}
                  className={`p-4 border rounded-xl flex items-center gap-3.5 shadow-xs ${kpi.color} print:bg-white print:border-slate-300`}
                >
                  <div className="p-2 bg-white/60 rounded-xl shrink-0 border border-white/20 print:border-slate-200">
                    {kpi.icon}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono block tracking-wider text-slate-500">{kpi.label}</span>
                    <span className="text-base font-bold block mt-0.5 font-mono">{kpi.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Report Data Table */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center print:hidden">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Linhas Detalhadas ({rows.length})</span>
              <span className="text-[9.5px] font-mono text-slate-400">Filtro de data ativo: {formatDateBR(startDate)} até {formatDateBR(endDate)}</span>
            </div>

            {rows.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2.5">
                <FileText className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
                <h4 className="text-sm font-semibold text-slate-700">Sem resultados para este relatório</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Não foram encontrados registros para o período e filtros selecionados. Tente ajustar o intervalo de datas ou limpe os filtros de profissional/cliente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs print:border-slate-300">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 print:bg-white print:border-slate-300">
                      {headers.map((h, i) => (
                        <th key={i} className="px-4 py-3 font-bold text-slate-600 print:text-slate-900 border-r last:border-r-0 border-slate-100/50 print:border-slate-300">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60 print:divide-slate-300">
                    {rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors print:hover:bg-transparent">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-4 py-2.5 font-medium text-slate-700 print:text-slate-800 border-r last:border-r-0 border-slate-100/50 print:border-slate-300 truncate max-w-[200px]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CRM Quick Actions panel specifically for clients sem retorno */}
          {selectedReportId === 'clientes_sem_retorno' && rows.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden animate-in fade-in duration-300">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-500/10 animate-bounce" /> Ação Reativa de WhatsApp recomendada
                </h4>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Consulte os números de telefone de contato listados acima na tabela e envie mensagens personalizadas de WhatsApp para reconvocar estas clientes ausentes e preencher os horários ociosos da sua equipe.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
