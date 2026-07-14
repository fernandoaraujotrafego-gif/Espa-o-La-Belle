/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole, UserPermissions } from '../types';
import {
  Settings as SettingsIcon,
  Save,
  MessageCircle,
  Percent,
  Clock,
  Briefcase,
  AlertCircle,
  Sparkles,
  DollarSign,
  User as UserIcon,
  Users,
  Shield,
  ShieldAlert,
  Calendar,
  Lock,
  Unlock,
  Check,
  Plus,
  Trash2,
  FileText,
  Smartphone,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Layers,
  Tag,
  Database,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  CheckCircle,
  XCircle,
  BellRing,
  Send,
  Copy,
  Trash,
  Key,
  Laptop,
  Server
} from 'lucide-react';

export default function Configuracoes() {
  const {
    settings,
    updateSettings,
    users,
    addUser,
    updateUser,
    deleteUser,
    professionals,
    services,
    addService,
    updateService,
    deleteService,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    backupsList,
    createBackup,
    restoreBackup,
    deleteBackup,
    backupSettings,
    setBackupSettings,
    currentUser,
    fcmTokensList,
    pushNotificationsList,
    registerFCMToken,
    deleteFCMToken,
    sendPushNotification,
    clearNotificationsLedger
  } = useApp();

  const [activeTab, setActiveTab] = useState<'salon' | 'finance' | 'maintenance' | 'users' | 'backup' | 'push'>('salon');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Backups UI states
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupTabStatusMessage, setBackupTabStatusMessage] = useState('');
  const [backupTabErrorMessage, setBackupTabErrorMessage] = useState('');

  const handleRestoreFromFirestore = async (backupId: string) => {
    if (!confirm('Deseja realmente restaurar os dados do sistema a partir deste backup? Todas as informações atuais serão sobrescritas.')) {
      return;
    }
    setIsRestoring(true);
    setBackupTabStatusMessage('Buscando payload do backup no Firestore...');
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      const docRef = doc(db, 'backups', backupId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.payload && data.payload.startsWith('{')) {
          const parsed = JSON.parse(data.payload);
          const success = await restoreBackup(parsed);
          if (success) {
            setBackupTabStatusMessage('');
            alert('Dados restaurados com sucesso!');
          }
        } else if (data.fileUrl) {
          setBackupTabStatusMessage('Baixando backup do Storage...');
          const res = await fetch(data.fileUrl);
          const parsed = await res.json();
          const success = await restoreBackup(parsed);
          if (success) {
            setBackupTabStatusMessage('');
            alert('Dados restaurados com sucesso!');
          }
        } else {
          throw new Error('Payload do backup não encontrado neste documento.');
        }
      } else {
        throw new Error('Documento de backup não encontrado.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao restaurar backup: ' + (err.message || err));
    } finally {
      setIsRestoring(false);
      setBackupTabStatusMessage('');
    }
  };

  const handleDownloadFromFirestore = async (backup: any) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      const docRef = doc(db, 'backups', backup.id);
      const docSnap = await getDoc(docRef);
      let jsonString = '';
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.payload && data.payload.startsWith('{')) {
          jsonString = data.payload;
        } else if (data.fileUrl) {
          const res = await fetch(data.fileUrl);
          jsonString = await res.text();
        }
      }
      if (jsonString) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_labelle_${backup.type}_${backup.id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert('Não foi possível obter os dados do backup.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao baixar arquivo de backup: ' + (err.message || err));
    }
  };

  const handleLocalBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.version || !parsed.data) {
          throw new Error('Arquivo JSON não possui a assinatura de formato de backup do Espaço La Belle.');
        }
        if (confirm(`Deseja restaurar o backup local de ${new Date(parsed.timestamp).toLocaleString('pt-BR')}? Todas as informações atuais serão substituídas.`)) {
          setIsRestoring(true);
          const success = await restoreBackup(parsed);
          if (success) {
            alert('Dados importados com sucesso a partir do arquivo local!');
          }
        }
      } catch (err: any) {
        alert('Erro ao processar arquivo de backup: ' + (err.message || err));
      } finally {
        setIsRestoring(false);
        if (e.target) e.target.value = ''; // reset file input
      }
    };
    reader.readAsText(file);
  };

  // Tab 1: Salon & Business Hours
  const [formSalName, setFormSalName] = useState(settings.salonName || settings.name || 'Espaço La Belle');
  const [formSalPhone, setFormSalPhone] = useState(() => {
    const ph = settings.salonPhone || settings.phone;
    return ph === '(11) 99999-8888' ? '(21) 99095-5002' : (ph || '(21) 99095-5002');
  });
  const [formSalAddress, setFormSalAddress] = useState(settings.salonAddress || settings.address || 'Rua das Flores, 789 - Jardins, São Paulo - SP');
  const [formSalCNPJ, setFormSalCNPJ] = useState(settings.salonCNPJ || '45.123.890/0001-22');
  const [formSalLogoEmoji, setFormSalLogoEmoji] = useState(settings.logoEmoji || '✨');
  const [hoursOpen, setHoursOpen] = useState(settings.businessHours?.start || '09:00');
  const [hoursClose, setHoursClose] = useState(settings.businessHours?.end || '19:00');

  const [logoType, setLogoType] = useState<'emoji' | 'image'>(() => {
    const lg = settings.logo || '';
    if (lg.startsWith('http') || lg.startsWith('/') || lg.length > 4) {
      return 'image';
    }
    return 'emoji';
  });
  const [formSalLogoUrl, setFormSalLogoUrl] = useState(() => {
    const lg = settings.logo || '';
    if (lg.startsWith('http') || lg.startsWith('/') || lg.length > 4) {
      return lg;
    }
    return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=120&auto=format&fit=crop&q=60';
  });
  const [workingHours, setWorkingHours] = useState<Record<string, { isOpen: boolean; start: string; end: string }>>(() => {
    return settings.workingHours || {
      Monday: { isOpen: false, start: '09:00', end: '18:00' },
      Tuesday: { isOpen: true, start: '09:00', end: '19:00' },
      Wednesday: { isOpen: true, start: '09:00', end: '19:00' },
      Thursday: { isOpen: true, start: '09:00', end: '19:00' },
      Friday: { isOpen: true, start: '09:00', end: '19:00' },
      Saturday: { isOpen: true, start: '09:00', end: '19:00' },
      Sunday: { isOpen: false, start: '09:00', end: '14:00' }
    };
  });

  // Tab 2: Finance, Fees & Commissions
  const [paymentMethodsList, setPaymentMethodsList] = useState<Array<{ id: string; name: string; fee: number }>>(() => {
    return Object.entries(settings.cardFees || {}).map(([name, fee], idx) => ({
      id: `${idx}-${name}`,
      name,
      fee
    }));
  });

  const handleUpdateMethod = (id: string, field: 'name' | 'fee', value: any) => {
    setPaymentMethodsList(prev => prev.map(m => {
      if (m.id === id) {
        if (field === 'fee') {
          return { ...m, fee: Math.max(0, Number(value)) };
        }
        return { ...m, name: value };
      }
      return m;
    }));
  };

  const handleDeleteMethod = (id: string) => {
    setPaymentMethodsList(prev => prev.filter(m => m.id !== id));
  };

  const handleAddMethod = () => {
    const id = `${Date.now()}-${Math.random()}`;
    setPaymentMethodsList(prev => [...prev, { id, name: 'Nova Forma', fee: 0 }]);
  };

  const [defaultCommission, setDefaultCommission] = useState(settings.defaultCommission || 50);
  const [categoryCommissions, setCategoryCommissions] = useState<Record<string, number>>(settings.categoryCommissions || {
    'Unhas': 50,
    'Cílios': 40,
    'Sobrancelhas': 45,
    'Cabelo': 60,
    'Estética': 40
  });

  // Tab 3: Maintenance & Messages
  const [categoryMaintenance, setCategoryMaintenance] = useState<Record<string, number>>(settings.categoryMaintenance || {
    'Unhas': 15,
    'Cílios': 15,
    'Sobrancelhas': 25,
    'Cabelo': 30,
    'Estética': 20
  });
  const [msgConfirm, setMsgConfirm] = useState(settings.defaultMessages?.confirmation || 'Olá {cliente}! Confirmamos o seu atendimento de {servico} com a profissional {profissional} no dia {data} às {hora}. Valor: {valor}. Te esperamos!');
  const [msgReminder, setMsgReminder] = useState(settings.defaultMessages?.reminder || 'Olá {cliente}! Notamos que já fazem {dias} dias desde o seu procedimento de {servico}. Que tal garantir o seu horário de manutenção conosco? Clique aqui e agende!');
  const [msgBday, setMsgBday] = useState(settings.defaultMessages?.birthday || 'Parabéns {cliente}! O Espaço La Belle te deseja um feliz aniversário! Hoje você tem 10% de desconto em qualquer serviço para comemorar conosco!');

  // Tab 3 Maintenance Sub-tabs & Editor states
  const [maintenanceSubTab, setMaintenanceSubTab] = useState<'categories' | 'services'>('categories');

  // Category Edit / Add State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catFormName, setCatFormName] = useState('');
  const [catFormHasMaintenance, setCatFormHasMaintenance] = useState(true);
  const [catFormMaintenanceDays, setCatFormMaintenanceDays] = useState(15);

  // Service Edit / Add State
  const [isSrvModalOpen, setIsSrvModalOpen] = useState(false);
  const [editingSrvId, setEditingSrvId] = useState<string | null>(null);
  const [srvFormName, setSrvFormName] = useState('');
  const [srvFormCategory, setSrvFormCategory] = useState('');
  const [srvFormPrice, setSrvFormPrice] = useState(100);
  const [srvFormDuration, setSrvFormDuration] = useState(60);
  const [srvFormCommission, setSrvFormCommission] = useState(40);
  const [srvFormHasMaintenance, setSrvFormHasMaintenance] = useState(true);
  const [srvFormMaintenanceDays, setSrvFormMaintenanceDays] = useState(15);

  // Category handlers
  const handleOpenAddCategory = () => {
    setEditingCatId(null);
    setCatFormName('');
    setCatFormHasMaintenance(true);
    setCatFormMaintenanceDays(15);
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: { id: string; name: string }) => {
    setEditingCatId(cat.id);
    setCatFormName(cat.name);
    const hasM = cat.name in categoryMaintenance;
    setCatFormHasMaintenance(hasM);
    setCatFormMaintenanceDays(categoryMaintenance[cat.name] || 15);
    setIsCatModalOpen(true);
  };

  const handleCategoryFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) return;

    const formattedName = catFormName.trim();

    if (editingCatId) {
      const oldCat = categories.find(c => c.id === editingCatId);
      updateCategory(editingCatId, { name: formattedName });

      // Update categoryMaintenance dictionary
      setCategoryMaintenance(prev => {
        const next = { ...prev };
        if (oldCat && oldCat.name !== formattedName) {
          delete next[oldCat.name];
        }
        if (catFormHasMaintenance) {
          next[formattedName] = catFormMaintenanceDays;
        } else {
          delete next[formattedName];
        }
        return next;
      });
    } else {
      addCategory({ name: formattedName, professionals: [] });
      if (catFormHasMaintenance) {
        setCategoryMaintenance(prev => ({
          ...prev,
          [formattedName]: catFormMaintenanceDays
        }));
      }
    }

    setIsCatModalOpen(false);
    triggerNotification(editingCatId ? 'Categoria atualizada!' : 'Nova categoria criada!');
  };

  const handleDeleteCat = (catId: string, catName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${catName}"?`)) {
      deleteCategory(catId);
      setCategoryMaintenance(prev => {
        const next = { ...prev };
        delete next[catName];
        return next;
      });
      triggerNotification('Categoria excluída!');
    }
  };

  // Service handlers
  const handleOpenAddService = () => {
    setEditingSrvId(null);
    setSrvFormName('');
    setSrvFormCategory(categories[0]?.name || '');
    setSrvFormPrice(100);
    setSrvFormDuration(60);
    setSrvFormCommission(40);
    setSrvFormHasMaintenance(true);
    setSrvFormMaintenanceDays(15);
    setIsSrvModalOpen(true);
  };

  const handleOpenEditService = (srv: any) => {
    setEditingSrvId(srv.id);
    setSrvFormName(srv.name);
    setSrvFormCategory(srv.category);
    setSrvFormPrice(srv.price);
    setSrvFormDuration(srv.duration);
    setSrvFormCommission(srv.commission);
    setSrvFormHasMaintenance(srv.hasMaintenance ?? false);
    setSrvFormMaintenanceDays(srv.maintenanceDays || 15);
    setIsSrvModalOpen(true);
  };

  const handleServiceFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvFormName.trim() || !srvFormCategory) return;

    if (editingSrvId) {
      updateService(editingSrvId, {
        name: srvFormName.trim(),
        category: srvFormCategory,
        price: srvFormPrice,
        duration: srvFormDuration,
        commission: srvFormCommission,
        hasMaintenance: srvFormHasMaintenance,
        maintenanceDays: srvFormHasMaintenance ? srvFormMaintenanceDays : undefined
      });
    } else {
      addService({
        name: srvFormName.trim(),
        category: srvFormCategory,
        price: srvFormPrice,
        duration: srvFormDuration,
        commission: srvFormCommission,
        professionals: [],
        active: true,
        hasMaintenance: srvFormHasMaintenance,
        maintenanceDays: srvFormHasMaintenance ? srvFormMaintenanceDays : undefined
      });
    }

    setIsSrvModalOpen(false);
    triggerNotification(editingSrvId ? 'Serviço atualizado!' : 'Novo serviço criado!');
  };

  const handleDeleteSrv = (srvId: string, srvName: string) => {
    if (window.confirm(`Tem certeza que deseja inativar o serviço "${srvName}"?`)) {
      deleteService(srvId);
      triggerNotification('Serviço inativado com sucesso!');
    }
  };

  // Tab 4: User Manager states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // User form states
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('123');
  const [uRole, setURole] = useState<UserRole>('profissional');
  const [uProfId, setUProfId] = useState('');
  const [uIsBlocked, setUIsBlocked] = useState(false);

  // User permission checkboxes
  const [permPastDays, setPermPastDays] = useState(true);
  const [permTodayOnly, setPermTodayOnly] = useState(false);
  const [permFutureDays, setPermFutureDays] = useState(true);
  const [permPastMonth, setPermPastMonth] = useState(true);
  const [permCurrentMonth, setPermCurrentMonth] = useState(true);
  const [permFutureMonth, setPermFutureMonth] = useState(true);
  const [permServicesDone, setPermServicesDone] = useState(true);
  const [permCommissions, setPermCommissions] = useState(true);
  const [permValues, setPermValues] = useState(true);

  const triggerNotification = (msg: string) => {
    setSaveMessage(msg);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleSaveSalonAndHours = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: formSalName,
      salonName: formSalName,
      salonPhone: formSalPhone,
      salonAddress: formSalAddress,
      salonCNPJ: formSalCNPJ,
      logoEmoji: formSalLogoEmoji,
      logo: logoType === 'emoji' ? formSalLogoEmoji : formSalLogoUrl,
      workingHours: workingHours,
      businessHours: {
        start: hoursOpen,
        end: hoursClose
      }
    });
    triggerNotification('Configurações salvas: Logo, Nome, Dias e Horários atualizados!');
  };

  const handleSaveFinance = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cardFeesObj: Record<string, number> = {};
    paymentMethodsList.forEach(m => {
      const trimmedName = m.name.trim();
      if (trimmedName) {
        cardFeesObj[trimmedName] = m.fee;
      }
    });

    updateSettings({
      cardFees: cardFeesObj,
      defaultCommission,
      categoryCommissions
    });
    triggerNotification('Taxas de cartões e regras de comissão salvas!');
  };

  const handleSaveMaintenanceAndMessages = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      categoryMaintenance,
      defaultMessages: {
        confirmation: msgConfirm,
        reminder: msgReminder,
        birthday: msgBday
      }
    });
    triggerNotification('Prazos de manutenção e copies do WhatsApp atualizadas!');
  };

  const openAddUser = () => {
    setEditingUserId(null);
    setUName('');
    setUEmail('');
    setUPassword('123');
    setURole('profissional');
    setUProfId('');
    setUIsBlocked(false);
    
    // Reset permissions to default
    setPermPastDays(true);
    setPermTodayOnly(false);
    setPermFutureDays(true);
    setPermPastMonth(true);
    setPermCurrentMonth(true);
    setPermFutureMonth(true);
    setPermServicesDone(true);
    setPermCommissions(true);
    setPermValues(true);

    setUserFormOpen(true);
  };

  const openEditUser = (user: User) => {
    setEditingUserId(user.id);
    setUName(user.name);
    setUEmail(user.email);
    setUPassword(user.password || '123');
    setURole(user.role);
    setUProfId(user.professionalId || '');
    setUIsBlocked(!!user.isBlocked);

    // Load permissions if professional
    if (user.permissions) {
      const p = user.permissions;
      setPermPastDays(p.calendarAccess?.pastDays !== false);
      setPermTodayOnly(!!p.calendarAccess?.todayOnly);
      setPermFutureDays(p.calendarAccess?.futureDays !== false);
      setPermPastMonth(p.calendarAccess?.pastMonth !== false);
      setPermCurrentMonth(p.calendarAccess?.currentMonth !== false);
      setPermFutureMonth(p.calendarAccess?.futureMonth !== false);
      setPermServicesDone(p.viewServicesDone !== false);
      setPermCommissions(p.viewCommissions !== false);
      setPermValues(p.viewValues !== false);
    } else {
      setPermPastDays(true);
      setPermTodayOnly(false);
      setPermFutureDays(true);
      setPermPastMonth(true);
      setPermCurrentMonth(true);
      setPermFutureMonth(true);
      setPermServicesDone(true);
      setPermCommissions(true);
      setPermValues(true);
    }

    setUserFormOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const permissions: UserPermissions | undefined = uURoleIsProfessional(uRole) ? {
      calendarAccess: {
        pastDays: permPastDays,
        todayOnly: permTodayOnly,
        futureDays: permFutureDays,
        pastMonth: permPastMonth,
        currentMonth: permCurrentMonth,
        futureMonth: permFutureMonth,
      },
      viewServicesDone: permServicesDone,
      viewCommissions: permCommissions,
      viewValues: permValues,
    } : undefined;

    const userData = {
      name: uName,
      email: uEmail,
      role: uRole,
      professionalId: uRole === 'profissional' ? (uProfId || undefined) : undefined,
      isBlocked: uIsBlocked,
      permissions
    };

    try {
      if (editingUserId) {
        await updateUser(editingUserId, userData);
        triggerNotification(`Usuário "${uName}" atualizado com sucesso!`);
      } else {
        await addUser(userData, uPassword);
        triggerNotification(`Usuário "${uName}" cadastrado com sucesso!`);
      }
      setUserFormOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao salvar usuário: ${err.message || 'Verifique se as credenciais estão corretas.'}`);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário "${name}"?`)) {
      try {
        await deleteUser(id);
        triggerNotification(`Usuário "${name}" removido!`);
      } catch (err: any) {
        console.error(err);
        alert(`Erro ao remover usuário: ${err.message || err}`);
      }
    }
  };

  function uURoleIsProfessional(role: UserRole) {
    return role === 'profissional';
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'gestora': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'recepcao': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'profissional': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabelPT = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gestora': return 'Gestora';
      case 'recepcao': return 'Recepção';
      case 'profissional': return 'Profissional';
      default: return role;
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Upper Information Banner */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{formSalLogoEmoji}</span>
            <h3 className="text-base font-serif font-bold text-sky-950">Ajustes & Parâmetros do Salão</h3>
          </div>
          <p className="text-xs text-slate-400">Gerencie informações do estabelecimento, taxas financeiras de maquininha, regras de comissão, prazos de retorno e segurança de usuários.</p>
        </div>

        {saveSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center gap-1 animate-pulse">
            <Check className="w-3.5 h-3.5" /> {saveMessage}
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Tab Selector Column */}
        <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xs space-y-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible">
          <button
            onClick={() => setActiveTab('salon')}
            className={`flex-1 lg:flex-none flex items-center justify-start gap-2.5 px-4 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
              activeTab === 'salon'
                ? 'bg-sky-950 text-amber-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Salão & Horários</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`flex-1 lg:flex-none flex items-center justify-start gap-2.5 px-4 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
              activeTab === 'finance'
                ? 'bg-sky-950 text-amber-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Financeiro & Comissão</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex-1 lg:flex-none flex items-center justify-start gap-2.5 px-4 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
              activeTab === 'maintenance'
                ? 'bg-sky-950 text-amber-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Manutenção & Copys</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 lg:flex-none flex items-center justify-start gap-2.5 px-4 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
              activeTab === 'users'
                ? 'bg-sky-950 text-amber-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Usuários & Permissões</span>
          </button>

          {currentUser?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('backup')}
                className={`flex-1 lg:flex-none flex items-center justify-start gap-2.5 px-4 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                  activeTab === 'backup'
                    ? 'bg-sky-950 text-amber-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Database className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="whitespace-nowrap text-amber-400 font-extrabold">Backup & Segurança</span>
              </button>

              <button
                onClick={() => setActiveTab('push')}
                className={`flex-1 lg:flex-none flex items-center justify-start gap-2.5 px-4 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                  activeTab === 'push'
                    ? 'bg-sky-950 text-amber-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BellRing className="w-4 h-4 shrink-0 text-sky-400" />
                <span className="whitespace-nowrap text-sky-400 font-extrabold">Notificações Push</span>
              </button>
            </>
          )}
        </div>

        {/* Tab Content Column */}
        <div className="lg:col-span-3 space-y-6">

          {/* TAB 1: SALON & HOURS */}
          {activeTab === 'salon' && (
            <form onSubmit={handleSaveSalonAndHours} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Briefcase className="w-4 h-4 text-sky-700" /> Ficha Cadastral do Estabelecimento
                </h4>
                <p className="text-xs text-slate-400 mt-1">Insira as credenciais do seu espaço e personalize o ícone, logo ou emoji que estampa o cabeçalho e relatórios.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Nome do Salão / Espaço *</label>
                  <input
                    type="text"
                    required
                    value={formSalName}
                    onChange={(e) => setFormSalName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">WhatsApp Principal de Contato *</label>
                  <input
                    type="text"
                    required
                    value={formSalPhone}
                    onChange={(e) => setFormSalPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">CNPJ / CPF do Salão</label>
                  <input
                    type="text"
                    value={formSalCNPJ}
                    onChange={(e) => setFormSalCNPJ(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="font-semibold text-slate-500 block">Endereço Completo</label>
                  <input
                    type="text"
                    value={formSalAddress}
                    onChange={(e) => setFormSalAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950"
                  />
                </div>

                {/* LOGO PERSONALIZATION BLOCK */}
                <div className="sm:col-span-2 p-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-xs">Identidade Visual & Logotipo</span>
                    <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setLogoType('emoji')}
                        className={`px-3 py-1 rounded-md transition-all ${
                          logoType === 'emoji' ? 'bg-white shadow-xs text-sky-950' : 'text-slate-500'
                        }`}
                      >
                        Emoji / Ícone
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoType('image')}
                        className={`px-3 py-1 rounded-md transition-all ${
                          logoType === 'image' ? 'bg-white shadow-xs text-sky-950' : 'text-slate-500'
                        }`}
                      >
                        Imagem (URL)
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    {/* Preview circle */}
                    <div className="w-16 h-16 rounded-full bg-[#2B4C7E] border border-slate-200 shadow-md flex items-center justify-center bg-white overflow-hidden shrink-0 self-center">
                      {logoType === 'emoji' ? (
                        <span className="text-3xl">{formSalLogoEmoji}</span>
                      ) : (
                        <img
                          src={formSalLogoUrl}
                          alt="Preview Logo"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=120&auto=format&fit=crop&q=60';
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-2.5 w-full">
                      {logoType === 'emoji' ? (
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-500 block">Escolha ou digite um Emoji</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={4}
                              value={formSalLogoEmoji}
                              onChange={(e) => setFormSalLogoEmoji(e.target.value)}
                              className="w-14 px-2 py-2 bg-white border border-slate-200 rounded-xl text-center focus:outline-none focus:ring-1 focus:ring-sky-950 text-base font-bold shadow-2xs"
                            />
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {['✨', '🌸', '💇‍♀️', '💅', '💄', '🧖‍♀️', '🛍️', '💎', '🎨', '🎀', '⭐'].map(em => (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={() => setFormSalLogoEmoji(em)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg border text-sm transition-colors hover:bg-slate-100 ${
                                    formSalLogoEmoji === em ? 'border-sky-950 bg-sky-50 shadow-2xs' : 'border-slate-200 bg-white'
                                  }`}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-500 block">URL da Imagem do Logo</label>
                            <input
                              type="text"
                              value={formSalLogoUrl}
                              onChange={(e) => setFormSalLogoUrl(e.target.value)}
                              placeholder="Cole a URL da imagem aqui..."
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 font-mono text-[11px]"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Ou selecione uma identidade padrão:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { id: 'p1', label: 'Estética Chique', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=120&auto=format&fit=crop&q=60' },
                                { id: 'p2', label: 'Salão de Cabelo', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&auto=format&fit=crop&q=60' },
                                { id: 'p3', label: 'Unhas & Cores', url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=120&auto=format&fit=crop&q=60' },
                                { id: 'p4', label: 'Spa Wellness', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=60' }
                              ].map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setFormSalLogoUrl(p.url)}
                                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-medium text-left truncate transition-colors ${
                                    formSalLogoUrl === p.url ? 'bg-sky-950 text-white border-sky-950' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* DAILY WORKING HOURS EDITOR */}
              <div>
                <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Clock className="w-4 h-4 text-sky-700" /> Dias e Horários de Funcionamento do Salão
                </h4>
                <p className="text-xs text-slate-400 mt-1">Configure quais dias da semana seu salão abre para agendamentos de clientes, e os horários de início e término específicos.</p>
              </div>

              <div className="space-y-2.5">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayKey => {
                  const dayNamePT = {
                    Monday: 'Segunda-feira',
                    Tuesday: 'Terça-feira',
                    Wednesday: 'Quarta-feira',
                    Thursday: 'Quinta-feira',
                    Friday: 'Sexta-feira',
                    Saturday: 'Sábado',
                    Sunday: 'Domingo'
                  }[dayKey] || dayKey;

                  const config = workingHours[dayKey] || { isOpen: false, start: '09:00', end: '19:00' };

                  return (
                    <div
                      key={dayKey}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all text-xs gap-3 ${
                        config.isOpen
                          ? 'bg-slate-50 border-slate-200/80 shadow-2xs'
                          : 'bg-slate-100/30 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.isOpen}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setWorkingHours(prev => ({
                                ...prev,
                                [dayKey]: { ...prev[dayKey], isOpen: checked }
                              }));
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-950"></div>
                        </label>

                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-700 block">{dayNamePT}</span>
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                            config.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {config.isOpen ? 'Aberto' : 'Fechado'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-slate-400 font-mono">Início</span>
                          <input
                            type="time"
                            disabled={!config.isOpen}
                            value={config.start}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWorkingHours(prev => ({
                                ...prev,
                                [dayKey]: { ...prev[dayKey], start: val }
                              }));
                            }}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 font-mono font-medium shadow-2xs"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-slate-400 font-mono">Término</span>
                          <input
                            type="time"
                            disabled={!config.isOpen}
                            value={config.end}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWorkingHours(prev => ({
                                ...prev,
                                [dayKey]: { ...prev[dayKey], end: val }
                              }));
                            }}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 font-mono font-medium shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FALLBACK GENERAL COMPATIBILITY PANEL */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <span className="font-bold text-slate-700 text-[10px] uppercase block">Compatibilidade Geral da Agenda Visual</span>
                <p className="text-[10px] text-slate-400">Determine a hora padrão de abertura e fechamento que será usada de modo amplo no grid diário da Agenda Visual:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block text-[9px] uppercase">Abertura Padrão</label>
                    <input
                      type="time"
                      required
                      value={hoursOpen}
                      onChange={(e) => setHoursOpen(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-950 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block text-[9px] uppercase">Fechamento Padrão</label>
                    <input
                      type="time"
                      required
                      value={hoursClose}
                      onChange={(e) => setHoursClose(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-950 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" /> Salvar Configurações Gerais
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: FINANCE & COMMISSIONS */}
          {activeTab === 'finance' && (
            <form onSubmit={handleSaveFinance} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <DollarSign className="w-4 h-4 text-sky-700" /> Formas de Pagamento e Taxas
                </h4>
                <p className="text-xs text-slate-400 mt-1">Determine e personalize as formas de pagamento disponíveis e as taxas descontadas pelo intermediador de cartão / maquininha. Elas serão descontadas automaticamente no fechamento do caixa para obter o Faturamento Líquido.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Formas de Pagamento Cadastradas</span>
                  <button
                    type="button"
                    onClick={handleAddMethod}
                    className="px-3 py-1.5 bg-sky-50 text-sky-950 hover:bg-sky-100 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nova Forma de Pagamento
                  </button>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3 text-[11px] uppercase">Nome do Método</th>
                        <th className="p-3 text-[11px] uppercase text-right w-48">Taxa (%)</th>
                        <th className="p-3 text-[11px] uppercase text-right w-24">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentMethodsList.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <input
                              type="text"
                              required
                              value={m.name}
                              onChange={(e) => handleUpdateMethod(m.id, 'name', e.target.value)}
                              placeholder="Ex: Cartão de Crédito, Pix, Dinheiro"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                required
                                value={m.fee}
                                onChange={(e) => handleUpdateMethod(m.id, 'fee', e.target.value)}
                                className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold font-mono text-sky-950 focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs"
                              />
                              <span className="text-slate-500 font-bold">%</span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteMethod(m.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir forma de pagamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paymentMethodsList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-400 font-medium">
                            Nenhuma forma de pagamento cadastrada. Clique em "Nova Forma de Pagamento" para adicionar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-sky-700" /> Regras de Comissão de Profissionais
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Defina a comissão padrão geral do salão, ou personalize o repasse específico para as profissionais de acordo com as categorias de serviços.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddCategory}
                  className="px-3 py-1.5 bg-sky-50 text-sky-950 hover:bg-sky-100 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer animate-bounce"
                >
                  <Plus className="w-3.5 h-3.5" /> Nova Categoria de Serviço
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="max-w-xs bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Comissão Geral Padrão</span>
                  <div className="flex items-center gap-1.5 w-24">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={defaultCommission}
                      onChange={(e) => setDefaultCommission(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-sky-950 focus:outline-none focus:ring-1 focus:ring-sky-950"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3 text-[11px] uppercase">Categoria de Serviço</th>
                        <th className="p-3 text-[11px] uppercase text-right w-36">Comissão Especial (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map(cat => {
                        const commissionVal = categoryCommissions[cat.name] ?? defaultCommission;
                        return (
                          <tr key={cat.id}>
                            <td className="p-3 font-semibold text-slate-700 flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              {cat.name}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={commissionVal}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setCategoryCommissions(prev => ({ ...prev, [cat.name]: val }));
                                  }}
                                  className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-semibold font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-950"
                                />
                                <span className="text-slate-500 font-semibold">%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {categories.length === 0 && (
                        <tr>
                          <td colSpan={2} className="p-8 text-center text-slate-400 font-medium">
                            Nenhuma categoria de serviço cadastrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" /> Salvar Regras Financeiras
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: MAINTENANCE & MESSAGES */}
          {activeTab === 'maintenance' && (
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Clock className="w-4 h-4 text-sky-700" /> Regras de Manutenção (Prazo de Retorno)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Configure quais categorias e serviços específicos requerem prazo de retorno para manutenção e ajuste as datas ideais. Clientes sem retorno após esse prazo serão alertadas no painel.
                </p>
              </div>

              {/* Maintenance Sub-Tabs: Categories vs Services */}
              <div className="flex bg-slate-100 p-1 rounded-xl max-w-xs text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMaintenanceSubTab('categories')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-center cursor-pointer transition-all ${
                    maintenanceSubTab === 'categories' ? 'bg-white text-sky-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 animate-pulse" /> Categorias
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMaintenanceSubTab('services')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-center cursor-pointer transition-all ${
                    maintenanceSubTab === 'services' ? 'bg-white text-sky-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Serviços
                  </span>
                </button>
              </div>

              {/* TAB 3.1: CATEGORIES MAINTENANCE MANAGER */}
              {maintenanceSubTab === 'categories' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categorias de Serviços Cadastradas</span>
                    <button
                      type="button"
                      onClick={handleOpenAddCategory}
                      className="px-3 py-1.5 bg-sky-50 text-sky-950 hover:bg-sky-100 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Nova Categoria
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-3 text-[11px] uppercase">Categoria</th>
                          <th className="p-3 text-[11px] uppercase text-center w-40">Necessita Retorno?</th>
                          <th className="p-3 text-[11px] uppercase text-right w-40">Prazo Padrão (Dias)</th>
                          <th className="p-3 text-[11px] uppercase text-right w-32">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {categories.map(cat => {
                          const hasM = cat.name in categoryMaintenance;
                          const mDays = categoryMaintenance[cat.name] || 15;
                          return (
                            <tr key={cat.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-700 flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-slate-400" />
                                {cat.name}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCategoryMaintenance(prev => {
                                        const next = { ...prev };
                                        if (hasM) {
                                          delete next[cat.name];
                                        } else {
                                          next[cat.name] = mDays;
                                        }
                                        return next;
                                      });
                                    }}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                    title={hasM ? "Desativar retorno para esta categoria" : "Ativar retorno para esta categoria"}
                                  >
                                    {hasM ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        <Check className="w-3 h-3" /> Monitorado
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                        Não monitorar
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    disabled={!hasM}
                                    value={hasM ? mDays : ''}
                                    placeholder="--"
                                    onChange={(e) => {
                                      const val = Math.max(1, Number(e.target.value));
                                      setCategoryMaintenance(prev => ({
                                        ...prev,
                                        [cat.name]: val
                                      }));
                                    }}
                                    className={`w-16 px-2 py-1 border rounded-lg text-right font-semibold font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-950 ${
                                      hasM ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                    }`}
                                  />
                                  <span className={hasM ? "text-slate-500 text-[11px]" : "text-slate-300 text-[11px]"}>dias</span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditCategory(cat)}
                                    className="p-1.5 text-slate-500 hover:text-sky-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="Editar nome"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCat(cat.id, cat.name)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Excluir categoria"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
              )}

              {/* TAB 3.2: SERVICES MAINTENANCE MANAGER */}
              {maintenanceSubTab === 'services' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Serviços e Prazos Específicos</span>
                    <button
                      type="button"
                      onClick={handleOpenAddService}
                      className="px-3 py-1.5 bg-sky-50 text-sky-950 hover:bg-sky-100 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Novo Serviço
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-3 text-[11px] uppercase">Serviço / Procedimento</th>
                          <th className="p-3 text-[11px] uppercase">Categoria</th>
                          <th className="p-3 text-[11px] uppercase text-center w-40">Necessita Retorno?</th>
                          <th className="p-3 text-[11px] uppercase text-right w-40">Prazo de Retorno (Dias)</th>
                          <th className="p-3 text-[11px] uppercase text-right w-32">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {services.filter(s => s.active !== false).map(srv => {
                          const hasM = srv.hasMaintenance ?? false;
                          const mDays = srv.maintenanceDays || 15;
                          return (
                            <tr key={srv.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-700 flex flex-col">
                                <span className="text-slate-800">{srv.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {srv.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • {srv.duration} min
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 font-medium">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                                  {srv.category}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateService(srv.id, {
                                        hasMaintenance: !hasM,
                                        maintenanceDays: srv.maintenanceDays || 15
                                      });
                                    }}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                    title={hasM ? "Desativar retorno para este serviço" : "Ativar retorno para este serviço"}
                                  >
                                    {hasM ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        <Check className="w-3 h-3" /> Monitorado
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                        Não monitorar
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    disabled={!hasM}
                                    value={hasM ? mDays : ''}
                                    placeholder="--"
                                    onChange={(e) => {
                                      const val = Math.max(1, Number(e.target.value));
                                      updateService(srv.id, {
                                        maintenanceDays: val
                                      });
                                    }}
                                    className={`w-16 px-2 py-1 border rounded-lg text-right font-semibold font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-950 ${
                                      hasM ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                    }`}
                                  />
                                  <span className={hasM ? "text-slate-500 text-[11px]" : "text-slate-300 text-[11px]"}>dias</span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditService(srv)}
                                    className="p-1.5 text-slate-500 hover:text-sky-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="Editar completo"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSrv(srv.id, srv.name)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Inativar serviço"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
              )}

              {/* MESSAGE COPYS SECTION */}
              <div>
                <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2 border-b border-slate-100 pb-3 mt-4">
                  <MessageCircle className="w-4 h-4 text-sky-700" /> Copies Automáticas do WhatsApp
                </h4>
                <p className="text-xs text-slate-400 mt-1">Configure o texto pré-redigido que o salão enviará pelo WhatsApp ao interagir com as clientes. Use chaves para substituições dinâmicas.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">1. Confirmação de Agendamento</label>
                  <textarea
                    rows={3}
                    value={msgConfirm}
                    onChange={(e) => setMsgConfirm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-[11px] font-mono leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">2. Aviso de Manutenção (Recall)</label>
                  <textarea
                    rows={3}
                    value={msgReminder}
                    onChange={(e) => setMsgReminder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-[11px] font-mono leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">3. Lembrete de Aniversário</label>
                  <textarea
                    rows={2}
                    value={msgBday}
                    onChange={(e) => setMsgBday(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-[11px] font-mono leading-relaxed"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 leading-relaxed space-y-1">
                  <p className="font-bold">Variáveis Inteligentes Reconhecidas pelo Motor:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-2">
                    <div><strong>{`{cliente}`}</strong>: Nome da cliente</div>
                    <div><strong>{`{servico}`}</strong>: Procedimento</div>
                    <div><strong>{`{profissional}`}</strong>: Especialista</div>
                    <div><strong>{`{data}`}</strong>: Dia da reserva</div>
                    <div><strong>{`{hora}`}</strong>: Horário do início</div>
                    <div><strong>{`{valor}`}</strong>: Valor cobrado</div>
                    <div><strong>{`{dias}`}</strong>: Dias transcorridos</div>
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON FOR GENERAL TAB SETTINGS */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveMaintenanceAndMessages}
                  className="px-5 py-2.5 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" /> Salvar Regras de Retorno & Copys
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: USERS & PERMISSIONS */}
          {activeTab === 'users' && (
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-700" /> Usuários e Controle de Permissões
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Crie logins para gerentes, recepcionistas e manicures. Defina permissões granulares de acesso e agenda.</p>
                </div>

                {!userFormOpen && (
                  <button
                    onClick={openAddUser}
                    className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400" /> Adicionar Usuário
                  </button>
                )}
              </div>

              {/* USER ADD/EDIT DRAWER CARD */}
              {userFormOpen && (
                <form onSubmit={handleSaveUser} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 space-y-5 animate-in slide-in-from-top duration-200">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      <Shield className="w-4 h-4 text-slate-500" />
                      {editingUserId ? 'Editar Credenciais de Usuário' : 'Adicionar Novo Usuário no Sistema'}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setUserFormOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Amanda Lima"
                        value={uName}
                        onChange={(e) => setUName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">E-mail de Login *</label>
                      <input
                        type="email"
                        required
                        placeholder="amanda@belle.com"
                        value={uEmail}
                        onChange={(e) => setUEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Senha de Acesso *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 123"
                        value={uPassword}
                        onChange={(e) => setUPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Nível de Acesso (Perfil)</label>
                      <select
                        value={uRole}
                        onChange={(e) => setURole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="admin">Admin (Acesso Total)</option>
                        <option value="gestora">Gestora (Gerente Geral)</option>
                        <option value="recepcao">Recepção (Operacional & Caixa)</option>
                        <option value="profissional">Profissional (Esteticista / Nail / Lash)</option>
                      </select>
                    </div>

                    {uURoleIsProfessional(uRole) && (
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 block">Vincular Perfil Profissional *</label>
                        <select
                          required
                          value={uProfId}
                          onChange={(e) => setUProfId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                        >
                          <option value="">Selecione a profissional correspondente...</option>
                          {professionals.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="sm:col-span-2 border-t border-slate-200 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="u_is_blocked"
                          checked={uIsBlocked}
                          onChange={(e) => setUIsBlocked(e.target.checked)}
                          className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                        />
                        <label htmlFor="u_is_blocked" className="font-bold text-rose-700 cursor-pointer flex items-center gap-1 select-none">
                          <ShieldAlert className="w-4 h-4 shrink-0" /> Bloquear Acesso deste Usuário ao Sistema
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">Usuários bloqueados recebem aviso de bloqueio imediato e são impedidos de fazer login.</p>
                    </div>
                  </div>

                  {/* GRANULAR PERMISSIONS PANEL - ONLY FOR PROFESSIONALS */}
                  {uURoleIsProfessional(uRole) && (
                    <div className="border border-slate-200 rounded-2xl bg-white p-4 space-y-4 text-xs">
                      <div>
                        <h6 className="font-bold text-sky-950 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-sky-700" /> Permissões Granulares da Agenda (Profissional)
                        </h6>
                        <p className="text-[11px] text-slate-400 mt-0.5">Como administrador, selecione exatamente quais períodos da agenda e dados confidenciais esta profissional poderá visualizar.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                          <p className="font-bold text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Restrição de Datas / Período:
                          </p>
                          <div className="space-y-1.5 font-semibold text-slate-600">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permPastDays}
                                onChange={(e) => setPermPastDays(e.target.checked)}
                                className="rounded text-sky-900 focus:ring-sky-900"
                              />
                              Verificar Dias Anteriores (Passado)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permTodayOnly}
                                onChange={(e) => setPermTodayOnly(e.target.checked)}
                                className="rounded text-sky-900 focus:ring-sky-900"
                              />
                              Restringir APENAS ao Dia Atual (Bloqueia passado/futuro)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permFutureDays}
                                onChange={(e) => setPermFutureDays(e.target.checked)}
                                className="rounded text-sky-900 focus:ring-sky-900"
                              />
                              Verificar Dias Futuros (Amanhã em diante)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permPastMonth}
                                onChange={(e) => setPermPastMonth(e.target.checked)}
                                className="rounded text-sky-900 focus:ring-sky-900"
                              />
                              Verificar Mês Anterior inteiro
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permCurrentMonth}
                                onChange={(e) => setPermCurrentMonth(e.target.checked)}
                                className="rounded text-sky-900 focus:ring-sky-900"
                              />
                              Verificar Mês Atual inteiro
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permFutureMonth}
                                onChange={(e) => setPermFutureMonth(e.target.checked)}
                                className="rounded text-sky-900 focus:ring-sky-900"
                              />
                              Verificar Mês Futuro inteiro
                            </label>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                          <p className="font-bold text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" /> Visualização de Informações:
                          </p>
                          <div className="space-y-1.5 font-semibold text-slate-600">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permServicesDone}
                                onChange={(e) => setPermServicesDone(e.target.checked)}
                                className="rounded text-sky-900 focus:ring-sky-900"
                              />
                              Visualizar Serviços Já Feitos (Finalizados)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permCommissions}
                                onChange={(e) => setPermCommissions(e.target.checked)}
                                className="rounded text-sky-900 focus:ring-sky-900"
                              />
                              Visualizar Comissões Financeiras
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permValues}
                                onChange={(e) => setPermValues(e.target.checked)}
                                className="rounded text-sky-900 focus:ring-sky-900"
                              />
                              Visualizar Valores e Faturamento dos Procedimentos
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={() => setUserFormOpen(false)}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl cursor-pointer"
                    >
                      Fechar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-amber-400" /> Confirmar Gravação
                    </button>
                  </div>
                </form>
              )}

              {/* USER DATABASE TABLE */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Pesquisar usuários por nome, email ou perfil..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-3">Nome / Usuário</th>
                          <th className="p-3">E-mail</th>
                          <th className="p-3">Senha</th>
                          <th className="p-3">Perfil</th>
                          <th className="p-3">Profissional Vinculado</th>
                          <th className="p-3">Acesso / Status</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-full flex items-center justify-center">
                                  {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-bold text-slate-800">{u.name}</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-slate-500 text-[11px]">{u.email}</td>
                            <td className="p-3 font-mono text-slate-400 text-[11px] italic">Gerenciado via Firebase</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getRoleBadgeColor(u.role)}`}>
                                {getRoleLabelPT(u.role)}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 font-medium">
                              {u.role === 'profissional' ? (
                                professionals.find(p => p.id === u.professionalId)?.name || 'Profissional Não Vinculado'
                              ) : (
                                <span className="text-slate-300 italic">Não aplicável</span>
                              )}
                            </td>
                            <td className="p-3">
                              {u.isBlocked ? (
                                <span className="inline-flex items-center gap-0.5 text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <Lock className="w-3 h-3" /> Bloqueado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <Unlock className="w-3 h-3" /> Ativo / Liberado
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditUser(u)}
                                  className="px-2 py-1 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="p-1 border border-rose-100 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer transition-colors"
                                  title="Remover Usuário"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: BACKUPS & STORAGE */}
          {activeTab === 'backup' && (
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-700" /> Rotina de Backup e Integridade de Dados
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Garante a integridade do Espaço La Belle salvando snapshots periódicos no Firebase e no Bucket de Armazenamento.
                  </p>
                </div>
              </div>

              {/* Status messages */}
              {backupTabStatusMessage && (
                <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-center gap-2.5 animate-pulse">
                  <RefreshCw className="w-4 h-4 text-sky-600 animate-spin" />
                  <span className="text-xs font-semibold text-sky-800">{backupTabStatusMessage}</span>
                </div>
              )}

              {/* BENTO GRID - CONTROLS & MANUAL OPERATIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel 1: Automations */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <HardDrive className="w-4.5 h-4.5 text-sky-900" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Automação de Rotina</h5>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Backup Automático Ativo</p>
                        <p className="text-[10px] text-slate-400">Salva snapshots em segundo plano ao acessar o painel</p>
                      </div>
                      <button
                        onClick={() => setBackupSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className="cursor-pointer"
                      >
                        {backupSettings.enabled ? (
                          <ToggleRight className="w-10 h-10 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-slate-300" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Frequência Periódica</label>
                      <select
                        disabled={!backupSettings.enabled}
                        value={backupSettings.frequency}
                        onChange={(e) => setBackupSettings(prev => ({ ...prev, frequency: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs cursor-pointer disabled:opacity-50"
                      >
                        <option value="daily">Diário (Recomendado para alto volume)</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensal</option>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Último backup automático:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {backupSettings.lastBackup ? new Date(backupSettings.lastBackup).toLocaleString('pt-BR') : 'Nenhum'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Manual Backup & Import */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <RefreshCw className="w-4.5 h-4.5 text-amber-500" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Ações de Resgate Rápido</h5>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Create manual backup */}
                      <button
                        disabled={isBackingUp || isRestoring}
                        onClick={async () => {
                          setIsBackingUp(true);
                          setBackupTabStatusMessage('Consolidando banco de dados e enviando snapshot de segurança...');
                          try {
                            const meta = await createBackup('manual');
                            if (meta.status === 'success') {
                              alert('Backup manual concluído com sucesso!');
                            } else {
                              alert('Backup concluído com alertas: ' + meta.errorMessage);
                            }
                          } catch (err: any) {
                            alert('Erro na criação de backup: ' + (err.message || err));
                          } finally {
                            setIsBackingUp(false);
                            setBackupTabStatusMessage('');
                          }
                        }}
                        className="flex flex-col items-center justify-center p-3 bg-sky-950 hover:bg-sky-900 disabled:opacity-50 text-amber-100 rounded-xl border border-sky-900 cursor-pointer shadow-xs transition-colors text-center"
                      >
                        <Database className="w-5 h-5 text-amber-400 mb-1" />
                        <span className="text-xs font-bold">Criar Snapshot</span>
                        <span className="text-[9px] text-amber-200/70 mt-0.5">Backup manual instantâneo</span>
                      </button>

                      {/* Import backup */}
                      <label className="flex flex-col items-center justify-center p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer shadow-xs transition-colors text-center">
                        <Upload className="w-5 h-5 text-sky-700 mb-1" />
                        <span className="text-xs font-bold text-slate-700">Restaurar do PC</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">Carregar arquivo .json</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleLocalBackupUpload}
                          className="hidden"
                          disabled={isBackingUp || isRestoring}
                        />
                      </label>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    Nota: Restaurar dados substitui todos os cadastros de clientes, profissionais, serviços, vendas e histórico de caixa atuais do sistema. Use com cautela.
                  </p>
                </div>

              </div>

              {/* LIST OF AVAILABLE BACKUPS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Database className="w-4.5 h-4.5 text-sky-950" /> Histórico de Snapshots ({backupsList.length})
                  </h5>
                </div>

                {backupsList.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                    <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">Nenhum backup registrado em nuvem ainda.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Ative o backup automático ou clique em "Criar Snapshot" para salvar o primeiro.</p>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                            <th className="p-3">Data e Hora</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-right">Tamanho</th>
                            <th className="p-3 font-semibold">Itens Salvos</th>
                            <th className="p-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {backupsList.map((bk) => (
                            <tr key={bk.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-700">
                                {new Date(bk.timestamp).toLocaleString('pt-BR')}
                              </td>
                              <td className="p-3">
                                {bk.type === 'automatic' ? (
                                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md text-[10px] font-bold text-blue-700">
                                    Automático
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-md text-[10px] font-bold text-amber-700">
                                    Manual
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {bk.status === 'success' ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md text-[10px] font-bold text-emerald-700">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Ativo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded-md text-[10px] font-bold text-rose-700">
                                    <XCircle className="w-3 h-3 text-rose-600" /> Falhou
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-500">
                                {(bk.size / 1024).toFixed(1)} KB
                              </td>
                              <td className="p-3 text-slate-400 text-[10px] font-normal">
                                {bk.itemCount ? (
                                  <span>
                                    {bk.itemCount.clients || 0} cl. • {bk.itemCount.bookings || 0} ag. • {bk.itemCount.products || 0} pr.
                                  </span>
                                ) : (
                                  'Não especificado'
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Download button */}
                                  <button
                                    onClick={() => handleDownloadFromFirestore(bk)}
                                    className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer transition-all"
                                    title="Baixar Backup JSON"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Restore action */}
                                  {bk.status === 'success' && (
                                    <button
                                      disabled={isRestoring || isBackingUp}
                                      onClick={() => handleRestoreFromFirestore(bk.id)}
                                      className="p-1.5 border border-sky-100 hover:bg-sky-50 rounded-lg text-sky-700 cursor-pointer transition-all disabled:opacity-50"
                                      title="Restaurar para este Ponto"
                                    >
                                      <Upload className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete action */}
                                  <button
                                    onClick={async () => {
                                      if (confirm('Deseja realmente apagar este snapshot de backup? Esta ação não pode ser desfeita.')) {
                                        try {
                                          await deleteBackup(bk.id);
                                          alert('Backup removido.');
                                        } catch (err: any) {
                                          alert('Falha ao remover backup: ' + (err.message || err));
                                        }
                                      }
                                    }}
                                    className="p-1.5 border border-rose-100 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer transition-all"
                                    title="Excluir de Nuvem"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 6: PUSH NOTIFICATIONS AND FCM DEVICE TOKENS */}
          {activeTab === 'push' && (
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-sky-700" /> Central de Notificações Push (FCM)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Gerencie o registro de dispositivos, permissões do navegador e audite o histórico de disparos automáticos para novos agendamentos e status de clientes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (confirm('Deseja realmente apagar todo o histórico de notificações enviadas?')) {
                        const success = await clearNotificationsLedger();
                        if (success) {
                          alert('Histórico de notificações apagado com sucesso!');
                        } else {
                          alert('Erro ao apagar histórico.');
                        }
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl cursor-pointer transition-all"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    Limpar Histórico
                  </button>
                </div>
              </div>

              {/* BENTO GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Browser Permission Status */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Key className="w-4 h-4 text-sky-700" /> Permissão no Navegador
                  </h5>
                  
                  <div className="flex flex-col items-center justify-center p-4 text-center space-y-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    {('Notification' in window) ? (
                      <>
                        {Notification.permission === 'granted' ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600 animate-pulse">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Notificações Habilitadas</p>
                              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Permissão Concedida</p>
                            </div>
                          </>
                        ) : Notification.permission === 'denied' ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-600">
                              <XCircle className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Notificações Bloqueadas</p>
                              <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Permissão Negada</p>
                            </div>
                            <p className="text-[10px] text-slate-400">Habilite as notificações nas configurações do navegador para este site.</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-600">
                              <AlertCircle className="w-6 h-6 animate-bounce" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Permissão Pendente</p>
                              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Aguardando Solicitação</p>
                            </div>
                            <button
                              onClick={async () => {
                                const permission = await Notification.requestPermission();
                                if (permission === 'granted') {
                                  // Auto-generate token on grant
                                  const mockToken = 'fcm_tok_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString().substring(8);
                                  await registerFCMToken(mockToken, 'desktop');
                                  alert('Permissão concedida! Dispositivo registrado com sucesso.');
                                } else {
                                  alert('Permissão recusada.');
                                }
                              }}
                              className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all w-full"
                            >
                              Solicitar Permissão
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-600">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Não Suportado</p>
                          <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Sem Suporte a Push</p>
                        </div>
                        <p className="text-[10px] text-slate-400">Este navegador não suporta a API de notificações nativas.</p>
                      </>
                    )}
                  </div>

                  <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-3 text-[10px] text-sky-800 space-y-1.5 leading-relaxed">
                    <p className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Simulação Segura em iFrames
                    </p>
                    <p>
                      Devido às restrições do ambiente de sandbox do AI Studio, o registro de Service Workers para FCM em background pode ser restrito pelo navegador. 
                    </p>
                    <p>
                      Por isso, implementamos um <strong>gerador robusto de tokens de teste</strong> para você registrar múltiplos dispositivos fictícios e auditar a persistência de ponta a ponta no Firestore!
                    </p>
                  </div>
                </div>

                {/* 2. Registered Devices list */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-sky-700" /> Dispositivos Cadastrados (Tokens FCM)
                    </h5>
                    
                    <button
                      onClick={async () => {
                        const randomToken = 'fcm_tok_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString().substring(8);
                        const devices = ['desktop', 'mobile', 'tablet'];
                        const randomDevice = devices[Math.floor(Math.random() * devices.length)];
                        const success = await registerFCMToken(randomToken, randomDevice);
                        if (success) {
                          alert('Dispositivo de teste registrado com sucesso no Firestore!');
                        } else {
                          alert('Erro ao registrar dispositivo.');
                        }
                      }}
                      className="px-2.5 py-1.5 bg-sky-950 hover:bg-sky-900 text-amber-100 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
                      Gerar Dispositivo de Teste
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {fcmTokensList.length === 0 ? (
                      <div className="bg-white border border-slate-100 p-8 rounded-xl text-center space-y-1">
                        <Smartphone className="w-6 h-6 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-400">Nenhum dispositivo registrado</p>
                        <p className="text-[10px] text-slate-400">Clique no botão acima para registrar um dispositivo para testes no Firestore.</p>
                      </div>
                    ) : (
                      fcmTokensList.map((tok) => (
                        <div key={tok.id} className="bg-white border border-slate-100 p-3 rounded-xl flex items-center justify-between gap-4 hover:shadow-xs transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700">
                              {tok.deviceType === 'desktop' ? (
                                <Laptop className="w-4 h-4" />
                              ) : tok.deviceType === 'tablet' ? (
                                <Laptop className="w-4 h-4" />
                              ) : (
                                <Smartphone className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-700">{tok.userEmail}</span>
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                                  {tok.deviceType}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] font-mono text-slate-400">
                                  Token: {tok.token.substring(0, 15)}...
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(tok.token);
                                    alert('Token copiado!');
                                  }}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                  title="Copiar Token"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={async () => {
                              if (confirm('Deseja realmente remover este dispositivo? ele não receberá mais notificações push.')) {
                                await deleteFCMToken(tok.id);
                              }
                            }}
                            className="p-1 border border-rose-50 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer transition-all"
                            title="Descadastrar Dispositivo"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Instant Manual Trigger / Sandbox Simulation */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Send className="w-4 h-4 text-sky-700" /> Disparo Manual de Teste (Simulação FCM)
                </h5>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const titleInput = form.elements.namedItem('pushTitle') as HTMLInputElement;
                    const bodyInput = form.elements.namedItem('pushBody') as HTMLInputElement;
                    
                    if (!titleInput.value || !bodyInput.value) return;

                    const success = await sendPushNotification(titleInput.value, bodyInput.value);
                    if (success) {
                      alert('Notificação enviada e salva no histórico do Firestore!');
                      form.reset();
                    } else {
                      alert('Erro ao processar notificação.');
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-xs"
                >
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Título da Notificação</label>
                    <input
                      name="pushTitle"
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs"
                      placeholder="Ex: Confirmação de Horário"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Corpo / Mensagem</label>
                    <input
                      name="pushBody"
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs"
                      placeholder="Ex: Seu horário com Joyce está confirmado para amanhã às 14:00."
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all h-[38px]"
                  >
                    <Send className="w-4 h-4 text-amber-400" /> Enviar Notificação
                  </button>
                </form>
              </div>

              {/* 3. Send Logs / Audit History */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Server className="w-4 h-4 text-sky-700" /> Histórico e Auditoria de Notificações (Ledger do Firestore)
                </h5>

                <div className="overflow-x-auto">
                  {pushNotificationsList.length === 0 ? (
                    <div className="bg-white border border-slate-100 p-8 rounded-xl text-center space-y-1">
                      <Server className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">Nenhuma notificação registrada no histórico</p>
                      <p className="text-[10px] text-slate-400">Cadastre agendamentos ou use o formulário acima para criar registros na base.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold">
                          <th className="py-2 px-3">Data/Hora</th>
                          <th className="py-2 px-3">Destinatário</th>
                          <th className="py-2 px-3">Título / Mensagem</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pushNotificationsList.map((log) => (
                          <tr key={log.id} className="border-b border-slate-100 hover:bg-white transition-all">
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(log.sentAt).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">
                              {log.userEmail || 'Sistema (Geral)'}
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-slate-800">{log.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{log.body}</p>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <Check className="w-2.5 h-2.5" /> ENVIADA
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* CATEGORY ADD/EDIT MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Layers className="w-4 h-4 text-sky-700" />
              {editingCatId ? 'Editar Categoria' : 'Nova Categoria'}
            </h4>

            <form onSubmit={handleCategoryFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  value={catFormName}
                  onChange={(e) => setCatFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs"
                  placeholder="Ex: Massagens, Unhas, etc."
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={catFormHasMaintenance}
                    onChange={(e) => setCatFormHasMaintenance(e.target.checked)}
                    className="rounded text-sky-900 focus:ring-sky-900 w-4 h-4"
                  />
                  Habilitar prazo de retorno padrão
                </label>

                {catFormHasMaintenance && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Prazo de Retorno Padrão (Dias)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        required
                        value={catFormMaintenanceDays}
                        onChange={(e) => setCatFormMaintenanceDays(Math.max(1, Number(e.target.value)))}
                        className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs text-right font-mono font-semibold"
                      />
                      <span className="font-semibold text-slate-500">dias</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Este prazo será sugerido por padrão para os procedimentos desta categoria.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" /> Gravar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE ADD/EDIT MODAL */}
      {isSrvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h4 className="text-sm font-serif font-bold text-sky-950 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Tag className="w-4 h-4 text-sky-700" />
              {editingSrvId ? 'Editar Serviço' : 'Novo Serviço'}
            </h4>

            <form onSubmit={handleServiceFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Nome do Serviço / Procedimento *</label>
                <input
                  type="text"
                  required
                  value={srvFormName}
                  onChange={(e) => setSrvFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs"
                  placeholder="Ex: Cutilagem e Esmaltação"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Categoria *</label>
                  <select
                    value={srvFormCategory}
                    onChange={(e) => setSrvFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Preço (R$) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={srvFormPrice}
                    onChange={(e) => setSrvFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Duração (Minutos) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={srvFormDuration}
                    onChange={(e) => setSrvFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Comissão (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={srvFormCommission}
                    onChange={(e) => setSrvFormCommission(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={srvFormHasMaintenance}
                    onChange={(e) => setSrvFormHasMaintenance(e.target.checked)}
                    className="rounded text-sky-900 focus:ring-sky-900 w-4 h-4"
                  />
                  Habilitar prazo de retorno/manutenção
                </label>

                {srvFormHasMaintenance && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Prazo de Retorno Individual (Dias)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        required
                        value={srvFormMaintenanceDays}
                        onChange={(e) => setSrvFormMaintenanceDays(Math.max(1, Number(e.target.value)))}
                        className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-950 text-xs text-right font-mono font-semibold"
                      />
                      <span className="font-semibold text-slate-500">dias</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSrvModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-950 hover:bg-sky-900 text-amber-100 font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" /> Gravar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
