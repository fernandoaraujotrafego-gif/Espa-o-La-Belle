/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'gestora' | 'recepcao' | 'profissional';

export interface UserPermissions {
  calendarAccess?: {
    pastDays?: boolean;       // dias anteriores
    todayOnly?: boolean;      // apenas o dia atual
    futureDays?: boolean;     // dias futuros
    pastMonth?: boolean;      // mês anterior
    currentMonth?: boolean;   // mês atual
    futureMonth?: boolean;    // mês futuro
  };
  viewServicesDone?: boolean; // verificar serviços feitos
  viewCommissions?: boolean;  // comissões
  viewValues?: boolean;       // valores
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  professionalId?: string; // Linked professional if role is 'profissional'
  permissions?: UserPermissions;
  isBlocked?: boolean; // Bloqueio de acesso
}

export interface Professional {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialties: string[];
  services: string[]; // IDs of services they perform
  workDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  workHours: {
    start: string; // "HH:MM"
    end: string;   // "HH:MM"
  };
  commission: number; // default commission percentage (e.g. 30)
  active: boolean;
  photo?: string;
  obs?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in minutes
  professionals: string[]; // IDs of professionals who perform this
  commission: number; // commission percentage specific to this service
  active: boolean;
  description?: string;
  hasMaintenance?: boolean;
  maintenanceDays?: number;
  productCost?: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  professionals: string[]; // List of professional IDs linked to this category
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  birthDate: string; // "YYYY-MM-DD"
  email?: string;
  address?: string;
  obs?: string;
  allergies?: string;
  lastVisit?: string; // "YYYY-MM-DD"
  nextMaintenance?: {
    date: string; // "YYYY-MM-DD"
    serviceName: string;
    notified: boolean;
  };
  status: 'ativo' | 'inativo';
}

export type BookingStatus =
  | 'agendado'
  | 'confirmado'
  | 'em_atendimento'
  | 'finalizado'
  | 'cancelado'
  | 'faltou'
  | 'reagendado';

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  professionalId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  endTime: string; // "HH:MM" (calculated automatically)
  duration: number; // minutes
  value: number; // price
  status: BookingStatus;
  obs?: string;
  isPaid: boolean;
  paymentDetails?: {
    method: string;
    gross: number;
    discount: number;
    discountProducts: number;
    addedValue: number;
    fee: number;
    net: number;
    commission: number;
    productsSold: Array<{ id: string; name: string; quantity: number; price: number }>;
    methodsSplit?: Array<{ method: string; value: number }>;
  };
}

export interface AgendaBlock {
  id: string;
  professionalId: string;
  professionalName: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  endTime: string; // "HH:MM"
  reason?: string;
}

export interface CashierTransaction {
  id: string;
  type: 'entrada' | 'saida' | 'sangria';
  description: string;
  value: number;
  category: string;
  date: string; // "YYYY-MM-DD HH:MM"
  paymentMethod?: string;
  isCheckout?: boolean;
}

export interface Cashier {
  isOpen: boolean;
  openedAt?: string; // "YYYY-MM-DD HH:MM"
  closedAt?: string; // "YYYY-MM-DD HH:MM"
  initialValue: number;
  closedValue?: number;
  transactions: CashierTransaction[];
  obs?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  cost: number;
  price: number; // for sale
  supplier: string;
  history: Array<{
    id: string;
    type: 'entrada' | 'saida' | 'ajuste';
    quantity: number;
    date: string; // "YYYY-MM-DD"
    obs?: string;
  }>;
}

export interface ServicePackageItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  sessionsUsed: number;
  pricePerSession: number;
  professionalId?: string; // Optional specific professional for this service in the package
  professionalName?: string; // Cache their name
}

export interface ServicePackage {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  servicesIncluded: string[]; // service IDs
  totalSessions: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  value: number;
  validityDate: string; // "YYYY-MM-DD"
  status: 'ativo' | 'concluido' | 'vencido';
  items?: ServicePackageItem[];
  usageHistory: Array<{
    date: string; // "YYYY-MM-DD HH:MM"
    serviceName: string;
    professionalName: string;
  }>;
}

export interface ServiceCombo {
  id: string;
  name: string;
  servicesIncluded: string[]; // service IDs
  originalPrice: number;
  promotionalPrice: number;
  totalDuration: number; // sum of durations
  professionals: string[]; // professional IDs that can perform this
  active: boolean;
}

export interface SalonSettings {
  name: string;
  logo: string;
  address: string;
  phone: string;
  salonName?: string;
  salonPhone?: string;
  salonAddress?: string;
  salonCNPJ?: string;
  cnpj?: string;
  workingHours?: {
    [key: string]: { isOpen: boolean; start: string; end: string }; // 'Monday', 'Tuesday', etc.
  };
  businessHours?: {
    start: string;
    end: string;
  };
  cardFees: {
    [key: string]: number; // e.g. credit: 2.5, debit: 1.5, pix: 0
  };
  defaultMessages: {
    confirmation: string;
    recall: string;
    reminder?: string;
    birthday?: string;
  };
  maintenanceRules?: {
    [category: string]: number; // days till return, e.g. "Alongamento de Unhas": 15
  };
}

export interface AppNotification {
  id: string;
  type: 'web_booking' | 'maintenance' | 'agenda_change' | 'pending_task';
  title: string;
  description: string;
  date: string;
  time: string;
  isRead: boolean;
  link?: string;
}

export interface BackupMetadata {
  id: string;
  timestamp: string; // ISO String
  size: number; // in bytes
  type: 'automatic' | 'manual';
  status: 'success' | 'failed';
  itemCount: {
    users?: number;
    clients?: number;
    bookings?: number;
    professionals?: number;
    services?: number;
    products?: number;
    packages?: number;
    combos?: number;
    categories?: number;
    agendaBlocks?: number;
    cashier?: number;
    settings?: number;
  };
  fileUrl?: string; // Bucket Storage download URL if successful
  errorMessage?: string;
}

export interface FCMToken {
  id: string;
  token: string;
  userId: string;
  userEmail: string;
  deviceType: string;
  createdAt: string;
  updatedAt: string;
}

export interface PushNotificationLedger {
  id: string;
  title: string;
  body: string;
  bookingId?: string;
  userId?: string;
  userEmail?: string;
  status: 'sent' | 'pending' | 'failed';
  error?: string;
  sentAt: string;
}


