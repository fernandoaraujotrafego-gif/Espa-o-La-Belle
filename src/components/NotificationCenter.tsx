import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';
import {
  Bell,
  Globe,
  Clock,
  RefreshCw,
  CheckSquare,
  Trash2,
  Check,
  PlusCircle,
  Sparkles,
  CalendarDays,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface NotificationCenterProps {
  setTab: (tab: string) => void;
}

export default function NotificationCenter({ setTab }: NotificationCenterProps) {
  const {
    notifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearReadNotifications,
    deleteAppNotification
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'web_booking' | 'maintenance' | 'agenda_change' | 'pending_task'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.isRead;
    return n.type === activeFilter;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'web_booking':
        return <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Globe className="w-4 h-4" /></div>;
      case 'maintenance':
        return <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-4 h-4" /></div>;
      case 'agenda_change':
        return <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><RefreshCw className="w-4 h-4" /></div>;
      case 'pending_task':
        return <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><CheckSquare className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 bg-slate-50 text-slate-600 rounded-xl"><Bell className="w-4 h-4" /></div>;
    }
  };

  const getNotifColorClasses = (type: string, isRead: boolean) => {
    if (isRead) return 'border-l-4 border-slate-200 bg-white opacity-85';
    switch (type) {
      case 'web_booking': return 'border-l-4 border-blue-500 bg-blue-50/20';
      case 'maintenance': return 'border-l-4 border-amber-500 bg-amber-50/20';
      case 'agenda_change': return 'border-l-4 border-indigo-500 bg-indigo-50/20';
      case 'pending_task': return 'border-l-4 border-rose-500 bg-rose-50/20';
      default: return 'border-l-4 border-slate-400 bg-slate-50/20';
    }
  };

  const handleNotificationClick = (n: AppNotification) => {
    markNotificationAsRead(n.id);
    if (n.link) {
      setTab(n.link);
      setIsOpen(false);
    }
  };

  // Simulation templates
  const simulateWebBooking = () => {
    const clients = [
      'Gabriela Rocha', 'Jessica Oliveira', 'Renata Santos', 'Tatiane Lima', 'Karina Mendes'
    ];
    const services = [
      'Design de Sobrancelhas', 'Alongamento em Gel', 'Manutenção Gel', 'Extensão de Cílios Fio a Fio', 'Esmaltação em Gel'
    ];
    const professional = ['Camila Silva', 'Amanda Costa', 'Juliana Medeiros'][Math.floor(Math.random() * 3)];
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    const randomSrv = services[Math.floor(Math.random() * services.length)];
    const randomHour = `${String(Math.floor(Math.random() * 10) + 9).padStart(2, '0')}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}`;

    addNotification({
      type: 'web_booking',
      title: 'Novo Agendamento Web',
      description: `A cliente ${randomClient} realizou agendamento online de "${randomSrv}" com ${professional} às ${randomHour}.`,
      link: 'agenda'
    });
  };

  const simulateMaintenance = () => {
    const clients = [
      'Fernanda Alencar', 'Lorena Silveira', 'Patrícia Souza', 'Juliana Ramos', 'Bárbara Vieira'
    ];
    const services = [
      'Alongamento de Unhas', 'Extensão de Cílios (Volume Russo)', 'Banho de Gel', 'Sobrancelha Microb'
    ];
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    const randomSrv = services[Math.floor(Math.random() * services.length)];
    const randomDays = Math.floor(Math.random() * 5) + 1;

    addNotification({
      type: 'maintenance',
      title: 'Manutenção Próxima / A Vencer',
      description: `A cliente ${randomClient} está no prazo ideal de retorno para manutenção de "${randomSrv}" (faltam ${randomDays} dias).`,
      link: 'clientes'
    });
  };

  const simulateAgendaChange = () => {
    const changes = [
      'Bruna Dias reagendou Beatriz Guedes das 11:00 para as 13:30 de hoje.',
      'Amanda Costa marcou um bloqueio de agenda às 15:30 para treinamento técnico.',
      'Juliana Medeiros cancelou o horário das 17:00 da cliente Vanessa Lima a pedido dela.',
      'Recepção alterou o profissional responsável pelo atendimento de Isabella Martins para Bruna Dias.'
    ];
    const randomChange = changes[Math.floor(Math.random() * changes.length)];

    addNotification({
      type: 'agenda_change',
      title: 'Alteração na Agenda Visual',
      description: randomChange,
      link: 'agenda'
    });
  };

  const simulatePendingTask = () => {
    const tasks = [
      'Repor estoque de luvas cirúrgicas e máscaras descartáveis.',
      'Enviar lista de pendências financeiras de clientes inadimplentes para gerência.',
      'Realizar higienização e esterilização na autoclave do kit de nail design.',
      'Entrar em contato com 3 clientes na lista de recall de manutenção vencida.'
    ];
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

    addNotification({
      type: 'pending_task',
      title: 'Tarefa Pendente do Dia',
      description: randomTask,
      link: 'dashboard'
    });
  };

  return (
    <div className="relative" ref={containerRef} id="notification-center">
      {/* Bell Trigger Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-[#2B4C7E] hover:bg-slate-50 rounded-lg transition-all cursor-pointer focus:outline-none"
        title="Notificações e Alertas"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white border border-[#E2E8F0] shadow-xl rounded-2xl z-50 overflow-hidden flex flex-col max-h-[580px]">
          {/* Header */}
          <div className="p-4 border-b border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-slate-800 text-sm flex items-center gap-1.5">
                Central de Alertas
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                    {unreadCount} novas
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">SISTEMA INTEGRADO LA BELLE</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={markAllNotificationsAsRead}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                title="Marcar todas como lidas"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={clearReadNotifications}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                title="Limpar notificações lidas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors md:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-3 py-2 border-b border-[#F1F5F9] bg-white flex flex-wrap gap-1 items-center">
            <SlidersHorizontal className="w-3 h-3 text-slate-400 mr-1" />
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                activeFilter === 'unread'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-rose-50/50 text-rose-600 border-rose-100 hover:bg-rose-50'
              }`}
            >
              Não Lidas
            </button>
            <button
              onClick={() => setActiveFilter('web_booking')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                activeFilter === 'web_booking'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50/50 text-blue-600 border-blue-100 hover:bg-blue-50'
              }`}
            >
              Web
            </button>
            <button
              onClick={() => setActiveFilter('maintenance')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                activeFilter === 'maintenance'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50/50 text-amber-600 border-amber-100 hover:bg-amber-50'
              }`}
            >
              Retornos
            </button>
            <button
              onClick={() => setActiveFilter('agenda_change')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                activeFilter === 'agenda_change'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:bg-indigo-50'
              }`}
            >
              Agenda
            </button>
            <button
              onClick={() => setActiveFilter('pending_task')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                activeFilter === 'pending_task'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-rose-50/50 text-rose-600 border-rose-100 hover:bg-rose-50'
              }`}
            >
              Tarefas
            </button>
          </div>

          {/* List area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9] max-h-80 select-none">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto stroke-1 mb-2 text-slate-300" />
                <p className="text-xs font-medium">Nenhum alerta nesta categoria</p>
                <p className="text-[10px] text-slate-400 mt-1">Ótimo trabalho! Tudo sob controle.</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors ${getNotifColorClasses(n.type, n.isRead)}`}
                >
                  {getNotifIcon(n.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p
                        onClick={() => handleNotificationClick(n)}
                        className={`text-xs font-semibold text-slate-800 leading-tight cursor-pointer hover:text-[#2B4C7E] truncate ${
                          !n.isRead ? 'font-bold' : ''
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0 whitespace-nowrap">
                        {n.time}
                      </span>
                    </div>
                    <p
                      onClick={() => handleNotificationClick(n)}
                      className="text-[11px] text-slate-500 mt-1 leading-relaxed cursor-pointer hover:text-slate-700"
                    >
                      {n.description}
                    </p>

                    {/* Meta info & Quick actions */}
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">
                        {n.type === 'web_booking' && 'Web'}
                        {n.type === 'maintenance' && 'Manutenção'}
                        {n.type === 'agenda_change' && 'Alteração'}
                        {n.type === 'pending_task' && 'Tarefa'}
                      </span>

                      <div className="flex items-center gap-2">
                        {!n.isRead && (
                          <button
                            onClick={() => markNotificationAsRead(n.id)}
                            className="text-[10px] font-bold text-[#2B4C7E] hover:underline"
                          >
                            Lida
                          </button>
                        )}
                        <button
                          onClick={() => deleteAppNotification(n.id)}
                          className="p-1 hover:bg-slate-200 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Excluir alerta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Simulator Panel Footer */}
          <div className="p-3 border-t border-[#F1F5F9] bg-[#F8FAFC]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
              Simular entrada de alertas (Apoio Testes)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={simulateWebBooking}
                className="px-2 py-1.5 bg-white border border-slate-200 text-[10px] font-semibold rounded-lg hover:border-blue-300 hover:bg-blue-50/30 text-blue-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Globe className="w-3 h-3 text-blue-500" />
                Agendamento Web
              </button>
              <button
                onClick={simulateMaintenance}
                className="px-2 py-1.5 bg-white border border-slate-200 text-[10px] font-semibold rounded-lg hover:border-amber-300 hover:bg-amber-50/30 text-amber-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Clock className="w-3 h-3 text-amber-500" />
                Manutenção Retorno
              </button>
              <button
                onClick={simulateAgendaChange}
                className="px-2 py-1.5 bg-white border border-slate-200 text-[10px] font-semibold rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 text-indigo-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-indigo-500" />
                Alt. de Agenda
              </button>
              <button
                onClick={simulatePendingTask}
                className="px-2 py-1.5 bg-white border border-slate-200 text-[10px] font-semibold rounded-lg hover:border-rose-300 hover:bg-rose-50/30 text-rose-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <CheckSquare className="w-3 h-3 text-rose-500" />
                Tarefa Pendente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
