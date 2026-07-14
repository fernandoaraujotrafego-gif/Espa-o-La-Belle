/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Service, ServiceCategory } from '../types';
import {
  Sparkles,
  Plus,
  Clock,
  DollarSign,
  Percent,
  ToggleLeft,
  ToggleRight,
  Briefcase,
  Layers,
  Edit2,
  Trash2,
  Users,
  Check,
  Tag
} from 'lucide-react';

export default function Services() {
  const {
    services,
    professionals,
    addService,
    updateService,
    categories,
    addCategory,
    updateCategory,
    deleteCategory
  } = useApp();

  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = services.filter(s => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return s.name.toLowerCase().includes(term) || s.category.toLowerCase().includes(term);
  });

  // Service Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState(100);
  const [formDuration, setFormDuration] = useState(60);
  const [formCommission, setFormCommission] = useState(40);
  const [formProductCost, setFormProductCost] = useState(0);
  const [formSelectedProfs, setFormSelectedProfs] = useState<string[]>([]);
  const [formHasMaintenance, setFormHasMaintenance] = useState(false);
  const [formMaintenanceDays, setFormMaintenanceDays] = useState(15);

  // Category Form states
  const [isCatFormOpen, setIsCatFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [formCatName, setFormCatName] = useState('');
  const [formCatSelectedProfs, setFormCatSelectedProfs] = useState<string[]>([]);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper to open Service form
  const handleOpenServiceForm = (s?: Service) => {
    if (s) {
      setEditingServiceId(s.id);
      setFormName(s.name);
      setFormCategory(s.category);
      setFormPrice(s.price);
      setFormDuration(s.duration);
      setFormCommission(s.commission);
      setFormProductCost(s.productCost || 0);
      setFormSelectedProfs(s.professionals);
      setFormHasMaintenance(s.hasMaintenance || false);
      setFormMaintenanceDays(s.maintenanceDays || 15);
    } else {
      setEditingServiceId(null);
      setFormName('');
      setFormCategory(categories[0]?.name || '');
      setFormPrice(100);
      setFormDuration(60);
      setFormCommission(40);
      setFormProductCost(0);
      setFormSelectedProfs([]);
      setFormHasMaintenance(false);
      setFormMaintenanceDays(15);
    }
    setIsFormOpen(true);
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formPrice <= 0 || formDuration <= 0) return;

    if (editingServiceId) {
      updateService(editingServiceId, {
        name: formName,
        category: formCategory,
        price: formPrice,
        duration: formDuration,
        commission: formCommission,
        productCost: formProductCost,
        professionals: formSelectedProfs,
        hasMaintenance: formHasMaintenance,
        maintenanceDays: formHasMaintenance ? formMaintenanceDays : undefined
      });
    } else {
      addService({
        name: formName,
        category: formCategory,
        price: formPrice,
        duration: formDuration,
        commission: formCommission,
        productCost: formProductCost,
        professionals: formSelectedProfs,
        active: true,
        hasMaintenance: formHasMaintenance,
        maintenanceDays: formHasMaintenance ? formMaintenanceDays : undefined
      });
    }

    setIsFormOpen(false);
  };

  const toggleServiceStatus = (s: Service) => {
    updateService(s.id, { active: !s.active });
  };

  // Helper to open Category form
  const handleOpenCategoryForm = (cat?: ServiceCategory) => {
    if (cat) {
      setEditingCategoryId(cat.id);
      setFormCatName(cat.name);
      setFormCatSelectedProfs(cat.professionals || []);
    } else {
      setEditingCategoryId(null);
      setFormCatName('');
      setFormCatSelectedProfs([]);
    }
    setIsCatFormOpen(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCatName.trim()) return;

    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        name: formCatName,
        professionals: formCatSelectedProfs
      });
    } else {
      addCategory({
        name: formCatName,
        professionals: formCatSelectedProfs
      });
    }

    setIsCatFormOpen(false);
  };

  const handleToggleCatProf = (profId: string) => {
    setFormCatSelectedProfs(prev =>
      prev.includes(profId)
        ? prev.filter(id => id !== profId)
        : [...prev, profId]
    );
  };

  const handleToggleServiceProf = (profId: string) => {
    setFormSelectedProfs(prev =>
      prev.includes(profId)
        ? prev.filter(id => id !== profId)
        : [...prev, profId]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-tab selection */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-1 flex max-w-sm">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
            activeTab === 'services'
              ? 'bg-sky-950 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Procedimentos ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
            activeTab === 'categories'
              ? 'bg-sky-950 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Categorias ({categories.length})
        </button>
      </div>

      {activeTab === 'services' ? (
        <>
          {/* Services Tab view */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-serif font-semibold text-sky-950">Catálogo de Procedimentos (Menu)</h3>
              <p className="text-xs text-slate-400">Cadastre a tabela de preços, durações estimadas de cabine e repasse de comissões por técnica.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
              <input
                type="text"
                placeholder="🔍 Pesquisar serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-950 min-w-[180px]"
              />
              
              <button
                onClick={() => handleOpenServiceForm()}
                className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-400" /> Adicionar Serviço
              </button>
            </div>
          </div>

          {/* Grid of services cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-150">
            {filteredServices.map(s => (
              <div
                key={s.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[17rem] h-auto relative transition-all hover:shadow-md ${
                  s.active ? 'border-slate-100' : 'border-slate-200 bg-slate-50/50 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-[#2B4C7E] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 uppercase tracking-tight">
                        {s.category}
                      </span>
                      <h4 className="font-serif font-bold text-slate-800 text-sm mt-1">{s.name}</h4>
                    </div>
                    
                    <button
                      onClick={() => toggleServiceStatus(s)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 shrink-0"
                      title={s.active ? "Desativar" : "Reativar"}
                    >
                      {s.active ? (
                        <ToggleRight className="w-7 h-7 text-emerald-600 cursor-pointer" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-400 cursor-pointer" />
                      )}
                    </button>
                  </div>

                  {/* Procedural values and durations */}
                  <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-[9px] text-slate-400 block uppercase font-sans font-medium">Preço</span>
                      <strong className="text-slate-800 text-xs">{formatBRL(s.price)}</strong>
                    </div>
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-[9px] text-slate-400 block uppercase font-sans font-medium">Duração</span>
                      <strong className="text-slate-800 text-xs flex items-center justify-center gap-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {s.duration}m
                      </strong>
                    </div>
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-[9px] text-slate-400 block uppercase font-sans font-medium">Repasse</span>
                      <strong className="text-emerald-700 text-xs flex items-center justify-center gap-0.5">
                        <Percent className="w-3.5 h-3.5 text-emerald-500" /> {s.commission}%
                      </strong>
                    </div>
                  </div>
                  {s.productCost && s.productCost > 0 ? (
                    <div className="text-[10px] text-slate-500 bg-rose-50/30 border border-rose-100/40 rounded-xl px-2.5 py-1.5 flex justify-between items-center">
                      <span className="font-sans font-medium text-slate-400">Custo do produto descontado:</span>
                      <span className="font-mono font-bold text-rose-600">-{formatBRL(s.productCost)}</span>
                    </div>
                  ) : null}
                  {s.hasMaintenance && (
                    <div className="text-[10px] font-bold text-rose-700 bg-rose-50/50 px-2 py-1 rounded-lg border border-rose-100 flex items-center gap-1 self-start">
                      <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Manutenção: {s.maintenanceDays} dias
                    </div>
                  )}
                </div>

                {/* List of professionals capable of doing this */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Equipe habilitada:</span>
                  <div className="flex flex-wrap gap-1 max-h-[40px] overflow-y-auto">
                    {s.professionals.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic">Sem profissionais vinculadas</span>
                    ) : (
                      s.professionals.map(id => {
                        const profName = professionals.find(p => p.id === id)?.name || 'Profissional';
                        return (
                          <span key={id} className="text-[9px] font-medium text-slate-600 bg-slate-100 border border-slate-200/50 rounded-md px-1.5 py-0.5">
                            {profName}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2 text-[10px] font-mono">
                  <button
                    onClick={() => handleOpenServiceForm(s)}
                    className="text-sky-800 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Editar Configurações &rarr;
                  </button>
                </div>

              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Categories Tab view */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
            <div>
              <h3 className="text-sm font-serif font-semibold text-sky-950">Categorias de Atendimento</h3>
              <p className="text-xs text-slate-400">Gerencie as categorias de serviços e vincule profissionais. Novas e atuais técnicas herdarão as profissionais vinculadas.</p>
            </div>
            
            <button
              onClick={() => handleOpenCategoryForm()}
              className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Adicionar Categoria
            </button>
          </div>

          {/* Grid of categories cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-150">
            {categories.map(cat => {
              const categoryServices = services.filter(s => s.category === cat.name);
              return (
                <div
                  key={cat.id}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[14rem] h-auto transition-all hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1 text-[#2B4C7E]">
                          <Tag className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Categoria</span>
                        </div>
                        <h4 className="font-serif font-bold text-slate-800 text-base mt-1">{cat.name}</h4>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenCategoryForm(cat)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer transition-colors"
                          title="Editar Categoria"
                        >
                          <Edit2 className="w-4 h-4 text-sky-800" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza de que deseja excluir a categoria "${cat.name}"? Os serviços dela não serão apagados.`)) {
                              deleteCategory(cat.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer transition-colors"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 py-1 font-mono">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-center">
                        <span className="text-[8.5px] text-slate-400 block uppercase font-sans font-medium">Serviços Vinculados</span>
                        <strong className="text-slate-800 text-sm">{categoryServices.length}</strong>
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-center">
                        <span className="text-[8.5px] text-slate-400 block uppercase font-sans font-medium">Profissionais Linkados</span>
                        <strong className="text-[#2B4C7E] text-sm">{(cat.professionals || []).length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* List of professionals linked */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 mt-4">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                      <Users className="w-3 h-3" /> Profissionais Habilitados por Padrão:
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto pt-0.5">
                      {(!cat.professionals || cat.professionals.length === 0) ? (
                        <span className="text-[10px] text-slate-400 italic">Nenhum profissional vinculado</span>
                      ) : (
                        cat.professionals.map(id => {
                          const prof = professionals.find(p => p.id === id);
                          if (!prof) return null;
                          return (
                            <span key={id} className="text-[9.5px] font-medium text-[#2B4C7E] bg-sky-50 border border-sky-100/50 rounded-lg px-2 py-0.5 flex items-center gap-1">
                              {prof.photo && (
                                <img src={prof.photo} alt={prof.name} className="w-3.5 h-3.5 rounded-full object-cover" referrerPolicy="no-referrer" />
                              )}
                              {prof.name}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MODAL: Add/Edit Service */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-serif font-bold text-sky-950">
              {editingServiceId ? 'Editar Cadastro de Serviço' : 'Cadastrar Novo Serviço'}
            </h3>
            
            <form onSubmit={handleServiceSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Nome do Procedimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manicure Simples, Alongamento em Gel com Tips"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Categoria de Atendimento</label>
                {categories.length === 0 ? (
                  <div className="p-2 border border-amber-100 bg-amber-50 text-amber-800 rounded-xl text-[10px]">
                    Nenhuma categoria cadastrada. Crie uma na aba de Categorias primeiro.
                  </div>
                ) : (
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Preço (R$)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Duração (m)</label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(Math.max(5, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Custo do Produto (R$)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formProductCost}
                    onChange={(e) => setFormProductCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none"
                    placeholder="Ex: 15"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Comissão (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formCommission}
                    onChange={(e) => setFormCommission(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Multi-select allowed stylists */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block mb-1">Vincular Profissionais habilitadas</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-[110px] overflow-y-auto p-2 bg-slate-50 border border-slate-250 rounded-xl">
                  {professionals.filter(p => p.active).map(p => {
                    const isChecked = formSelectedProfs.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleToggleServiceProf(p.id)}
                        className={`p-1.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-sky-50 border-[#2B4C7E] text-[#2B4C7E] font-bold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {p.photo && (
                            <img src={p.photo} alt={p.name} className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                          )}
                          {p.name}
                        </span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-[#2B4C7E]" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9.5px] text-slate-400 font-light mt-0.5">Clique nas profissionais que executam esse serviço.</p>
              </div>

              {/* Maintenance inputs */}
              <div className="space-y-2.5 p-3 bg-slate-50/50 rounded-xl border border-slate-150">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formHasMaintenance}
                    onChange={(e) => setFormHasMaintenance(e.target.checked)}
                    className="rounded border-slate-300 text-sky-950 focus:ring-sky-950 w-4 h-4 cursor-pointer"
                  />
                  <span>Possui prazo de manutenção/retorno?</span>
                </label>

                {formHasMaintenance && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <label className="font-bold text-slate-600 block">Prazo para próxima manutenção (em dias)</label>
                    <input
                      type="number"
                      min="1"
                      required={formHasMaintenance}
                      value={formMaintenanceDays}
                      onChange={(e) => setFormMaintenanceDays(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none"
                    />
                  </div>
                )}
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
                  disabled={categories.length === 0}
                  className="px-5 py-1.5 bg-sky-950 hover:bg-sky-900 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Cadastro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Category */}
      {isCatFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-serif font-bold text-sky-950">
              {editingCategoryId ? 'Editar Categoria de Atendimento' : 'Adicionar Categoria de Atendimento'}
            </h3>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cílios, Depilação, Cabeleireiro, Unhas de Fibra"
                  value={formCatName}
                  onChange={(e) => setFormCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-slate-700"
                />
              </div>

              {/* Multi-select professionals for the Category */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block mb-1">Vincular Profissionais à Categoria</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {professionals.filter(p => p.active).map(p => {
                    const isChecked = formCatSelectedProfs.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleToggleCatProf(p.id)}
                        className={`p-1.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-sky-50 border-[#2B4C7E] text-[#2B4C7E] font-bold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {p.photo && (
                            <img src={p.photo} alt={p.name} className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                          )}
                          {p.name}
                        </span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-[#2B4C7E]" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9.5px] text-slate-400 font-light mt-1">
                  Profissionais selecionadas serão habilitadas em todos os serviços atuais e novos vinculados a esta categoria.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatFormOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-sky-950 hover:bg-sky-900 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Salvar Categoria
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
