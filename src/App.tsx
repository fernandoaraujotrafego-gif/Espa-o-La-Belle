/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import Clients from './components/Clients';
import Cashier from './components/Cashier';
import PackagesCombos from './components/PackagesCombos';
import Inventory from './components/Inventory';
import Professionals from './components/Professionals';
import Services from './components/Services';
import Reports from './components/Reports';
import Configuracoes from './components/Configuracoes';

function MainApp() {
  const { currentUser, authLoading } = useApp();
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Adjust default tab starting route on authentication changes
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'profissional' || currentUser.role === 'recepcao') {
        setCurrentTab('agenda');
      } else {
        setCurrentTab('dashboard');
      }
    }
  }, [currentUser]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1E293B] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono font-bold">Iniciando Espaço La Belle...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  if (currentUser.isBlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white max-w-md p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-serif font-bold text-slate-900">Acesso Bloqueado</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              O acesso de sua conta (<strong className="text-slate-700">{currentUser.email}</strong>) foi temporariamente suspenso pelo administrador do salão. 
              Entre em contato com o gestor caso queira solicitar a reativação da sua conta.
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('belle_current_user');
              window.location.reload();
            }}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Sair ou Trocar Usuário
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setTab={setCurrentTab} />;
      case 'agenda':
        return <Agenda />;
      case 'clientes':
        return <Clients />;
      case 'caixa':
        return <Cashier />;
      case 'pacotes':
        return <PackagesCombos />;
      case 'estoque':
        return <Inventory />;
      case 'profissionais':
        return <Professionals />;
      case 'servicos':
        return <Services />;
      case 'relatorios':
        return <Reports />;
      case 'configuracoes':
        return <Configuracoes />;
      default:
        return <Dashboard setTab={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setTab={setCurrentTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
