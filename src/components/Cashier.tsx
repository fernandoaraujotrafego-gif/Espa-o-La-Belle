/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  Plus,
  Minus,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  User,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  Info,
  X,
  CreditCard,
  Percent,
  Check,
  Trash2,
  ArrowLeft
} from 'lucide-react';

export default function Cashier() {
  const {
    cashier,
    openCashier,
    closeCashier,
    addCashierTransaction,
    settings,
    bookings,
    clients,
    services,
    professionals,
    addBooking,
    checkoutBooking,
    updateBooking
  } = useApp();

  const [isOpenFormOpen, setIsOpenFormOpen] = useState(false);
  const [isCloseFormOpen, setIsCloseFormOpen] = useState(false);
  const [isTxFormOpen, setIsTxFormOpen] = useState(false);

  // Form states
  const [initialValueInput, setInitialValueInput] = useState(150);
  const [closedValueInput, setClosedValueInput] = useState(0);
  const [closeObs, setCloseObs] = useState('');

  // Transaction states
  const [txType, setTxType] = useState<'entrada' | 'saida' | 'sangria'>('entrada');
  const [txDesc, setTxDesc] = useState('');
  const [txVal, setTxVal] = useState(0);
  const [txCat, setTxCat] = useState('Serviço');
  const [txMethod, setTxMethod] = useState(() => Object.keys(settings.cardFees || {})[0] || 'Pix');

  // Selected Client Account state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Add new service form states
  const [newSrvId, setNewSrvId] = useState('');
  const [newProfId, setNewProfId] = useState('');
  const [newSrvValue, setNewSrvValue] = useState<number>(0);
  const [newSrvObs, setNewSrvObs] = useState('');

  // Checkout form states
  const [checkoutMethod, setCheckoutMethod] = useState(() => Object.keys(settings.cardFees || {})[0] || 'Pix');
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);
  const [checkoutObs, setCheckoutObs] = useState('');
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<Array<{ id: string; method: string; value: number; cashPaid?: number }>>(() => [
    { id: '1', method: Object.keys(settings.cardFees || {})[0] || 'Pix', value: 0, cashPaid: 0 }
  ]);
  const [singleCashPaid, setSingleCashPaid] = useState<number>(0);

  // Observation editing states
  const [editingBookingObsId, setEditingBookingObsId] = useState<string | null>(null);
  const [tempObsVal, setTempObsVal] = useState('');

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Cash computations
  const totalEntries = cashier.transactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + t.value, 0);

  const totalOuts = cashier.transactions
    .filter(t => t.type === 'saida' || t.type === 'sangria')
    .reduce((sum, t) => sum + t.value, 0);

  const calculatedBalance = cashier.initialValue + totalEntries - totalOuts;

  const entriesByMethod = cashier.transactions
    .filter(t => t.type === 'entrada')
    .reduce((acc, t) => {
      const method = t.paymentMethod || 'Dinheiro';
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count += 1;
      acc[method].total += t.value;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    openCashier(initialValueInput);
    setIsOpenFormOpen(false);
  };

  const handleCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if there are any unpaid bookings for the cashier date
    const cashierDate = cashier.openedAt?.split(' ')[0] || new Date().toISOString().split('T')[0];
    const unpaidBookings = bookings.filter(b => 
      b.date === cashierDate && 
      !['cancelado', 'faltou', 'reagendado'].includes(b.status) && 
      !b.isPaid
    );

    if (unpaidBookings.length > 0) {
      const unpaidClients = Array.from(new Set(unpaidBookings.map(b => b.clientName)));
      alert(`⚠️ Não é possível fechar o caixa!\n\nHá serviços agendados para hoje que ainda não foram pagos. Clientes com pendências:\n\n${unpaidClients.map(name => `• ${name}`).join('\n')}\n\nPor favor, realize o recebimento (checkout) de todos os serviços antes de fechar o caixa.`);
      return;
    }

    closeCashier(closedValueInput, closeObs);
    setIsCloseFormOpen(false);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc || txVal <= 0) return;

    addCashierTransaction(
      txType,
      txDesc,
      txVal,
      txCat,
      txType === 'entrada' ? txMethod : undefined,
      false
    );

    setIsTxFormOpen(false);
    setTxDesc('');
    setTxVal(0);
  };

  const getTxTypeStyle = (type: string) => {
    switch (type) {
      case 'entrada': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'saida': return 'text-rose-700 bg-rose-50 border-rose-100';
      case 'sangria': return 'text-amber-700 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  // Group daily scheduled bookings by client
  const cashierDate = cashier.openedAt?.split(' ')[0] || new Date().toISOString().split('T')[0];
  const dailyBookings = bookings.filter(b => b.date === cashierDate && b.status !== 'cancelado');

  const clientsGrouped: Record<string, {
    client: { id: string; name: string; phone: string };
    bookings: any[];
    totalSum: number;
    hasPending: boolean;
  }> = {};

  dailyBookings.forEach(b => {
    if (!clientsGrouped[b.clientId]) {
      clientsGrouped[b.clientId] = {
        client: { id: b.clientId, name: b.clientName, phone: b.clientPhone },
        bookings: [],
        totalSum: 0,
        hasPending: false
      };
    }
    clientsGrouped[b.clientId].bookings.push(b);
    clientsGrouped[b.clientId].totalSum += b.value;
    if (b.status !== 'finalizado') {
      clientsGrouped[b.clientId].hasPending = true;
    }
  });

  const activeAccountBookings = selectedClientId 
    ? dailyBookings.filter(b => b.clientId === selectedClientId) 
    : [];

  const activeAccountClient = selectedClientId 
    ? clients.find(c => c.id === selectedClientId) || { id: selectedClientId, name: activeAccountBookings[0]?.clientName || 'Cliente', phone: activeAccountBookings[0]?.clientPhone || '' }
    : null;

  const totalPendingServices = activeAccountBookings
    .filter(b => b.status !== 'finalizado')
    .reduce((sum, b) => sum + b.value, 0);

  const totalWithDiscount = Math.max(0, totalPendingServices - checkoutDiscount);

  const splitPaymentsSum = splitPayments.reduce((sum, sp) => sum + sp.value, 0);
  const splitDiff = splitPaymentsSum - totalWithDiscount;

  const handleAddSplitPayment = () => {
    const splitPaymentsSum = splitPayments.reduce((sum, sp) => sum + sp.value, 0);
    const remaining = Math.max(0, totalWithDiscount - splitPaymentsSum);

    setSplitPayments(prev => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, method: Object.keys(settings.cardFees || {})[0] || 'Pix', value: remaining, cashPaid: remaining }
    ]);
  };

  const handleRemoveSplitPayment = (id: string) => {
    setSplitPayments(prev => prev.filter(sp => sp.id !== id));
  };

  const handleUpdateSplitPayment = (id: string, field: 'method' | 'value' | 'cashPaid', val: any) => {
    setSplitPayments(prev => prev.map(sp => {
      if (sp.id === id) {
        if (field === 'value') {
          return { ...sp, value: Math.max(0, Number(val)) };
        }
        if (field === 'cashPaid') {
          return { ...sp, cashPaid: Math.max(0, Number(val)) };
        }
        return { ...sp, [field]: val };
      }
      return sp;
    }));
  };

  const handleServiceChange = (id: string) => {
    setNewSrvId(id);
    const srv = services.find(s => s.id === id);
    if (srv) {
      setNewSrvValue(srv.price);
    }
  };

  const handleStartEditObs = (bookingId: string, currentObs: string) => {
    setEditingBookingObsId(bookingId);
    setTempObsVal(currentObs || '');
  };

  const handleSaveBookingObs = async (bookingId: string) => {
    await updateBooking(bookingId, { obs: tempObsVal });
    setEditingBookingObsId(null);
    setTempObsVal('');
  };

  const handleAddServiceToAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newSrvId || !newProfId || !activeAccountClient) return;

    const srv = services.find(s => s.id === newSrvId);
    const prof = professionals.find(p => p.id === newProfId);
    if (!srv || !prof) return;

    const timeStr = new Date().toTimeString().split(' ')[0].slice(0, 5);

    await addBooking({
      clientId: selectedClientId,
      clientName: activeAccountClient.name,
      clientPhone: activeAccountClient.phone,
      serviceId: srv.id,
      serviceName: srv.name,
      professionalId: prof.id,
      professionalName: prof.name,
      date: cashierDate,
      time: timeStr,
      duration: srv.duration,
      value: newSrvValue,
      status: 'confirmado',
      isPaid: false,
      obs: newSrvObs || undefined
    }, true); // ignoreConflict = true for cashier add-on

    // Reset sub-form
    setNewSrvId('');
    setNewProfId('');
    setNewSrvValue(0);
    setNewSrvObs('');
  };

  const handleCheckoutAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const pendingBks = activeAccountBookings.filter(b => b.status !== 'finalizado');
    if (pendingBks.length === 0) return;

    const totalPendingServices = pendingBks.reduce((sum, b) => sum + b.value, 0);
    const totalWithDiscount = Math.max(0, totalPendingServices - checkoutDiscount);

    if (isSplitPayment) {
      const splitPaymentsSum = splitPayments.reduce((sum, sp) => sum + sp.value, 0);
      if (Math.abs(splitPaymentsSum - totalWithDiscount) > 0.01) {
        alert(`O valor total das formas de pagamento (${formatBRL(splitPaymentsSum)}) deve ser exatamente igual ao total com desconto (${formatBRL(totalWithDiscount)}).`);
        return;
      }

      // Distribute each payment method's value proportionally to each booking
      const allocatedByMethod = splitPayments.map(sp => ({ method: sp.method, totalAllocated: 0 }));

      pendingBks.forEach((b, bkIdx) => {
        const discountToApply = bkIdx === 0 ? checkoutDiscount : 0;
        const bookingGross = b.value - discountToApply;
        const obsToApply = bkIdx === 0 ? checkoutObs : '';

        const bookingMethodsSplit: Array<{ method: string; value: number }> = [];

        if (totalWithDiscount > 0) {
          const ratio = bookingGross / totalWithDiscount;
          splitPayments.forEach((sp, spIdx) => {
            let allocatedVal = 0;
            if (bkIdx === pendingBks.length - 1) {
              // Last booking gets the remainder to prevent precision loss
              allocatedVal = Number((sp.value - allocatedByMethod[spIdx].totalAllocated).toFixed(2));
            } else {
              allocatedVal = Number((sp.value * ratio).toFixed(2));
              allocatedByMethod[spIdx].totalAllocated += allocatedVal;
            }

            if (allocatedVal > 0) {
              bookingMethodsSplit.push({ method: sp.method, value: allocatedVal });
            }
          });
        }

        checkoutBooking(b.id, {
          method: bookingMethodsSplit[0]?.method || 'Pix',
          discount: discountToApply,
          discountProducts: 0,
          addedValue: 0,
          productsSold: [],
          obs: obsToApply || b.obs,
          methodsSplit: bookingMethodsSplit
        });
      });
    } else {
      pendingBks.forEach((b, index) => {
        const discountToApply = index === 0 ? checkoutDiscount : 0;
        const obsToApply = index === 0 ? checkoutObs : '';

        checkoutBooking(b.id, {
          method: checkoutMethod,
          discount: discountToApply,
          discountProducts: 0,
          addedValue: 0,
          productsSold: [],
          obs: obsToApply || b.obs
        });
      });
    }

    // Close and reset
    setSelectedClientId(null);
    setCheckoutDiscount(0);
    setCheckoutObs('');
    setIsSplitPayment(false);
    setSplitPayments([{ id: '1', method: Object.keys(settings.cardFees || {})[0] || 'Pix', value: 0, cashPaid: 0 }]);
    setSingleCashPaid(0);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Status Banner */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
            cashier.isOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}>
            {cashier.isOpen ? <Unlock className="w-5 h-5 animate-pulse" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-sky-950 flex items-center gap-2">
              Caixa Operacional do Dia: <span className={`text-xs px-2.5 py-0.5 rounded-full border ${
                cashier.isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>{cashier.isOpen ? 'ABERTO' : 'FECHADO'}</span>
            </h3>
            {cashier.isOpen ? (
              <p className="text-xs text-slate-400">Aberto em {cashier.openedAt?.split(' ')[1]}h com fundo de reserva de <strong>{formatBRL(cashier.initialValue)}</strong></p>
            ) : (
              <p className="text-xs text-slate-400">O caixa está fechado. Abra-o para receber pagamentos e movimentar sangrias.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {cashier.isOpen ? (
            <>
              <button
                onClick={() => setIsTxFormOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <Plus className="w-4 h-4" /> Movimentação Avulsa
              </button>
              <button
                onClick={() => {
                  setClosedValueInput(Number(calculatedBalance.toFixed(2)));
                  setCloseObs('');
                  setIsCloseFormOpen(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4" /> Fechar Caixa
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setInitialValueInput(150);
                setIsOpenFormOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Unlock className="w-4 h-4" /> Abrir Caixa do Dia
            </button>
          )}
        </div>
      </div>

      {/* Main cashier statistics dashboards */}
      {cashier.isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Fundo de Abertura</span>
            <p className="text-xl font-bold text-sky-950 mt-1">{formatBRL(cashier.initialValue)}</p>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Valor em dinheiro de troco</p>
          </div>

          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block text-emerald-600">Total de Entradas (+)</span>
            <p className="text-xl font-bold text-emerald-700 mt-1">+{formatBRL(totalEntries)}</p>
            <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Receitas de serviços e produtos</p>
          </div>

          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block text-rose-600">Total Saídas / Sangrias (-)</span>
            <p className="text-xl font-bold text-rose-700 mt-1">-{formatBRL(totalOuts)}</p>
            <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Retiradas e despesas operacionais</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs bg-sky-50/25">
            <span className="text-[10px] text-sky-700 font-mono uppercase tracking-wider block font-semibold">Saldo Atual Estimado (=)</span>
            <p className="text-2xl font-bold text-sky-950 mt-1">{formatBRL(calculatedBalance)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Fundo + Entradas - Saídas</p>
          </div>
        </div>
      )}

      {/* Detalhamento por Forma de Pagamento no Painel Geral */}
      {cashier.isOpen && totalEntries > 0 && (
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#2B4C7E]" />
            <h4 className="text-xs font-serif font-bold text-sky-950">Entradas Detalhadas por Forma de Pagamento</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {(Object.entries(entriesByMethod) as [string, { count: number; total: number }][]).map(([method, data]) => (
              <div key={method} className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block truncate">{method}</span>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className="text-sm font-bold text-slate-800">{formatBRL(data.total)}</span>
                  <span className="text-[9px] bg-[#E2E8F0] text-[#2B4C7E] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {data.count} {data.count === 1 ? 'venda' : 'vendas'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clientes e Contas de Hoje (Daily Accounts) */}
      {cashier.isOpen && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-serif font-semibold text-sky-950 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-700" /> Clientes e Contas de Hoje
              </h3>
              <p className="text-xs text-slate-400">Gerencie atendimentos, lance novos serviços avulsos, adicione observações e faça fechamento de contas.</p>
            </div>
            <span className="text-[10px] bg-sky-50 text-sky-700 font-mono font-bold px-2.5 py-1 rounded-lg border border-sky-100 self-start">
              {Object.keys(clientsGrouped).length} {Object.keys(clientsGrouped).length === 1 ? 'cliente' : 'clientes'} no dia
            </span>
          </div>

          {Object.keys(clientsGrouped).length === 0 ? (
            <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Clock className="w-5 h-5 text-slate-300 mx-auto mb-1.5 animate-pulse" />
              <p className="text-xs text-slate-400 italic">Nenhum cliente agendado para o dia de abertura do caixa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(clientsGrouped).map(({ client, bookings: clientBks, totalSum, hasPending }) => {
                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setCheckoutDiscount(0);
                      setCheckoutObs('');
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer flex gap-3 items-start relative ${
                      !hasPending
                        ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50 hover:border-emerald-200'
                        : 'bg-white border-slate-100 hover:border-sky-200 hover:bg-slate-50/30'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      !hasPending 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-sky-50 text-sky-800'
                    }`}>
                      {client.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="font-bold text-xs text-sky-950 truncate">{client.name}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 border ${
                          !hasPending
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {!hasPending ? 'Pago' : 'Pendente'}
                        </span>
                      </div>

                      {/* Services details listing */}
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        {clientBks.map((b, idx) => (
                          <div key={`${b.id || 'b'}-${idx}`} className="flex justify-between items-center gap-1">
                            <span className="truncate">
                              • {b.serviceName} <span className="text-[9px] text-slate-400">({b.professionalName})</span>
                            </span>
                            <span className="font-mono font-medium text-slate-600 shrink-0">{formatBRL(b.value)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-100/70 flex justify-between items-center mt-1.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Total do Dia:</span>
                        <strong className={`font-mono text-xs ${!hasPending ? 'text-emerald-700' : 'text-sky-950'}`}>
                          {formatBRL(totalSum)}
                        </strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Daily cash ledger records */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-serif font-semibold text-sky-950 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-sky-700" /> Fluxo de Movimentações de Hoje
        </h3>

        {!cashier.isOpen && cashier.transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-1.5">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">O caixa está fechado no momento.</p>
          </div>
        ) : cashier.transactions.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-8">Nenhuma movimentação financeira registrada para hoje.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-500">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10px] uppercase">
                  <th className="py-2.5">Horário / Data</th>
                  <th className="py-2.5">Descrição</th>
                  <th className="py-2.5">Categoria</th>
                  <th className="py-2.5">Forma</th>
                  <th className="py-2.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashier.transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 text-slate-400 font-mono text-[10px]">{t.date.split(' ')[1]}</td>
                    <td className="py-3 font-medium text-slate-800">{t.description}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${getTxTypeStyle(t.type)}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-slate-500">{t.paymentMethod || '-'}</td>
                    <td className={`py-3 text-right font-mono font-bold ${
                      t.type === 'entrada' ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {t.type === 'entrada' ? '+' : '-'}{formatBRL(t.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Open Cash Register */}
      {isOpenFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-sky-950">Abertura de Caixa do Dia</h3>
            
            <form onSubmit={handleOpenRegister} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Fundo de Reserva / Troco Inicial (R$)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialValueInput}
                  onChange={(e) => setInitialValueInput(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenFormOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Abrir Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Close Cash Register */}
      {isCloseFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-sky-950">Fechamento do Caixa</h3>
            
            <form onSubmit={handleCloseRegister} className="space-y-4 text-xs">
              <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl space-y-1 font-mono text-[11px] text-sky-800">
                <p>Saldo Calculado pelo Sistema: {formatBRL(calculatedBalance)}</p>
                <p>Fundo de Troco: {formatBRL(cashier.initialValue)}</p>
                <p>Receitas Totais: +{formatBRL(totalEntries)}</p>
                
                {/* Detailed breakdown by payment method */}
                {totalEntries > 0 && (
                  <div className="mt-2 pt-2 border-t border-sky-200/50 space-y-1 text-[10px] font-sans">
                    <p className="font-bold text-sky-950 uppercase tracking-wider mb-1 text-[9px]">Entradas por Forma de Pagamento:</p>
                    {(Object.entries(entriesByMethod) as [string, { count: number; total: number }][]).map(([method, data]) => (
                      <div key={method} className="flex justify-between items-center text-sky-900 pl-1.5 border-l border-sky-300 font-mono">
                        <span>• {method} ({data.count} {data.count === 1 ? 'vd' : 'vds'}):</span>
                        <span className="font-bold">{formatBRL(data.total)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="pt-1">Despesas / Sangrias: -{formatBRL(totalOuts)}</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Valor Físico Conferido em Gaveta (R$)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={closedValueInput}
                  onChange={(e) => setClosedValueInput(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-700 focus:outline-none"
                />
                {closedValueInput !== calculatedBalance && (
                  <p className="text-[10px] text-rose-600 font-bold">Atenção: Há uma divergência de {formatBRL(Math.abs(closedValueInput - calculatedBalance))} entre o físico e o sistema!</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500 block">Observações do Fechamento</label>
                <textarea
                  rows={2}
                  placeholder="Explique eventuais quebras ou sangrias feitas..."
                  value={closeObs}
                  onChange={(e) => setCloseObs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseFormOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Fechar Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Avulsa transaction */}
      {isTxFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-sky-950">Registrar Movimentação de Caixa</h3>
            
            <form onSubmit={handleAddTransaction} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Tipo de Movimento</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['entrada', 'saida', 'sangria'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTxType(t);
                        if (t === 'entrada') setTxCat('Serviço');
                        else if (t === 'saida') setTxCat('Despesa Insumo');
                        else setTxCat('Sangria Proprietária');
                      }}
                      className={`py-1 px-1.5 text-xs font-semibold rounded-lg border uppercase ${
                        txType === t
                          ? 'bg-sky-950 text-amber-100 border-sky-950'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Descrição do Lançamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de pó de café, Retirada Proprietária Bruna"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Valor Monetário (R$) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={txVal || ''}
                    onChange={(e) => setTxVal(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Categoria</label>
                  <input
                    type="text"
                    required
                    value={txCat}
                    onChange={(e) => setTxCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {txType === 'entrada' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 block">Forma de Entrada</label>
                  <select
                    value={txMethod}
                    onChange={(e) => setTxMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                  >
                    {Object.keys(settings.cardFees || {}).map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsTxFormOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-sky-950 hover:bg-sky-900 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Confirmar Lançamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Client Account Details & Walk-in / Checkout Actions */}
      {selectedClientId && activeAccountClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-sky-700 font-mono font-bold uppercase tracking-wider block">Conta Operacional do Dia</span>
                <h3 className="text-lg font-serif font-bold text-sky-950 flex items-center gap-2">
                  <User className="w-5 h-5 text-sky-700" /> {activeAccountClient.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Telefone: {activeAccountClient.phone || 'Não informado'}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedClientId(null);
                  setNewSrvId('');
                  setNewProfId('');
                  setNewSrvValue(0);
                  setNewSrvObs('');
                  setCheckoutDiscount(0);
                  setCheckoutObs('');
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of services for today */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Serviços Lançados Hoje</h4>
              
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {activeAccountBookings.map((b, idx) => (
                  <div key={`${b.id}-${idx}`} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-start gap-4 hover:bg-slate-50/80 transition-colors">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-sky-950">{b.serviceName}</strong>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          b.status === 'finalizado'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {b.status === 'finalizado' ? 'Pago' : b.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Profissional: <strong className="text-slate-600">{b.professionalName}</strong></p>
                      
                      {/* Observations inline edit */}
                      {editingBookingObsId === b.id ? (
                        <div className="flex gap-1.5 mt-2 max-w-md">
                          <input
                            type="text"
                            value={tempObsVal}
                            onChange={(e) => setTempObsVal(e.target.value)}
                            placeholder="Adicionar observações..."
                            className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-950"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveBookingObs(b.id)}
                            className="px-2 py-1 bg-sky-950 hover:bg-sky-900 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBookingObsId(null)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-slate-500 italic">
                            {b.obs ? `"${b.obs}"` : 'Sem observações.'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEditObs(b.id, b.obs || '')}
                            className="text-[9px] font-bold text-sky-700 hover:underline cursor-pointer"
                          >
                            [Editar]
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs text-sky-950">{formatBRL(b.value)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Sum indicator */}
              <div className="flex justify-between items-center bg-sky-50/50 border border-sky-100 p-3 rounded-xl">
                <span className="text-xs font-semibold text-sky-950">Subtotal de Hoje:</span>
                <span className="font-mono font-bold text-sm text-sky-950">
                  {formatBRL(activeAccountBookings.reduce((sum, b) => sum + b.value, 0))}
                </span>
              </div>
            </div>

            {/* Split layout: Add service (left) and Checkout Account (right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-5 text-xs">
              
              {/* Add New Service Column */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-sky-700" /> Lançar Outro Serviço
                </h4>
                
                <form onSubmit={handleAddServiceToAccount} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block">Serviço *</label>
                    <select
                      required
                      value={newSrvId}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-950"
                    >
                      <option value="">Selecione o serviço...</option>
                      {services
                        .filter(s => s.active)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({formatBRL(s.price)})</option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block">Profissional *</label>
                    <select
                      required
                      value={newProfId}
                      onChange={(e) => setNewProfId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-950"
                    >
                      <option value="">Selecione o profissional...</option>
                      {professionals
                        .filter(p => p.active)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 block">Preço (R$) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={newSrvValue || ''}
                        onChange={(e) => setNewSrvValue(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-950"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 block">Observação</label>
                      <input
                        type="text"
                        placeholder="Ex: Retoque"
                        value={newSrvObs}
                        onChange={(e) => setNewSrvObs(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-950"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs border border-slate-200"
                  >
                    <Plus className="w-4 h-4" /> Lançar Serviço
                  </button>
                </form>
              </div>

              {/* Checkout / Close Account Column */}
              <div className="space-y-3 bg-slate-50/50 p-4 border border-slate-100 rounded-xl text-xs">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fechar Conta Operacional
                </h4>

                {activeAccountBookings.filter(b => b.status !== 'finalizado').length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-1.5">
                    <Check className="w-8 h-8 text-emerald-500 bg-emerald-50 rounded-full p-1.5" />
                    <p className="text-[11px] text-emerald-800 font-bold">Conta Quitada!</p>
                    <p className="text-[10px] text-slate-400">Todos os agendamentos de hoje foram finalizados e pagos.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCheckoutAccount} className="space-y-4 text-xs">
                    <div className="space-y-1.5 bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/50">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-600 uppercase tracking-wide">Serviços Pendentes:</span>
                        <span className="font-bold font-mono text-slate-800">{formatBRL(totalPendingServices)}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 block text-[10px]">Desconto em Serviços (R$)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={checkoutDiscount || ''}
                          onChange={(e) => setCheckoutDiscount(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs"
                          placeholder="0,00"
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-200">
                        <span className="font-bold text-slate-900 uppercase tracking-wide">Total Líquido:</span>
                        <span className="text-sm font-extrabold font-mono text-slate-900">{formatBRL(totalWithDiscount)}</span>
                      </div>
                    </div>

                    {/* Simultaneous payment methods toggle */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="font-bold text-slate-600 text-[11px]">Método de Pagamento</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !isSplitPayment;
                          setIsSplitPayment(nextVal);
                          if (nextVal) {
                            setSplitPayments([{ id: '1', method: Object.keys(settings.cardFees || {})[0] || 'Pix', value: totalWithDiscount, cashPaid: totalWithDiscount }]);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold tracking-wider uppercase border transition-all ${
                          isSplitPayment
                            ? 'bg-sky-50 border-sky-200 text-sky-700'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {isSplitPayment ? '✓ Múltiplas Formas' : '+ Dividir Conta'}
                      </button>
                    </div>

                    {!isSplitPayment ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <select
                            value={checkoutMethod}
                            onChange={(e) => setCheckoutMethod(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs font-semibold"
                          >
                            {Object.keys(settings.cardFees || {}).map(method => (
                              <option key={method} value={method}>{method}</option>
                            ))}
                          </select>
                        </div>

                        {checkoutMethod === 'Dinheiro' && (
                          <div className="space-y-1.5 animate-in fade-in duration-150">
                            <label className="font-bold text-slate-500 block text-[10px]">Valor Entregue (R$)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={singleCashPaid || ''}
                              onChange={(e) => setSingleCashPaid(Math.max(0, Number(e.target.value)))}
                              placeholder="Digite o valor pago pelo cliente..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs"
                            />
                            {singleCashPaid > totalWithDiscount && (
                              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center justify-between animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div>
                                    <span className="text-[9px] font-bold text-emerald-600 block uppercase tracking-wider">Troco do Cliente</span>
                                    <span className="text-sm font-extrabold font-mono text-emerald-700">{formatBRL(singleCashPaid - totalWithDiscount)}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Troco</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 border-l-2 border-sky-100 pl-2">
                        <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                          {splitPayments.map((sp, idx) => (
                            <div key={sp.id} className="bg-white border border-slate-100 p-2 rounded-xl space-y-1.5 shadow-2xs relative">
                              <div className="flex items-center gap-1.5 justify-between">
                                <select
                                  value={sp.method}
                                  onChange={(e) => handleUpdateSplitPayment(sp.id, 'method', e.target.value)}
                                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none text-[10px] font-semibold w-[120px]"
                                >
                                  {Object.keys(settings.cardFees || {}).map(method => (
                                    <option key={method} value={method}>
                                      {method === 'Cartão de Débito' ? 'Débito' : method === 'Cartão de Crédito' ? 'Crédito' : method}
                                    </option>
                                  ))}
                                </select>

                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-slate-400 font-mono text-[10px]">R$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={sp.value || ''}
                                    placeholder="Valor"
                                    onChange={(e) => handleUpdateSplitPayment(sp.id, 'value', e.target.value)}
                                    className="w-[80px] px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 text-right focus:outline-none text-[10px]"
                                  />
                                </div>

                                {splitPayments.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSplitPayment(sp.id)}
                                    className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                                    title="Remover forma de pagamento"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* If selected method is cash, calculate split change */}
                              {sp.method === 'Dinheiro' && (
                                <div className="bg-slate-50/50 p-1.5 rounded-lg border border-slate-100 space-y-1 animate-in fade-in duration-100">
                                  <div className="flex items-center justify-between gap-1 text-[9px]">
                                    <span className="font-bold text-slate-500">Valor Entregue (Dinheiro):</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={sp.cashPaid || ''}
                                      onChange={(e) => handleUpdateSplitPayment(sp.id, 'cashPaid', e.target.value)}
                                      className="w-[70px] px-1 py-0.5 bg-white border border-slate-200 rounded text-right font-mono text-[9px]"
                                    />
                                  </div>
                                  {Number(sp.cashPaid) > sp.value && (
                                    <div className="flex items-center justify-between text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">
                                      <span>Troco para esta parte:</span>
                                      <span className="font-mono">{formatBRL(Number(sp.cashPaid) - sp.value)}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleAddSplitPayment}
                          className="w-full py-1 bg-sky-50 hover:bg-sky-100 border border-sky-100 text-[#2B4C7E] font-bold rounded-lg transition-all flex items-center justify-center gap-1 text-[10px] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Adicionar Forma de Pagamento
                        </button>

                        {/* Split Status Widget */}
                        <div className="p-2.5 rounded-xl border text-[10px] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-bold">Total Rateado:</span>
                            <span className="font-bold font-mono">{formatBRL(splitPaymentsSum)}</span>
                          </div>
                          
                          {Math.abs(splitDiff) < 0.01 ? (
                            <div className="bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1 mt-1 justify-center">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Soma bate com o valor total!
                            </div>
                          ) : splitDiff < 0 ? (
                            <div className="bg-amber-50 text-amber-800 font-bold px-2 py-1 rounded-lg border border-amber-100 flex items-center justify-between mt-1">
                              <span>Ainda restam para ratear:</span>
                              <span className="font-mono">{formatBRL(Math.abs(splitDiff))}</span>
                            </div>
                          ) : (
                            <div className="bg-rose-50 text-rose-800 font-bold px-2 py-1 rounded-lg border border-rose-100 flex items-center justify-between mt-1">
                              <span>Excesso de rateio por:</span>
                              <span className="font-mono">{formatBRL(splitDiff)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 block text-[10px]">Observações do Fechamento</label>
                      <textarea
                        rows={2}
                        placeholder="Detalhes do pagamento ou atendimento..."
                        value={checkoutObs}
                        onChange={(e) => setCheckoutObs(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-slate-700 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSplitPayment && Math.abs(splitDiff) >= 0.01}
                      className={`w-full py-2 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md text-xs cursor-pointer ${
                        isSplitPayment && Math.abs(splitDiff) >= 0.01
                          ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Check className="w-4 h-4" /> Finalizar & Confirmar Recebimento
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* Botão Voltar na parte inferior */}
            <div className="flex justify-center border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedClientId(null);
                  setNewSrvId('');
                  setNewProfId('');
                  setNewSrvValue(0);
                  setNewSrvObs('');
                  setCheckoutDiscount(0);
                  setCheckoutObs('');
                }}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar para Contas do Dia
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
