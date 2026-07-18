/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp, addMinutesToTime } from '../context/AppContext';
import { Booking, BookingStatus } from '../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Check,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  DollarSign,
  MessageCircle,
  AlertCircle,
  Sparkles,
  Lock,
  Unlock,
  Activity,
  ChevronDown
} from 'lucide-react';

export default function Agenda() {
  const {
    bookings,
    agendaBlocks,
    clients,
    professionals,
    services,
    products,
    addBooking,
    updateBooking,
    checkScheduleConflict,
    checkoutBooking,
    addClient,
    addAgendaBlock,
    deleteAgendaBlock,
    cashier,
    currentUser,
    settings
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date
  const [selectedProfFilter, setSelectedProfFilter] = useState('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [agendaView, setAgendaView] = useState<'daily' | 'weekly' | 'monthly' | 'search'>('daily');

  // Advanced search form states
  const [formPeriod, setFormPeriod] = useState<string>('today');
  const [formStartDate, setFormStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formClientName, setFormClientName] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formSelectedProfs, setFormSelectedProfs] = useState<string[]>([]);
  const [formSelectedServices, setFormSelectedServices] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<string>('all');
  const [formOrder, setFormOrder] = useState<string>('datetime_asc');

  // Applied search states (to trigger specifically on 'Filtrar' button click)
  const [searchPeriod, setSearchPeriod] = useState<string>('today');
  const [searchStartDate, setSearchStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchEndDate, setSearchEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchClientName, setSearchClientName] = useState<string>('');
  const [searchNotes, setSearchNotes] = useState<string>('');
  const [selectedSearchProfs, setSelectedSearchProfs] = useState<string[]>([]);
  const [selectedSearchServices, setSelectedSearchServices] = useState<string[]>([]);
  const [searchStatus, setSearchStatus] = useState<string>('all');
  const [searchOrder, setSearchOrder] = useState<string>('datetime_asc');

  // Dropdown open states
  const [isFormPeriodDropdownOpen, setIsFormPeriodDropdownOpen] = useState(false);
  const [isFormProfDropdownOpen, setIsFormProfDropdownOpen] = useState(false);
  const [isFormServiceDropdownOpen, setIsFormServiceDropdownOpen] = useState(false);

  // Helper helper list of period options
  const periodOptions = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'tomorrow', label: 'Amanhã' },
    { value: 'this_week', label: 'Esta semana' },
    { value: 'last_week', label: 'Semana passada' },
    { value: 'next_week', label: 'Próxima semana' },
    { value: 'this_month', label: 'Este mês' },
    { value: 'last_month', label: 'Mês passado' },
    { value: 'next_month', label: 'Próximo mês' },
    { value: 'custom', label: 'Outro período' }
  ];

  const getPeriodLabel = (val: string) => {
    return periodOptions.find(opt => opt.value === val)?.label || 'Hoje';
  };

  const getPeriodDates = (period: string, customStart?: string, customEnd?: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    
    switch (period) {
      case 'today':
        return { start: todayStr, end: todayStr };
      case 'yesterday': {
        const d = new Date(today);
        d.setDate(today.getDate() - 1);
        return { start: d.toISOString().split('T')[0], end: d.toISOString().split('T')[0] };
      }
      case 'tomorrow': {
        const d = new Date(today);
        d.setDate(today.getDate() + 1);
        return { start: d.toISOString().split('T')[0], end: d.toISOString().split('T')[0] };
      }
      case 'this_week': {
        const currentDay = today.getDay();
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - distanceToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
      }
      case 'last_week': {
        const currentDay = today.getDay();
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - distanceToMonday - 7);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
      }
      case 'next_week': {
        const currentDay = today.getDay();
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - distanceToMonday + 7);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
      }
      case 'this_month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
      }
      case 'last_month': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
      }
      case 'next_month': {
        const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
      }
      case 'custom':
        return { start: customStart || todayStr, end: customEnd || todayStr };
      default:
        return { start: todayStr, end: todayStr };
    }
  };

  const handleApplyFilters = () => {
    setSearchPeriod(formPeriod);
    setSearchStartDate(formStartDate);
    setSearchEndDate(formEndDate);
    setSearchClientName(formClientName);
    setSearchNotes(formNotes);
    setSelectedSearchProfs(formSelectedProfs);
    setSelectedSearchServices(formSelectedServices);
    setSearchStatus(formStatus);
    setSearchOrder(formOrder);
  };

  const handleClearFilters = () => {
    setFormPeriod('today');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(new Date().toISOString().split('T')[0]);
    setFormClientName('');
    setFormNotes('');
    setFormSelectedProfs([]);
    setFormSelectedServices([]);
    setFormStatus('all');
    setFormOrder('datetime_asc');

    setSearchPeriod('today');
    setSearchStartDate(new Date().toISOString().split('T')[0]);
    setSearchEndDate(new Date().toISOString().split('T')[0]);
    setSearchClientName('');
    setSearchNotes('');
    setSelectedSearchProfs([]);
    setSelectedSearchServices([]);
    setSearchStatus('all');
    setSearchOrder('datetime_asc');
  };

  const searchResults = React.useMemo(() => {
    const { start, end } = getPeriodDates(searchPeriod, searchStartDate, searchEndDate);
    
    return bookings.filter(b => {
      // 1. Period check
      if (b.date < start || b.date > end) return false;

      // 2. Client name check
      if (searchClientName.trim() !== '') {
        if (!b.clientName.toLowerCase().includes(searchClientName.toLowerCase())) return false;
      }

      // 3. Notes check
      if (searchNotes.trim() !== '') {
        const matchObs = b.obs && b.obs.toLowerCase().includes(searchNotes.toLowerCase());
        if (!matchObs) return false;
      }

      // 4. Professional check
      if (selectedSearchProfs.length > 0) {
        if (!selectedSearchProfs.includes(b.professionalId)) return false;
      }

      // 5. Service check
      if (selectedSearchServices.length > 0) {
        if (!selectedSearchServices.includes(b.serviceId)) return false;
      }

      // 6. Status check
      if (searchStatus !== 'all') {
        if (searchStatus === 'pago') {
          if (!b.isPaid) return false;
        } else if (searchStatus === 'pendente') {
          if (b.isPaid) return false;
        } else {
          if (b.status !== searchStatus) return false;
        }
      }

      // Professional visibility guard
      if (b.status === 'finalizado' && currentUser?.role === 'profissional' && currentUser?.permissions?.viewServicesDone === false) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (searchOrder) {
        case 'datetime_asc': {
          const compDate = a.date.localeCompare(b.date);
          if (compDate !== 0) return compDate;
          return a.time.localeCompare(b.time);
        }
        case 'datetime_desc': {
          const compDate = b.date.localeCompare(a.date);
          if (compDate !== 0) return compDate;
          return b.time.localeCompare(a.time);
        }
        case 'value_asc':
          return a.value - b.value;
        case 'value_desc':
          return b.value - a.value;
        case 'client_asc':
          return a.clientName.localeCompare(b.clientName);
        default:
          return a.date.localeCompare(b.date);
      }
    });
  }, [
    bookings,
    searchPeriod,
    searchStartDate,
    searchEndDate,
    searchClientName,
    searchNotes,
    selectedSearchProfs,
    selectedSearchServices,
    searchStatus,
    searchOrder,
    currentUser
  ]);

  // Portuguese helper functions
  const getWeekdayNamePT = (dateStr: string) => {
    const daysPT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const d = new Date(dateStr + 'T12:00:00');
    return daysPT[d.getDay()];
  };

  const getWeekdayShortPT = (dateStr: string) => {
    const daysPT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const d = new Date(dateStr + 'T12:00:00');
    return daysPT[d.getDay()];
  };

  const getMonthNamePT = (monthIndex: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthIndex];
  };

  const getWeekdayEnglishName = (dateStr: string) => {
    const daysEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr + 'T12:00:00');
    return daysEN[d.getDay()];
  };

  const isSalonOpenOnDate = (dateStr: string) => {
    if (!settings?.workingHours) return true; // Default to true if not initialized
    const weekdayEN = getWeekdayEnglishName(dateStr);
    const dayConfig = settings.workingHours[weekdayEN];
    if (dayConfig && !dayConfig.isOpen) return false;
    return true;
  };

  const weekDays = React.useMemo(() => {
    const date = new Date(selectedDate + 'T12:00:00');
    const day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, [selectedDate]);

  const monthData = React.useMemo(() => {
    const date = new Date(selectedDate + 'T12:00:00');
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - offset);
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return { days, year, month };
  }, [selectedDate]);

  const getBookingsForDay = (dStr: string) => {
    return bookings.filter(b => {
      const matchDate = b.date === dStr;
      const matchProf = selectedProfFilter ? b.professionalId === selectedProfFilter : true;
      const matchService = selectedServiceFilter ? b.serviceId === selectedServiceFilter : true;
      
      // Hide services done if permission is false
      if (b.status === 'finalizado' && currentUser?.role === 'profissional' && currentUser?.permissions?.viewServicesDone === false) {
        return false;
      }
      
      let matchStatus = true;
      if (selectedStatusFilter === 'pago') {
        matchStatus = b.isPaid;
      } else if (selectedStatusFilter === 'pendente') {
        matchStatus = !b.isPaid;
      } else if (selectedStatusFilter) {
        matchStatus = b.status === selectedStatusFilter;
      }
      
      return matchDate && matchProf && matchService && matchStatus;
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const handlePrev = () => {
    if (agendaView === 'daily') {
      shiftDate(-1);
    } else if (agendaView === 'weekly') {
      shiftDate(-7);
    } else {
      // monthly
      const d = new Date(selectedDate + 'T12:00:00');
      d.setMonth(d.getMonth() - 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    }
  };

  const handleNext = () => {
    if (agendaView === 'daily') {
      shiftDate(1);
    } else if (agendaView === 'weekly') {
      shiftDate(7);
    } else {
      // monthly
      const d = new Date(selectedDate + 'T12:00:00');
      d.setMonth(d.getMonth() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    }
  };

  // Form controls
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  // Draggable states for New Booking modal
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0 });

  // Handle drag mousemove / touchmove on window
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      setDragOffset({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);
  
  // Bottom navigation booking trigger effect
  useEffect(() => {
    const shouldOpen = sessionStorage.getItem('open_new_booking');
    if (shouldOpen === 'true') {
      sessionStorage.removeItem('open_new_booking');
      setIsNewBookingOpen(true);
    }
  }, [isNewBookingOpen]);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);

  // New Booking State
  const [newClientId, setNewClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newProfId, setNewProfId] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newObs, setNewObs] = useState('');
  const [formError, setFormError] = useState('');
  const [isRegisteringNewClient, setIsRegisteringNewClient] = useState(false);

  // Multi-Service Appointment States
  const [newItems, setNewItems] = useState<Array<{
    serviceId: string;
    professionalId: string;
    time: string;
    duration: number;
    value: number;
  }>>([]);
  const [conflictsList, setConflictsList] = useState<Array<{
    serviceName: string;
    professionalName: string;
    time: string;
    endTime: string;
  }>>([]);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);

  const [serviceSearchQueries, setServiceSearchQueries] = useState<Record<number, string>>({});
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState<Record<number, boolean>>({});

  const handleServiceSearchChange = (index: number, query: string) => {
    setServiceSearchQueries(prev => ({
      ...prev,
      [index]: query
    }));
  };

  React.useEffect(() => {
    if (isNewBookingOpen) {
      const defaultProfId = newProfId || '';
      const defaultServiceId = newServiceId || '';
      const defaultTime = newTime || '09:00';
      const selectedSrv = services.find(s => s.id === defaultServiceId);
      
      setNewItems([
        {
          serviceId: defaultServiceId,
          professionalId: defaultProfId,
          time: defaultTime,
          duration: selectedSrv ? selectedSrv.duration : 0,
          value: selectedSrv ? selectedSrv.price : 0
        }
      ]);
      setFormError('');
      setConflictsList([]);
      setShowConflictConfirm(false);
      setServiceSearchQueries({});
      setIsServiceDropdownOpen({});
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isNewBookingOpen]);

  const handleAddItem = () => {
    let nextTime = '09:00';
    if (newItems.length > 0) {
      const lastItem = newItems[newItems.length - 1];
      if (lastItem.time && lastItem.duration) {
        nextTime = addMinutesToTime(lastItem.time, lastItem.duration);
      } else {
        nextTime = lastItem.time || '09:00';
      }
    }
    
    // Choose a default professional if there's one pre-selected or just empty
    const nextProfId = newItems.length > 0 ? newItems[newItems.length - 1].professionalId : '';

    setNewItems(prev => [
      ...prev,
      { serviceId: '', professionalId: nextProfId, time: nextTime, duration: 0, value: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (newItems.length <= 1) return;
    setNewItems(prev => prev.filter((_, i) => i !== index));
    setConflictsList([]);
    setShowConflictConfirm(false);
  };

  const handleUpdateItem = (index: number, fields: Partial<{ serviceId: string; professionalId: string; time: string; duration: number; value: number }>) => {
    setNewItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const merged = { ...item, ...fields };
      
      if (fields.serviceId !== undefined) {
        const srv = services.find(s => s.id === fields.serviceId);
        merged.duration = srv ? srv.duration : 0;
        merged.value = srv ? srv.price : 0;
        if (srv && srv.professionals.length > 0) {
          if (!srv.professionals.includes(merged.professionalId)) {
            merged.professionalId = srv.professionals[0];
          }
        }
      }
      return merged;
    }));
    setConflictsList([]);
    setShowConflictConfirm(false);
  };

  const handleAutoChainSchedules = () => {
    setNewItems(prev => {
      const chained = [...prev];
      for (let i = 1; i < chained.length; i++) {
        const prevItem = chained[i - 1];
        if (prevItem.time && prevItem.duration) {
          chained[i].time = addMinutesToTime(prevItem.time, prevItem.duration);
        }
      }
      return chained;
    });
  };

  // Block Schedule state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockProfId, setBlockProfId] = useState('all'); // 'all' or specific professional id
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('10:00');
  const [blockReason, setBlockReason] = useState('Outro');
  const [blockCustomReason, setBlockCustomReason] = useState('');
  const [blockError, setBlockError] = useState('');

  const [expandedProfSlots, setExpandedProfSlots] = useState<Record<string, boolean>>({});

  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getProfessionalSlots = (profId: string, dateStr: string) => {
    const prof = professionals.find(p => p.id === profId);
    if (!prof) return { available: [], filled: [] };

    const startStr = prof.workHours?.start || '09:00';
    const endStr = prof.workHours?.end || '19:00';

    const slots = [];
    let current = startStr;
    const endMinutes = timeToMinutes(endStr);

    while (timeToMinutes(current) < endMinutes) {
      slots.push(current);
      current = addMinutesToTime(current, 30);
    }

    const dayBookings = bookings.filter(b => 
      b.professionalId === profId && 
      b.date === dateStr && 
      b.status !== 'cancelado' && 
      b.status !== 'faltou'
    );

    const dayBlocks = agendaBlocks.filter(b => 
      b.professionalId === profId && 
      b.date === dateStr
    );

    const filled: string[] = [];
    const available: string[] = [];

    slots.forEach(slot => {
      const slotStart = timeToMinutes(slot);
      const slotEnd = slotStart + 30;

      const isBooked = dayBookings.some(b => {
        const bStart = timeToMinutes(b.time);
        const bEnd = bStart + b.duration;
        return slotStart < bEnd && slotEnd > bStart;
      });

      const isBlocked = dayBlocks.some(b => {
        const bStart = timeToMinutes(b.time);
        const bEnd = timeToMinutes(b.endTime);
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (isBooked || isBlocked) {
        filled.push(slot);
      } else {
        available.push(slot);
      }
    });

    return { available, filled };
  };

  // Checkout State
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);
  const [checkoutDiscountProducts, setCheckoutDiscountProducts] = useState<number>(0);
  const [checkoutAddedValue, setCheckoutAddedValue] = useState<number>(0);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState(() => Object.keys(settings.cardFees || {})[0] || 'Pix');
  const [checkoutProducts, setCheckoutProducts] = useState<Array<{ id: string; quantity: number }>>([]);
  const [checkoutObs, setCheckoutObs] = useState('');

  // Professional filtering
  const activeProfessionals = professionals.filter(p => p.active);
  const activeServices = services.filter(s => s.active);
  const displayedProfessionals = selectedProfFilter
    ? activeProfessionals.filter(p => p.id === selectedProfFilter)
    : activeProfessionals;

  // If professional role, hardcode filter to their own account
  React.useEffect(() => {
    if (currentUser?.role === 'profissional' && currentUser.professionalId) {
      setSelectedProfFilter(currentUser.professionalId);
    }
  }, [currentUser]);

  React.useEffect(() => {
    setBlockDate(selectedDate);
  }, [selectedDate]);

  // Compute Bookings matching criteria
  const filteredBookings = bookings.filter(b => {
    const matchDate = b.date === selectedDate;
    const matchProf = selectedProfFilter ? b.professionalId === selectedProfFilter : true;
    const matchService = selectedServiceFilter ? b.serviceId === selectedServiceFilter : true;
    let matchStatus = true;
    if (selectedStatusFilter === 'pago') {
      matchStatus = b.isPaid;
    } else if (selectedStatusFilter === 'pendente') {
      matchStatus = !b.isPaid;
    } else if (selectedStatusFilter) {
      matchStatus = b.status === selectedStatusFilter;
    }
    return matchDate && matchProf && matchService && matchStatus;
  });

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'confirmado': return 'Confirmado';
      case 'em_atendimento': return 'Em Atendimento';
      case 'finalizado': return 'Finalizado';
      case 'cancelado': return 'Cancelado';
      case 'faltou': return 'Faltou';
      case 'reagendado': return 'Reagendado';
      default: return status;
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'agendado': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'confirmado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'em_atendimento': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'finalizado': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'faltou': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'cancelado': return 'bg-slate-50 text-slate-400 border-slate-200';
      case 'reagendado': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const formatBRL = (val: number, isCommission: boolean = false) => {
    if (currentUser?.role === 'profissional') {
      if (isCommission && currentUser?.permissions?.viewCommissions === false) {
        return '---';
      }
      if (!isCommission && currentUser?.permissions?.viewValues === false) {
        return '---';
      }
    }
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getServiceSearchValue = (index: number, serviceId: string) => {
    if (serviceSearchQueries[index] !== undefined) {
      return serviceSearchQueries[index];
    }
    const srv = services.find(s => s.id === serviceId);
    return srv ? srv.name : '';
  };

  const isDateAllowed = (dateStr: string) => {
    if (!currentUser) return false;
    if (currentUser.role !== 'profissional') return true;
    if (currentUser.isBlocked) return false;
    
    const perm = currentUser.permissions;
    if (!perm) return true; // Default to full access
    
    const cal = perm.calendarAccess;
    if (!cal) return true;
    
    const todayStr = new Date().toISOString().split('T')[0]; 
    
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    
    const dateObj = new Date(dateStr + 'T12:00:00');
    const todayObj = new Date(todayStr + 'T12:00:00');
    
    const targetYear = dateObj.getFullYear();
    const targetMonth = dateObj.getMonth();
    const refYear = todayObj.getFullYear();
    const refMonth = todayObj.getMonth();
    
    const isPastMonth = (targetYear < refYear) || (targetYear === refYear && targetMonth < refMonth);
    const isCurrentMonth = (targetYear === refYear && targetMonth === refMonth);
    const isFutureMonth = (targetYear > refYear) || (targetYear === refYear && targetMonth > refMonth);
    
    // Check day rules
    if (isPast && cal.pastDays === false) return false;
    if (isToday && cal.todayOnly === false) return false;
    if (isFuture && cal.futureDays === false) return false;
    
    // Check month rules
    if (isPastMonth && cal.pastMonth === false) return false;
    if (isCurrentMonth && cal.currentMonth === false) return false;
    if (isFutureMonth && cal.futureMonth === false) return false;
    
    return true;
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError('');

    if (blockStartTime >= blockEndTime) {
      setBlockError('O horário de início deve ser menor que o horário de término.');
      return;
    }

    const reasonText = blockReason === 'Outro' ? (blockCustomReason || 'Bloqueio') : blockReason;

    const selectedProf = activeProfessionals.find(p => p.id === blockProfId);
    if (blockProfId !== 'all' && !selectedProf) return;

    try {
      await addAgendaBlock({
        professionalId: blockProfId,
        professionalName: blockProfId === 'all' ? 'Todas as profissionais' : selectedProf!.name,
        date: blockDate,
        time: blockStartTime,
        endTime: blockEndTime,
        reason: reasonText
      });
      setIsBlockModalOpen(false);
      setBlockCustomReason('');
      setBlockReason('Outro');
    } catch (error) {
      setBlockError(error instanceof Error ? error.message : 'Não foi possível criar o bloqueio.');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!window.confirm('Remover este bloqueio da agenda?')) return;
    try {
      await deleteAgendaBlock(id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível remover o bloqueio.');
    }
  };

  // Submit Booking creation
  const handleCreateBooking = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setFormError('');

    if (newItems.length === 0) {
      setFormError('Por favor, adicione pelo menos um serviço para agendar.');
      return;
    }

    // Validate that all items have a service and professional
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      if (!item.serviceId) {
        setFormError(`Por favor, selecione o serviço para o item ${i + 1}.`);
        return;
      }
      if (!item.professionalId) {
        setFormError(`Por favor, selecione o profissional para o item ${i + 1}.`);
        return;
      }
      if (!item.time) {
        setFormError(`Por favor, defina o horário para o item ${i + 1}.`);
        return;
      }
    }

    // Validate client selection
    let finalClientId = newClientId;
    let finalClientName = '';
    let finalClientPhone = '';

    if (isRegisteringNewClient) {
      if (!newClientName || !newClientPhone) {
        setFormError('Por favor, digite o nome e telefone da nova cliente.');
        return;
      }
      const created = await addClient({
        name: newClientName,
        phone: newClientPhone,
        birthDate: '1990-01-01',
        status: 'ativo'
      });
      finalClientId = created.id;
      finalClientName = created.name;
      finalClientPhone = created.phone;
    } else {
      const existing = clients.find(c => c.id === newClientId);
      if (!existing) {
        setFormError('Por favor, selecione uma cliente ou cadastre uma nova.');
        return;
      }
      finalClientId = existing.id;
      finalClientName = existing.name;
      finalClientPhone = existing.phone;
    }

    const conflicts: Array<{
      serviceName: string;
      professionalName: string;
      time: string;
      endTime: string;
    }> = [];

    for (const item of newItems) {
      const isConflict = checkScheduleConflict(
        selectedDate,
        item.time,
        item.duration,
        item.professionalId
      );
      if (isConflict) {
        const prof = professionals.find(p => p.id === item.professionalId);
        const srv = services.find(s => s.id === item.serviceId);
        conflicts.push({
          serviceName: srv ? srv.name : 'Serviço',
          professionalName: prof ? prof.name : 'Profissional',
          time: item.time,
          endTime: addMinutesToTime(item.time, item.duration)
        });
      }
    }

    if (conflicts.length > 0) {
      setConflictsList(conflicts);
      setShowConflictConfirm(true);
      return;
    }

    // Process saving all items
    const successes: Booking[] = [];
    const errors: string[] = [];

    for (const item of newItems) {
      const srv = services.find(s => s.id === item.serviceId)!;
      const prof = professionals.find(p => p.id === item.professionalId)!;

      try {
        const res = await addBooking({
          clientId: finalClientId,
          clientName: finalClientName,
          clientPhone: finalClientPhone,
          professionalId: prof.id,
          professionalName: prof.name,
          serviceId: srv.id,
          serviceName: srv.name,
          date: selectedDate,
          time: item.time,
          duration: item.duration,
          value: item.value,
          status: 'agendado',
          isPaid: false,
          obs: newObs
        });

        if (res.success && res.booking) {
          successes.push(res.booking);
        } else {
          errors.push(`${srv.name} (${item.time}): ${res.message}`);
        }
      } catch (error) {
        errors.push(`${srv.name} (${item.time}): ${error instanceof Error ? error.message : 'Falha ao salvar.'}`);
      }
    }

    if (errors.length > 0) {
      if (successes.length > 0) {
        setNewItems(currentItems => currentItems.filter(item => !successes.some(booking =>
          booking.serviceId === item.serviceId &&
          booking.professionalId === item.professionalId &&
          booking.time === item.time
        )));
        setFormError(`${successes.length} serviço(s) foram salvos. Revise os demais: ${errors.join(' | ')}`);
      } else {
        setFormError(errors.join(' | '));
      }
      return;
    }

    // Success reset and close
    setIsNewBookingOpen(false);
    setNewClientId('');
    setNewClientName('');
    setNewClientPhone('');
    setNewObs('');
    setIsRegisteringNewClient(false);
    setShowConflictConfirm(false);
    setConflictsList([]);
  };

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    try {
      const res = await updateBooking(id, { status });
      if (res.success) {
        setSelectedBooking(prev => prev ? { ...prev, status } : null);
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível atualizar o agendamento.');
    }
  };

  // Open checkout modal
  const handleOpenCheckout = () => {
    if (!selectedBooking) return;
    setCheckoutDiscount(0);
    setCheckoutDiscountProducts(0);
    setCheckoutAddedValue(0);
    setCheckoutPaymentMethod(Object.keys(settings.cardFees || {})[0] || 'Pix');
    setCheckoutProducts([]);
    setCheckoutObs('');
    setIsCheckoutOpen(true);
  };

  // Confirm checkout and complete billing
  const handleConfirmCheckout = async () => {
    if (!selectedBooking || isCheckoutSubmitting) return;
    
    // Safety check if cashier is closed
    if (!cashier.isOpen) {
      alert('Atenção: O caixa do dia está fechado! Abra o caixa para registrar a transação financeira.');
      return;
    }

    const details = {
      method: checkoutPaymentMethod,
      discount: checkoutDiscount,
      discountProducts: checkoutDiscountProducts,
      addedValue: checkoutAddedValue,
      productsSold: checkoutProducts,
      obs: checkoutObs
    };

    setIsCheckoutSubmitting(true);
    try {
      await checkoutBooking(selectedBooking.id, details);
      setIsCheckoutOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível finalizar o pagamento.');
    } finally {
      setIsCheckoutSubmitting(false);
    }
  };

  const handleAddProductToCheckout = (prodId: string) => {
    if (!prodId) return;
    setCheckoutProducts(prev => {
      const existing = prev.find(p => p.id === prodId);
      if (existing) {
        return prev.map(p => p.id === prodId ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { id: prodId, quantity: 1 }];
    });
  };

  const handleRemoveProductFromCheckout = (prodId: string) => {
    setCheckoutProducts(prev => prev.filter(p => p.id !== prodId));
  };

  // Generate customized WhatsApp text
  const getWhatsAppMessageText = (b: Booking) => {
    let msg = settings.defaultMessages?.confirmation || 'Olá {cliente}, seu agendamento de {servico} com {profissional} está marcado para o dia {data} às {hora}.';
    
    const replacements: Record<string, string> = {
      '\\{cliente\\}': b.clientName || '',
      '\\{servico\\}': b.serviceName || '',
      '\\{profissional\\}': b.professionalName || '',
      '\\{data\\}': b.date ? b.date.split('-').reverse().join('/') : '',
      '\\{hora\\}': b.time || '',
      '\\{valor\\}': formatBRL(b.value || 0)
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder, 'gi');
      msg = msg.replace(regex, value);
    });

    return msg;
  };

  const triggerWhatsApp = (b: Booking) => {
    let phone = b.clientPhone.replace(/\D/g, '');
    if (phone.startsWith('55') && phone.length >= 12) {
      // Já possui DDI 55
    } else {
      phone = `55${phone}`;
    }
    const text = encodeURIComponent(getWhatsAppMessageText(b));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Navigation and filters */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* Date Selector navigation and View switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer" title="Anterior">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-950"
              />
            </div>

            <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer" title="Próximo">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-xs text-[#2B4C7E] font-semibold hover:underline"
          >
            Ir para Hoje
          </button>

          {/* View Toggler Segment */}
          <div className="flex bg-[#F1F5F9] p-0.5 rounded-xl border border-[#E2E8F0]">
            <button
              onClick={() => setAgendaView('daily')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                agendaView === 'daily'
                  ? 'bg-white text-[#2B4C7E] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => setAgendaView('weekly')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                agendaView === 'weekly'
                  ? 'bg-white text-[#2B4C7E] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setAgendaView('monthly')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                agendaView === 'monthly'
                  ? 'bg-white text-[#2B4C7E] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAgendaView('search')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                agendaView === 'search'
                  ? 'bg-[#2B4C7E] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Pesquisar</span> 🔍
            </button>
          </div>
        </div>

        {/* Filters and View controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {currentUser?.role !== 'profissional' && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedProfFilter}
                onChange={(e) => setSelectedProfFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-600 font-semibold focus:outline-none border-none pr-4"
              >
                <option value="">Todos os Profissionais</option>
                {activeProfessionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedServiceFilter}
              onChange={(e) => setSelectedServiceFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-600 font-semibold focus:outline-none border-none pr-4"
            >
              <option value="">Todos os Serviços</option>
              {activeServices.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-600 font-semibold focus:outline-none border-none pr-4 cursor-pointer"
            >
              <option value="">Todos os Status</option>
              <option value="pago">Status: Pago</option>
              <option value="pendente">Status: Pendente</option>
              <option value="agendado">Atendimento: Agendado</option>
              <option value="confirmado">Atendimento: Confirmado</option>
              <option value="em_atendimento">Atendimento: Em Atendimento</option>
              <option value="finalizado">Atendimento: Finalizado</option>
              <option value="cancelado">Atendimento: Cancelado</option>
              <option value="faltou">Atendimento: Faltou</option>
              <option value="reagendado">Atendimento: Reagendado</option>
            </select>
          </div>

          <button
            onClick={() => {
              setBlockDate(selectedDate);
              setIsBlockModalOpen(true);
            }}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" /> Bloquear Horário
          </button>

          <button
            onClick={() => setIsNewBookingOpen(true)}
            className="px-3.5 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" /> Agendar Horário
          </button>
        </div>

      </div>

      {/* Main Agenda Grid / Visual List */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* Header containing status explanations */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-serif font-bold text-[#1E293B]">
              {agendaView === 'daily' && `Agenda do Dia: ${selectedDate.split('-').reverse().join('/')}`}
              {agendaView === 'weekly' && `Agenda Semanal`}
              {agendaView === 'monthly' && `Agenda Mensal: ${getMonthNamePT(monthData.month)} de ${monthData.year}`}
            </h3>
            <p className="text-xs text-slate-400">
              {agendaView === 'daily' && `${filteredBookings.length} ${filteredBookings.length === 1 ? 'agendamento listado' : 'agendamentos listados'}`}
              {agendaView === 'weekly' && `Visualização de 7 dias da semana corrente`}
              {agendaView === 'monthly' && `Clique em qualquer dia do mês para listar atendimentos`}
            </p>
          </div>

          {/* Quick status reminders */}
          <div className="hidden sm:flex gap-3 text-[10px] font-semibold text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Agendado</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Confirmado</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Atendimento</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Finalizado</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Faltou</span>
          </div>
        </div>

        {/* DIÁRIO VIEW */}
        {agendaView === 'daily' && (
          !isDateAllowed(selectedDate) ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-center space-y-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Visualização de Agenda Bloqueada</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Seu perfil de usuário possui restrições para visualizar a agenda no dia <strong>{selectedDate.split('-').reverse().join('/')}</strong>. Contate a administração se precisar de acesso.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {!isSalonOpenOnDate(selectedDate) && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top-2 duration-200">
                <span className="text-base">⚠️</span>
                <div>
                  <strong className="font-bold">Aviso de Expediente:</strong> O salão está configurado como <span className="font-bold underline">fechado</span> aos {getWeekdayNamePT(selectedDate)}s. Atendimentos ainda podem ser geridos, mas respeite a escala de funcionamento.
                </div>
              </div>
            )}
            {/* Scrollable Container of Columns */}
            <div className="flex flex-col md:flex-row gap-5 overflow-x-auto pb-4">
              {displayedProfessionals.map(p => {
                const profBookings = bookings.filter(b => {
                  const matchProf = b.professionalId === p.id;
                  const matchDate = b.date === selectedDate;
                  const matchService = selectedServiceFilter ? b.serviceId === selectedServiceFilter : true;
                  let matchStatus = true;
                  if (selectedStatusFilter === 'pago') {
                    matchStatus = b.isPaid;
                  } else if (selectedStatusFilter === 'pendente') {
                    matchStatus = !b.isPaid;
                  } else if (selectedStatusFilter) {
                    matchStatus = b.status === selectedStatusFilter;
                  }
                  return matchProf && matchDate && matchService && matchStatus;
                });
                const profBlocks = agendaBlocks.filter(b => 
                  b.professionalId === p.id && 
                  b.date === selectedDate
                );

                // Combine bookings and blocks
                const timelineItems = [
                  ...profBookings.map(b => ({ type: 'booking' as const, id: b.id, time: b.time, item: b })),
                  ...profBlocks.map(b => ({ type: 'block' as const, id: b.id, time: b.time, item: b }))
                ].sort((a, b) => a.time.localeCompare(b.time));

                const slotsSummary = getProfessionalSlots(p.id, selectedDate);
                const isSlotsExpanded = !!expandedProfSlots[p.id];

                return (
                  <div
                    key={p.id}
                    className="flex-1 min-w-[300px] bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Column Header */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          {p.photo ? (
                            <img
                              src={p.photo}
                              alt={p.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs">
                              {getInitials(p.name)}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 leading-tight">{p.name}</h4>
                            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]" title={p.specialties.join(', ')}>
                              {p.specialties[0]}
                            </p>
                          </div>
                        </div>

                        {/* Counts and Quick Add Trigger */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold bg-white text-slate-600 border border-slate-200 rounded px-1.5 py-0.5" title="Agendamentos e Bloqueios">
                            {profBookings.length} ag. | {profBlocks.length} bl.
                          </span>
                          
                          {/* Lane Quick Controls */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => {
                                setNewProfId(p.id);
                                setIsNewBookingOpen(true);
                              }}
                              className="p-1 bg-white hover:bg-sky-50 text-sky-950 hover:text-sky-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="Agendar para este profissional"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setBlockProfId(p.id);
                                setBlockDate(selectedDate);
                                setIsBlockModalOpen(true);
                              }}
                              className="p-1 bg-white hover:bg-rose-50 text-rose-800 hover:text-rose-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="Bloquear agenda para este profissional"
                            >
                              <Lock className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Visual Slots Timeline Selector ("Visualizar Horários") */}
                      <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-3xs">
                        <button
                          onClick={() => setExpandedProfSlots(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                          className="w-full px-3 py-2 text-left flex justify-between items-center text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Ver Horários Disponíveis ({slotsSummary.available.length})
                          </span>
                          <span className="text-slate-400 text-xs">
                            {isSlotsExpanded ? '▲' : '▼'}
                          </span>
                        </button>

                        {isSlotsExpanded && (
                          <div className="p-2 border-t border-slate-100 bg-slate-50/30 max-h-[160px] overflow-y-auto space-y-1.5">
                            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                              Clique em um horário livre para agendar:
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                              {/* List all slots: if available, show light green. If filled, show gray */}
                              {(() => {
                                const startStr = p.workHours?.start || '09:00';
                                const endStr = p.workHours?.end || '19:00';
                                const slotsList = [];
                                let curr = startStr;
                                while (timeToMinutes(curr) < timeToMinutes(endStr)) {
                                  slotsList.push(curr);
                                  curr = addMinutesToTime(curr, 30);
                                }

                                return slotsList.map(slot => {
                                  const isAvailable = slotsSummary.available.includes(slot);
                                  return (
                                    <button
                                      key={slot}
                                      disabled={!isAvailable}
                                      onClick={() => {
                                        setNewProfId(p.id);
                                        setNewTime(slot);
                                        setIsNewBookingOpen(true);
                                      }}
                                      className={`text-[9px] font-bold font-mono py-1 rounded text-center transition-all ${
                                        isAvailable
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through'
                                      }`}
                                      title={isAvailable ? `Agendar às ${slot}` : `Horário ocupado/bloqueado`}
                                    >
                                      {slot}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lane Items List */}
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {timelineItems.length === 0 ? (
                          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-white/60">
                            <CalendarIcon className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                            <p className="text-[10px] font-bold text-slate-400">Nenhum agendamento</p>
                            <p className="text-[9px] text-slate-400 max-w-[160px] mx-auto mt-0.5">
                              Clique no "+" acima para adicionar serviços ou bloquear horário.
                            </p>
                          </div>
                        ) : (
                          timelineItems.map((item, idx) => {
                            if (item.type === 'booking') {
                              const b = item.item as Booking;
                              return (
                                <div
                                  key={`${b.id}-${idx}`}
                                  onClick={() => setSelectedBooking(b)}
                                  className={`border rounded-xl p-3 cursor-pointer hover:shadow-xs transition-all relative overflow-hidden bg-white hover:border-amber-300 flex flex-col justify-between space-y-1.5 ${
                                    b.status === 'finalizado' ? 'opacity-75 border-slate-200 bg-slate-50/50' : 'border-slate-100'
                                  }`}
                                >
                                  {/* Left visual strip */}
                                  <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                                    b.status === 'agendado' ? 'bg-sky-500' :
                                    b.status === 'confirmado' ? 'bg-emerald-500' :
                                    b.status === 'em_atendimento' ? 'bg-amber-500' :
                                    b.status === 'finalizado' ? 'bg-slate-400' : 'bg-rose-500'
                                  }`} />

                                  <div className="pl-1.5 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                        {b.time} - {b.endTime}
                                      </span>
                                      <span className={`px-1.5 py-0.2 text-[8px] font-bold uppercase rounded-full border ${getStatusColor(b.status)}`}>
                                        {getStatusLabel(b.status)}
                                      </span>
                                    </div>
                                    <h5 className="text-xs font-bold text-sky-950 line-clamp-1">{b.clientName}</h5>
                                    <p className="text-[10px] text-slate-600 font-medium leading-tight">{b.serviceName}</p>
                                    {b.obs && (
                                      <p className="text-[9px] text-slate-400 italic line-clamp-1">"{b.obs}"</p>
                                    )}
                                  </div>

                                  <div className="pl-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-700">
                                    <span>{formatBRL(b.value)}</span>
                                    <span className="text-[8px] text-sky-700 uppercase tracking-wider hover:underline">
                                      Opções & Caixa
                                    </span>
                                  </div>
                                </div>
                              );
                            } else {
                              const block = item.item as any;
                              return (
                                <div
                                  key={`${block.id}-${idx}`}
                                  className="border border-rose-100 bg-rose-50/40 rounded-xl p-3 relative overflow-hidden flex flex-col justify-between space-y-1.5"
                                >
                                  {/* Left visual strip */}
                                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-rose-500" />

                                  <div className="pl-1.5 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-mono text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" /> {block.time} - {block.endTime}
                                      </span>
                                      <span className="px-1.5 py-0.2 text-[8px] font-bold uppercase rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                        Bloqueio
                                      </span>
                                    </div>
                                    <h5 className="text-xs font-bold text-rose-950 flex items-center gap-1">
                                      {block.reason}
                                    </h5>
                                    <p className="text-[9px] text-rose-500">Agendamentos estão restritos neste horário.</p>
                                  </div>

                                  <div className="pl-1.5 pt-1.5 border-t border-rose-100 flex items-center justify-between">
                                    <span className="text-[8px] text-rose-400 font-mono">ID: {block.id.slice(0, 8)}</span>
                                    <button
                                      onClick={() => void handleDeleteBlock(block.id)}
                                      className="text-[9px] font-bold text-rose-700 hover:text-rose-900 uppercase hover:underline"
                                    >
                                      Remover Bloqueio
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )
        )}

        {/* WEEKLY VIEW */}
        {agendaView === 'weekly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 animate-in fade-in duration-200">
            {weekDays.map(dayStr => {
              const dayBookings = getBookingsForDay(dayStr);
              const isToday = dayStr === new Date().toISOString().split('T')[0];
              const isSelected = dayStr === selectedDate;

              return (
                <div
                  key={dayStr}
                  onClick={() => setSelectedDate(dayStr)}
                  className={`border rounded-xl p-3 flex flex-col justify-between min-h-[320px] transition-all cursor-pointer ${
                    isToday
                      ? 'bg-[#F0F4F8] border-[#2B4C7E] ring-1 ring-[#2B4C7E]'
                      : isSelected
                      ? 'bg-white border-[#D4AF37] shadow-xs'
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Day name & date */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">
                          {getWeekdayShortPT(dayStr)}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {dayStr.split('-').reverse().slice(0, 2).join('/')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(dayStr);
                          setIsNewBookingOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-[#2B4C7E] hover:bg-slate-100 rounded transition-colors"
                        title="Novo Agendamento"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bookings inside that day */}
                    {!isDateAllowed(dayStr) ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 bg-slate-50/50 rounded-lg border border-slate-100 p-2 my-2">
                        <Lock className="w-4 h-4 text-rose-400 animate-pulse" />
                        <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Acesso Restrito</p>
                        <p className="text-[9px] text-slate-400 leading-normal">Permissão bloqueada</p>
                      </div>
                    ) : (() => {
                      const dayBlocks = agendaBlocks.filter(b => b.date === dayStr);
                      const combined = [
                        ...dayBookings.map(b => ({ type: 'booking' as const, id: b.id, time: b.time, item: b })),
                        ...dayBlocks.map(b => ({ type: 'block' as const, id: b.id, time: b.time, item: b }))
                      ].sort((a, b) => a.time.localeCompare(b.time));

                      if (combined.length === 0) {
                        return (
                          <div className="text-center py-12 text-[10px] text-slate-400 font-medium">
                            Sem horários
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                          {combined.map((item, idx) => {
                            if (item.type === 'booking') {
                              const b = item.item as Booking;
                              return (
                                <div
                                  key={`${b.id}-${idx}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBooking(b);
                                  }}
                                  className="p-2 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100/80 hover:border-amber-200 transition-all text-left relative overflow-hidden"
                                >
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                    b.status === 'agendado' ? 'bg-sky-500' :
                                    b.status === 'confirmado' ? 'bg-emerald-500' :
                                    b.status === 'em_atendimento' ? 'bg-amber-500' :
                                    b.status === 'finalizado' ? 'bg-slate-400' : 'bg-rose-500'
                                  }`} />
                                  <div className="pl-1.5 space-y-0.5">
                                    <p className="text-[9px] font-bold text-slate-500 font-mono">
                                      {b.time}
                                    </p>
                                    <h5 className="text-[10px] font-bold text-[#1E293B] truncate leading-tight">
                                      {b.clientName}
                                    </h5>
                                    <p className="text-[9px] text-slate-500 truncate leading-none">
                                      {b.serviceName}
                                    </p>
                                  </div>
                                </div>
                              );
                            } else {
                              const block = item.item as any;
                              return (
                                <div
                                  key={`${block.id}-${idx}`}
                                  className="p-2 border border-rose-100 rounded-lg bg-rose-50/60 transition-all text-left relative overflow-hidden"
                                >
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                                  <div className="pl-1.5 space-y-0.5">
                                    <p className="text-[9px] font-bold text-rose-700 font-mono flex items-center gap-0.5">
                                      <Lock className="w-2 h-2" /> {block.time}
                                    </p>
                                    <h5 className="text-[10px] font-bold text-rose-950 truncate leading-tight">
                                      {block.reason}
                                    </h5>
                                    <p className="text-[9px] text-rose-400 truncate leading-none">
                                      Bloqueado
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {(dayBookings.length > 0 || agendaBlocks.filter(b => b.date === dayStr).length > 0) && (
                    <div className="pt-2 border-t border-slate-100 mt-2 text-[10px] text-right font-semibold text-slate-500">
                      {dayBookings.length} at. | {agendaBlocks.filter(b => b.date === dayStr).length} bl.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* MONTHLY VIEW */}
        {agendaView === 'monthly' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              
              {/* Days of the week label row */}
              <div className="grid grid-cols-7 text-center bg-white border-b border-slate-100 py-3 text-xs font-bold text-slate-500">
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
                <div>Dom</div>
              </div>

              {/* 42 cells grid */}
              <div className="grid grid-cols-7 gap-px bg-slate-200">
                {monthData.days.map(dayStr => {
                  const dayBookings = getBookingsForDay(dayStr);
                  const isCurrentMonth = new Date(dayStr + 'T12:00:00').getMonth() === monthData.month;
                  const isSelected = dayStr === selectedDate;
                  const isToday = dayStr === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={dayStr}
                      onClick={() => setSelectedDate(dayStr)}
                      className={`min-h-[75px] md:min-h-[105px] p-2 flex flex-col justify-between transition-all cursor-pointer relative group ${
                        !isDateAllowed(dayStr)
                          ? 'bg-rose-50/10 text-slate-300 opacity-60'
                          : isSelected
                          ? 'bg-[#FAF6E8] ring-2 ring-[#D4AF37] z-10'
                          : isToday
                          ? 'bg-[#F0F4F8]'
                          : isCurrentMonth
                          ? 'bg-white hover:bg-slate-50'
                          : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold flex items-center gap-1 ${
                          isSelected ? 'text-amber-800' : isToday ? 'text-sky-800' : 'text-slate-700'
                        }`}>
                          {dayStr.split('-')[2]}
                          {!isDateAllowed(dayStr) && <Lock className="w-2.5 h-2.5 text-rose-400" />}
                        </span>
                        
                        {isCurrentMonth && isDateAllowed(dayStr) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(dayStr);
                              setIsNewBookingOpen(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:bg-slate-100 p-0.5 rounded text-slate-400 hover:text-[#2B4C7E] transition-all"
                            title="Novo Agendamento"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Booking mini list or badges inside cells */}
                      <div className="space-y-1 mt-1.5 flex-1 flex flex-col justify-end">
                        
                        {/* Desktop text details */}
                        <div className="hidden lg:block space-y-1">
                          {dayBookings.slice(0, 2).map((b, idx) => (
                            <div
                              key={`${b.id}-${idx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(b);
                              }}
                              className="text-[9px] px-1 py-0.5 rounded truncate font-medium flex items-center gap-1 border border-slate-100 bg-white shadow-3xs hover:border-amber-400"
                            >
                              <span className={`w-1 h-1 rounded-full shrink-0 ${
                                b.status === 'agendado' ? 'bg-sky-500' :
                                b.status === 'confirmado' ? 'bg-emerald-500' :
                                b.status === 'em_atendimento' ? 'bg-amber-500' :
                                b.status === 'finalizado' ? 'bg-slate-400' : 'bg-rose-500'
                              }`} />
                              <span className="font-bold text-slate-500 font-mono shrink-0">{b.time}</span>
                              <span className="text-slate-700 truncate leading-none">{b.clientName}</span>
                            </div>
                          ))}
                          {dayBookings.length > 2 && (
                            <div className="text-[8px] text-[#2B4C7E] font-bold pl-1">
                              + {dayBookings.length - 2} mais
                            </div>
                          )}
                        </div>

                        {/* Mobile and tablet dot or numeric badges */}
                        <div className="lg:hidden flex justify-center">
                          {dayBookings.length > 0 && (
                            <span className="bg-[#2B4C7E] text-[#D4AF37] text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              {dayBookings.length}
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected day listings under the monthly view */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-[#1E293B] font-serif flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2B4C7E]" />
                    Atendimentos de {selectedDate.split('-').reverse().join('/')} ({getWeekdayNamePT(selectedDate)})
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {getBookingsForDay(selectedDate).length} agendamentos e {agendaBlocks.filter(b => b.date === selectedDate).length} bloqueios cadastrados nesta data
                  </p>
                </div>
                <button
                  onClick={() => setAgendaView('daily')}
                  className="text-xs text-[#2B4C7E] font-bold hover:underline self-start sm:self-auto"
                >
                  Visualizar em Modo Diário &rarr;
                </button>
              </div>

              {(() => {
                const dayBookings = getBookingsForDay(selectedDate);
                const dayBlocks = agendaBlocks.filter(b => b.date === selectedDate);
                const combined = [
                  ...dayBookings.map(b => ({ type: 'booking' as const, id: b.id, time: b.time, item: b })),
                  ...dayBlocks.map(b => ({ type: 'block' as const, id: b.id, time: b.time, item: b }))
                ].sort((a, b) => a.time.localeCompare(b.time));

                if (combined.length === 0) {
                  return <p className="text-xs text-slate-400 italic py-2">Não há nenhum agendamento ou bloqueio registrado para este dia.</p>;
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {combined.map((item, idx) => {
                      if (item.type === 'booking') {
                        const b = item.item as Booking;
                        return (
                          <div
                            key={`${b.id}-${idx}`}
                            onClick={() => setSelectedBooking(b)}
                            className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col justify-between hover:shadow-sm hover:border-amber-300 cursor-pointer transition-all relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {b.time} - {b.endTime}
                              </span>
                              <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border ${getStatusColor(b.status)}`}>
                                {getStatusLabel(b.status)}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-sky-950 truncate">{b.clientName}</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{b.serviceName} com {b.professionalName}</p>
                          </div>
                        );
                      } else {
                        const block = item.item as any;
                        const profName = block.professionalId === 'all' ? 'Todos' : (professionals.find(p => p.id === block.professionalId)?.name || 'Profissional');
                        return (
                          <div
                            key={`${block.id}-${idx}`}
                            className="bg-rose-50/40 border border-rose-100 rounded-xl p-3 flex flex-col justify-between transition-all relative overflow-hidden text-left"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> {block.time} - {block.endTime}
                              </span>
                              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border bg-rose-100 text-rose-700 border-rose-200">
                                Bloqueio
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-rose-950 truncate">{block.reason}</h5>
                            <p className="text-[11px] text-rose-500 mt-0.5 truncate">Bloqueado para: {profName}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteBlock(block.id);
                              }}
                              className="text-[9px] font-bold text-rose-700 hover:text-rose-900 mt-2 text-right uppercase hover:underline cursor-pointer"
                            >
                              Remover Bloqueio
                            </button>
                          </div>
                        );
                      }
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* SEARCH VIEW */}
        {agendaView === 'search' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Advanced Search Form Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <span className="p-1.5 bg-sky-100 text-[#2B4C7E] rounded-lg">
                  <Filter className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-sky-950 font-serif">Filtro de Pesquisa de Agendamentos</h3>
                  <p className="text-[10px] text-slate-500">Defina os parâmetros abaixo e clique em "Filtrar" para pesquisar na base de dados.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* 1. Campo Período */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">PERÍODO</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormPeriodDropdownOpen(!isFormPeriodDropdownOpen);
                        setIsFormProfDropdownOpen(false);
                        setIsFormServiceDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#2B4C7E]" />
                        {getPeriodLabel(formPeriod)}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    
                    {isFormPeriodDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 max-h-56 overflow-y-auto">
                        {periodOptions.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setFormPeriod(opt.value);
                              setIsFormPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              formPeriod === opt.value
                                ? 'bg-[#F0F4F8] text-[#2B4C7E] font-bold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Date Inputs if "Outro período" is selected */}
                  {formPeriod === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 mt-2 animate-in slide-in-from-top-1 duration-150">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">INÍCIO</label>
                        <input
                          type="date"
                          value={formStartDate}
                          onChange={(e) => setFormStartDate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#2B4C7E]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">FIM</label>
                        <input
                          type="date"
                          value={formEndDate}
                          onChange={(e) => setFormEndDate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#2B4C7E]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Campo Nome da cliente */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">NOME DA CLIENTE</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nome..."
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-sky-950 focus:outline-none focus:ring-1 focus:ring-[#2B4C7E]"
                    />
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* 3. Campo Contém observação */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">CONTÉM OBSERVAÇÃO</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Texto na observação..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-sky-950 focus:outline-none focus:ring-1 focus:ring-[#2B4C7E]"
                    />
                    <MessageCircle className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* 4. Campo Selecionar profissional (Multi-select) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">PROFISSIONAIS</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormProfDropdownOpen(!isFormProfDropdownOpen);
                        setIsFormServiceDropdownOpen(false);
                        setIsFormPeriodDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer border-solid"
                    >
                      <span className="flex items-center gap-1.5 truncate pr-2">
                        <User className="w-3.5 h-3.5 text-[#2B4C7E]" />
                        <span className="truncate">
                          {formSelectedProfs.length === 0
                            ? 'Todos os Profissionais'
                            : `${formSelectedProfs.length} selecionado(s)`}
                        </span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                    
                    {isFormProfDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 max-h-60 overflow-y-auto space-y-2 border-solid">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[9px] font-bold text-slate-400">SELECIONAR</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setFormSelectedProfs(activeProfessionals.map(p => p.id))}
                              className="text-[9px] text-[#2B4C7E] font-bold hover:underline cursor-pointer"
                            >
                              Todos
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => setFormSelectedProfs([])}
                              className="text-[9px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Limpar
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {activeProfessionals.map(p => {
                            const isChecked = formSelectedProfs.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setFormSelectedProfs(formSelectedProfs.filter(id => id !== p.id));
                                    } else {
                                      setFormSelectedProfs([...formSelectedProfs, p.id]);
                                    }
                                  }}
                                  className="rounded text-[#2B4C7E] focus:ring-[#2B4C7E] w-3.5 h-3.5 border-slate-300 cursor-pointer"
                                />
                                <span className="truncate">{p.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Campo Selecionar serviço (Multi-select) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">SERVIÇOS</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormServiceDropdownOpen(!isFormServiceDropdownOpen);
                        setIsFormProfDropdownOpen(false);
                        setIsFormPeriodDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer border-solid"
                    >
                      <span className="flex items-center gap-1.5 truncate pr-2">
                        <Filter className="w-3.5 h-3.5 text-[#2B4C7E]" />
                        <span className="truncate">
                          {formSelectedServices.length === 0
                            ? 'Todos os Serviços'
                            : `${formSelectedServices.length} selecionado(s)`}
                        </span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                    
                    {isFormServiceDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 max-h-60 overflow-y-auto space-y-2 border-solid">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[9px] font-bold text-slate-400">SELECIONAR</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setFormSelectedServices(activeServices.map(s => s.id))}
                              className="text-[9px] text-[#2B4C7E] font-bold hover:underline cursor-pointer"
                            >
                              Todos
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => setFormSelectedServices([])}
                              className="text-[9px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Limpar
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {activeServices.map(s => {
                            const isChecked = formSelectedServices.includes(s.id);
                            return (
                              <label key={s.id} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setFormSelectedServices(formSelectedServices.filter(id => id !== s.id));
                                    } else {
                                      setFormSelectedServices([...formSelectedServices, s.id]);
                                    }
                                  }}
                                  className="rounded text-[#2B4C7E] focus:ring-[#2B4C7E] w-3.5 h-3.5 border-slate-300 cursor-pointer"
                                />
                                <span className="truncate">{s.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Campo Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">STATUS DO AGENDAMENTO</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2B4C7E] cursor-pointer"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pago">Status: Pago 🟢</option>
                    <option value="pendente">Status: Pendente de Pagamento 🟡</option>
                    <option value="agendado">Atendimento: Agendado 🔵</option>
                    <option value="confirmado">Atendimento: Confirmado 🟢</option>
                    <option value="em_atendimento">Atendimento: Em Atendimento 🟠</option>
                    <option value="finalizado">Atendimento: Finalizado ⚫</option>
                    <option value="cancelado">Atendimento: Cancelado ⚪</option>
                    <option value="faltou">Atendimento: Faltou 🔴</option>
                    <option value="reagendado">Atendimento: Reagendado 🟣</option>
                  </select>
                </div>

                {/* 7. Campo Ordem */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">ORDEM DE EXIBIÇÃO</label>
                  <select
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2B4C7E] cursor-pointer"
                  >
                    <option value="datetime_asc">Data e Hora Crescente 📅 ⬆️</option>
                    <option value="datetime_desc">Data e Hora Decrescente 📅 ⬇️</option>
                    <option value="value_asc">Valor do Serviço Crescente 💵 ⬆️</option>
                    <option value="value_desc">Valor do Serviço Decrescente 💵 ⬇️</option>
                    <option value="client_asc">Nome do Cliente (A-Z) 👤 ⬆️</option>
                  </select>
                </div>

                {/* 8. Botão Filtrar e Botão Limpar */}
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="flex-1 py-2 bg-[#2B4C7E] hover:bg-[#1E355B] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Filtrar 🔍
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    title="Resetar Filtros"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </div>

            {/* Results Header Info */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-sm font-bold text-sky-950 font-serif">
                  Resultados da Pesquisa ({searchResults.length})
                </h4>
                <p className="text-[10px] text-slate-400">
                  Período ativo: <span className="font-bold text-slate-600">{getPeriodLabel(searchPeriod)}</span>
                  {searchPeriod === 'custom' && ` (${searchStartDate.split('-').reverse().join('/')} até ${searchEndDate.split('-').reverse().join('/')})`}
                </p>
              </div>
            </div>

            {/* Results Grid List */}
            {searchResults.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h5 className="text-sm font-bold text-slate-700">Nenhum agendamento encontrado</h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Tente alterar os termos da busca, ampliar o período ou remover alguns filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map((b, idx) => (
                  <div
                    key={`${b.id}-${idx}`}
                    onClick={() => setSelectedBooking(b)}
                    className={`border rounded-2xl p-4 bg-white hover:border-amber-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-3 ${
                      b.status === 'finalizado' ? 'opacity-85 border-slate-200 bg-slate-50/40' : 'border-slate-100'
                    }`}
                  >
                    {/* Left visual strip */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      b.status === 'agendado' ? 'bg-sky-500' :
                      b.status === 'confirmado' ? 'bg-emerald-500' :
                      b.status === 'em_atendimento' ? 'bg-amber-500' :
                      b.status === 'finalizado' ? 'bg-slate-400' : 'bg-rose-500'
                    }`} />

                    <div className="pl-1.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          📅 {b.date.split('-').reverse().join('/')} às {b.time}
                        </span>
                        <div className="flex gap-1.5">
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border ${getStatusColor(b.status)}`}>
                            {getStatusLabel(b.status)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-sky-950 flex items-center gap-1">
                          👤 {b.clientName}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{b.clientPhone}</p>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg space-y-1 text-[11px] text-slate-600 border border-slate-100">
                        <p className="font-semibold text-slate-700">💈 {b.serviceName}</p>
                        <p className="text-[10px]">👤 Profissional: <span className="font-medium text-slate-800">{b.professionalName}</span></p>
                      </div>

                      {b.obs && (
                        <p className="text-[10px] text-slate-500 italic bg-amber-50/50 p-1.5 rounded border border-[#E2E8F0] line-clamp-2">
                          💬 "{b.obs}"
                        </p>
                      )}
                    </div>

                    <div className="pl-1.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-800">{formatBRL(b.value)}</span>
                        <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border ${
                          b.isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {b.isPaid ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#2B4C7E] hover:underline uppercase tracking-wider flex items-center gap-0.5">
                        Opções & Caixa &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL: Booking Details & Option Actions */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl shadow-2xl border-0 md:border border-slate-100 flex flex-col overflow-hidden animate-in fade-in md:zoom-in-95 duration-150">
            
            <div className="flex justify-between items-start border-b border-slate-100 px-6 py-4 shrink-0 pt-[calc(1.25rem+env(safe-area-inset-top))] md:pt-6">
              <div>
                <h3 className="text-lg font-serif font-bold text-sky-950">Detalhes do Agendamento</h3>
                <p className="text-xs text-slate-400">ID: {selectedBooking.id}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 text-lg min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Core Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">CLIENTE</span>
                  <p className="font-bold text-sky-950 text-sm">{selectedBooking.clientName}</p>
                  <p className="text-slate-500 font-mono">{selectedBooking.clientPhone}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">PROFISSIONAL</span>
                  <p className="font-bold text-sky-950 text-sm">{selectedBooking.professionalName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">SERVIÇO</span>
                  <p className="font-bold text-sky-950 text-sm">{selectedBooking.serviceName}</p>
                  <p className="text-slate-400">Preço: {formatBRL(selectedBooking.value)} / {selectedBooking.duration} min</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">HORÁRIO</span>
                  <p className="font-bold text-sky-950 text-sm">{selectedBooking.time} às {selectedBooking.endTime}</p>
                  <p className="text-slate-400">Data: {selectedBooking.date.split('-').reverse().join('/')}</p>
                </div>
              </div>

              {selectedBooking.obs && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-500 block mb-1">Observações Internas:</span>
                  <p className="text-slate-700 italic">"{selectedBooking.obs}"</p>
                </div>
              )}

              {/* Paid Receipts display if finalizado */}
              {selectedBooking.isPaid && selectedBooking.paymentDetails && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-700 flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-600" /> ATENDIMENTO FINALIZADO & PAGO
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono">
                    <p>Forma Pagamento: {selectedBooking.paymentDetails.method}</p>
                    <p>Bruto Procedimento: {formatBRL(selectedBooking.value)}</p>
                    {selectedBooking.paymentDetails.discount > 0 && (
                      <p className="text-rose-600">Desconto Proc: -{formatBRL(selectedBooking.paymentDetails.discount)}</p>
                    )}
                    {selectedBooking.paymentDetails.productsSold.length > 0 && (
                      <p className="col-span-2">Produtos: {selectedBooking.paymentDetails.productsSold.map(p => `${p.name} (x${p.quantity})`).join(', ')}</p>
                    )}
                    <p className="col-span-2 font-bold text-sky-950">Bruto Total: {formatBRL(selectedBooking.paymentDetails.gross)}</p>
                    <p className="text-slate-500">Taxas do Cartão: {formatBRL(selectedBooking.paymentDetails.fee)}</p>
                    <p className="font-bold text-emerald-700">Valor Líquido: {formatBRL(selectedBooking.paymentDetails.net)}</p>
                    <p className="text-amber-700">Comissão Prof: {formatBRL(selectedBooking.paymentDetails.commission, true)}</p>
                  </div>
                </div>
              )}

              {/* Interactive Actions Panel */}
              {!selectedBooking.isPaid && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ações Operacionais</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmado')}
                      className="p-3 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs hover:bg-emerald-100 cursor-pointer min-h-[44px] active:scale-95 transition-transform"
                    >
                      Confirmar Presença
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'em_atendimento')}
                      className="p-3 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs hover:bg-amber-100 cursor-pointer min-h-[44px] active:scale-95 transition-transform"
                    >
                      Iniciar Atendimento
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'faltou')}
                      className="p-3 border border-rose-200 bg-rose-50 text-rose-700 rounded-xl font-bold text-xs hover:bg-rose-100 cursor-pointer min-h-[44px] active:scale-95 transition-transform"
                    >
                      Marcar que Faltou
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelado')}
                      className="p-3 border border-slate-200 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 cursor-pointer min-h-[44px] active:scale-95 transition-transform"
                    >
                      Cancelar Horário
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    {currentUser?.role !== 'profissional' && (
                      <button
                        onClick={handleOpenCheckout}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer border border-emerald-500/10 min-h-[44px] active:scale-95 transition-transform"
                      >
                        <DollarSign className="w-4 h-4" /> Finalizar e Cobrar (Checkout)
                      </button>
                    )}

                    <button
                      onClick={() => triggerWhatsApp(selectedBooking)}
                      className="py-3 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 text-slate-600 cursor-pointer min-h-[44px] active:scale-95 transition-transform"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-500/10" /> Mandar WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-white shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-6">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer min-h-[40px] w-full md:w-auto"
              >
                Voltar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Checkout / Atendimento Finalização */}
      {isCheckoutOpen && selectedBooking && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
          <div className="bg-white w-[96%] max-w-lg h-auto max-h-[82vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-start border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h3 className="text-sm md:text-base font-serif font-bold text-sky-950">Atendimento / Finalização de Caixa</h3>
                <p className="text-[10px] md:text-xs text-slate-400">Registrar pagamento da cliente: {selectedBooking.clientName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-lg min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Check Cashier warning */}
              {!cashier.isOpen && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">CAIXA DO DIA FECHADO</p>
                    <p>Você precisa abrir o caixa no painel de finanças ("Caixa do Dia") antes de concluir cobranças de atendimentos.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
              
              {/* Service details */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex justify-between items-center font-bold text-slate-700">
                  <span>Procedimento Realizado:</span>
                  <span>{formatBRL(selectedBooking.value)}</span>
                </div>
                <p className="text-slate-500 mt-0.5">{selectedBooking.serviceName} com {selectedBooking.professionalName}</p>
              </div>

              {/* Retail products additions */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">Adicionar Produtos Vendidos</label>
                <select
                  onChange={(e) => {
                    handleAddProductToCheckout(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600"
                >
                  <option value="">-- Selecione um produto para acrescentar --</option>
                  {products
                    .filter(p => p.quantity > 0)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatBRL(p.price)} (Estoque: {p.quantity})
                      </option>
                    ))}
                </select>

                {/* Added products cart list */}
                {checkoutProducts.length > 0 && (
                  <div className="border border-slate-100 rounded-xl p-2 space-y-1.5 bg-sky-50/20">
                    {checkoutProducts.map(cp => {
                      const details = products.find(p => p.id === cp.id);
                      if (!details) return null;
                      return (
                        <div key={cp.id} className="flex items-center justify-between text-xs p-1">
                          <span className="text-slate-700 font-medium truncate max-w-[180px]">{details.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-500">x{cp.quantity} ({formatBRL(details.price * cp.quantity)})</span>
                            <button
                              onClick={() => handleRemoveProductFromCheckout(cp.id)}
                              className="text-rose-500 font-semibold hover:underline"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Financial Inputs: Discounts, Added, method */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Desconto em Serviço (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={checkoutDiscount}
                    onChange={(e) => setCheckoutDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Desconto em Produto (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={checkoutDiscountProducts}
                    onChange={(e) => setCheckoutDiscountProducts(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Acréscimos (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={checkoutAddedValue}
                    onChange={(e) => setCheckoutAddedValue(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Forma de Pagamento</label>
                  <select
                    value={checkoutPaymentMethod}
                    onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold"
                  >
                    {Object.keys(settings.cardFees || {}).map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-600 block">Observações do Atendimento / Checkout</label>
                <input
                  type="text"
                  placeholder="Ex: Utilizou esmalte importado, quer manutenção extra"
                  value={checkoutObs}
                  onChange={(e) => setCheckoutObs(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs"
                />
              </div>

              {/* Real-time Math Summary calculation */}
              {(() => {
                const srvPrice = selectedBooking.value;
                const prodPriceSum = checkoutProducts.reduce((sum, cp) => {
                  const details = products.find(p => p.id === cp.id);
                  return sum + (details ? details.price * cp.quantity : 0);
                }, 0);

                const finalSrv = Math.max(0, srvPrice - checkoutDiscount);
                const finalProd = Math.max(0, prodPriceSum - checkoutDiscountProducts);
                const grossTotal = finalSrv + finalProd + checkoutAddedValue;

                const cardFeeRate = settings.cardFees[checkoutPaymentMethod] || 0;
                const feeValue = Number(((grossTotal * cardFeeRate) / 100).toFixed(2));
                const netValue = Number((grossTotal - feeValue).toFixed(2));

                const srvObj = services.find(s => s.id === selectedBooking.serviceId);
                const srvCommissionRate = srvObj?.commission ?? 40;
                const productCost = srvObj?.productCost ?? 0;
                const serviceValueForCommission = Math.max(0, finalSrv - productCost);
                const commissionDue = Number(((serviceValueForCommission * srvCommissionRate) / 100).toFixed(2));

                return (
                  <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-sky-950 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Resumo Financeiro Líquido
                    </h4>
                    <div className="grid grid-cols-2 gap-y-1 text-slate-600 font-mono">
                      <span>Valor Serviços Líquido:</span>
                      <span className="text-right">{formatBRL(finalSrv)}</span>
                      {productCost > 0 && (
                        <>
                          <span className="text-rose-600">Custo Insumo (Não comissionável):</span>
                          <span className="text-right text-rose-600">-{formatBRL(productCost)}</span>
                        </>
                      )}
                      <span>Valor Produtos Líquido:</span>
                      <span className="text-right">{formatBRL(finalProd)}</span>
                      {checkoutAddedValue > 0 && (
                        <>
                          <span>Acréscimos extras:</span>
                          <span className="text-right">{formatBRL(checkoutAddedValue)}</span>
                        </>
                      )}
                      <div className="col-span-2 border-t border-slate-200 my-1.5" />
                      <span className="font-bold text-sky-950">VALOR BRUTO TOTAL:</span>
                      <span className="font-bold text-sky-950 text-right">{formatBRL(grossTotal)}</span>
                      
                      {cardFeeRate > 0 && (
                        <>
                          <span className="text-slate-400">Taxa {checkoutPaymentMethod} ({cardFeeRate}%):</span>
                          <span className="text-slate-400 text-right">-{formatBRL(feeValue)}</span>
                        </>
                      )}
                      
                      <span className="font-bold text-emerald-700">VALOR LÍQUIDO NO CAIXA:</span>
                      <span className="font-bold text-emerald-700 text-right">{formatBRL(netValue)}</span>

                      <span className="font-medium text-amber-800">Comissão da Profissional ({srvCommissionRate}%):</span>
                      <span className="font-medium text-amber-800 text-right">{formatBRL(commissionDue)}</span>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center pt-2 italic">
                      Ao confirmar, o caixa será incrementado, o estoque será debitado e as metas de manutenção serão recalculadas.
                    </p>
                  </div>
                );
              })()}

            </div>

          </div>
          
          <div className="flex gap-2 justify-end border-t border-slate-100 px-6 py-4 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl cursor-pointer min-h-[38px] flex items-center justify-center flex-1 sm:flex-none sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmCheckout}
              disabled={!cashier.isOpen || isCheckoutSubmitting}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer min-h-[38px] flex items-center justify-center flex-1 sm:flex-none sm:w-auto ${
                cashier.isOpen && !isCheckoutSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isCheckoutSubmitting ? 'Processando...' : 'Confirmar e Baixar Caixa'}
            </button>
          </div>

        </div>
      </div>
    )}

      {/* MODAL: New Appointment Form */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
          <div 
            style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
            className="bg-white w-[96%] max-w-lg md:max-w-xl h-auto max-h-[82vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative transition-transform duration-75 ease-out"
          >
            
            <div 
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                const target = e.target as HTMLElement;
                if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) return;
                setIsDragging(true);
                dragStartRef.current = {
                  x: e.clientX - dragOffset.x,
                  y: e.clientY - dragOffset.y
                };
              }}
              onTouchStart={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) return;
                setIsDragging(true);
                dragStartRef.current = {
                  x: e.touches[0].clientX - dragOffset.x,
                  y: e.touches[0].clientY - dragOffset.y
                };
              }}
              className="flex justify-between items-start border-b border-slate-100 px-6 py-4 shrink-0 cursor-grab active:cursor-grabbing hover:bg-slate-50/50 transition-colors select-none"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-mono select-none">✥</span>
                  <h3 className="text-sm md:text-base font-serif font-bold text-sky-950">Novo Agendamento</h3>
                </div>
                <p className="text-[10px] md:text-[11px] text-slate-400">
                  Data: {selectedDate.split('-').reverse().join('/')} <span className="hidden sm:inline text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1 font-medium">(Arraste para mover)</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBookingOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-lg min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {formError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2 rounded-lg font-semibold">
                    {formError}
                  </div>
                )}
              
              {/* Client Selector (with New Client option) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600">Cliente</label>
                  <button
                    type="button"
                    onClick={() => setIsRegisteringNewClient(!isRegisteringNewClient)}
                    className="text-xs text-sky-700 font-bold hover:underline"
                  >
                    {isRegisteringNewClient ? 'Selecionar Existente' : '+ Cadastrar Nova'}
                  </button>
                </div>

                {isRegisteringNewClient ? (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="col-span-2 text-[10px] text-slate-400 font-mono uppercase tracking-wide">Cadastro Rápido de Cliente</div>
                    <input
                      type="text"
                      placeholder="Nome Completo"
                      required
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="WhatsApp (com DDD)"
                      required
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none col-span-2"
                    />
                  </div>
                ) : (
                  <select
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none"
                  >
                    <option value="">-- Escolha a cliente --</option>
                    {clients
                      .filter(c => c.status === 'ativo')
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                  </select>
                )}
              </div>

              {/* LIST OF SERVICES & PROFESSIONALS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Serviços & Profissionais Selecionados ({newItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoChainSchedules}
                    className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                    title="Ajusta o horário de início de cada serviço para começar exatamente quando o anterior terminar"
                  >
                    🔄 Auto-ajustar Sequência
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {newItems.map((item, index) => {
                    return (
                      <div key={index} className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl relative space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-[#2B4C7E] bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                            Serviço #{index + 1}
                          </span>
                          {newItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-xs text-rose-600 font-bold hover:underline"
                            >
                              Remover
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Service selector */}
                          <div className="space-y-1 relative" id={`service-selector-container-${index}`}>
                            <label className="font-semibold text-slate-600 block">Serviço</label>
                            <div className="space-y-1 relative">
                              <input
                                type="text"
                                placeholder="🔍 Pesquisar serviço..."
                                value={getServiceSearchValue(index, item.serviceId)}
                                onChange={(e) => handleServiceSearchChange(index, e.target.value)}
                                onFocus={() => setIsServiceDropdownOpen(prev => ({ ...prev, [index]: true }))}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setIsServiceDropdownOpen(prev => ({ ...prev, [index]: false }));
                                  }, 200);
                                }}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-950"
                              />
                              
                              {isServiceDropdownOpen[index] && (
                                <div className="absolute left-0 right-0 z-40 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 space-y-0.5 text-xs">
                                  {(() => {
                                    const q = (serviceSearchQueries[index] || '').toLowerCase().trim();
                                    const filtered = activeServices.filter(s => 
                                      !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
                                    );
                                    if (filtered.length === 0) {
                                      return <div className="p-2 text-slate-400 text-center italic">Nenhum serviço encontrado</div>;
                                    }
                                    return filtered.map(s => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onMouseDown={() => {
                                          handleUpdateItem(index, { serviceId: s.id });
                                          handleServiceSearchChange(index, s.name);
                                          setIsServiceDropdownOpen(prev => ({ ...prev, [index]: false }));
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex justify-between items-center cursor-pointer ${
                                          item.serviceId === s.id
                                            ? 'bg-sky-50 text-sky-950 font-semibold'
                                            : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        <div className="text-left">
                                          <div className="font-semibold text-[11px]">{s.name}</div>
                                          <div className="text-[9px] text-slate-400 font-medium">{s.category}</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="font-mono font-bold text-[10px] text-sky-950">{formatBRL(s.price)}</div>
                                          <div className="text-[9px] text-slate-400 font-medium">{s.duration} min</div>
                                        </div>
                                      </button>
                                    ));
                                  })()}
                                </div>
                              )}

                              <select
                                value={item.serviceId}
                                required
                                onChange={(e) => {
                                  handleUpdateItem(index, { serviceId: e.target.value });
                                  const srv = services.find(s => s.id === e.target.value);
                                  if (srv) {
                                    handleServiceSearchChange(index, srv.name);
                                  }
                                }}
                                className="w-full text-[11px] bg-slate-50/50 border border-slate-100 rounded-xl px-2.5 py-1 text-slate-400 focus:outline-none pointer-events-none"
                              >
                                <option value="">-- Escolha o serviço --</option>
                                {activeServices.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.duration} min - {formatBRL(s.price)})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Professional selector */}
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-600 block">Profissional</label>
                            <select
                              value={item.professionalId}
                              required
                              onChange={(e) => handleUpdateItem(index, { professionalId: e.target.value })}
                              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-600 focus:outline-none"
                            >
                              <option value="">-- Escolha o profissional --</option>
                              {activeProfessionals
                                .filter(p => {
                                  if (!item.serviceId) return true;
                                  return p.services.includes(item.serviceId);
                                })
                                .map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                          </div>

                          {/* Time selection */}
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-600 block">Horário de Início</label>
                            <input
                              type="time"
                              required
                              value={item.time}
                              onChange={(e) => handleUpdateItem(index, { time: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                            />
                          </div>

                          {/* Summary / Duration calculation for this item */}
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-600 block">Duração & Término Estimados</label>
                            <div className="px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium text-xs">
                              {item.serviceId ? (
                                <>
                                  {item.duration} min &rarr; Termina às{' '}
                                  <strong>{addMinutesToTime(item.time, item.duration)}</strong>
                                </>
                              ) : (
                                'Selecione o serviço'
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex-1 py-2 border border-dashed border-sky-300 hover:bg-sky-50/50 text-sky-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    + Adicionar Outro Serviço
                  </button>
                </div>
              </div>

              {/* General Sum total */}
              {newItems.length > 0 && (
                <div className="p-3 bg-sky-50/30 border border-sky-100 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Total do Agendamento:</span>
                  <div className="text-right">
                    <p className="font-bold text-sky-950">
                      {newItems.length} {newItems.length === 1 ? 'Serviço' : 'Serviços'} |{' '}
                      {formatBRL(newItems.reduce((acc, cur) => acc + cur.value, 0))}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Duração Total: {newItems.reduce((acc, cur) => acc + cur.duration, 0)} minutos
                    </p>
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-600 block">Observações do Agendamento</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Quer alongamento arredondado, observações para toda a equipe"
                  value={newObs}
                  onChange={(e) => setNewObs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none"
                />
              </div>

              {/* Schedule conflict warning */}
              {showConflictConfirm && conflictsList.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 space-y-1">
                      <p className="font-bold">⚠️ Conflitos de Horário Detectados!</p>
                      <p className="leading-relaxed">
                        Os seguintes profissionais já possuem agendamentos ou bloqueios cobrindo estes períodos:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 mt-1 font-semibold text-amber-950">
                        {conflictsList.map((conflict, idx) => (
                          <li key={idx}>
                            {conflict.professionalName} ({conflict.serviceName}) das {conflict.time} às {conflict.endTime}
                          </li>
                        ))}
                      </ul>
                      <p className="pt-2 italic text-[10px]">
                        Por segurança, o sistema não permite duplicidade. Ajuste os horários para continuar.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowConflictConfirm(false);
                        setConflictsList([]);
                      }}
                      className="px-3.5 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold text-xs rounded-lg hover:bg-amber-100 transition-all cursor-pointer"
                    >
                      Ajustar horários
                    </button>
                  </div>
                </div>
              )}

              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 justify-end border-t border-slate-100 px-6 py-4 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewBookingOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl cursor-pointer min-h-[38px] flex items-center justify-center flex-1 sm:flex-none sm:w-auto"
                >
                  Cancelar
                </button>
                {!showConflictConfirm && (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#2B4C7E] hover:bg-[#1E355B] text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer min-h-[38px] flex items-center justify-center flex-1 sm:flex-none sm:w-auto"
                  >
                    Confirmar Agendamento
                  </button>
                )}
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: Bloqueio de Agenda */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-2xl shadow-2xl border-0 md:border border-slate-100 flex flex-col overflow-hidden animate-in fade-in md:zoom-in-95 duration-150">
            
            <div className="flex justify-between items-start border-b border-slate-100 px-6 py-4 shrink-0 pt-[calc(1.25rem+env(safe-area-inset-top))] md:pt-6">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-base font-serif font-bold text-sky-950">Bloquear Agenda</h3>
                  <p className="text-xs text-slate-400">Restringir horários na grade da equipe</p>
                </div>
              </div>
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-lg min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {blockError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
                    {blockError}
                  </div>
                )}
              {/* Professional selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Profissional</label>
                <select
                  value={blockProfId}
                  onChange={(e) => setBlockProfId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none"
                >
                  <option value="all">Todos os Profissionais</option>
                  {activeProfessionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Date selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Data</label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none"
                />
              </div>

              {/* Time selection */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 block">Horário de Início</label>
                  <input
                    type="time"
                    required
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 block">Horário de Término</label>
                  <input
                    type="time"
                    required
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">Motivo do Bloqueio</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Almoço', 'Folga', 'Médico', 'Reunião', 'Curso', 'Outro'].map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setBlockReason(reason)}
                      className={`text-xs py-1.5 rounded-lg font-semibold border transition-all ${
                        blockReason === reason
                          ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-3xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                {blockReason === 'Outro' && (
                  <input
                    type="text"
                    required
                    placeholder="Especifique o motivo do bloqueio..."
                    value={blockCustomReason}
                    onChange={(e) => setBlockCustomReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none"
                  />
                )}
              </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end border-t border-slate-100 px-6 py-4 bg-white shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-6">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl cursor-pointer min-h-[40px] flex items-center justify-center w-full md:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 w-full md:w-auto min-h-[40px]"
                >
                  <Lock className="w-3.5 h-3.5" /> Confirmar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
