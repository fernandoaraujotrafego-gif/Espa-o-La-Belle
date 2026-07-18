/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Professional, Service, Client, Booking, Product, ServicePackage, ServiceCombo, SalonSettings, AppNotification } from '../types';

export const INITIAL_SERVICES: Service[] = [
  { id: 'srv-1', name: 'Manicure Simples', category: 'Manicure e Pedicure', price: 35.00, duration: 30, professionals: ['prof-1', 'prof-3'], commission: 40, active: true, description: 'Corte, lixamento, cuticulagem e esmaltação comum.' },
  { id: 'srv-2', name: 'Alongamento de Unhas (Gel)', category: 'Alongamento de Unhas', price: 130.00, duration: 90, professionals: ['prof-1'], commission: 50, active: true, description: 'Extensão de unhas com gel esculpido ou tips.' },
  { id: 'srv-3', name: 'Banho de Gel', category: 'Banho de Gel', price: 80.00, duration: 60, professionals: ['prof-1'], commission: 45, active: true, description: 'Camada de gel sobre a unha natural para proteção e brilho.' },
  { id: 'srv-4', name: 'Cílios Fio a Fio', category: 'Cílios', price: 150.00, duration: 120, professionals: ['prof-2'], commission: 40, active: true, description: 'Extensão de cílios clássica para efeito natural.' },
  { id: 'srv-5', name: 'Design de Sobrancelha', category: 'Sobrancelhas', price: 45.00, duration: 30, professionals: ['prof-2', 'prof-3'], commission: 40, active: true, description: 'Modelagem de sobrancelha conforme visagismo facial.' },
  { id: 'srv-6', name: 'Corte & Escova', category: 'Cabeleireiro', price: 110.00, duration: 60, professionals: ['prof-3'], commission: 35, active: true, description: 'Corte feminino moderno finalizado com escova modeladora.' },
  { id: 'srv-7', name: 'Depilação Meia Perna', category: 'Depilação', price: 40.00, duration: 30, professionals: ['prof-2'], commission: 40, active: true, description: 'Depilação com cera morna higiênica e descartável.' },
  { id: 'srv-8', name: 'Limpeza de Pele Profunda', category: 'Estética Facial', price: 140.00, duration: 75, professionals: ['prof-2'], commission: 40, active: true, description: 'Remoção de impurezas, cravos e nutrição da pele.' },
  { id: 'srv-9', name: 'Pedicure Completo', category: 'Manicure e Pedicure', price: 40.00, duration: 40, professionals: ['prof-1', 'prof-3'], commission: 40, active: true, description: 'Tratamento completo para os pés, lixamento e esmaltação.' }
];

export const INITIAL_PROFESSIONALS: Professional[] = [
  {
    id: 'prof-1',
    name: 'Camila Silva',
    phone: '(11) 98888-1111',
    email: 'camila.nails@labelle.com',
    specialties: ['Alongamento de Unhas', 'Manicure e Pedicure', 'Banho de Gel'],
    services: ['srv-1', 'srv-2', 'srv-3', 'srv-9'],
    workDays: [2, 3, 4, 5, 6], // Ter-Sáb
    workHours: { start: '09:00', end: '19:00' },
    commission: 45,
    active: true,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    obs: 'Especialista em unhas de fibra de vidro e nail art.'
  },
  {
    id: 'prof-2',
    name: 'Amanda Costa',
    phone: '(11) 98888-2222',
    email: 'amanda.lash@labelle.com',
    specialties: ['Cílios', 'Sobrancelhas', 'Estética Facial', 'Depilação'],
    services: ['srv-4', 'srv-5', 'srv-7', 'srv-8'],
    workDays: [2, 3, 4, 5, 6], // Ter-Sáb
    workHours: { start: '09:00', end: '19:00' },
    commission: 40,
    active: true,
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    obs: 'Especialista em extensão de cílios híbrida e designer de sobrancelha.'
  },
  {
    id: 'prof-3',
    name: 'Beatriz Reis',
    phone: '(11) 98888-3333',
    email: 'beatriz.hair@labelle.com',
    specialties: ['Cabeleireiro', 'Manicure e Pedicure', 'Sobrancelhas'],
    services: ['srv-1', 'srv-5', 'srv-6', 'srv-9'],
    workDays: [2, 3, 4, 5, 6, 1], // Seg-Sáb
    workHours: { start: '08:30', end: '18:00' },
    commission: 35,
    active: true,
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face',
    obs: 'Cabeleireira sênior, especialista em cortes e químicas suaves.'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Mariana Souza',
    phone: '(11) 99876-5432',
    birthDate: '1995-07-07', // Matches TODAY 2026-07-07 to trigger birthday!
    email: 'mari.souza@gmail.com',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    obs: 'Prefere esmalte em tons de nude ou vermelho clássico.',
    allergies: 'Alergia a esmalte com tolueno.',
    lastVisit: '2026-06-22',
    nextMaintenance: {
      date: '2026-07-07', // Today! Alongamento de unhas maintenance
      serviceName: 'Alongamento de Unhas (Gel)',
      notified: false
    },
    status: 'ativo'
  },
  {
    id: 'cli-2',
    name: 'Carolina Lima',
    phone: '(11) 98877-6655',
    birthDate: '1990-04-12',
    email: 'carol.lima@hotmail.com',
    address: 'Rua Augusta, 450 - Consolação, São Paulo - SP',
    obs: 'Faz manutenção rigorosa de cílios a cada 15 dias.',
    lastVisit: '2026-06-20',
    nextMaintenance: {
      date: '2026-07-05', // Past due! Maintenance of Lash Extension
      serviceName: 'Cílios Fio a Fio',
      notified: false
    },
    status: 'ativo'
  },
  {
    id: 'cli-3',
    name: 'Gisele Rocha',
    phone: '(11) 97766-5544',
    birthDate: '1988-11-20',
    email: 'gisele.rocha@yahoo.com.br',
    lastVisit: '2026-06-28',
    status: 'ativo'
  },
  {
    id: 'cli-4',
    name: 'Débora Prado',
    phone: '(11) 96655-4433',
    birthDate: '2001-07-15',
    obs: 'Aprecia café expresso com adoçante.',
    lastVisit: '2026-07-01',
    status: 'ativo'
  },
  {
    id: 'cli-5',
    name: 'Amanda Alencar',
    phone: '(11) 95544-3322',
    birthDate: '1993-02-28',
    lastVisit: '2026-07-02',
    status: 'ativo'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  // Finished today
  {
    id: 'bk-1',
    clientId: 'cli-1',
    clientName: 'Mariana Souza',
    clientPhone: '(11) 99876-5432',
    professionalId: 'prof-1',
    professionalName: 'Camila Silva',
    serviceId: 'srv-3',
    serviceName: 'Banho de Gel',
    date: '2026-07-07',
    time: '09:00',
    endTime: '10:00',
    duration: 60,
    value: 80.00,
    status: 'finalizado',
    isPaid: true,
    paymentDetails: {
      method: 'Pix',
      gross: 80.00,
      discount: 0,
      discountProducts: 0,
      addedValue: 0,
      fee: 0,
      net: 80.00,
      commission: 36.00, // 45% of 80
      productsSold: []
    },
    obs: 'Manutenção de banho de gel efetuada.'
  },
  // In service right now
  {
    id: 'bk-2',
    clientId: 'cli-3',
    clientName: 'Gisele Rocha',
    clientPhone: '(11) 97766-5544',
    professionalId: 'prof-3',
    professionalName: 'Beatriz Reis',
    serviceId: 'srv-6',
    serviceName: 'Corte & Escova',
    date: '2026-07-07',
    time: '14:00',
    endTime: '15:00',
    duration: 60,
    value: 110.00,
    status: 'em_atendimento',
    isPaid: false,
    obs: 'Cliente quer clarear as pontas na próxima visita.'
  },
  // Confirmed today
  {
    id: 'bk-3',
    clientId: 'cli-4',
    clientName: 'Débora Prado',
    clientPhone: '(11) 96655-4433',
    professionalId: 'prof-2',
    professionalName: 'Amanda Costa',
    serviceId: 'srv-4',
    serviceName: 'Cílios Fio a Fio',
    date: '2026-07-07',
    time: '15:30',
    endTime: '17:30',
    duration: 120,
    value: 150.00,
    status: 'confirmado',
    isPaid: false
  },
  // Scheduled today
  {
    id: 'bk-4',
    clientId: 'cli-5',
    clientName: 'Amanda Alencar',
    clientPhone: '(11) 95544-3322',
    professionalId: 'prof-1',
    professionalName: 'Camila Silva',
    serviceId: 'srv-1',
    serviceName: 'Manicure Simples',
    date: '2026-07-07',
    time: '17:45',
    endTime: '18:15',
    duration: 30,
    value: 35.00,
    status: 'agendado',
    isPaid: false
  },
  // Past days for historical reports
  {
    id: 'bk-old-1',
    clientId: 'cli-2',
    clientName: 'Carolina Lima',
    clientPhone: '(11) 98877-6655',
    professionalId: 'prof-2',
    professionalName: 'Amanda Costa',
    serviceId: 'srv-4',
    serviceName: 'Cílios Fio a Fio',
    date: '2026-07-06',
    time: '10:00',
    endTime: '12:00',
    duration: 120,
    value: 150.00,
    status: 'finalizado',
    isPaid: true,
    paymentDetails: {
      method: 'Cartão de Crédito',
      gross: 150.00,
      discount: 0,
      discountProducts: 0,
      addedValue: 0,
      fee: 3.75, // 2.5% fee
      net: 146.25,
      commission: 60.00, // 40% of 150
      productsSold: []
    }
  },
  {
    id: 'bk-old-2',
    clientId: 'cli-3',
    clientName: 'Gisele Rocha',
    clientPhone: '(11) 97766-5544',
    professionalId: 'prof-1',
    professionalName: 'Camila Silva',
    serviceId: 'srv-2',
    serviceName: 'Alongamento de Unhas (Gel)',
    date: '2026-07-05',
    time: '14:00',
    endTime: '15:30',
    duration: 90,
    value: 130.00,
    status: 'finalizado',
    isPaid: true,
    paymentDetails: {
      method: 'Pix',
      gross: 130.00,
      discount: 10.00, // Client discount
      discountProducts: 0,
      addedValue: 0,
      fee: 0,
      net: 120.00,
      commission: 58.50, // 45% of 130 (comissão sôbre o valor bruto, dependendo da regra, aqui calculamos sobre o bruto ou liq)
      productsSold: []
    }
  },
  {
    id: 'bk-old-3',
    clientId: 'cli-4',
    clientName: 'Débora Prado',
    clientPhone: '(11) 96655-4433',
    professionalId: 'prof-2',
    professionalName: 'Amanda Costa',
    serviceId: 'srv-5',
    serviceName: 'Design de Sobrancelha',
    date: '2026-07-04',
    time: '11:00',
    endTime: '11:30',
    duration: 30,
    value: 45.00,
    status: 'faltou',
    isPaid: false
  },
  {
    id: 'bk-old-4',
    clientId: 'cli-1',
    clientName: 'Mariana Souza',
    clientPhone: '(11) 99876-5432',
    professionalId: 'prof-3',
    professionalName: 'Beatriz Reis',
    serviceId: 'srv-9',
    serviceName: 'Pedicure Completo',
    date: '2026-07-03',
    time: '15:00',
    endTime: '15:40',
    duration: 40,
    value: 40.00,
    status: 'finalizado',
    isPaid: true,
    paymentDetails: {
      method: 'Dinheiro',
      gross: 40.00,
      discount: 0,
      discountProducts: 0,
      addedValue: 0,
      fee: 0,
      net: 40.00,
      commission: 16.00,
      productsSold: []
    }
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Gel UV Construtor Classic Pink 15g',
    category: 'Alongamento',
    quantity: 3, // TRIGGER LOW STOCK ALERT! (Min is 5)
    minQuantity: 5,
    cost: 35.00,
    price: 65.00,
    supplier: 'Vòlia Cosméticos',
    history: [
      { id: 'h-1', type: 'entrada', quantity: 10, date: '2026-06-10', obs: 'Compra de lote inicial' },
      { id: 'h-2', type: 'saida', quantity: 7, date: '2026-06-25', obs: 'Uso interno em procedimentos de alongamento' }
    ]
  },
  {
    id: 'prod-2',
    name: 'Monomer Líquido Acrílico 50ml',
    category: 'Alongamento',
    quantity: 4,
    minQuantity: 2,
    cost: 45.00,
    price: 85.00,
    supplier: 'Fingers Brasil',
    history: [
      { id: 'h-3', type: 'entrada', quantity: 5, date: '2026-06-15' }
    ]
  },
  {
    id: 'prod-3',
    name: 'Cílios Mink Mix Curvatura D 0.07',
    category: 'Lash',
    quantity: 2, // TRIGGER LOW STOCK ALERT! (Min is 6)
    minQuantity: 6,
    cost: 22.00,
    price: 45.00,
    supplier: 'Lash Shop SP',
    history: [
      { id: 'h-4', type: 'entrada', quantity: 8, date: '2026-06-12' },
      { id: 'h-5', type: 'saida', quantity: 6, date: '2026-07-01', obs: 'Uso em procedimentos' }
    ]
  },
  {
    id: 'prod-4',
    name: 'Óleo Hidratante de Cutícula Cravo 10ml',
    category: 'Venda Geral',
    quantity: 15,
    minQuantity: 3,
    cost: 5.50,
    price: 15.00, // Product for retail sale!
    supplier: 'Acessórios Nails',
    history: [
      { id: 'h-6', type: 'entrada', quantity: 20, date: '2026-06-20' },
      { id: 'h-7', type: 'saida', quantity: 5, date: '2026-07-02', obs: 'Vendas para clientes' }
    ]
  },
  {
    id: 'prod-5',
    name: 'Sérum Ativador de Sobrancelhas 5ml',
    category: 'Venda Geral',
    quantity: 8,
    minQuantity: 2,
    cost: 32.00,
    price: 75.00, // Product for retail sale!
    supplier: 'Lash Estética Corp',
    history: [
      { id: 'h-8', type: 'entrada', quantity: 10, date: '2026-06-24' },
      { id: 'h-9', type: 'saida', quantity: 2, date: '2026-07-04', obs: 'Venda direta' }
    ]
  }
];

export const INITIAL_PACKAGES: ServicePackage[] = [
  {
    id: 'pkg-1',
    name: 'Pacote Mensal Manicure',
    clientId: 'cli-1',
    clientName: 'Mariana Souza',
    servicesIncluded: ['srv-1'],
    totalSessions: 4,
    sessionsUsed: 2,
    sessionsRemaining: 2,
    value: 120.00,
    validityDate: '2026-08-01',
    status: 'ativo',
    usageHistory: [
      { date: '2026-06-25 10:00', serviceName: 'Manicure Simples', professionalName: 'Camila Silva' },
      { date: '2026-07-02 11:30', serviceName: 'Manicure Simples', professionalName: 'Camila Silva' }
    ]
  },
  {
    id: 'pkg-2',
    name: 'Combo Cílios Bronze',
    clientId: 'cli-2',
    clientName: 'Carolina Lima',
    servicesIncluded: ['srv-4', 'srv-5'],
    totalSessions: 3,
    sessionsUsed: 3,
    sessionsRemaining: 0,
    value: 390.00,
    validityDate: '2026-06-30',
    status: 'concluido',
    usageHistory: [
      { date: '2026-05-15 09:00', serviceName: 'Cílios Fio a Fio', professionalName: 'Amanda Costa' },
      { date: '2026-06-01 14:00', serviceName: 'Cílios Fio a Fio', professionalName: 'Amanda Costa' },
      { date: '2026-06-15 11:00', serviceName: 'Design de Sobrancelha', professionalName: 'Amanda Costa' }
    ]
  }
];

export const INITIAL_COMBOS: ServiceCombo[] = [
  {
    id: 'cb-1',
    name: 'Combo Cílios Maravilhosa',
    servicesIncluded: ['srv-4', 'srv-5'], // Lash + Eyebrow design
    originalPrice: 195.00,
    promotionalPrice: 170.00,
    totalDuration: 150, // 120 + 30
    professionals: ['prof-2'],
    active: true
  },
  {
    id: 'cb-2',
    name: 'Combo Nails Luxo',
    servicesIncluded: ['srv-3', 'srv-9'], // Gel overlay + Foot pedicure
    originalPrice: 120.00,
    promotionalPrice: 105.00,
    totalDuration: 100, // 60 + 40
    professionals: ['prof-1', 'prof-3'],
    active: true
  }
];

export const DEFAULT_SETTINGS: SalonSettings = {
  name: 'Espaço La Belle',
  logo: '✨',
  address: 'Rua das Flores, 789 - Jardins, São Paulo - SP',
  phone: '(21) 99095-5002',
  salonName: 'Espaço La Belle',
  salonPhone: '(21) 99095-5002',
  salonAddress: 'Rua das Flores, 789 - Jardins, São Paulo - SP',
  salonCNPJ: '00.000.000/0001-00',
  businessHours: {
    start: '09:00',
    end: '19:00'
  },
  workingHours: {
    Monday: { isOpen: false, start: '09:00', end: '18:00' },
    Tuesday: { isOpen: true, start: '09:00', end: '19:00' },
    Wednesday: { isOpen: true, start: '09:00', end: '19:00' },
    Thursday: { isOpen: true, start: '09:00', end: '19:00' },
    Friday: { isOpen: true, start: '09:00', end: '19:00' },
    Saturday: { isOpen: true, start: '09:00', end: '19:00' },
    Sunday: { isOpen: false, start: '09:00', end: '14:00' }
  },
  cardFees: {
    Dinheiro: 0,
    Pix: 0,
    'Cartão de Débito': 1.2, // 1.2% fee
    'Cartão de Crédito': 2.5, // 2.5% fee
    'Link de Pagamento': 3.5, // 3.5% fee
    Transferência: 0,
    Cortesia: 0,
    Pacote: 0
  },
  defaultMessages: {
    confirmation: 'Olá, {cliente}! Tudo bem? 💙\n\nSeu agendamento no Espaço La Belle foi marcado com sucesso.\n\nServiço: {servico}\nProfissional: {profissional}\nData: {data}\nHorário: {hora}\nValor: {valor}\n\nPedimos que chegue com alguns minutos de antecedência. Caso precise remarcar, fale conosco por aqui.\n\nObrigada! ✨',
    recall: 'Olá, {cliente}! Sentimos sua falta por aqui no Espaço La Belle. 🌸\n\nNotamos que já faz algum tempo desde o seu último procedimento de {servico} (seu prazo de manutenção de {prazo_dias} dias venceu ou está próximo de vencer).\n\nQue tal reservarmos um horário para deixar você ainda mais maravilhosa?\n\nResponda essa mensagem para agendarmos! Beijos de toda equipe. 💕',
    reminder: 'Olá, {cliente}! Passando para lembrar do seu atendimento amanhã ({data}) às {hora} para o serviço de {servico} com {profissional}. Confirmado?',
    birthday: 'Olá, {cliente}! Toda a equipe do Espaço La Belle lhe deseja um Feliz Aniversário! 🎉 Que seu dia seja repleto de amor, paz e beleza. Venha nos visitar para ganhar um presente surpresa!'
  },
  maintenanceRules: {
    'Alongamento de Unhas': 15,
    'Banho de Gel': 20,
    'Cílios': 15,
    'Sobrancelhas': 25,
    'Cabeleireiro': 30
  }
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'web_booking',
    title: 'Agendamento via Link Web',
    description: 'Mariana Silva agendou "Designer de Sobrancelhas" com Amanda Costa para amanhã às 14:00.',
    date: '2026-07-09',
    time: '14:00',
    isRead: false,
    link: 'agenda'
  },
  {
    id: 'notif-2',
    type: 'maintenance',
    title: 'Manutenção de Cílios a Vencer',
    description: 'Camila Sousa está no 28º dia após aplicação de cílios e precisa agendar a manutenção.',
    date: '2026-07-08',
    time: '09:00',
    isRead: false,
    link: 'clientes'
  },
  {
    id: 'notif-3',
    type: 'agenda_change',
    title: 'Alteração de Horário',
    description: 'Bruna Dias reagendou Juliana Albuquerque de hoje às 10:30 para às 11:15.',
    date: '2026-07-08',
    time: '10:30',
    isRead: true,
    link: 'agenda'
  },
  {
    id: 'notif-4',
    type: 'pending_task',
    title: 'Tarefa Pendente do Dia',
    description: 'Realizar contagem física do estoque de esmaltes e repor paletas de cores.',
    date: '2026-07-08',
    time: '08:00',
    isRead: false,
    link: 'estoque'
  }
];

