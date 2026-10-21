// Cliente de API HTTP para comunicação com o Backend (Node.js/Express na porta 5000)

const API_BASE = (import.meta.env as Record<string, string | undefined>)["VITE_API_URL"] || "http://localhost:5000/api";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("conecta_saude_token");
}

export async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMsg = `Erro na API (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {
      const errorBody = await response.text();
      if (errorBody) errorMsg = errorBody;
    }
    throw new Error(errorMsg);
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
  eventId?: string | undefined;
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
    medicalRecordId?: string | undefined;
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

export async function createEventApi(data: {
  name: string;
  date?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  location: string;
  pharmacyId?: string | undefined;
}) {
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
  participantId?: string | undefined;
  participantName: string;
  eventId: string;
  time?: string | undefined;
  responsible: string;
  status: string;
  systolic: number;
  diastolic: number;
  spo2: number;
  heartRate: number;
  result?: string | undefined;
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

// 7. Farmácias Vinculadas
export async function getPharmaciesApi() {
  return fetchFromApi<any[]>("/pharmacies");
}

export async function createPharmacyApi(data: any) {
  return fetchFromApi<any>("/pharmacies", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePharmacyApi(id: string, data: any) {
  return fetchFromApi<any>(`/pharmacies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePharmacyApi(id: string) {
  return fetchFromApi<void>(`/pharmacies/${id}`, {
    method: "DELETE",
  });
}

// 8. Autenticação & Troca de Senha
export async function loginApi(identifier: string, password: string) {
  return fetchFromApi<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function changePasswordApi(currentPassword: string, newPassword: string) {
  return fetchFromApi<{ message: string; token: string; user: any }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// 9. Grupos de Farmácias
export async function getPharmacyGroupsApi() {
  return fetchFromApi<any[]>("/pharmacy-groups");
}

export async function createPharmacyGroupApi(data: {
  name: string;
  cnpj?: string;
  responsible?: string;
  phone?: string;
  email?: string;
}) {
  return fetchFromApi<any>("/pharmacy-groups", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// 10. Gestão de Usuários
export async function getUsersApi() {
  return fetchFromApi<any[]>("/users");
}

export async function createUserApi(data: {
  name: string;
  email: string;
  username?: string;
  role: string;
  groupId?: string | null;
  pharmacyId?: string | null;
}) {
  return fetchFromApi<{ user: any; temporaryPassword: string }>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteUserApi(id: number) {
  return fetchFromApi<void>(`/users/${id}`, {
    method: "DELETE",
  });
}
