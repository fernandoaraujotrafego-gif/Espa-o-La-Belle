/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User, Professional, Service, ServiceCategory, Client, Booking, Product,
  ServicePackage, ServicePackageItem, ServiceCombo, SalonSettings, Cashier, CashierTransaction, BookingStatus, AgendaBlock, AppNotification, BackupMetadata,
  FCMToken, PushNotificationLedger
} from '../types';
import {
  MOCK_USERS, INITIAL_SERVICES, INITIAL_PROFESSIONALS, INITIAL_CLIENTS,
  INITIAL_BOOKINGS, INITIAL_PRODUCTS, INITIAL_PACKAGES, INITIAL_COMBOS, DEFAULT_SETTINGS, INITIAL_NOTIFICATIONS
} from '../data/mockData';
import { 
  app,
  auth, 
  db, 
  bootstrapInitialUsers, 
  createNewUserAuth 
} from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot,
  getDocs,
  query
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AppContextType {
  currentUser: User | null;
  authLoading: boolean;
  firebaseAuthDisabled: boolean;
  professionals: Professional[];
  services: Service[];
  clients: Client[];
  bookings: Booking[];
  agendaBlocks: AgendaBlock[];
  products: Product[];
  packages: ServicePackage[];
  combos: ServiceCombo[];
  categories: ServiceCategory[];
  settings: SalonSettings;
  cashier: Cashier;
  login: (email: string, passwordOrRole: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  
  // Agenda Blocks CRUD
  addAgendaBlock: (block: Omit<AgendaBlock, 'id'>) => void;
  deleteAgendaBlock: (id: string) => void;

  // Professionals CRUD
  addProfessional: (prof: Omit<Professional, 'id'>) => void;
  updateProfessional: (id: string, prof: Partial<Professional>) => void;
  deleteProfessional: (id: string) => void;

  // Services CRUD
  addService: (srv: Omit<Service, 'id'>) => void;
  updateService: (id: string, srv: Partial<Service>) => void;
  deleteService: (id: string) => void;

  // Categories CRUD
  addCategory: (cat: Omit<ServiceCategory, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<ServiceCategory>) => void;
  deleteCategory: (id: string) => void;

  // Clients CRUD
  addClient: (cli: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, cli: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  searchClients: (query: string) => Client[];

  // Bookings CRUD & Helpers
  addBooking: (bk: Omit<Booking, 'id' | 'endTime'>, ignoreConflict?: boolean) => { success: boolean; message: string; booking?: Booking; isConflict?: boolean };
  updateBooking: (id: string, bk: Partial<Booking>) => { success: boolean; message: string };
  deleteBooking: (id: string) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  checkScheduleConflict: (date: string, time: string, duration: number, professionalId: string, excludeBookingId?: string) => boolean;
  checkoutBooking: (
    bookingId: string,
    paymentDetails: {
      method: string;
      discount: number;
      discountProducts: number;
      addedValue: number;
      productsSold: Array<{ id: string; quantity: number; price: number }>;
      obs?: string;
      methodsSplit?: Array<{ method: string; value: number }>;
    }
  ) => void;

  // Products CRUD
  addProduct: (prod: Omit<Product, 'id' | 'history'>) => void;
  updateProduct: (id: string, prod: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, quantity: number, type: 'entrada' | 'saida' | 'ajuste', obs?: string) => void;

  // Packages CRUD
  sellPackage: (clientId: string, clientName: string, name: string, value: number, servicesIncluded: string[], validityMonths: number, items?: ServicePackageItem[]) => void;
  updatePackage: (id: string, fields: Partial<ServicePackage>) => void;
  deletePackage: (id: string) => void;
  usePackageSession: (packageId: string, serviceName: string, professionalName: string) => void;

  // Combos CRUD
  addCombo: (combo: Omit<ServiceCombo, 'id'>) => void;
  updateCombo: (id: string, combo: Partial<ServiceCombo>) => void;
  deleteCombo: (id: string) => void;

  // Cashier Controls
  openCashier: (initialValue: number) => void;
  closeCashier: (closedValue: number, obs?: string) => void;
  addCashierTransaction: (type: 'entrada' | 'saida' | 'sangria', description: string, value: number, category: string, paymentMethod?: string, isCheckout?: boolean) => void;

  // Settings
  updateSettings: (newSettings: Partial<SalonSettings>) => void;

  // Users CRUD
  users: User[];
  addUser: (user: Omit<User, 'id'>, password?: string) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Notification lists
  getBirthdayList: () => Client[];
  getLowStockProducts: () => Product[];
  getUpcomingMaintenanceList: () => Array<{
    client: Client;
    date: string;
    serviceName: string;
    category: string;
    lastServiceDate: string;
    lastServiceTime: string;
    professionalName: string;
    overdue: boolean;
  }>;

  // Real-time Topbar Notifications System
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'time' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearReadNotifications: () => void;
  deleteAppNotification: (id: string) => void;

  // Backups
  backupsList: BackupMetadata[];
  createBackup: (type: 'automatic' | 'manual') => Promise<BackupMetadata>;
  restoreBackup: (backupData: any) => Promise<boolean>;
  deleteBackup: (id: string) => Promise<void>;
  backupSettings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    lastBackup: string | null;
  };
  setBackupSettings: React.Dispatch<React.SetStateAction<{
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    lastBackup: string | null;
  }>>;

  // FCM / Push Notifications
  fcmTokensList: FCMToken[];
  pushNotificationsList: PushNotificationLedger[];
  registerFCMToken: (token: string, deviceType: string) => Promise<boolean>;
  deleteFCMToken: (id: string) => Promise<boolean>;
  sendPushNotification: (title: string, body: string, bookingId?: string, targetUserId?: string, targetUserEmail?: string) => Promise<boolean>;
  clearNotificationsLedger: () => Promise<boolean>;
  
  // PWA Connection State
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper functions for dates and time arithmetic
export function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function shiftDate(originalDateStr: string): string {
  if (!originalDateStr) return originalDateStr;
  
  // Check if it's YYYY-MM-DD HH:MM
  const matchWithTime = originalDateStr.match(/^2026-07-(\d{2})\s+(\d{2}):(\d{2})/);
  if (matchWithTime) {
    const dayNum = parseInt(matchWithTime[1], 10);
    const offset = dayNum - 7;
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const datePart = d.toISOString().split('T')[0];
    return `${datePart} ${matchWithTime[2]}:${matchWithTime[3]}`;
  }

  // Check if it's format YYYY-MM-DD
  const match = originalDateStr.match(/^2026-07-(\d{2})/);
  if (match) {
    const dayNum = parseInt(match[1], 10);
    const offset = dayNum - 7;
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  }
  
  return originalDateStr;
}

export function shiftBirthDate(originalBirthDateStr: string): string {
  if (!originalBirthDateStr) return originalBirthDateStr;
  // If birthDate ends with -07-07, make it end with today's month and day to trigger birthday list
  if (originalBirthDateStr.endsWith('-07-07')) {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${originalBirthDateStr.slice(0, 4)}-${mm}-${dd}`;
  }
  return originalBirthDateStr;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Conexão PWA restabelecida!');
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Dispositivo PWA offline!');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseAuthDisabled, setFirebaseAuthDisabled] = useState(false);

  // Helper to ensure a user has a Firestore profile doc.
  // Especially useful for default seed users who have Auth accounts but might not have Firestore docs yet.
  const ensureUserProfile = async (uid: string, email: string | null): Promise<User | null> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      let userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() && email) {
        const lowerEmail = email.toLowerCase();
        let defaultRole: string | null = null;
        let defaultName = '';
        let professionalId: string | undefined = undefined;

        if (lowerEmail === 'admin@labelle.com' || lowerEmail === 'fernandoaraujotrafego@gmail.com') {
          defaultRole = 'admin';
          defaultName = lowerEmail === 'admin@labelle.com' ? 'Juliana Medeiros (Admin)' : 'Fernando Araújo (Admin)';
        } else if (lowerEmail === 'gestora@labelle.com') {
          defaultRole = 'gestora';
          defaultName = 'Patrícia Rocha (Gestora)';
        } else if (lowerEmail === 'recepcao@labelle.com') {
          defaultRole = 'recepcao';
          defaultName = 'Bruna Dias (Recepção)';
        } else if (lowerEmail === 'profissional@labelle.com') {
          defaultRole = 'profissional';
          defaultName = 'Camila Silva (Nails Designer)';
          professionalId = 'prof-1';
        } else {
          // Robust fallback for other/custom email accounts during testing
          defaultRole = 'admin';
          defaultName = `Usuário (${email.split('@')[0]})`;
        }

        if (defaultRole) {
          const defaultPayload: any = {
            id: uid,
            name: defaultName,
            email: email,
            role: defaultRole,
            isBlocked: false,
          };
          if (professionalId) {
            defaultPayload.professionalId = professionalId;
          }
          await setDoc(userDocRef, defaultPayload);
          userDoc = await getDoc(userDocRef); // Re-fetch
        }
      }

      if (userDoc.exists()) {
        return { ...userDoc.data(), id: uid } as User;
      }
    } catch (err) {
      console.error('Erro ao verificar/criar perfil de usuário:', err);
    }
    return null;
  };

  const [professionals, setProfessionals] = useState<Professional[]>(() => {
    const saved = localStorage.getItem('belle_professionals');
    return saved ? JSON.parse(saved) : INITIAL_PROFESSIONALS;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('belle_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('belle_clients');
    const rawClients = saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    return rawClients.map((c: Client) => ({
      ...c,
      birthDate: shiftBirthDate(c.birthDate),
      lastVisit: shiftDate(c.lastVisit)
    }));
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('belle_bookings');
    const rawBookings = saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    const seen = new Set<string>();
    const uniqueBookings = rawBookings.filter((b: Booking) => {
      if (!b || !b.id) return false;
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
    return uniqueBookings.map((b: Booking) => ({
      ...b,
      date: shiftDate(b.date)
    }));
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('belle_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [packages, setPackages] = useState<ServicePackage[]>(() => {
    const saved = localStorage.getItem('belle_packages');
    return saved ? JSON.parse(saved) : INITIAL_PACKAGES;
  });

  const [combos, setCombos] = useState<ServiceCombo[]>(() => {
    const saved = localStorage.getItem('belle_combos');
    return saved ? JSON.parse(saved) : INITIAL_COMBOS;
  });

  const [categories, setCategories] = useState<ServiceCategory[]>(() => {
    const saved = localStorage.getItem('belle_categories');
    if (saved) return JSON.parse(saved);
    // Initialize default categories based on the current mock data categories & professionals linked to those services
    const cats: ServiceCategory[] = [
      { id: 'cat-1', name: 'Manicure e Pedicure', professionals: ['prof-1', 'prof-3'] },
      { id: 'cat-2', name: 'Alongamento de Unhas', professionals: ['prof-1'] },
      { id: 'cat-3', name: 'Banho de Gel', professionals: ['prof-1'] },
      { id: 'cat-4', name: 'Cílios', professionals: ['prof-2'] },
      { id: 'cat-5', name: 'Sobrancelhas', professionals: ['prof-2', 'prof-3'] },
      { id: 'cat-6', name: 'Cabeleireiro', professionals: ['prof-3'] },
      { id: 'cat-7', name: 'Depilação', professionals: ['prof-2'] },
      { id: 'cat-8', name: 'Estética Facial', professionals: ['prof-2'] }
    ];
    return cats;
  });

  const [agendaBlocks, setAgendaBlocks] = useState<AgendaBlock[]>(() => {
    const saved = localStorage.getItem('belle_agenda_blocks');
    const rawBlocks = saved ? JSON.parse(saved) : [
      {
        id: 'block-1',
        professionalId: 'prof-2',
        professionalName: 'Amanda Costa',
        date: '2026-07-07',
        time: '12:00',
        endTime: '13:00',
        reason: 'Almoço'
      },
      {
        id: 'block-2',
        professionalId: 'prof-3',
        professionalName: 'Beatriz Reis',
        date: '2026-07-07',
        time: '08:30',
        endTime: '11:00',
        reason: 'Não vem de manhã'
      }
    ];
    return rawBlocks.map((ab: AgendaBlock) => ({
      ...ab,
      date: shiftDate(ab.date)
    }));
  });

  const [settings, setSettings] = useState<SalonSettings>(() => {
    const saved = localStorage.getItem('belle_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [cashier, setCashier] = useState<Cashier>(() => {
    const saved = localStorage.getItem('belle_cashier');
    let rawCashier;
    if (saved) {
      try {
        rawCashier = JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    if (!rawCashier) {
      const initialTransactions: CashierTransaction[] = [
        {
          id: 'tx-1',
          type: 'entrada',
          description: 'Venda de procedimento: Banho de Gel (Mariana Souza)',
          value: 80.00,
          category: 'Serviço',
          date: '2026-07-07 10:15',
          paymentMethod: 'Pix',
          isCheckout: true
        }
      ];
      rawCashier = {
        isOpen: true,
        openedAt: '2026-07-07 08:00',
        initialValue: 150.00,
        transactions: initialTransactions,
        obs: 'Caixa de abertura padrão'
      };
    }
    
    if (rawCashier) {
      if (rawCashier.openedAt) {
        rawCashier.openedAt = shiftDate(rawCashier.openedAt);
      }
      if (rawCashier.closedAt) {
        rawCashier.closedAt = shiftDate(rawCashier.closedAt);
      }
      if (Array.isArray(rawCashier.transactions)) {
        const seen = new Set<string>();
        rawCashier.transactions = rawCashier.transactions.map((t: any, index: number) => {
          let txId = t.id;
          if (!txId || seen.has(txId)) {
            txId = `${txId || 'tx'}-${Date.now()}-${index}-${Math.floor(Math.random() * 1000000)}`;
          }
          seen.add(txId);
          return {
            ...t,
            id: txId,
            date: shiftDate(t.date)
          };
        });
      }
    }
    return rawCashier;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('belle_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Firebase Auth and Firestore Users Synchronization
  useEffect(() => {
    // Run bootstrap once to ensure default Auth accounts are populated
    bootstrapInitialUsers().then((isDisabled) => {
      if (isDisabled) {
        setFirebaseAuthDisabled(true);
      }
    });

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await ensureUserProfile(firebaseUser.uid, firebaseUser.email);

          if (userData) {
            if (userData.isBlocked) {
              console.warn('Usuário bloqueado. Desconectando...');
              await signOut(auth);
              setCurrentUser(null);
            } else {
              setCurrentUser(userData);
            }
          } else {
            console.error('Documento de usuário no Firestore não encontrado.');
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Erro ao buscar perfil do usuário no Firestore:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Real-time listener for the entire users list (ONLY FOR ADMINS)
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      setUsers([]);
      return;
    }

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetchedUsers: User[] = [];
      snapshot.forEach(docSnap => {
        fetchedUsers.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      setUsers(fetchedUsers);
    }, (err) => {
      console.error('Erro na escuta de usuários do Firestore:', err);
    });

    return () => {
      unsubscribeUsers();
    };
  }, [currentUser]);

  // Real-time listener for current user's profile and block status (FOR EVERYONE)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeSelf = onSnapshot(doc(db, 'users', currentUser.id), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        if (userData.isBlocked) {
          console.warn('Sua conta foi bloqueada.');
          signOut(auth);
          setCurrentUser(null);
        } else {
          setCurrentUser({ ...userData, id: currentUser.id });
        }
      } else {
        // Doc deleted
        signOut(auth);
        setCurrentUser(null);
      }
    }, (err) => {
      console.error('Erro na escuta do próprio usuário:', err);
    });

    return () => {
      unsubscribeSelf();
    };
  }, [currentUser?.id]);

  // Listeners for real-time synchronization with Firestore
  useEffect(() => {
    if (!currentUser) return;

    // 1. Professionals
    const unsubProfessionals = onSnapshot(collection(db, 'professionals'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial professionals...');
        for (const p of INITIAL_PROFESSIONALS) {
          try {
            await setDoc(doc(db, 'professionals', p.id), p);
          } catch (err) {
            console.error('Error seeding professional:', p.id, err);
          }
        }
      } else {
        const list: Professional[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data() } as Professional);
        });
        setProfessionals(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'professionals');
    });

    // 2. Services
    const unsubServices = onSnapshot(collection(db, 'services'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial services...');
        for (const s of INITIAL_SERVICES) {
          try {
            await setDoc(doc(db, 'services', s.id), s);
          } catch (err) {
            console.error('Error seeding service:', s.id, err);
          }
        }
      } else {
        const list: Service[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data() } as Service);
        });
        setServices(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'services');
    });

    // 3. Clients
    const unsubClients = onSnapshot(collection(db, 'clients'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial clients...');
        for (const c of INITIAL_CLIENTS) {
          try {
            const shiftedC = {
              ...c,
              birthDate: shiftBirthDate(c.birthDate),
              lastVisit: shiftDate(c.lastVisit)
            };
            await setDoc(doc(db, 'clients', c.id), shiftedC);
          } catch (err) {
            console.error('Error seeding client:', c.id, err);
          }
        }
      } else {
        const list: Client[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data() } as Client);
        });
        setClients(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'clients');
    });

    // 4. Bookings
    const unsubBookings = onSnapshot(collection(db, 'bookings'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial bookings...');
        for (const b of INITIAL_BOOKINGS) {
          try {
            const shiftedB = {
              ...b,
              date: shiftDate(b.date)
            };
            await setDoc(doc(db, 'bookings', b.id), shiftedB);
          } catch (err) {
            console.error('Error seeding booking:', b.id, err);
          }
        }
      } else {
        const list: Booking[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data() } as Booking);
        });
        setBookings(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'bookings');
    });

    // 5. Products
    const unsubProducts = onSnapshot(collection(db, 'products'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial products...');
        for (const p of INITIAL_PRODUCTS) {
          try {
            await setDoc(doc(db, 'products', p.id), p);
          } catch (err) {
            console.error('Error seeding product:', p.id, err);
          }
        }
      } else {
        const list: Product[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data() } as Product);
        });
        setProducts(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'products');
    });

    // 6. Packages
    const unsubPackages = onSnapshot(collection(db, 'packages'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial packages...');
        for (const pkg of INITIAL_PACKAGES) {
          try {
            await setDoc(doc(db, 'packages', pkg.id), pkg);
          } catch (err) {
            console.error('Error seeding package:', pkg.id, err);
          }
        }
      } else {
        const list: ServicePackage[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data() } as ServicePackage);
        });
        setPackages(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'packages');
    });

    // 7. Combos
    const unsubCombos = onSnapshot(collection(db, 'combos'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial combos...');
        for (const comb of INITIAL_COMBOS) {
          try {
            await setDoc(doc(db, 'combos', comb.id), comb);
          } catch (err) {
            console.error('Error seeding combo:', comb.id, err);
          }
        }
      } else {
        const list: ServiceCombo[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data() } as ServiceCombo);
        });
        setCombos(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'combos');
    });

    // 8. Categories
    const unsubCategories = onSnapshot(collection(db, 'categories'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial categories...');
        const initialCats: ServiceCategory[] = [
          { id: 'cat-1', name: 'Manicure e Pedicure', professionals: ['prof-1', 'prof-3'] },
          { id: 'cat-2', name: 'Alongamento de Unhas', professionals: ['prof-1'] },
          { id: 'cat-3', name: 'Banho de Gel', professionals: ['prof-1'] },
          { id: 'cat-4', name: 'Cílios', professionals: ['prof-2'] },
          { id: 'cat-5', name: 'Sobrancelhas', professionals: ['prof-2', 'prof-3'] },
          { id: 'cat-6', name: 'Cabeleireiro', professionals: ['prof-3'] },
          { id: 'cat-7', name: 'Depilação', professionals: ['prof-2'] },
          { id: 'cat-8', name: 'Estética Facial', professionals: ['prof-2'] }
        ];
        for (const cat of initialCats) {
          try {
            await setDoc(doc(db, 'categories', cat.id), cat);
          } catch (err) {
            console.error('Error seeding category:', cat.id, err);
          }
        }
      } else {
        const list: ServiceCategory[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data() } as ServiceCategory);
        });
        setCategories(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'categories');
    });

    // 9. Agenda Blocks
    const unsubAgendaBlocks = onSnapshot(collection(db, 'agenda_blocks'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial agenda blocks...');
        const initialBlocks = [
          {
            id: 'block-1',
            professionalId: 'prof-2',
            professionalName: 'Amanda Costa',
            date: '2026-07-07',
            time: '12:00',
            endTime: '13:00',
            reason: 'Almoço'
          },
          {
            id: 'block-2',
            professionalId: 'prof-3',
            professionalName: 'Beatriz Reis',
            date: '2026-07-07',
            time: '08:30',
            endTime: '11:00',
            reason: 'Não vem de manhã'
          }
        ].map(ab => ({ ...ab, date: shiftDate(ab.date) }));
        for (const ab of initialBlocks) {
          try {
            await setDoc(doc(db, 'agenda_blocks', ab.id), ab);
          } catch (err) {
            console.error('Error seeding agenda block:', ab.id, err);
          }
        }
      } else {
        const list: AgendaBlock[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data() } as AgendaBlock);
        });
        setAgendaBlocks(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'agenda_blocks');
    });

    // 10. Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'salon'), async (docSnap) => {
      if (!docSnap.exists()) {
        console.log('Seeding initial settings...');
        try {
          await setDoc(doc(db, 'settings', 'salon'), DEFAULT_SETTINGS);
        } catch (err) {
          console.error('Error seeding settings:', err);
        }
      } else {
        setSettings(docSnap.data() as SalonSettings);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings');
    });

    // 11. Cashier
    const unsubCashier = onSnapshot(doc(db, 'cashier', 'current'), async (docSnap) => {
      if (!docSnap.exists()) {
        console.log('Seeding initial cashier...');
        const initialTransactions: CashierTransaction[] = [
          {
            id: 'tx-1',
            type: 'entrada',
            description: 'Venda de procedimento: Banho de Gel (Mariana Souza)',
            value: 80.00,
            category: 'Serviço',
            date: '2026-07-07 10:15',
            paymentMethod: 'Pix',
            isCheckout: true
          }
        ];
        const initialCashierObj = {
          isOpen: true,
          openedAt: '2026-07-07 08:00',
          initialValue: 150.00,
          transactions: initialTransactions,
          obs: 'Caixa de abertura padrão'
        };
        try {
          await setDoc(doc(db, 'cashier', 'current'), initialCashierObj);
        } catch (err) {
          console.error('Error seeding cashier:', err);
        }
      } else {
        setCashier(docSnap.data() as Cashier);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'cashier');
    });

    // 12. Notifications
    const unsubNotifications = onSnapshot(collection(db, 'notifications'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial notifications...');
        for (const notif of INITIAL_NOTIFICATIONS) {
          try {
            await setDoc(doc(db, 'notifications', notif.id), notif);
          } catch (err) {
            console.error('Error seeding notification:', notif.id, err);
          }
        }
      } else {
        const list: AppNotification[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data() } as AppNotification);
        });
        setNotifications(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'notifications');
    });

    return () => {
      unsubProfessionals();
      unsubServices();
      unsubClients();
      unsubBookings();
      unsubProducts();
      unsubPackages();
      unsubCombos();
      unsubCategories();
      unsubAgendaBlocks();
      unsubSettings();
      unsubCashier();
      unsubNotifications();
    };
  }, [currentUser]);

  // --- BACKUPS SYSTEM AND ROTATION ---
  const [backupsList, setBackupsList] = useState<BackupMetadata[]>([]);
  const [backupSettings, setBackupSettings] = useState<{
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    lastBackup: string | null;
  }>(() => {
    const saved = localStorage.getItem('belle_backup_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      frequency: 'daily',
      lastBackup: null
    };
  });

  useEffect(() => {
    localStorage.setItem('belle_backup_settings', JSON.stringify(backupSettings));
  }, [backupSettings]);

  // FCM / Push Notifications States
  const [fcmTokensList, setFcmTokensList] = useState<FCMToken[]>([]);
  const [pushNotificationsList, setPushNotificationsList] = useState<PushNotificationLedger[]>([]);

  // Listen to Firestore backups collection in real-time
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      setBackupsList([]);
      return;
    }

    const unsubscribeBackups = onSnapshot(collection(db, 'backups'), (snapshot) => {
      const fetchedBackups: BackupMetadata[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        fetchedBackups.push({
          id: docSnap.id,
          timestamp: data.timestamp,
          size: data.size,
          type: data.type,
          status: data.status,
          itemCount: data.itemCount,
          fileUrl: data.fileUrl,
          errorMessage: data.errorMessage
        } as BackupMetadata);
      });
      // Sort newest first
      fetchedBackups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setBackupsList(fetchedBackups);
    }, (err) => {
      console.error('Erro na escuta de backups do Firestore:', err);
    });

    return () => {
      unsubscribeBackups();
    };
  }, [currentUser]);

  // Listen to Firestore fcm_tokens collection
  useEffect(() => {
    if (!currentUser) {
      setFcmTokensList([]);
      return;
    }

    const unsubscribeTokens = onSnapshot(collection(db, 'fcm_tokens'), (snapshot) => {
      const tokens: FCMToken[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        tokens.push({
          id: docSnap.id,
          token: data.token,
          userId: data.userId,
          userEmail: data.userEmail,
          deviceType: data.deviceType,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as FCMToken);
      });
      setFcmTokensList(tokens);
    }, (err) => {
      console.error('Erro na escuta de tokens FCM:', err);
    });

    return () => unsubscribeTokens();
  }, [currentUser]);

  // Listen to Firestore push_notifications collection
  useEffect(() => {
    if (!currentUser) {
      setPushNotificationsList([]);
      return;
    }

    const unsubscribePushLogs = onSnapshot(collection(db, 'push_notifications'), (snapshot) => {
      const logs: PushNotificationLedger[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        logs.push({
          id: docSnap.id,
          title: data.title,
          body: data.body,
          bookingId: data.bookingId,
          userId: data.userId,
          userEmail: data.userEmail,
          status: data.status,
          error: data.error,
          sentAt: data.sentAt
        } as PushNotificationLedger);
      });
      // Sort newest first
      logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      setPushNotificationsList(logs);
    }, (err) => {
      console.error('Erro na escuta de push notifications:', err);
    });

    return () => unsubscribePushLogs();
  }, [currentUser]);

  // Automatic Backup Routine Check
  useEffect(() => {
    if (!backupSettings.enabled || !currentUser || currentUser.role !== 'admin') return;

    const checkAndRunAutoBackup = async () => {
      const now = new Date();
      const last = backupSettings.lastBackup ? new Date(backupSettings.lastBackup) : null;
      let shouldBackup = false;

      if (!last) {
        shouldBackup = true;
      } else {
        const diffTime = Math.abs(now.getTime() - last.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (backupSettings.frequency === 'daily' && diffDays >= 1) {
          shouldBackup = true;
        } else if (backupSettings.frequency === 'weekly' && diffDays >= 7) {
          shouldBackup = true;
        } else if (backupSettings.frequency === 'monthly' && diffDays >= 30) {
          shouldBackup = true;
        }
      }

      if (shouldBackup) {
        console.log('Iniciando backup automático periódico...');
        try {
          await createBackup('automatic');
        } catch (err) {
          console.error('Falha no backup automático periódico:', err);
        }
      }
    };

    const timer = setTimeout(() => {
      checkAndRunAutoBackup();
    }, 10000); // 10s after mount

    return () => clearTimeout(timer);
  }, [backupSettings.lastBackup, backupSettings.enabled, backupSettings.frequency, currentUser?.id]);

  // Backups Logic
  const createBackup = async (type: 'automatic' | 'manual'): Promise<BackupMetadata> => {
    const timestamp = new Date().toISOString();
    const backupId = `bk_${Date.now()}`;
    
    const backupPayload = {
      version: '1.0.0',
      timestamp,
      data: {
        users,
        clients,
        bookings,
        professionals,
        services,
        products,
        packages,
        combos,
        categories,
        agendaBlocks,
        settings,
        cashier,
        notifications
      }
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const size = jsonString.length;

    let fileUrl = '';
    let status: 'success' | 'failed' = 'success';
    let errorMessage = '';

    // 1. Attempt upload to Firebase Storage Bucket
    try {
      const storage = getStorage(app);
      const fileName = `backups/backup_${type}_${Date.now()}.json`;
      const storageRef = ref(storage, fileName);
      await uploadString(storageRef, jsonString, 'raw', {
        contentType: 'application/json'
      });
      fileUrl = await getDownloadURL(storageRef);
      console.log('Backup salvo com sucesso no Firebase Storage:', fileUrl);
    } catch (err: any) {
      console.warn('Erro ao salvar no Firebase Storage (pode ser restrição de regras ou bucket inativo):', err);
    }

    // 2. Save document record on Firestore backups collection
    const backupDoc: any = {
      id: backupId,
      timestamp,
      size,
      type,
      status,
      itemCount: {
        users: users.length,
        clients: clients.length,
        bookings: bookings.length,
        professionals: professionals.length,
        services: services.length,
        products: products.length,
        packages: packages.length,
        combos: combos.length,
        categories: categories.length,
        agendaBlocks: agendaBlocks.length,
        cashier: (cashier?.transactions || []).length,
        settings: 1
      },
      fileUrl: fileUrl || "",
      payload: size < 800000 ? jsonString : 'Payload too large for Firestore document (>800KB). Available via Storage/Download.'
    };

    try {
      await setDoc(doc(db, 'backups', backupId), backupDoc);
    } catch (err: any) {
      console.error('Erro ao registrar backup no Firestore:', err);
      status = 'failed';
      errorMessage = err.message || String(err);
      
      const localBackups = JSON.parse(localStorage.getItem('belle_local_backups_log') || '[]');
      localBackups.push({
        id: backupId,
        timestamp,
        size,
        type,
        status: 'failed',
        errorMessage: 'Firestore persist failed: ' + errorMessage,
        itemCount: backupDoc.itemCount
      });
      localStorage.setItem('belle_local_backups_log', JSON.stringify(localBackups));
    }

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      size,
      type,
      status,
      itemCount: backupDoc.itemCount,
      fileUrl: fileUrl || undefined,
      errorMessage: errorMessage || undefined
    };

    if (status === 'success') {
      setBackupSettings(prev => ({
        ...prev,
        lastBackup: timestamp
      }));

      addNotification({
        type: 'pending_task',
        title: `Backup ${type === 'automatic' ? 'Automático' : 'Manual'} Realizado`,
        description: `Snapshot de segurança do Espaço La Belle salvo com sucesso (${(size / 1024).toFixed(1)} KB).`,
        link: '/configuracoes'
      });
    }

    return metadata;
  };

  const restoreBackup = async (backupData: any): Promise<boolean> => {
    try {
      if (!backupData || !backupData.data) {
        throw new Error('Formato de backup inválido.');
      }

      const d = backupData.data;

      if (Array.isArray(d.professionals)) setProfessionals(d.professionals);
      if (Array.isArray(d.services)) setServices(d.services);
      if (Array.isArray(d.clients)) setClients(d.clients);
      if (Array.isArray(d.bookings)) setBookings(d.bookings);
      if (Array.isArray(d.products)) setProducts(d.products);
      if (Array.isArray(d.packages)) setPackages(d.packages);
      if (Array.isArray(d.combos)) setCombos(d.combos);
      if (Array.isArray(d.categories)) setCategories(d.categories);
      if (Array.isArray(d.agendaBlocks)) setAgendaBlocks(d.agendaBlocks);
      if (d.settings && typeof d.settings === 'object') setSettings(d.settings);
      if (d.cashier && typeof d.cashier === 'object') setCashier(d.cashier);
      if (Array.isArray(d.notifications)) setNotifications(d.notifications);

      if (Array.isArray(d.users)) {
        for (const u of d.users) {
          try {
            await setDoc(doc(db, 'users', u.id), {
              name: u.name,
              email: u.email,
              role: u.role,
              isBlocked: u.isBlocked || false,
              permissions: u.permissions || null,
              professionalId: u.professionalId || null
            });
          } catch (err) {
            console.error('Erro ao restaurar usuário:', u.email, err);
          }
        }
      }

      addNotification({
        type: 'agenda_change',
        title: 'Restauração de Dados Efetuada',
        description: `Os dados do sistema foram restaurados com sucesso para o snapshot de ${new Date(backupData.timestamp).toLocaleString('pt-BR')}.`,
        link: '/configuracoes'
      });

      return true;
    } catch (err: any) {
      console.error('Falha ao restaurar backup:', err);
      alert(`Falha na restauração dos dados: ${err.message || err}`);
      return false;
    }
  };

  const deleteBackup = async (id: string): Promise<void> => {
    try {
      const backupSnap = await getDoc(doc(db, 'backups', id));
      if (backupSnap.exists()) {
        const backupData = backupSnap.data();
        if (backupData.fileUrl) {
          try {
            const storage = getStorage(app);
            const fileRef = ref(storage, backupData.fileUrl);
            await deleteObject(fileRef);
          } catch (storageErr) {
            console.warn('Erro ao deletar do Storage (não obstrutivo):', storageErr);
          }
        }
      }
      await deleteDoc(doc(db, 'backups', id));
    } catch (err) {
      console.error('Erro ao deletar registro de backup do Firestore:', err);
      throw err;
    }
  };

  // Function to register/update user FCM token in Firestore
  const registerFCMToken = async (token: string, deviceType: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const tokenId = `tok_${currentUser.id}_${token.substring(0, 10)}`;
      const tokenDoc: FCMToken = {
        id: tokenId,
        token: token,
        userId: currentUser.id,
        userEmail: currentUser.email,
        deviceType: deviceType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'fcm_tokens', tokenId), tokenDoc);
      return true;
    } catch (err) {
      console.error('Erro ao registrar token FCM no Firestore:', err);
      return false;
    }
  };

  // Function to delete FCM token
  const deleteFCMToken = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'fcm_tokens', id));
      return true;
    } catch (err) {
      console.error('Erro ao deletar token FCM no Firestore:', err);
      return false;
    }
  };

  // Function to dispatch push notification log and fire native notification if possible
  const sendPushNotification = async (
    title: string,
    body: string,
    bookingId?: string,
    targetUserId?: string,
    targetUserEmail?: string
  ): Promise<boolean> => {
    try {
      const notificationId = `push_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      let notificationStatus: 'sent' | 'failed' = 'sent';
      let errorMsg = '';
      
      // Request native browser notification if allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, { body });
        } catch (e: any) {
          console.warn('Unable to trigger native notification in sandboxed iframe.', e);
        }
      }

      const newLog: PushNotificationLedger = {
        id: notificationId,
        title,
        body,
        bookingId,
        userId: targetUserId || currentUser?.id || '',
        userEmail: targetUserEmail || currentUser?.email || '',
        status: notificationStatus,
        error: errorMsg || undefined,
        sentAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'push_notifications', notificationId), newLog);
      return true;
    } catch (err: any) {
      console.error('Erro ao salvar log de push notification no Firestore:', err);
      return false;
    }
  };

  // Function to clear history of push notifications
  const clearNotificationsLedger = async (): Promise<boolean> => {
    try {
      const snapshot = await getDocs(collection(db, 'push_notifications'));
      const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'push_notifications', docSnap.id)));
      await Promise.all(deletePromises);
      return true;
    } catch (err) {
      console.error('Erro ao limpar histórico de push notifications:', err);
      return false;
    }
  };

  // Login/Logout Actions
  const login = async (email: string, passwordOrRole: string): Promise<boolean> => {
    try {
      // 1. Perform Auth sign in using email and password
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, passwordOrRole);
      } catch (signInError: any) {
        // Smart self-healing fallback for migration
        let fallbackPassword = '';
        const lowerEmail = email.toLowerCase();
        if (passwordOrRole === '123') {
          if (lowerEmail === 'admin@labelle.com' || lowerEmail === 'fernandoaraujotrafego@gmail.com') fallbackPassword = 'admin123';
          else if (lowerEmail === 'gestora@labelle.com') fallbackPassword = 'gestora123';
          else if (lowerEmail === 'recepcao@labelle.com') fallbackPassword = 'recepcao123';
          else if (lowerEmail === 'profissional@labelle.com') fallbackPassword = 'profissional123';
        }

        if (fallbackPassword) {
          try {
            userCredential = await signInWithEmailAndPassword(auth, email, fallbackPassword);
            // If logged in with the old fallback password, seamlessly update it to '123'
            try {
              const { updatePassword } = await import('firebase/auth');
              await updatePassword(userCredential.user, '123');
              console.log('Password successfully migrated to "123" for:', email);
            } catch (updateErr) {
              console.error('Error migrating password to "123":', updateErr);
            }
          } catch (fallbackError) {
            // Fallback failed, proceed to on-demand registration or original error
          }
        }

        if (!userCredential) {
          // If login fails because account doesn't exist, try to register them on-the-fly!
          // This is extremely useful for seed accounts or custom test users.
          if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/user-not-found') {
            try {
              userCredential = await createUserWithEmailAndPassword(auth, email, passwordOrRole);
              console.log('Usuário registrado sob demanda durante o login:', email);
            } catch (signUpError: any) {
              // If sign up fails because the email is already in use, it means the password entered was actually incorrect
              throw signInError;
            }
          } else {
            throw signInError;
          }
        }
      }

      const uid = userCredential.user.uid;

      // 2. Ensure profile exists and retrieve it
      const userData = await ensureUserProfile(uid, email);

      if (userData) {
        if (userData.isBlocked) {
          await signOut(auth);
          throw new Error('Acesso Bloqueado. Sua conta foi suspensa por um administrador.');
        }
        setCurrentUser(userData);
        return true;
      } else {
        await signOut(auth);
        throw new Error('Perfil de usuário não encontrado no sistema.');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Erro no reenvio de senha:', error);
      throw error;
    }
  };

  // Users CRUD
  const addUser = async (user: Omit<User, 'id'>, password?: string): Promise<void> => {
    try {
      const pwd = password || 'labelle123'; // fallback default password if not provided
      // Create user auth in Firebase (using secondary app so as not to disconnect current admin)
      const uid = await createNewUserAuth(user.email, pwd);
      
      // Save user payload to Firestore 'users' collection
      const userDocRef = doc(db, 'users', uid);
      const userPayload = {
        ...user,
        id: uid,
      };
      // Make sure we never store password in Firestore as requested
      if ('password' in userPayload) {
        delete (userPayload as any).password;
      }
      
      await setDoc(userDocRef, userPayload);
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updatedFields: Partial<User>): Promise<void> => {
    try {
      const userDocRef = doc(db, 'users', id);
      const fieldsToUpdate = { ...updatedFields };
      // Make sure we never store password in Firestore as requested
      if ('password' in fieldsToUpdate) {
        delete fieldsToUpdate.password;
      }
      
      await updateDoc(userDocRef, fieldsToUpdate);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      const userDocRef = doc(db, 'users', id);
      await deleteDoc(userDocRef);
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  };

  // Agenda Blocks CRUD
  const addAgendaBlock = async (block: Omit<AgendaBlock, 'id'>) => {
    try {
      const id = `block-${Date.now()}`;
      const newBlock = { ...block, id };
      await setDoc(doc(db, 'agenda_blocks', id), newBlock);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `agenda_blocks/${Date.now()}`);
    }
  };

  const deleteAgendaBlock = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'agenda_blocks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `agenda_blocks/${id}`);
    }
  };

  // Professionals CRUD
  const addProfessional = async (prof: Omit<Professional, 'id'>) => {
    try {
      const id = `prof-${Date.now()}`;
      const newProf = { ...prof, id };
      await setDoc(doc(db, 'professionals', id), newProf);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `professionals/${Date.now()}`);
    }
  };

  const updateProfessional = async (id: string, prof: Partial<Professional>) => {
    try {
      await updateDoc(doc(db, 'professionals', id), prof);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `professionals/${id}`);
    }
  };

  const deleteProfessional = async (id: string) => {
    try {
      await updateDoc(doc(db, 'professionals', id), { active: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `professionals/${id}`);
    }
  };

  // Services CRUD
  const addService = async (srv: Omit<Service, 'id'>) => {
    try {
      let finalProfs = srv.professionals || [];
      if (finalProfs.length === 0) {
        const catObj = categories.find(c => c.name === srv.category);
        if (catObj) {
          finalProfs = catObj.professionals;
        }
      }
      const id = `srv-${Date.now()}`;
      const newSrv = { ...srv, professionals: finalProfs, id };
      await setDoc(doc(db, 'services', id), newSrv);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `services/${Date.now()}`);
    }
  };

  const updateService = async (id: string, srv: Partial<Service>) => {
    try {
      await updateDoc(doc(db, 'services', id), srv);
      if (srv.price !== undefined || srv.duration !== undefined) {
        const todayStr = new Date().toISOString().split('T')[0];
        const bookingsToUpdate = bookings.filter(b => b.serviceId === id && b.date >= todayStr && b.status !== 'finalizado' && b.status !== 'cancelado' && b.status !== 'faltou');
        for (const b of bookingsToUpdate) {
          const updatedVal = srv.price !== undefined ? srv.price : b.value;
          const updatedDur = srv.duration !== undefined ? srv.duration : b.duration;
          const updatedEndTime = addMinutesToTime(b.time, updatedDur);
          await updateDoc(doc(db, 'bookings', b.id), {
            value: updatedVal,
            duration: updatedDur,
            endTime: updatedEndTime
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `services/${id}`);
    }
  };

  const deleteService = async (id: string) => {
    try {
      await updateDoc(doc(db, 'services', id), { active: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `services/${id}`);
    }
  };

  const addCategory = async (cat: Omit<ServiceCategory, 'id'>) => {
    try {
      const id = `cat-${Date.now()}`;
      const newCat = { ...cat, id };
      await setDoc(doc(db, 'categories', id), newCat);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `categories/${Date.now()}`);
    }
  };

  const updateCategory = async (id: string, updatedFields: Partial<ServiceCategory>) => {
    try {
      await updateDoc(doc(db, 'categories', id), updatedFields);
      const cat = categories.find(c => c.id === id);
      if (cat) {
        if (updatedFields.name && updatedFields.name !== cat.name) {
          const servicesToUpdate = services.filter(s => s.category === cat.name);
          for (const s of servicesToUpdate) {
            await updateDoc(doc(db, 'services', s.id), { category: updatedFields.name! });
          }
        }
        if (updatedFields.professionals) {
          const servicesToUpdate = services.filter(s => s.category === (updatedFields.name || cat.name));
          for (const s of servicesToUpdate) {
            const mergedProfs = Array.from(new Set([...s.professionals, ...updatedFields.professionals!]));
            await updateDoc(doc(db, 'services', s.id), { professionals: mergedProfs });
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  // Clients CRUD
  const addClient = (cli: Omit<Client, 'id'>): Client => {
    if (!navigator.onLine) {
      alert("Não é possível cadastrar novos clientes enquanto estiver sem conexão com a internet. Por favor, recupere a conexão.");
      return { ...cli, id: 'offline-blocked' } as Client;
    }
    const id = `cli-${Date.now()}`;
    const newClient: Client = {
      ...cli,
      id
    };
    setDoc(doc(db, 'clients', id), newClient).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `clients/${id}`);
    });
    return newClient;
  };

  const updateClient = async (id: string, cli: Partial<Client>) => {
    if (!navigator.onLine) {
      alert("Não é possível editar clientes enquanto estiver sem conexão com a internet. Por favor, recupere a conexão.");
      return;
    }
    try {
      await updateDoc(doc(db, 'clients', id), cli);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `clients/${id}`);
    }
  };

  const deleteClient = async (id: string) => {
    if (!navigator.onLine) {
      alert("Não é possível inativar/remover clientes enquanto estiver sem conexão com a internet. Por favor, recupere a conexão.");
      return;
    }
    try {
      await updateDoc(doc(db, 'clients', id), { status: 'inativo' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `clients/${id}`);
    }
  };

  const searchClients = (query: string): Client[] => {
    const q = query.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  };

  // Check Schedule Conflicts helper
  const checkScheduleConflict = (
    date: string,
    time: string,
    duration: number,
    professionalId: string,
    excludeBookingId?: string
  ): boolean => {
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + duration;

    // 1. Check against bookings
    const hasBookingConflict = bookings.some(b => {
      if (b.id === excludeBookingId) return false;
      if (b.status === 'cancelado' || b.status === 'faltou') return false;
      if (b.date !== date || b.professionalId !== professionalId) return false;

      const bStart = timeToMinutes(b.time);
      const bEnd = bStart + b.duration;

      // Overlap calculation: (startA < endB) && (endA > startB)
      return startMinutes < bEnd && endMinutes > bStart;
    });

    if (hasBookingConflict) return true;

    // 2. Check against agenda blocks
    const hasBlockConflict = agendaBlocks.some(block => {
      if (block.date !== date) return false;
      // If block is for 'all' OR for the specific professional
      if (block.professionalId !== 'all' && block.professionalId !== professionalId) return false;

      const blockStart = timeToMinutes(block.time);
      const blockEnd = timeToMinutes(block.endTime);

      // Overlap calculation: (startA < endB) && (endA > startB)
      return startMinutes < blockEnd && endMinutes > blockStart;
    });

    return hasBlockConflict;
  };

  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Bookings CRUD
  const addBooking = (bk: Omit<Booking, 'id' | 'endTime'>, ignoreConflict: boolean = false) => {
    if (!navigator.onLine) {
      alert("Não é possível registrar novos agendamentos enquanto estiver sem conexão com a internet para evitar conflitos de horário e duplicidade. Por favor, recupere a conexão.");
      return {
        success: false,
        message: 'Ação bloqueada: Sem conexão com a internet.'
      };
    }
    const prof = professionals.find(p => p.id === bk.professionalId);
    if (prof) {
      if (!prof.active) {
        return {
          success: false,
          message: 'A profissional selecionada está inativa e não pode receber novos agendamentos.'
        };
      }

      const srv = services.find(s => s.id === bk.serviceId);
      if (srv && !srv.professionals.includes(bk.professionalId)) {
        return {
          success: false,
          message: 'A profissional selecionada não realiza este serviço.'
        };
      }

      if (prof.workDays) {
        const d = new Date(bk.date + 'T00:00:00');
        const dayOfWeek = d.getDay();
        if (!prof.workDays.includes(dayOfWeek)) {
          const daysPT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
          return {
            success: false,
            message: `A profissional ${prof.name} não trabalha no(a) ${daysPT[dayOfWeek]}.`
          };
        }
      }

      if (prof.workHours) {
        const startMin = timeToMinutes(bk.time);
        const endMin = startMin + bk.duration;
        const profStart = timeToMinutes(prof.workHours.start);
        const profEnd = timeToMinutes(prof.workHours.end);
        if (startMin < profStart || endMin > profEnd) {
          return {
            success: false,
            message: `Horário fora do expediente de ${prof.name} (${prof.workHours.start} - ${prof.workHours.end}).`
          };
        }
      }
    }

    if (!ignoreConflict) {
      const isConflict = checkScheduleConflict(bk.date, bk.time, bk.duration, bk.professionalId);
      if (isConflict) {
        return {
          success: false,
          isConflict: true,
          message: 'Conflito de horário! O profissional já possui agendamento neste horário.'
        };
      }
    }

    const calculatedEndTime = addMinutesToTime(bk.time, bk.duration);
    const id = `bk-${Date.now()}`;
    const newBooking: Booking = {
      ...bk,
      id,
      endTime: calculatedEndTime
    };

    setDoc(doc(db, 'bookings', id), newBooking).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `bookings/${id}`);
    });

    // Automatically dispatch Push Notification on scheduling!
    sendPushNotification(
      'Novo Agendamento Realizado',
      `Agendado: ${newBooking.serviceName} com ${newBooking.professionalName} para ${newBooking.clientName} em ${newBooking.date} às ${newBooking.time}.`,
      newBooking.id,
      currentUser?.id,
      currentUser?.email
    );

    return {
      success: true,
      message: 'Agendamento registrado com sucesso!',
      booking: newBooking
    };
  };

  const updateBooking = (id: string, bk: Partial<Booking>) => {
    if (!navigator.onLine) {
      alert("Não é possível editar agendamentos enquanto estiver sem conexão com a internet. Por favor, recupere a conexão.");
      return {
        success: false,
        message: 'Ação bloqueada: Sem conexão com a internet.'
      };
    }
    const current = bookings.find(b => b.id === id);
    if (!current) return { success: false, message: 'Agendamento não encontrado.' };

    const merged = { ...current, ...bk };

    const prof = professionals.find(p => p.id === merged.professionalId);
    if (prof) {
      if (bk.professionalId !== undefined && !prof.active) {
        return {
          success: false,
          message: 'A profissional selecionada está inativa.'
        };
      }

      const srv = services.find(s => s.id === merged.serviceId);
      if (srv && !srv.professionals.includes(merged.professionalId)) {
        return {
          success: false,
          message: 'A profissional selecionada não realiza este serviço.'
        };
      }

      if (prof.workDays) {
        const d = new Date(merged.date + 'T00:00:00');
        const dayOfWeek = d.getDay();
        if (!prof.workDays.includes(dayOfWeek)) {
          const daysPT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
          return {
            success: false,
            message: `A profissional ${prof.name} não trabalha no(a) ${daysPT[dayOfWeek]}.`
          };
        }
      }

      if (prof.workHours) {
        const startMin = timeToMinutes(merged.time);
        const endMin = startMin + merged.duration;
        const profStart = timeToMinutes(prof.workHours.start);
        const profEnd = timeToMinutes(prof.workHours.end);
        if (startMin < profStart || endMin > profEnd) {
          return {
            success: false,
            message: `Horário fora do expediente de ${prof.name} (${prof.workHours.start} - ${prof.workHours.end}).`
          };
        }
      }
    }

    // Check conflicts if date, time, duration or professional changed
    const needsConflictCheck =
      bk.date !== undefined ||
      bk.time !== undefined ||
      bk.duration !== undefined ||
      bk.professionalId !== undefined;

    if (needsConflictCheck) {
      const isConflict = checkScheduleConflict(
        merged.date,
        merged.time,
        merged.duration,
        merged.professionalId,
        id
      );
      if (isConflict) {
        return {
          success: false,
          message: 'Conflito de horário! O profissional já possui outro agendamento neste horário.'
        };
      }
    }

    const finalEndTime = addMinutesToTime(merged.time, merged.duration);
    const finalBooking = { ...merged, endTime: finalEndTime };

    setDoc(doc(db, 'bookings', id), finalBooking).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
    });
    return { success: true, message: 'Agendamento atualizado com sucesso!' };
  };

  const deleteBooking = async (id: string) => {
    if (!navigator.onLine) {
      alert("Não é possível excluir agendamentos enquanto estiver sem conexão com a internet. Por favor, recupere a conexão.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`);
    }
  };

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    if (!navigator.onLine) {
      alert("Não é possível alterar o status do agendamento enquanto estiver sem conexão com a internet. Por favor, recupere a conexão.");
      return;
    }
    const found = bookings.find(b => b.id === id);
    if (found) {
      sendPushNotification(
        'Atualização de Agendamento',
        `O status do agendamento de ${found.clientName} para ${found.serviceName} foi alterado para ${status.toUpperCase()}.`,
        id,
        currentUser?.id,
        currentUser?.email
      );
    }
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  // Cashier Checkout Action
  const checkoutBooking = async (
    bookingId: string,
    paymentDetails: {
      method: string;
      discount: number;
      discountProducts: number;
      addedValue: number;
      productsSold: Array<{ id: string; quantity: number; price: number }>;
      obs?: string;
      methodsSplit?: Array<{ method: string; value: number }>;
    }
  ) => {
    if (!navigator.onLine) {
      alert("Não é possível realizar pagamentos ou finalizar contas operacionais enquanto estiver sem conexão com a internet. Por favor, recupere a conexão.");
      return;
    }
    const bk = bookings.find(b => b.id === bookingId);
    if (!bk) return;

    // 1. Calculate financial details
    const servicesSubtotal = bk.value;
    
    let productsSubtotal = 0;
    const soldList: Array<{ id: string; name: string; quantity: number; price: number }> = [];

    // Deduct stock for each retail product sold
    for (const ps of paymentDetails.productsSold) {
      const prod = products.find(p => p.id === ps.id);
      if (prod) {
        productsSubtotal += ps.price * ps.quantity;
        soldList.push({
          id: ps.id,
          name: prod.name,
          quantity: ps.quantity,
          price: ps.price
        });
        
        // Deduct from inventory
        await adjustStock(
          ps.id,
          ps.quantity,
          'saida',
          `Venda no caixa - agendamento ${bk.id}`
        );
      }
    }

    const gross = (servicesSubtotal - paymentDetails.discount) + (productsSubtotal - paymentDetails.discountProducts) + paymentDetails.addedValue;
    
    let feeValue = 0;
    if (paymentDetails.methodsSplit && paymentDetails.methodsSplit.length > 0) {
      paymentDetails.methodsSplit.forEach(m => {
        const rate = settings.cardFees[m.method] || 0;
        feeValue += Number(((m.value * rate) / 100).toFixed(2));
      });
      feeValue = Number(feeValue.toFixed(2));
    } else {
      const rate = settings.cardFees[paymentDetails.method] || 0;
      feeValue = Number(((gross * rate) / 100).toFixed(2));
    }
    
    const net = Number((gross - feeValue).toFixed(2));

    // 2. Calculate professional's commission (based on the actual service performed)
    const srv = services.find(s => s.id === bk.serviceId);
    const prof = professionals.find(p => p.id === bk.professionalId);
    const commPct = srv?.commission ?? prof?.commission ?? 40;
    // Commission calculated over service subtotal after service discount and deducting product cost
    const serviceFinalValue = Math.max(0, servicesSubtotal - paymentDetails.discount);
    const productCost = srv?.productCost ?? 0;
    const serviceValueForCommission = Math.max(0, serviceFinalValue - productCost);
    const commissionVal = Number(((serviceValueForCommission * commPct) / 100).toFixed(2));

    // 3. Assemble complete paymentDetails object
    const finalPaymentDetails = {
      method: paymentDetails.methodsSplit && paymentDetails.methodsSplit.length > 1
        ? `Múltiplos (${paymentDetails.methodsSplit.map(m => `${m.method}: ${m.value}`).join(', ')})`
        : paymentDetails.method,
      gross,
      discount: paymentDetails.discount,
      discountProducts: paymentDetails.discountProducts,
      addedValue: paymentDetails.addedValue,
      fee: feeValue,
      net,
      commission: commissionVal,
      productsSold: soldList,
      methodsSplit: paymentDetails.methodsSplit
    };

    try {
      // 4. Update the booking object as finalizado, paid and store details in Firestore
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'finalizado',
        isPaid: true,
        paymentDetails: finalPaymentDetails,
        obs: paymentDetails.obs || bk.obs || ''
      });

      // 5. Update cashier if open
      const descStr = `Venda no caixa: ${bk.serviceName} + ${soldList.length} produtos (${bk.clientName})`;
      if (cashier.isOpen) {
        if (paymentDetails.methodsSplit && paymentDetails.methodsSplit.length > 0) {
          for (let mIdx = 0; mIdx < paymentDetails.methodsSplit.length; mIdx++) {
            const m = paymentDetails.methodsSplit[mIdx];
            await addCashierTransaction(
              'entrada',
              `${descStr} [${mIdx + 1}/${paymentDetails.methodsSplit.length}]`,
              m.value,
              'Serviço',
              m.method,
              true
            );
          }
        } else {
          await addCashierTransaction(
            'entrada',
            descStr,
            gross, // store gross cash movement, fee deduction is tracked separately in report calculations
            'Serviço',
            paymentDetails.method,
            true
          );
        }
      }

      // 6. Update Client metrics: lastVisit, and auto-calculate nextMaintenance!
      const todayStr = new Date().toISOString().split('T')[0];
      const categoryRules = settings.maintenanceRules;
      const daysToNext = (srv?.hasMaintenance && srv?.maintenanceDays) 
        ? srv.maintenanceDays 
        : (categoryRules[srv?.category || ''] || categoryRules[bk.serviceName] || 0);

      const maintenanceObj = daysToNext > 0 ? {
        date: addDaysToDate(todayStr, daysToNext),
        serviceName: bk.serviceName,
        notified: false
      } : null;

      await updateClient(bk.clientId, {
        lastVisit: todayStr,
        nextMaintenance: maintenanceObj
      });

      // Consumo automático de pacote se o método for 'Pacote'
      const isPackagePayment = paymentDetails.method === 'Pacote' || 
        (paymentDetails.methodsSplit && paymentDetails.methodsSplit.some(m => m.method === 'Pacote'));

      if (isPackagePayment) {
        const matchedPkg = packages.find(p => 
          p.clientId === bk.clientId && 
          p.status === 'ativo' && 
          p.sessionsRemaining > 0 &&
          (p.servicesIncluded.includes(bk.serviceId) || 
           p.servicesIncluded.some(nameOrId => nameOrId === bk.serviceName || nameOrId === bk.serviceId) || 
           (p.items && p.items.some(item => item.serviceName === bk.serviceName && item.sessionsUsed < item.quantity)))
        );
        if (matchedPkg) {
          await usePackageSession(matchedPkg.id, bk.serviceName, prof?.name || bk.professionalName);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}/checkout`);
    }
  };

  // Products stock management
  // Products stock management
  const addProduct = async (prod: Omit<Product, 'id' | 'history'>) => {
    const id = `prod-${Date.now()}`;
    const newProd: Product = {
      ...prod,
      id,
      history: [{ id: `h-${Date.now()}`, type: 'entrada', quantity: prod.quantity, date: new Date().toISOString().split('T')[0], obs: 'Estoque inicial' }]
    };
    try {
      await setDoc(doc(db, 'products', id), newProd);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `products/${id}`);
    }
  };

  const updateProduct = async (id: string, prod: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'products', id), prod);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const adjustStock = async (id: string, quantity: number, type: 'entrada' | 'saida' | 'ajuste', obs?: string) => {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    let finalQty = p.quantity;
    if (type === 'entrada') finalQty += quantity;
    else if (type === 'saida') finalQty = Math.max(0, finalQty - quantity);
    else if (type === 'ajuste') finalQty = quantity;

    const histItem = {
      id: `h-${Date.now()}-${Math.random()}`,
      type,
      quantity,
      date: new Date().toISOString().split('T')[0],
      obs
    };

    try {
      await updateDoc(doc(db, 'products', id), {
        quantity: finalQty,
        history: [histItem, ...p.history]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  // Packages sales and sessions consumption
  const sellPackage = async (
    clientId: string,
    clientName: string,
    name: string,
    value: number,
    servicesIncluded: string[],
    validityMonths: number,
    items?: ServicePackageItem[]
  ) => {
    const today = new Date();
    today.setMonth(today.getMonth() + validityMonths);
    const validityDate = today.toISOString().split('T')[0];

    const calcTotalSessions = items 
      ? items.reduce((acc, item) => acc + item.quantity, 0)
      : servicesIncluded.length * 4;

    const id = `pkg-${Date.now()}`;
    const newPkg: ServicePackage = {
      id,
      name,
      clientId,
      clientName,
      servicesIncluded,
      totalSessions: calcTotalSessions,
      sessionsUsed: 0,
      sessionsRemaining: calcTotalSessions,
      value,
      validityDate,
      status: 'ativo',
      items,
      usageHistory: []
    };

    try {
      await setDoc(doc(db, 'packages', id), newPkg);

      // Feed cashier
      if (cashier.isOpen) {
        await addCashierTransaction(
          'entrada',
          `Venda de Pacote: ${name} (${clientName})`,
          value,
          'Pacotes',
          'Dinheiro',
          true
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `packages/${id}`);
    }
  };

  const updatePackage = async (id: string, fields: Partial<ServicePackage>) => {
    try {
      const p = packages.find(pkg => pkg.id === id);
      if (!p) return;
      const merged = { ...p, ...fields };
      // Recalculate total/remaining if items changed
      if (fields.items) {
        const total = fields.items.reduce((acc, item) => acc + item.quantity, 0);
        const used = fields.items.reduce((acc, item) => acc + item.sessionsUsed, 0);
        merged.totalSessions = total;
        merged.sessionsUsed = used;
        merged.sessionsRemaining = Math.max(0, total - used);
        merged.status = merged.sessionsRemaining === 0 ? 'concluido' : merged.status;
      }
      await setDoc(doc(db, 'packages', id), merged);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `packages/${id}`);
    }
  };

  const deletePackage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'packages', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `packages/${id}`);
    }
  };

  const usePackageSession = async (packageId: string, serviceName: string, professionalName: string) => {
    const p = packages.find(pkg => pkg.id === packageId);
    if (!p) return;
    if (p.sessionsRemaining <= 0) return;

    let updatedItems = p.items;
    if (p.items) {
      let found = false;
      updatedItems = p.items.map(item => {
        if (!found && item.serviceName === serviceName && item.sessionsUsed < item.quantity) {
          found = true;
          return { ...item, sessionsUsed: item.sessionsUsed + 1 };
        }
        return item;
      });
    }

    const rem = p.sessionsRemaining - 1;
    const used = p.sessionsUsed + 1;
    const status = rem === 0 ? 'concluido' : p.status;

    const hist = {
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      serviceName,
      professionalName
    };

    try {
      await updateDoc(doc(db, 'packages', packageId), {
        sessionsUsed: used,
        sessionsRemaining: rem,
        status: status as any,
        items: updatedItems,
        usageHistory: [hist, ...p.usageHistory]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `packages/${packageId}`);
    }
  };

  // Combos
  const addCombo = async (combo: Omit<ServiceCombo, 'id'>) => {
    const id = `cb-${Date.now()}`;
    const newCombo: ServiceCombo = {
      ...combo,
      id
    };
    try {
      await setDoc(doc(db, 'combos', id), newCombo);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `combos/${id}`);
    }
  };

  const updateCombo = async (id: string, combo: Partial<ServiceCombo>) => {
    try {
      await updateDoc(doc(db, 'combos', id), combo);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `combos/${id}`);
    }
  };

  const deleteCombo = async (id: string) => {
    try {
      await updateDoc(doc(db, 'combos', id), { active: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `combos/${id}`);
    }
  };

  // Cashier open, close and transactions
  const openCashier = async (initialValue: number) => {
    if (!navigator.onLine) {
      alert("Não é possível abrir o caixa offline. Por favor, recupere a conexão.");
      return;
    }
    const openedTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const cashierObj = {
      isOpen: true,
      openedAt: openedTime,
      initialValue,
      transactions: []
    };
    try {
      await setDoc(doc(db, 'cashier', 'current'), cashierObj);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cashier/current');
    }
  };

  const closeCashier = async (closedValue: number, obs?: string) => {
    if (!navigator.onLine) {
      alert("Não é possível fechar o caixa offline. Por favor, recupere a conexão.");
      return;
    }
    const closedTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    try {
      await updateDoc(doc(db, 'cashier', 'current'), {
        isOpen: false,
        closedAt: closedTime,
        closedValue,
        obs
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cashier/current');
    }
  };

  const addCashierTransaction = async (
    type: 'entrada' | 'saida' | 'sangria',
    description: string,
    value: number,
    category: string,
    paymentMethod?: string,
    isCheckout?: boolean
  ) => {
    if (!navigator.onLine) {
      alert("Não é possível lançar transações de caixa offline. Por favor, recupere a conexão.");
      return;
    }
    const newTx: CashierTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      type,
      description,
      value,
      category,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      paymentMethod,
      isCheckout
    };

    try {
      await updateDoc(doc(db, 'cashier', 'current'), {
        transactions: [newTx, ...cashier.transactions]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cashier/current');
    }
  };

  // Settings
  const updateSettings = async (newSettings: Partial<SalonSettings>) => {
    try {
      await updateDoc(doc(db, 'settings', 'salon'), newSettings);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/salon');
    }
  };

  // Topbar Notifications System CRUD
  const addNotification = async (notif: Omit<AppNotification, 'id' | 'date' | 'time' | 'isRead'>) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0].slice(0, 5);
    const id = `notif-${Date.now()}`;
    const newNotif: AppNotification = {
      ...notif,
      id,
      date: dateStr,
      time: timeStr,
      isRead: false
    };
    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${id}`);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const batchPromises = notifications.map(n => updateDoc(doc(db, 'notifications', n.id), { isRead: true }));
      await Promise.all(batchPromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'notifications');
    }
  };

  const clearReadNotifications = async () => {
    try {
      const readNotifications = notifications.filter(n => n.isRead);
      const batchPromises = readNotifications.map(n => deleteDoc(doc(db, 'notifications', n.id)));
      await Promise.all(batchPromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'notifications');
    }
  };

  const deleteAppNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notifications/${id}`);
    }
  };

  // Notification algorithms
  const getBirthdayList = (): Client[] => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const targetMMDD = `${mm}-${dd}`;

    return clients.filter(c => c.status === 'ativo' && c.birthDate.endsWith(targetMMDD));
  };

  const getLowStockProducts = (): Product[] => {
    return products.filter(p => p.quantity <= p.minQuantity);
  };

  const getUpcomingMaintenanceList = () => {
    // Determine a reference todayStr. We can use local date or hardcoded '2026-07-07' if desired, but local date is best.
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    // Days difference helper
    const getDaysDifference = (d1Str: string, d2Str: string): number => {
      const d1 = new Date(d1Str + 'T00:00:00');
      const d2 = new Date(d2Str + 'T00:00:00');
      return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    };

    const upcomingList: Array<{
      client: Client;
      date: string;
      serviceName: string;
      category: string;
      lastServiceDate: string;
      lastServiceTime: string;
      professionalName: string;
      overdue: boolean;
    }> = [];

    clients.forEach(client => {
      if (client.status !== 'ativo') return;

      const clientBookings = bookings.filter(b => b.clientId === client.id);

      // Group unique categories in client's history
      const categoriesSeen = new Set<string>();
      clientBookings.forEach(b => {
        const srv = services.find(s => s.id === b.serviceId);
        if (srv?.category) {
          categoriesSeen.add(srv.category);
        }
      });

      categoriesSeen.forEach(category => {
        const categoryBookings = clientBookings.filter(b => {
          const srv = services.find(s => s.id === b.serviceId);
          return srv?.category === category;
        });

        // Find latest completed booking of this category
        const completed = categoryBookings
          .filter(b => b.status === 'finalizado')
          .sort((a, b) => {
            const dateComp = b.date.localeCompare(a.date);
            if (dateComp !== 0) return dateComp;
            return b.time.localeCompare(a.time);
          });

        const latestCompleted = completed[0];
        if (!latestCompleted) return;

        const srv = services.find(s => s.id === latestCompleted.serviceId);
        if (!srv || !srv.hasMaintenance || !srv.maintenanceDays) return;

        // Next maintenance date
        const nextMaintenanceDateStr = addDaysToDate(latestCompleted.date, srv.maintenanceDays);

        // Check if there's any scheduled/pending booking of this SAME category starting on or after the latest completed date
        const hasPendingBooking = categoryBookings.some(b =>
          ['agendado', 'confirmado', 'em_atendimento', 'reagendado'].includes(b.status) &&
          b.date >= latestCompleted.date
        );

        if (hasPendingBooking) {
          // Exclude because they have an active future/current scheduled appointment in this category
          return;
        }

        // Check if today is within 5 days before or overdue
        const daysToMaintenance = getDaysDifference(todayStr, nextMaintenanceDateStr);

        if (daysToMaintenance <= 5) {
          const mDate = new Date(nextMaintenanceDateStr + 'T00:00:00');
          const overdue = mDate < today;

          upcomingList.push({
            client,
            date: nextMaintenanceDateStr,
            serviceName: latestCompleted.serviceName,
            category,
            lastServiceDate: latestCompleted.date,
            lastServiceTime: latestCompleted.time,
            professionalName: latestCompleted.professionalName,
            overdue
          });
        }
      });
    });

    return upcomingList.sort((a, b) => a.date.localeCompare(b.date));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authLoading,
        firebaseAuthDisabled,
        users,
        addUser,
        updateUser,
        deleteUser,
        forgotPassword,
        professionals,
        services,
        clients,
        bookings,
        agendaBlocks,
        products,
        packages,
        combos,
        categories,
        settings,
        cashier,
        login,
        logout,
        addAgendaBlock,
        deleteAgendaBlock,
        addProfessional,
        updateProfessional,
        deleteProfessional,
        addService,
        updateService,
        deleteService,
        addClient,
        updateClient,
        deleteClient,
        searchClients,
        addBooking,
        updateBooking,
        deleteBooking,
        updateBookingStatus,
        checkScheduleConflict,
        checkoutBooking,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        sellPackage,
        updatePackage,
        deletePackage,
        usePackageSession,
        addCombo,
        updateCombo,
        deleteCombo,
        addCategory,
        updateCategory,
        deleteCategory,
        openCashier,
        closeCashier,
        addCashierTransaction,
        updateSettings,
        getBirthdayList,
        getLowStockProducts,
        getUpcomingMaintenanceList,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearReadNotifications,
        deleteAppNotification,
        backupsList,
        createBackup,
        restoreBackup,
        deleteBackup,
        backupSettings,
        setBackupSettings,
        fcmTokensList,
        pushNotificationsList,
        registerFCMToken,
        deleteFCMToken,
        sendPushNotification,
        clearNotificationsLedger,
        isOnline
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
