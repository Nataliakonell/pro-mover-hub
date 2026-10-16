// Cliente de API HTTP para comunicação com o Backend (Node.js/Express na porta 5000)

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Erro na API (${response.status}): ${errorBody}`);
  }

  return response.json();
}

// 1. Participantes
export async function getParticipantsApi() {
  return fetchFromApi<any[]>("/participants");
}

export async function createParticipantApi(data: {
  name: string;
  birthDate: string;
  age: number;
  ageGroup: string;
  cpf: string;
  phone: string;
  eventId?: string;
}) {
  return fetchFromApi<any>("/participants", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function addAttendanceApi(
  participantId: string,
  data: {
    date: string;
    eventName: string;
    type: string;
    responsible: string;
    status: string;
    summary: string;
    medicalRecordId?: string;
  }
) {
  return fetchFromApi<any>(`/participants/${participantId}/attendances`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// 2. Eventos Comunitários / Campanhas
export async function getEventsApi() {
  return fetchFromApi<any[]>("/events");
}

export async function createEventApi(data: { name: string; date: string; location: string }) {
  return fetchFromApi<any>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// 3. Triagens Clínicas
export async function getTriagesApi(eventId?: string) {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
  return fetchFromApi<any[]>(`/triages${query}`);
}

export async function createTriageApi(data: {
  participantId?: string;
  participantName: string;
  eventId: string;
  time?: string;
  responsible: string;
  status: string;
  systolic: number;
  diastolic: number;
  glucose: number;
  spo2: number;
  heartRate: number;
  result?: string;
}) {
  return fetchFromApi<any>("/triages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// 4. Prontuários Médicos
export async function getMedicalRecordsApi() {
  return fetchFromApi<any[]>("/medical-records");
}

export async function createMedicalRecordApi(data: any) {
  return fetchFromApi<any>("/medical-records", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// 5. Sessões Cortesia
export async function getCourtesyRecordsApi() {
  return fetchFromApi<any[]>("/courtesy");
}

export async function concedeCourtesyApi(data: {
  participantId: string;
  triageId?: string;
  sessions: number;
  reason: string;
}) {
  return fetchFromApi<any>("/courtesy/concede", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function scheduleCourtesyApi(data: {
  courtesyRecordId: string;
  date: string;
  type: string;
  professional: string;
  status: "Realizado" | "Agendado" | "Cancelado";
}) {
  return fetchFromApi<any>("/courtesy/schedule", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// 6. Configurações
export async function getSettingsApi() {
  return fetchFromApi<any>("/settings");
}

export async function updateSettingsApi(data: any) {
  return fetchFromApi<any>("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// 7. Autenticação
export async function loginApi(email: string, password: string) {
  return fetchFromApi<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
