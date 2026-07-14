/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ServicePackage, ServiceCombo, ServicePackageItem } from '../types';
import {
  Package,
  Plus,
  Zap,
  User,
  ShoppingBag,
  Calendar,
  CheckCircle,
  Clock,
  Briefcase,
  Layers,
  History,
  Tag,
  Edit2,
  Trash2,
  Users,
  Check,
  PlusCircle,
  MinusCircle,
  X,
  HelpCircle,
  DollarSign,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface LocalPackageItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  sessionsUsed: number;
  pricePerSession: number;
  professionalId?: string; // empty string means any/all
}

export default function PackagesCombos() {
  const {
    packages,
    combos,
    clients,
    services,
    professionals,
    sellPackage,
    updatePackage,
    deletePackage,
    usePackageSession,
    addCombo,
    updateCombo,
    deleteCombo
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pacotes' | 'combos'>('pacotes');

  // Package Form States
  const [isPkgFormOpen, setIsPkgFormOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgClientId, setPkgClientId] = useState('');
  const [pkgName, setPkgName] = useState('Pacote Personalizado');
  const [pkgValue, setPkgValue] = useState(0);
  const [pkgMonths, setPkgMonths] = useState(3);
  const [pkgItems, setPkgItems] = useState<LocalPackageItem[]>([]);

  // Combo Form States
  const [isComboFormOpen, setIsComboFormOpen] = useState(false);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [cbName, setCbName] = useState('');
  const [cbServices, setCbServices] = useState<string[]>([]);
  const [cbPriceOriginal, setCbPriceOriginal] = useState(0);
  const [cbPricePromo, setCbPricePromo] = useState(0);
  const [cbActive, setCbActive] = useState(true);

  // Consumption State
  const [isConsumeFormOpen, setIsConsumeFormOpen] = useState(false);
  const [selectedPkgToConsume, setSelectedPkgToConsume] = useState<ServicePackage | null>(null);
  const [consumeServiceName, setConsumeServiceName] = useState('');
  const [consumeProfName, setConsumeProfName] = useState('');

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Auto calculate original price sum for package items
  const suggestedPkgValue = pkgItems.reduce((sum, item) => sum + (item.quantity * item.pricePerSession), 0);

  // Auto calculate combo original price on change
  useEffect(() => {
    let sum = 0;
    cbServices.forEach(id => {
      const s = services.find(srv => srv.id === id);
      if (s) sum += s.price;
    });
    setCbPriceOriginal(sum);
  }, [cbServices, services]);

  // Handle open form for selling/creating packages
  const handleOpenPackageForm = (pkg?: ServicePackage) => {
    if (pkg) {
      setEditingPackageId(pkg.id);
      setPkgClientId(pkg.clientId);
      setPkgName(pkg.name);
      setPkgValue(pkg.value);
      
      // Calculate months from validity date (or default to 3)
      const months = 3; 
      setPkgMonths(months);

      if (pkg.items && pkg.items.length > 0) {
        setPkgItems(pkg.items.map(item => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          quantity: item.quantity,
          sessionsUsed: item.sessionsUsed || 0,
          pricePerSession: item.pricePerSession,
          professionalId: item.professionalId || ''
        })));
      } else {
        // Fallback for backward compatibility
        setPkgItems(pkg.servicesIncluded.map(srvId => {
          const srv = services.find(s => s.id === srvId);
          const sessionsPerSrv = Math.floor(pkg.totalSessions / pkg.servicesIncluded.length) || 4;
          return {
            serviceId: srvId,
            serviceName: srv?.name || 'Serviço',
            quantity: sessionsPerSrv,
            sessionsUsed: pkg.sessionsUsed > 0 ? Math.floor(pkg.sessionsUsed / pkg.servicesIncluded.length) : 0,
            pricePerSession: srv?.price || 0,
            professionalId: ''
          };
        }));
      }
    } else {
      setEditingPackageId(null);
      setPkgClientId('');
      setPkgName('Pacote Personalizado');
      setPkgValue(0);
      setPkgMonths(3);
      setPkgItems([]);
    }
    setIsPkgFormOpen(true);
  };

  // Submit handler for Packages
  const handlePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgClientId || !pkgName || pkgItems.length === 0) return;

    const cli = clients.find(c => c.id === pkgClientId);
    if (!cli) return;

    // Build the ServicePackageItem structure
    const finalItems: ServicePackageItem[] = pkgItems.map(item => {
      const pName = item.professionalId 
        ? professionals.find(p => p.id === item.professionalId)?.name 
        : undefined;
      return {
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        quantity: item.quantity,
        sessionsUsed: item.sessionsUsed || 0,
        pricePerSession: item.pricePerSession,
        professionalId: item.professionalId || undefined,
        professionalName: pName
      };
    });

    const servicesIncluded = Array.from(new Set(pkgItems.map(item => item.serviceId)));

    if (editingPackageId) {
      // Edit existing package
      updatePackage(editingPackageId, {
        name: pkgName,
        clientId: pkgClientId,
        clientName: cli.name,
        servicesIncluded,
        value: pkgValue,
        items: finalItems
      });
    } else {
      // Sell/Create new package
      sellPackage(
        cli.id,
        cli.name,
        pkgName,
        pkgValue,
        servicesIncluded,
        pkgMonths,
        finalItems
      );
    }

    setIsPkgFormOpen(false);
  };

  // Add a service item to the package builder
  const handleAddServiceToPkg = (serviceId: string) => {
    if (!serviceId) return;
    const srv = services.find(s => s.id === serviceId);
    if (!srv) return;

    setPkgItems(prev => {
      // Avoid duplicate adding of the exact same configuration if not wanted, or just append
      const newItem: LocalPackageItem = {
        serviceId: srv.id,
        serviceName: srv.name,
        quantity: 4, // Default to 4 sessions
        sessionsUsed: 0,
        pricePerSession: srv.price,
        professionalId: ''
      };
      const updated = [...prev, newItem];
      
      // Update pkgValue automatically with the new suggested price if it was 0 or matches suggested pkg sum
      const previousSuggested = prev.reduce((sum, item) => sum + (item.quantity * item.pricePerSession), 0);
      if (pkgValue === 0 || pkgValue === previousSuggested) {
        const newSuggested = updated.reduce((sum, item) => sum + (item.quantity * item.pricePerSession), 0);
        setPkgValue(newSuggested);
      }
      return updated;
    });
  };

  const handleUpdateItemField = (index: number, field: keyof LocalPackageItem, val: any) => {
    setPkgItems(prev => {
      const updated = prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, [field]: val };
        }
        return item;
      });
      
      // Auto update total if matches suggested sum
      const prevSuggested = prev.reduce((sum, item) => sum + (item.quantity * item.pricePerSession), 0);
      if (pkgValue === prevSuggested) {
        const newSuggested = updated.reduce((sum, item) => sum + (item.quantity * item.pricePerSession), 0);
        setPkgValue(newSuggested);
      }
      return updated;
    });
  };

  const handleRemovePkgItem = (index: number) => {
    setPkgItems(prev => {
      const updated = prev.filter((_, idx) => idx !== index);
      const prevSuggested = prev.reduce((sum, item) => sum + (item.quantity * item.pricePerSession), 0);
      if (pkgValue === prevSuggested) {
        const newSuggested = updated.reduce((sum, item) => sum + (item.quantity * item.pricePerSession), 0);
        setPkgValue(newSuggested);
      }
      return updated;
    });
  };

  // Open form for creating/editing combos
  const handleOpenComboForm = (combo?: ServiceCombo) => {
    if (combo) {
      setEditingComboId(combo.id);
      setCbName(combo.name);
      setCbServices(combo.servicesIncluded);
      setCbPriceOriginal(combo.originalPrice);
      setCbPricePromo(combo.promotionalPrice);
      setCbActive(combo.active);
    } else {
      setEditingComboId(null);
      setCbName('');
      setCbServices([]);
      setCbPriceOriginal(0);
      setCbPricePromo(0);
      setCbActive(true);
    }
    setIsComboFormOpen(true);
  };

  const handleComboSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbName || cbServices.length === 0) return;

    // Sum of durations
    let sumDuration = 0;
    cbServices.forEach(id => {
      const s = services.find(srv => srv.id === id);
      if (s) sumDuration += s.duration;
    });

    // Allowed professionals
    const allowedProfs = Array.from(new Set(
      cbServices.flatMap(id => services.find(s => s.id === id)?.professionals || [])
    ));

    if (editingComboId) {
      updateCombo(editingComboId, {
        name: cbName,
        servicesIncluded: cbServices,
        originalPrice: cbPriceOriginal,
        promotionalPrice: cbPricePromo,
        totalDuration: sumDuration,
        professionals: allowedProfs,
        active: cbActive
      });
    } else {
      addCombo({
        name: cbName,
        servicesIncluded: cbServices,
        originalPrice: cbPriceOriginal,
        promotionalPrice: cbPricePromo,
        totalDuration: sumDuration,
        professionals: allowedProfs,
        active: true
      });
    }

    setIsComboFormOpen(false);
  };

  const handleSelectServiceForCombo = (srvId: string) => {
    if (!srvId) return;
    setCbServices(prev => {
      if (prev.includes(srvId)) return prev;
      const next = [...prev, srvId];
      
      // Calculate sum
      let sum = 0;
      next.forEach(id => {
        const s = services.find(srv => srv.id === id);
        if (s) sum += s.price;
      });
      setCbPriceOriginal(sum);
      setCbPricePromo(Number((sum * 0.85).toFixed(2))); // 15% discount default
      
      return next;
    });
  };

  const handleOpenConsume = (pkg: ServicePackage) => {
    setSelectedPkgToConsume(pkg);
    
    // Find first consumable service in package items or servicesIncluded
    let initialService = '';
    if (pkg.items && pkg.items.length > 0) {
      const availableItem = pkg.items.find(item => item.quantity > item.sessionsUsed);
      if (availableItem) {
        initialService = availableItem.serviceName;
      }
    }
    if (!initialService) {
      initialService = services.find(s => pkg.servicesIncluded.includes(s.id))?.name || '';
    }

    setConsumeServiceName(initialService);

    // Set initial professional default
    let defaultProf = '';
    if (pkg.items && pkg.items.length > 0) {
      const item = pkg.items.find(i => i.serviceName === initialService);
      if (item && item.professionalId) {
        const prof = professionals.find(p => p.id === item.professionalId);
        if (prof) defaultProf = prof.name;
      }
    }
    if (!defaultProf) {
      defaultProf = professionals[0]?.name || '';
    }
    setConsumeProfName(defaultProf);

    setIsConsumeFormOpen(true);
  };

  // Trigger professional auto-default when service changes in consumption modal
  useEffect(() => {
    if (selectedPkgToConsume && consumeServiceName) {
      if (selectedPkgToConsume.items) {
        const item = selectedPkgToConsume.items.find(i => i.serviceName === consumeServiceName);
        if (item && item.professionalId) {
          const prof = professionals.find(p => p.id === item.professionalId);
          if (prof) setConsumeProfName(prof.name);
        }
      }
    }
  }, [consumeServiceName, selectedPkgToConsume, professionals]);

  const handleConfirmConsume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkgToConsume) return;

    usePackageSession(
      selectedPkgToConsume.id,
      consumeServiceName,
      consumeProfName
    );

    setIsConsumeFormOpen(false);
    setSelectedPkgToConsume(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Module tab toggler */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pacotes')}
          className={`px-5 py-3 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'pacotes'
              ? 'border-sky-950 text-sky-950 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package className="w-4 h-4" /> Gestão de Pacotes de Clientes
        </button>
        <button
          onClick={() => setActiveTab('combos')}
          className={`px-5 py-3 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'combos'
              ? 'border-sky-950 text-sky-950 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Zap className="w-4 h-4" /> Combos Promocionais
        </button>
      </div>

      {/* PACOTES SECTION */}
      {activeTab === 'pacotes' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-serif font-semibold text-sky-950">Pacotes de Serviços Contratados</h3>
              <p className="text-xs text-slate-400">Monte pacotes personalizados com múltiplos serviços, quantidades personalizadas e profissionais exclusivos.</p>
            </div>
            <button
              onClick={() => handleOpenPackageForm()}
              className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Criar & Vender Pacote
            </button>
          </div>

          {/* Sold Packages List Grid */}
          {packages.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-700">Nenhum pacote vendido</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Venda seu primeiro pacote personalizado para acompanhar as sessões e consumo de suas clientes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {packages.map(p => {
                const totalSess = p.totalSessions;
                const remSess = p.sessionsRemaining;
                const usedSess = p.sessionsUsed;
                const percentageUsed = totalSess > 0 ? (usedSess / totalSess) * 100 : 0;

                return (
                  <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 relative transition-all hover:shadow-md">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 border rounded-md ${
                          p.status === 'ativo'
                            ? 'border-emerald-200 text-emerald-800 bg-emerald-50'
                            : p.status === 'concluido'
                            ? 'border-blue-200 text-blue-800 bg-blue-50'
                            : 'border-rose-200 text-rose-800 bg-rose-50'
                        }`}>
                          {p.status === 'ativo' ? 'Ativo' : p.status === 'concluido' ? 'Concluído' : 'Vencido'}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenPackageForm(p)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer transition-colors"
                            title="Editar Pacote"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-sky-800" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir o pacote "${p.name}" de ${p.clientName}?`)) {
                                deletePackage(p.id);
                              }
                            }}
                            className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer transition-colors"
                            title="Excluir Pacote"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-serif font-bold text-sky-950 line-clamp-1">{p.name}</h4>
                        <p className="text-xs text-slate-600 font-semibold flex items-center gap-1 mt-1">
                          <User className="w-3.5 h-3.5 text-sky-950" /> {p.clientName}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">Expira em: {p.validityDate.split('-').reverse().join('/')}</p>
                      </div>

                      {/* Sessions tracking progress */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                          <span>Uso de Sessões:</span>
                          <span>{usedSess} de {totalSess} usadas ({remSess} restam)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2B4C7E] h-full transition-all duration-350"
                            style={{ width: `${percentageUsed}%` }}
                          />
                        </div>
                      </div>

                      {/* Customized service items inside package */}
                      {p.items && p.items.length > 0 && (
                        <div className="pt-2 border-t border-slate-50 space-y-1.5">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Serviços Habilitados:</span>
                          <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                            {p.items.map((item, idx) => {
                              const pName = item.professionalName || 'Qualquer Profissional';
                              return (
                                <div key={idx} className="p-2 bg-slate-50/70 border border-slate-100 rounded-xl text-[11px] space-y-1">
                                  <div className="flex justify-between font-semibold text-slate-700">
                                    <span className="truncate max-w-[150px]">{item.serviceName}</span>
                                    <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                      {item.sessionsUsed} de {item.quantity}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
                                    <span className="flex items-center gap-1 text-[#2B4C7E] truncate max-w-[160px]">
                                      <Users className="w-3 h-3 text-[#2B4C7E]" /> {pName}
                                    </span>
                                    <span>{formatBRL(item.pricePerSession)}/sessão</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase font-mono">Valor Pago:</span>
                        <span className="text-xs font-bold text-sky-950 font-mono">{formatBRL(p.value)}</span>
                      </div>
                      {remSess > 0 && p.status === 'ativo' ? (
                        <button
                          onClick={() => handleOpenConsume(p)}
                          className="px-3 py-1.5 bg-[#2B4C7E] hover:bg-[#1A345B] text-amber-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          Consumir Sessão
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-slate-300" /> Sem sessões / Concluído
                        </span>
                      )}
                    </div>

                    {/* Historical uses */}
                    {p.usageHistory.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 space-y-1 text-[10px] mt-2">
                        <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1 font-mono">
                          <History className="w-3 h-3 text-[#2B4C7E]" /> Histórico do Pacote
                        </span>
                        <div className="space-y-1 max-h-[85px] overflow-y-auto">
                          {p.usageHistory.map((h, i) => (
                            <p key={i} className="text-slate-500 font-mono truncate">
                              {h.date.split(' ')[0].split('-').reverse().join('/')}: {h.serviceName} com {h.professionalName}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* COMBOS SECTION */}
      {activeTab === 'combos' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-serif font-semibold text-sky-950">Combos Especiais com Desconto</h3>
              <p className="text-xs text-slate-400">Defina ofertas de combos casados de serviços rápidos e forneça preços promocionais atrativos para suas clientes.</p>
            </div>
            <button
              onClick={() => handleOpenComboForm()}
              className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Criar Novo Combo
            </button>
          </div>

          {combos.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <Zap className="w-12 h-12 text-amber-400 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-700">Nenhum combo cadastrado</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Combine múltiplos serviços em ofertas promocionais irresistíveis de uma só vez.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {combos.map(c => (
                <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:shadow-md">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 border rounded-md flex items-center gap-1 ${
                        c.active 
                          ? 'border-emerald-200 text-emerald-800 bg-emerald-50' 
                          : 'border-slate-200 text-slate-500 bg-slate-100'
                      }`}>
                        <Tag className="w-3 h-3 text-emerald-500" /> {c.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.totalDuration} min</span>
                        <button
                          onClick={() => handleOpenComboForm(c)}
                          className="p-1 hover:bg-slate-100 rounded text-sky-800 cursor-pointer"
                          title="Editar Combo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza de que deseja excluir o combo "${c.name}"?`)) {
                              deleteCombo(c.id);
                            }
                          }}
                          className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"
                          title="Excluir Combo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-serif font-bold text-sky-950">{c.name}</h4>
                    
                    {/* Itemized services listed */}
                    <div className="space-y-1.5 py-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Serviços Combinados:</span>
                      <div className="space-y-1">
                        {c.servicesIncluded.map(id => {
                          const s = services.find(srv => srv.id === id);
                          return s ? (
                            <div key={id} className="text-xs p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-medium flex justify-between">
                              <span>{s.name}</span>
                              <span className="text-slate-400 text-[10px] font-mono">{s.duration} min</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div className="flex flex-col font-mono">
                      <span className="text-[10px] text-slate-400 line-through">De: {formatBRL(c.originalPrice)}</span>
                      <span className="text-sm font-bold text-emerald-700">Por: {formatBRL(c.promotionalPrice)}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-mono">
                      Economia {formatBRL(c.originalPrice - c.promotionalPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Create or Edit Package */}
      {isPkgFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-serif font-bold text-sky-950 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              {editingPackageId ? 'Editar Configuração de Pacote' : 'Venda & Cadastro de Pacote Personalizado'}
            </h3>
            
            <form onSubmit={handlePackageSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Selecione a Cliente *</label>
                  <select
                    required
                    value={pkgClientId}
                    disabled={!!editingPackageId}
                    onChange={(e) => setPkgClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none disabled:opacity-60"
                  >
                    <option value="">-- Escolha a cliente --</option>
                    {clients.filter(c => c.status === 'ativo').map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Nome Comercial do Pacote *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pacote de Manicures da Maria"
                    value={pkgName}
                    onChange={(e) => setPkgName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Package Services List Builder */}
              <div className="space-y-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-150">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sky-950 block">Serviços Inclusos, Quantidades & Profissionais</span>
                  
                  {/* Select dropdown to add a new service */}
                  <select
                    value=""
                    onChange={(e) => {
                      handleAddServiceToPkg(e.target.value);
                      e.target.value = '';
                    }}
                    className="px-3 py-1 bg-[#2B4C7E] text-amber-100 rounded-lg text-[10.5px] font-bold cursor-pointer hover:bg-sky-900 border-none outline-none"
                  >
                    <option value="">+ Adicionar Serviço...</option>
                    {services.filter(s => s.active).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({formatBRL(s.price)})</option>
                    ))}
                  </select>
                </div>

                {pkgItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 space-y-1.5 bg-white rounded-xl border border-dashed border-slate-200">
                    <HelpCircle className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="text-[11px] font-medium">Selecione e adicione serviços ao pacote no botão acima.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {pkgItems.map((item, index) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 relative shadow-xs animate-in fade-in duration-100">
                        <button
                          type="button"
                          onClick={() => handleRemovePkgItem(index)}
                          className="absolute top-2.5 right-2.5 text-rose-500 hover:text-rose-700 transition-colors p-0.5 cursor-pointer"
                          title="Remover serviço"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex-1 min-w-[140px]">
                            <span className="text-[10px] text-slate-400 font-mono block">Serviço</span>
                            <span className="font-bold text-slate-800 text-[11.5px] block truncate">{item.serviceName}</span>
                          </div>

                          <div className="w-[75px]">
                            <label className="text-[9.5px] text-slate-400 font-mono block">Quantidades</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemField(index, 'quantity', Math.max(1, Number(e.target.value)))}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold font-mono focus:outline-none"
                            />
                          </div>

                          <div className="w-[95px]">
                            <label className="text-[9.5px] text-slate-400 font-mono block">Valor/Sessão (R$)</label>
                            <input
                              type="number"
                              min="0"
                              value={item.pricePerSession}
                              onChange={(e) => handleUpdateItemField(index, 'pricePerSession', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-semibold font-mono text-emerald-800 focus:outline-none"
                            />
                          </div>

                          <div className="w-[150px]">
                            <label className="text-[9.5px] text-slate-400 font-mono block">Profissional Exclusiva</label>
                            <select
                              value={item.professionalId || ''}
                              onChange={(e) => handleUpdateItemField(index, 'professionalId', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] text-slate-700 font-medium focus:outline-none"
                            >
                              <option value="">Qualquer Profissional</option>
                              {professionals.filter(p => p.active).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {item.sessionsUsed > 0 && (
                          <div className="text-[9.5px] text-slate-400 font-mono pt-1 border-t border-slate-100 flex items-center justify-between">
                            <span>Sessões já consumidas deste item: <strong>{item.sessionsUsed}</strong></span>
                            {item.sessionsUsed >= item.quantity && (
                              <span className="text-rose-600 font-bold flex items-center gap-0.5">
                                <AlertTriangle className="w-3.5 h-3.5" /> Totalmente consumido!
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Package Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Soma Matemática (R$)</label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold text-center">
                    {formatBRL(suggestedPkgValue)}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block flex items-center justify-between">
                    <span>Valor Comercial Total *</span>
                    {suggestedPkgValue > 0 && pkgValue !== suggestedPkgValue && (
                      <button
                        type="button"
                        onClick={() => setPkgValue(suggestedPkgValue)}
                        className="text-[#2B4C7E] hover:underline font-bold text-[9.5px] cursor-pointer"
                      >
                        Resetar p/ sugerido
                      </button>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pkgValue || ''}
                    onChange={(e) => setPkgValue(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-emerald-800 focus:outline-none text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Validade em Meses</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pkgMonths}
                    onChange={(e) => setPkgMonths(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-center focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsPkgFormOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pkgItems.length === 0 || !pkgClientId}
                  className="px-5 py-1.5 bg-sky-950 hover:bg-sky-900 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPackageId ? 'Salvar Edições' : 'Confirmar Venda'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Consume Package Session */}
      {isConsumeFormOpen && selectedPkgToConsume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-sky-950 flex items-center gap-1.5">
              <CheckCircle className="w-5 h-5 text-emerald-500 animate-bounce" />
              Consumir Sessão de Pacote
            </h3>
            <p className="text-xs text-slate-400">Cliente: <strong>{selectedPkgToConsume.clientName}</strong></p>
            
            <form onSubmit={handleConfirmConsume} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Qual serviço foi prestado?</label>
                <select
                  value={consumeServiceName}
                  onChange={(e) => setConsumeServiceName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {/* Select from available remaining sessions */}
                  {selectedPkgToConsume.items && selectedPkgToConsume.items.length > 0 ? (
                    selectedPkgToConsume.items
                      .filter(item => item.quantity > item.sessionsUsed)
                      .map((item, idx) => (
                        <option key={idx} value={item.serviceName}>
                          {item.serviceName} ({item.sessionsUsed}/{item.quantity} usadas)
                        </option>
                      ))
                  ) : (
                    // Backward compatible fallback list
                    services
                      .filter(s => selectedPkgToConsume.servicesIncluded.includes(s.id))
                      .map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block font-mono">Profissional Atendente</label>
                <select
                  value={consumeProfName}
                  onChange={(e) => setConsumeProfName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {professionals.filter(p => p.active).map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                {selectedPkgToConsume.items && selectedPkgToConsume.items.find(i => i.serviceName === consumeServiceName)?.professionalId && (
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">
                    * Este serviço tem uma profissional preferencial/vinculada ao pacote!
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsConsumeFormOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Registrar Consumo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create/Edit Combo */}
      {isComboFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-sky-950 flex items-center gap-1.5">
              <Zap className="w-5 h-5 text-amber-500" />
              {editingComboId ? 'Editar Combo Promocional' : 'Novo Combo Promocional'}
            </h3>
            
            <form onSubmit={handleComboSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Nome do Combo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combo Mãos & Pés de Fibra"
                  value={cbName}
                  onChange={(e) => setCbName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Adicionar Serviços ao Combo *</label>
                <select
                  value=""
                  onChange={(e) => {
                    handleSelectServiceForCombo(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="">-- Escolha um serviço para somar --</option>
                  {services.filter(s => s.active).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({formatBRL(s.price)})</option>
                  ))}
                </select>

                {cbServices.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {cbServices.map(id => {
                      const details = services.find(s => s.id === id);
                      if (!details) return null;
                      return (
                        <span key={id} className="text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-100 rounded px-2 py-0.5 flex items-center gap-1">
                          {details.name}
                          <button
                            type="button"
                            onClick={() => setCbServices(prev => prev.filter(p => p !== id))}
                            className="text-rose-500 font-bold hover:underline ml-1 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Soma Original (R$)</label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 font-semibold text-center">
                    {formatBRL(cbPriceOriginal)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Preço com Desconto (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={cbPricePromo || ''}
                    onChange={(e) => setCbPricePromo(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 font-bold focus:outline-none text-center"
                  />
                </div>
              </div>

              {editingComboId && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cbActive"
                    checked={cbActive}
                    onChange={(e) => setCbActive(e.target.checked)}
                    className="rounded border-slate-300 text-sky-950 focus:ring-sky-950"
                  />
                  <label htmlFor="cbActive" className="font-bold text-slate-600">Combo Ativo e Disponível?</label>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsComboFormOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cbServices.length === 0}
                  className="px-5 py-1.5 bg-sky-950 hover:bg-sky-900 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {editingComboId ? 'Salvar Combo' : 'Criar Combo'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
