/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  FileText,
  Search,
  ShoppingCart,
  TrendingUp,
  Tag,
  DollarSign
} from 'lucide-react';

export default function Inventory() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Alongamento');
  const [formCost, setFormCost] = useState(0);
  const [formPrice, setFormPrice] = useState(0);
  const [formMin, setFormMin] = useState(2);
  const [formQty, setFormQty] = useState(5);
  const [formSupplier, setFormSupplier] = useState('');

  // Adjust State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustObs, setAdjustObs] = useState('');

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formCost < 0 || formPrice < 0) return;

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: formName,
        category: formCategory,
        cost: formCost,
        price: formPrice,
        minQuantity: formMin,
        supplier: formSupplier
      });
    } else {
      addProduct({
        name: formName,
        category: formCategory,
        cost: formCost,
        price: formPrice,
        quantity: formQty,
        minQuantity: formMin,
        supplier: formSupplier
      });
    }

    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingProductId(null);
    setFormName('');
    setFormCategory('Alongamento');
    setFormCost(0);
    setFormPrice(0);
    setFormMin(2);
    setFormQty(5);
    setFormSupplier('');
  };

  const handleEdit = (p: Product) => {
    setEditingProductId(p.id);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormCost(p.cost);
    setFormPrice(p.price);
    setFormMin(p.minQuantity);
    setFormSupplier(p.supplier);
    setIsFormOpen(true);
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustQty <= 0) return;

    adjustStock(
      selectedProduct.id,
      adjustQty,
      adjustType,
      adjustObs || 'Ajuste manual rápido'
    );

    setIsAdjustOpen(false);
    setAdjustObs('');
    
    // Refresh selected item details view
    const updated = products.find(p => p.id === selectedProduct.id);
    if (updated) setSelectedProduct(updated);
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
            placeholder="Pesquisar estoque/produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-950 focus:bg-white transition-all text-slate-700"
          />
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" /> Cadastrar Produto/Insumo
        </button>
      </div>

      {/* Main Stock layout split pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Inventory details table */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-semibold text-sky-950 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-700" /> Almoxarifado & Prateleira de Venda
            </h3>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">{filteredProducts.length} itens listados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-500">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10px] uppercase">
                  <th className="py-2.5">Nome do Item</th>
                  <th className="py-2.5">Categoria</th>
                  <th className="py-2.5 text-center">Qtd Atual</th>
                  <th className="py-2.5 text-center">Status Mínimo</th>
                  <th className="py-2.5 text-right">Margem Venda</th>
                  <th className="py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => {
                  const isLow = p.quantity <= p.minQuantity;
                  const marginPct = p.cost > 0 ? ((p.price - p.cost) / p.cost) * 100 : 0;
                  
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                        selectedProduct?.id === p.id ? 'bg-sky-50/20 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 font-semibold text-sky-950">{p.name}</td>
                      <td className="py-3 text-slate-500">{p.category}</td>
                      <td className="py-3 text-center font-bold font-mono">
                        <span className={`px-2 py-0.5 rounded-md ${isLow ? 'text-rose-700 bg-rose-50 animate-pulse' : 'text-slate-700 bg-slate-100'}`}>
                          {p.quantity} un
                        </span>
                      </td>
                      <td className="py-3 text-center text-[10px] font-semibold text-slate-400">
                        {isLow ? (
                          <span className="text-amber-600 flex items-center justify-center gap-0.5 font-bold">
                            <AlertTriangle className="w-3 h-3 text-amber-500 animate-bounce" /> Crítico (&le; {p.minQuantity})
                          </span>
                        ) : (
                          <span>Ideal ({p.minQuantity})</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {p.price > 0 ? (
                          <div>
                            <span className="font-bold text-slate-700">{formatBRL(p.price)}</span>
                            <span className="block text-[9px] text-emerald-600 font-mono font-medium">+{marginPct.toFixed(0)}% lucro</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Uso Interno</span>
                        )}
                      </td>
                      <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1 hover:bg-slate-100 rounded text-sky-800"
                            title="Editar"
                          >
                            <Plus className="w-3.5 h-3.5 rotate-45" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Selected inventory item audit logs */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico de Entradas / Saídas</h3>

          {selectedProduct ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              
              <div className="border-b border-slate-100 pb-3 space-y-1">
                <h4 className="text-xs text-sky-700 font-bold uppercase tracking-wider">{selectedProduct.category}</h4>
                <h4 className="text-sm font-bold text-sky-950 font-serif leading-tight">{selectedProduct.name}</h4>
                {selectedProduct.supplier && <p className="text-[10px] text-slate-400">Fornecedor: {selectedProduct.supplier}</p>}
              </div>

              {/* Inventory stats */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p>Custo Unitário: <strong className="text-slate-800">{formatBRL(selectedProduct.cost)}</strong></p>
                <p>Venda Varejo: <strong className="text-slate-800">{selectedProduct.price > 0 ? formatBRL(selectedProduct.price) : 'Uso Interno'}</strong></p>
                <p>Estoque Atual: <strong className="text-slate-800">{selectedProduct.quantity} un</strong></p>
                <p>Qtd Mínima: <strong className="text-slate-800">{selectedProduct.minQuantity} un</strong></p>
              </div>

              {/* Adjust stock quick button */}
              <button
                onClick={() => {
                  setAdjustType('entrada');
                  setAdjustQty(1);
                  setIsAdjustOpen(true);
                }}
                className="w-full py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 text-sky-950 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-sky-700" /> Corrigir / Dar Entrada de Lote
              </button>

              {/* Visualized audit list */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                  <FileText className="w-3.5 h-3.5" /> Log de Movimentações Recentes
                </span>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {selectedProduct.history.map(h => (
                    <div key={h.id} className="p-2.5 bg-slate-50 rounded-xl text-[11px] flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={`w-1.5 h-1.5 rounded-full ${h.type === 'entrada' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-slate-700 capitalize">{h.type === 'entrada' ? 'entrada' : 'saída'} ({h.quantity} un)</span>
                        </div>
                        {h.obs && <p className="text-[10px] text-slate-400 italic mt-0.5">"{h.obs}"</p>}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">{h.date.split('-').reverse().join('/')}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-xs">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Selecione um insumo na tabela ao lado para visualizar o fornecedor, margem de lucro e todo o histórico de reposições de estoque.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Register/Edit Product */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-sky-950">
              {editingProductId ? 'Editar Ficha do Produto' : 'Cadastrar Novo Insumo'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Nome do Produto / Insumo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome comercial do produto"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Alongamento">Alongamento</option>
                    <option value="Lash">Lash</option>
                    <option value="Cabelo">Cabelo</option>
                    <option value="Venda Geral">Venda Geral / Varejo</option>
                    <option value="Estética">Estética</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Fornecedor</label>
                  <input
                    type="text"
                    placeholder="Distribuidora X"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formCost || ''}
                    onChange={(e) => setFormCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00 se interno"
                    value={formPrice || ''}
                    onChange={(e) => setFormPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 animate-pulse"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!editingProductId && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Estoque Inicial (unidades)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formQty}
                      onChange={(e) => setFormQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Estoque Crítico Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formMin}
                    onChange={(e) => setFormMin(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
                  />
                </div>
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
                  Salvar Produto
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adjust stock manual */}
      {isAdjustOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-sky-950">Ajuste Manual de Almoxarifado</h3>
            <p className="text-xs text-slate-400">Item: {selectedProduct.name}</p>
            
            <form onSubmit={handleConfirmAdjust} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Tipo de Ajuste</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['entrada', 'saida', 'ajuste'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAdjustType(t)}
                      className={`py-1 px-1.5 text-xs font-semibold rounded-lg border uppercase ${
                        adjustType === t
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
                <label className="font-bold text-slate-600 block">Quantidade de Unidades</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500 block">Observação / Justificativa</label>
                <input
                  type="text"
                  placeholder="Ex: Doação de lote, Perda por validade vencida"
                  value={adjustObs}
                  onChange={(e) => setAdjustObs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-sky-950 hover:bg-sky-900 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Aplicar Ajuste
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
