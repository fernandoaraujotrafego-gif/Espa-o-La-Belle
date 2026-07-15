/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { MOCK_USERS } from '../data/mockData';
import {
  Calendar,
  Users,
  Briefcase,
  Scissors,
  DollarSign,
  Package,
  TrendingUp,
  Settings,
  Menu,
  X,
  LogOut,
  Sparkles,
  ShieldAlert,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  WifiOff,
  RotateCw,
  Wifi,
  Share
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  currentTab: string;
  setTab: (tab: string) => void;
  children: React.ReactNode;
}

export default function Layout({ currentTab, setTab, children }: LayoutProps) {
  const { currentUser, login, logout, cashier, users, settings, isOnline } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  // Body scroll lock effect when mobile drawer menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [mobileMenuOpen]);

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [showUpdateAvailable, setShowUpdateAvailable] = useState(false);

  // Connection Toast States
  const [wasOffline, setWasOffline] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (isOnline && wasOffline) {
      setShowOnlineToast(true);
      const timer = setTimeout(() => {
        setShowOnlineToast(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Listen for Chrome/Android Install prompt event
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for service worker updates
  React.useEffect(() => {
    const handleUpdate = () => {
      console.log('Evento pwa-update-available recebido no Layout!');
      setShowUpdateAvailable(true);
    };
    window.addEventListener('pwa-update-available', handleUpdate);
    return () => {
      window.removeEventListener('pwa-update-available', handleUpdate);
    };
  }, []);

  // Check iOS installation guide eligibility
  React.useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const iosDismissed = localStorage.getItem('pwa_ios_prompt_dismissed');

    if (isIOS && !isStandalone && iosDismissed !== 'true') {
      setShowIosPrompt(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resposta do usuário para instalação: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDismissIosPrompt = () => {
    localStorage.setItem('pwa_ios_prompt_dismissed', 'true');
    setShowIosPrompt(false);
  };

  const handleUpdateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  if (!currentUser) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">{children}</div>;
  }

  const renderLogo = (sizeClasses = "w-9 h-9 text-base", imgSizeClasses = "w-9 h-9") => {
    const lg = settings.logo || settings.logoEmoji || '✨';
    const isUrl = lg.startsWith('http') || lg.startsWith('/') || lg.length > 4;
    const initial = (settings.salonName || settings.name || 'La Belle').charAt(0).toUpperCase();

    if (isUrl) {
      return (
        <div className={`${imgSizeClasses} rounded-full overflow-hidden shadow-xs border border-slate-100 flex items-center justify-center bg-slate-50`}>
          <img src={lg} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      );
    }

    return (
      <div className={`${sizeClasses} rounded-full bg-[#2B4C7E] flex items-center justify-center shadow-xs text-[#D4AF37] font-serif font-bold italic tracking-wide`}>
        {lg.length <= 2 ? lg : initial}
      </div>
    );
  };

  // Define tab navigation permission rules
  const menuItems = [
    { id: 'dashboard', label: 'Painel Inicial', icon: Sparkles, roles: ['admin', 'gestora'] },
    { id: 'agenda', label: 'Agenda Visual', icon: Calendar, roles: ['admin', 'gestora', 'recepcao', 'profissional'] },
    { id: 'clientes', label: 'Clientes', icon: Users, roles: ['admin', 'gestora', 'recepcao', 'profissional'] },
    { id: 'caixa', label: 'Caixa do Dia', icon: DollarSign, roles: ['admin', 'gestora', 'recepcao'] },
    { id: 'pacotes', label: 'Pacotes & Combos', icon: Package, roles: ['admin', 'gestora', 'recepcao'] },
    { id: 'estoque', label: 'Estoque & Vendas', icon: Package, roles: ['admin', 'gestora'] },
    { id: 'profissionais', label: 'Profissionais', icon: UserCheck, roles: ['admin', 'gestora'] },
    { id: 'servicos', label: 'Serviços', icon: Scissors, roles: ['admin', 'gestora', 'recepcao'] },
    { id: 'relatorios', label: 'Relatórios', icon: TrendingUp, roles: ['admin', 'gestora'] },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, roles: ['admin', 'gestora'] }
  ];

  // Filter menu items by user role
  const allowedMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  const handleRoleChange = (role: UserRole, email: string) => {
    login(email, role);
    // Auto-redirect if role is not allowed on current tab
    const matched = menuItems.find(item => item.id === currentTab);
    if (matched && !matched.roles.includes(role)) {
      if (role === 'profissional') {
        setTab('agenda');
      } else {
        setTab(role === 'recepcao' ? 'agenda' : 'dashboard');
      }
    }
    setShowRoleSwitcher(false);
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gestora': return 'Gestora';
      case 'recepcao': return 'Recepção';
      case 'profissional': return 'Profissional';
      default: return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'gestora': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'recepcao': return 'bg-emerald-50 text-emerald-700 border-[#A7F3D0]';
      case 'profissional': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  // Define bottom navigation tabs dynamically based on user permissions
  const getBottomNavItems = () => {
    const items = [];
    
    // 1. Home / Dashboard (or Caixa for Reception, Agenda for Professional)
    if (['admin', 'gestora'].includes(currentUser.role)) {
      items.push({ id: 'dashboard', label: 'Início', icon: Sparkles });
    } else if (currentUser.role === 'recepcao') {
      items.push({ id: 'caixa', label: 'Caixa', icon: DollarSign });
    }
    
    // 2. Agenda (Always visible to all roles as standard secondary shortcut)
    items.push({ id: 'agenda', label: 'Agenda', icon: Calendar });
    
    // 3. Central action button (scissors)
    items.push({ id: 'novo-agendamento', label: 'Novo Agend.', icon: Scissors, isAction: true });
    
    // 4. Clientes (All roles can access clients)
    items.push({ id: 'clientes', label: 'Clientes', icon: Users });
    
    // 5. Menu trigger button
    items.push({ id: 'menu', label: 'Menu', icon: Menu, isMenuTrigger: true });
    
    return items;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#2D3748] flex flex-col font-sans relative">
      
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-2.5 flex items-center justify-between gap-3 font-medium animate-in slide-in-from-top duration-300 z-[3000] relative">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4.5 h-4.5 shrink-0 animate-pulse text-amber-100" />
            <span className="text-[11px] sm:text-xs">
              <strong>Sem conexão com a internet.</strong> O sistema está operando em modo de leitura seguro. Algumas ações críticas (lançar caixa, finalizações e agendamentos) foram bloqueadas para evitar perda ou duplicidade de dados.
            </span>
          </div>
          <span className="text-[10px] bg-amber-700/60 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono uppercase shrink-0">
            Modo Leitura
          </span>
        </div>
      )}

      {/* Online Reconnection Notification */}
      {showOnlineToast && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-2.5 flex items-center gap-2 font-medium animate-in slide-in-from-top duration-300 z-[3000] relative">
          <Wifi className="w-4.5 h-4.5 text-emerald-100 animate-bounce" />
          <span className="text-[11px] sm:text-xs">Conexão restabelecida com sucesso! Sincronizando dados com o servidor...</span>
        </div>
      )}

      {/* Update Available Banner */}
      {showUpdateAvailable && (
        <div className="bg-sky-950 text-sky-100 text-xs px-4 py-3 border-b border-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-semibold animate-in slide-in-from-top duration-300 z-[3000] relative">
          <div className="flex items-center gap-2">
            <Info className="w-4.5 h-4.5 text-sky-400 shrink-0" />
            <span className="text-[11px] sm:text-xs">Uma nova versão do <strong>Espaço La Belle</strong> está disponível com melhorias de segurança e estabilidade.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpdateAvailable(false)}
              className="px-3 py-1.5 text-sky-400 hover:text-sky-300 text-[11px] font-bold cursor-pointer transition-all min-h-[40px]"
            >
              Lembrar mais tarde
            </button>
            <button
              onClick={handleUpdateApp}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-extrabold rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-1.5 min-h-[40px]"
            >
              <RotateCw className="w-3.5 h-3.5 animate-spin" /> Atualizar agora
            </button>
          </div>
        </div>
      )}
      
      {/* Top Header Section - Respecting safe areas on iOS and Android */}
      <header
        className="sticky top-0 z-[100] bg-white border-b border-[#E2E8F0] shadow-xs w-full"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          paddingBottom: '12px',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        {/* DESKTOP HEADER (md:flex, hidden on mobile) */}
        <div className="hidden md:flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              id="mobile-menu-btn"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-2">
              {renderLogo("w-9 h-9 text-base", "w-9 h-9")}
              <div>
                <h1 className="text-base md:text-lg font-serif font-bold tracking-wide text-[#1E293B] flex items-center gap-1.5">
                  {settings.salonName || settings.name || "Espaço La Belle"} <span className="text-[#2B4C7E] font-sans text-xs font-normal px-1.5 py-0.5 border border-[#E2E8F0] rounded-md bg-[#F0F4F8]">Agenda</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">SISTEMA INTEGRADO DE AGENDAMENTO</p>
              </div>
            </div>
          </div>

          {/* Action Header Items */}
          <div className="flex items-center gap-4">
            {/* Install PWA Button */}
            {showInstallButton && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-950 text-white hover:bg-sky-900 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 min-h-[44px]"
                title="Instalar aplicativo"
              >
                <Download className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Instalar App</span>
              </button>
            )}
            
            {/* Cashier state indicator badge */}
            {currentUser.role !== 'profissional' && (
              <div
                onClick={() => setTab('caixa')}
                className={`cursor-pointer flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border min-h-[40px] ${
                  cashier.isOpen
                    ? 'bg-emerald-50/60 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50/60 text-rose-700 border-rose-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cashier.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                Caixa {cashier.isOpen ? 'Aberto' : 'Fechado'}
              </div>
            )}

            {/* Top Bar Notification Center */}
            <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              <NotificationCenter setTab={setTab} />
            </div>

            {/* Quick Interactive Role Switcher for instant testing */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 border border-[#E2E8F0] rounded-lg hover:bg-slate-50 cursor-pointer min-h-[44px]"
                id="role-switcher-btn"
              >
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${getRoleColor(currentUser.role)}`}>
                  {getRoleLabel(currentUser.role)}
                </span>
                <span className="text-slate-600 text-[13px]">{currentUser.name.split(' ')[0]}</span>
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] shadow-lg rounded-xl p-2 z-40">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 px-2.5 py-1.5 border-b border-[#F1F5F9]">Simular Acesso (Demo)</p>
                  <div className="flex flex-col gap-1 mt-1.5">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleRoleChange(u.role, u.email)}
                        className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          currentUser.role === u.role ? 'bg-[#F0F4F8] font-medium text-[#2B4C7E]' : 'text-slate-600'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{u.name.split(' (')[0]}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                        </div>
                        <span className="text-[9px] uppercase font-semibold px-1 py-0.5 bg-slate-100 rounded text-slate-500 border border-slate-200">
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Sair do sistema"
              id="logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MOBILE HEADER (flex md:hidden, 100% optimized for Android and iPhone) */}
        <div className="flex md:hidden flex-col w-full gap-2.5">
          {/* First Line */}
          <div className="flex items-center justify-between w-full">
            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu className="w-6.5 h-6.5" />
            </button>

            {/* Logo and salon short name in the center */}
            <div className="flex items-center gap-1.5 select-none max-w-[50%] justify-center">
              {renderLogo("w-8.5 h-8.5 text-xs", "w-8.5 h-8.5")}
              <div className="text-left">
                <h1 className="text-[14px] font-serif font-extrabold tracking-wide text-slate-900 leading-none truncate max-w-[120px]">
                  {settings.salonName || settings.name || "La Belle"}
                </h1>
                <span className="text-[9px] font-sans font-extrabold tracking-widest text-[#2B4C7E] uppercase block mt-0.5 leading-none">AGENDA</span>
              </div>
            </div>

            {/* Right actions (Install & Notifications) */}
            <div className="flex items-center gap-1">
              {showInstallButton && (
                <button
                  onClick={handleInstallClick}
                  className="p-2 hover:bg-sky-50 rounded-xl text-sky-600 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                  title="Instalar App"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                <NotificationCenter setTab={setTab} />
              </div>
            </div>
          </div>

          {/* Second Line - User profile details with professional color-coding */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border border-slate-100 bg-slate-50/50 rounded-xl">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[11px] text-slate-600 font-medium truncate">
                Operador: <strong className="text-slate-800">{currentUser.name.split(' ')[0]}</strong>
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${getRoleColor(currentUser.role)}`}>
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Left Sidebar Navigation */}
        <aside className={`hidden md:flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-[#E2E8F0] shrink-0 justify-between`}>
          <div className="flex flex-col">
            <div className={`flex items-center justify-between border-b border-[#F1F5F9] ${sidebarCollapsed ? 'flex-col gap-3 py-5 px-2' : 'px-6 py-5 gap-3'}`}>
              <div className="flex items-center gap-3">
                {renderLogo("w-10 h-10 text-xl", "w-10 h-10")}
                {!sidebarCollapsed && (
                  <span className="font-serif text-sm font-bold text-[#1E293B] leading-tight animate-in fade-in duration-200">
                    {settings.salonName || settings.name || "La Belle"}<br/>
                    <span className="text-xs font-sans font-normal text-slate-400 tracking-widest uppercase">Agenda</span>
                  </span>
                )}
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[36px]"
                title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>
            
            <nav className="py-4 space-y-0.5">
              {allowedMenuItems.map(item => {
                const IconComp = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`w-full flex items-center transition-all duration-150 cursor-pointer ${
                      sidebarCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-6 py-3'
                    } text-sm font-medium ${
                      isActive
                        ? 'bg-[#F0F4F8] text-[#2B4C7E] border-r-4 border-[#2B4C7E]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <IconComp className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#2B4C7E]' : 'text-slate-400'}`} />
                    {!sidebarCollapsed && <span className="animate-in fade-in duration-200">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick contact / Support detail inside workspace */}
          {!sidebarCollapsed && (
            <div className="p-4 animate-in fade-in duration-200">
              <div className="bg-[#F0F4F8] rounded-xl p-3 border border-[#E2E8F0] text-center">
                <span className="text-[10px] font-mono text-[#2B4C7E] uppercase tracking-wider block mb-1">Precisa de Ajuda?</span>
                <p className="text-xs text-slate-600 font-medium">WhatsApp Suporte</p>
                <p className="text-[10px] text-[#2B4C7E] font-mono font-bold">
                  {settings.salonPhone === "(11) 99999-8888" || settings.phone === "(11) 99999-8888"
                    ? "(21) 99095-5002"
                    : (settings.salonPhone || settings.phone || "(21) 99095-5002")}
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Slide-Out Drawer Menu (Full size drawer optimized for touch targets and permissions) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[1000] flex">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[900]"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Sidebar drawer container */}
            <div
              className="relative w-80 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 z-[1000]"
              style={{
                paddingTop: 'max(16px, env(safe-area-inset-top))',
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                paddingLeft: 'max(16px, env(safe-area-inset-left))',
                paddingRight: 'max(16px, env(safe-area-inset-right))',
              }}
            >
              {/* Header inside Drawer */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {renderLogo("w-8.5 h-8.5 text-xs", "w-8.5 h-8.5")}
                  <div>
                    <span className="font-serif font-bold text-slate-900 text-sm block tracking-wide truncate max-w-[150px]">
                      {settings.salonName || settings.name || "La Belle"}
                    </span>
                    <span className="text-[9px] font-sans font-extrabold tracking-widest text-[#2B4C7E] uppercase block">NAVEGAÇÃO</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>

              {/* Navigation Links with large touch targets (44px+) */}
              <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                {/* Regular Permitted Menu Items */}
                {allowedMenuItems.map(item => {
                  const IconComp = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-[13.5px] font-semibold cursor-pointer min-h-[46px] transition-all active:scale-[0.98] ${
                        isActive
                          ? 'bg-[#F0F4F8] text-[#2B4C7E] border-l-4 border-[#2B4C7E] shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <IconComp className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#2B4C7E]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {/* Additional simulated options / explicit drawer requests */}
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setTab('configuracoes');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-[13.5px] font-semibold cursor-pointer min-h-[46px] transition-all text-slate-600 hover:bg-slate-50`}
                  >
                    <Users className="w-5 h-5 text-slate-400 shrink-0" />
                    <span>Controle de Usuários</span>
                  </button>
                )}
              </nav>

              {/* Bottom section of the Drawer */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                {/* Active user credentials */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8.5 h-8.5 rounded-full bg-[#2B4C7E] text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate leading-none mb-0.5">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 truncate leading-none">{currentUser.email}</p>
                    </div>
                  </div>
                  
                  {/* Embedded profile switch in mobile drawer for super easy validation */}
                  <div className="pt-2 border-t border-slate-200/60 mt-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">Mudar Usuário (Simulação)</span>
                    <div className="grid grid-cols-2 gap-1">
                      {users.slice(0, 4).map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            handleRoleChange(u.role, u.email);
                            setMobileMenuOpen(false);
                          }}
                          className={`px-2 py-1 text-[9px] font-bold rounded-lg border text-left truncate leading-tight transition-colors cursor-pointer ${
                            currentUser.role === u.role
                              ? 'bg-[#2B4C7E] text-white border-[#2B4C7E]'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {u.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LogOut action inside drawer */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <span>v2.1.2 • PWA</span>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="text-xs font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer min-h-[40px]"
                  >
                    <LogOut className="w-4 h-4" /> Sair do Sistema
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Core Screen Container - Adding extra padding bottom on mobile to accommodate bottom navigation bar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 pb-28 md:pb-8">
          
          {/* Permission restrict banner if in Professional mode */}
          {currentUser.role === 'profissional' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Você está conectado como <strong>{currentUser.name}</strong>. Seu acesso está restrito para visualizar apenas sua própria agenda de procedimentos e históricos vinculados.</span>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* OPTIONAL PREMIUM BOTTOM NAVIGATION BAR (Visible only on mobile screens) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_16px_rgba(0,0,0,0.05)] flex items-center justify-around z-[200]"
        style={{
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          paddingTop: '10px',
          paddingLeft: 'max(8px, env(safe-area-inset-left))',
          paddingRight: 'max(8px, env(safe-area-inset-right))',
        }}
      >
        {getBottomNavItems().map((item) => {
          const IconComponent = item.icon;
          
          // Special central action button: Novo Agendamento
          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  sessionStorage.setItem('open_new_booking', 'true');
                  setTab('agenda');
                }}
                className="relative -top-5 flex flex-col items-center justify-center w-14 h-14 bg-[#D4AF37] hover:bg-[#C5A059] active:scale-90 text-white rounded-full shadow-lg border-4 border-white transition-all cursor-pointer shrink-0 z-50 focus:outline-none"
                title="Novo Agendamento"
              >
                <IconComponent className="w-6 h-6 text-white" />
              </button>
            );
          }
          
          const isCurrentActive = currentTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isMenuTrigger) {
                  setMobileMenuOpen(true);
                } else {
                  setTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-xl min-w-[54px] min-h-[44px] transition-all cursor-pointer active:scale-95 ${
                isCurrentActive 
                  ? 'text-[#2B4C7E] font-extrabold' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IconComponent className={`w-5.5 h-5.5 mb-1 ${isCurrentActive ? 'text-[#2B4C7E]' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight leading-none truncate max-w-[65px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* iOS Installation Guide Overlay */}
      {showIosPrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] bg-white border border-slate-100 p-5 rounded-2xl shadow-xl space-y-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#2B4C7E] flex items-center justify-center font-bold font-serif text-lg">
                ✨
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-serif">Instalar no seu iPhone / iPad</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Acesse como um aplicativo nativo!</p>
              </div>
            </div>
            <button
              onClick={handleDismissIosPrompt}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              title="Dispensar tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-[11px] text-slate-600">
            <p className="font-semibold text-slate-800">Siga estas instruções simples no Safari:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Toque no botão <span className="font-bold inline-flex items-center gap-0.5 text-slate-900 border border-slate-200 px-1 py-0.5 bg-white rounded-md"><Share className="w-3 h-3 text-sky-600" /> Compartilhar</span> do Safari.</li>
              <li>Selecione <span className="font-bold text-slate-900">“Adicionar à Tela de Início”</span>.</li>
              <li>Toque em <span className="font-bold text-slate-900">“Adicionar”</span> no canto superior direito.</li>
            </ol>
          </div>

          <div className="flex justify-end gap-2 text-[10px]">
            <button
              onClick={handleDismissIosPrompt}
              className="px-3.5 py-1.5 bg-sky-950 hover:bg-sky-900 text-white font-bold rounded-lg cursor-pointer transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
