export const mockEmployees = [
  { id: 1, name: 'Ahmed Raza', employee_code: 'EMP001', counter_id: 1, status: 'Active', email: 'ahmed@example.com', phone: '03001234567', unified_score: 85, total_interactions: 128 },
  { id: 2, name: 'Sara Khan', employee_code: 'EMP002', counter_id: 2, status: 'Active', email: 'sara@example.com', phone: '03009876543', unified_score: 78, total_interactions: 115 },
  { id: 3, name: 'Bilal Ahmed', employee_code: 'EMP003', counter_id: 3, status: 'Active', email: 'bilal@example.com', phone: '03005555555', unified_score: 92, total_interactions: 142 }
]

export const mockDashboardSummary = {
  unified_score: 85.5,
  presence_rate: 91.2,
  avg_response: 12.3,
  feedback: 4.3,
  avg_voice: 82.5,
  active_alerts: 2,
  alerts: [
    { id: 1, type: 'Low Score', message: 'Employee score below threshold', triggered_at: '2025-01-10T10:30:00' },
    { id: 2, type: 'Absence', message: 'Multiple absences detected', triggered_at: '2025-01-09T14:00:00' }
  ]
}

export const mockTrendData = {
  'Ahmed Raza': [
    { date: '2025-01-01', score: 78 },
    { date: '2025-01-02', score: 80 },
    { date: '2025-01-03', score: 82 },
    { date: '2025-01-04', score: 81 },
    { date: '2025-01-05', score: 85 },
    { date: '2025-01-06', score: 84 },
    { date: '2025-01-07', score: 86 }
  ],
  'Sara Khan': [
    { date: '2025-01-01', score: 75 },
    { date: '2025-01-02', score: 76 },
    { date: '2025-01-03', score: 78 },
    { date: '2025-01-04', score: 77 },
    { date: '2025-01-05', score: 79 },
    { date: '2025-01-06', score: 80 },
    { date: '2025-01-07', score: 78 }
  ],
  'Bilal Ahmed': [
    { date: '2025-01-01', score: 88 },
    { date: '2025-01-02', score: 89 },
    { date: '2025-01-03', score: 91 },
    { date: '2025-01-04', score: 90 },
    { date: '2025-01-05', score: 92 },
    { date: '2025-01-06', score: 93 },
    { date: '2025-01-07', score: 92 }
  ]
}

export const mockInteractions = [
  { id: 1, employee_id: 1, employee_name: 'Ahmed Raza', time: '14:30', present: true, emotion: 82, voice: 85, response: 10, feedback: 4.5 },
  { id: 2, employee_id: 2, employee_name: 'Sara Khan', time: '13:45', present: true, emotion: 75, voice: 78, response: 14, feedback: 4.2 },
  { id: 3, employee_id: 3, employee_name: 'Bilal Ahmed', time: '14:15', present: true, emotion: 90, voice: 92, response: 8, feedback: 4.8 },
  { id: 4, employee_id: 1, employee_name: 'Ahmed Raza', time: '12:00', present: true, emotion: 80, voice: 83, response: 11, feedback: 4.4 },
  { id: 5, employee_id: 2, employee_name: 'Sara Khan', time: '11:30', present: false, emotion: null, voice: null, response: null, feedback: null }
]

export const mockTickets = [
  { id: 1, title: 'Service not working', description: 'The service stopped working today', type: 'Technical', priority: 'High', status: 'Open', customer_name: 'Muhammad Ali', created_at: '2025-01-10' },
  { id: 2, title: 'Billing issue', description: 'I was charged twice', type: 'Billing', priority: 'Urgent', status: 'In Progress', customer_name: 'Fatima Khan', created_at: '2025-01-09' },
  { id: 3, title: 'General inquiry', description: 'How do I reset my password?', type: 'General', priority: 'Low', status: 'Resolved', customer_name: 'Hassan Ahmed', created_at: '2025-01-08' }
]

export const mockAppointments = [
  { id: 1, service_type: 'General', appointment_date: '2025-01-15 10:00', vehicle_model: 'Honda Breeze', vehicle_plate: 'ABC-123', status: 'Pending', customer_name: 'Muhammad Ali', employee_name: 'Ahmed Raza' },
  { id: 2, service_type: 'Technical', appointment_date: '2025-01-16 14:30', vehicle_model: 'Toyota Corolla', vehicle_plate: 'XYZ-789', status: 'Confirmed', customer_name: 'Fatima Khan', employee_name: 'Sara Khan' },
  { id: 3, service_type: 'Maintenance', appointment_date: '2025-01-17 09:00', vehicle_model: 'Honda City', vehicle_plate: 'PQR-456', status: 'Completed', customer_name: 'Hassan Ahmed', employee_name: 'Bilal Ahmed' }
]

export const mockAlerts = [
  { id: 1, employee_id: 1, employee_name: 'Ahmed Raza', alert_type: 'Low Score', message: 'Score dropped below 80', triggered_at: '2025-01-10T10:30:00', is_resolved: false },
  { id: 2, employee_id: 2, employee_name: 'Sara Khan', alert_type: 'Absence', message: 'Absent from work', triggered_at: '2025-01-09T09:00:00', is_resolved: false },
  { id: 3, employee_id: 1, employee_name: 'Ahmed Raza', alert_type: 'High Response Time', message: 'Response time exceeded 15 seconds', triggered_at: '2025-01-08T15:45:00', is_resolved: true }
]

export const mockTicketStats = {
  total: 45,
  open: 12,
  in_progress: 8,
  resolved: 25,
  urgent: 3,
  high: 7,
  medium: 15,
  low: 20,
  avg_resolution_hours: 24
}