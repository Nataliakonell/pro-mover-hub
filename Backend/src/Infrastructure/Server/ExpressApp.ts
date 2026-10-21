import express from "express";
import cors from "cors";

// Repositórios Prisma
import { PrismaParticipantRepository } from "../Repositories/PrismaParticipantRepository";
import { PrismaTriageRepository } from "../Repositories/PrismaTriageRepository";
import { PrismaMedicalRecordRepository } from "../Repositories/PrismaMedicalRecordRepository";
import { PrismaCourtesyRepository } from "../Repositories/PrismaCourtesyRepository";
import { PrismaEventRepository } from "../Repositories/PrismaEventRepository";
import { PrismaSettingsRepository } from "../Repositories/PrismaSettingsRepository";
import { PrismaUserRepository } from "../Repositories/PrismaUserRepository";
import { PrismaPharmacyRepository } from "../Repositories/PrismaPharmacyRepository";
import { PrismaPharmacyGroupRepository } from "../Repositories/PrismaPharmacyGroupRepository";

// Casos de Uso
import { GetAllParticipants } from "../../UseCases/Participants/GetAllParticipants";
import { CreateParticipant } from "../../UseCases/Participants/CreateParticipant";
import { AddAttendance } from "../../UseCases/Participants/AddAttendance";
import { GetAllTriages } from "../../UseCases/Triages/GetAllTriages";
import { CreateTriage } from "../../UseCases/Triages/CreateTriage";
import { GetAllMedicalRecords } from "../../UseCases/MedicalRecords/GetAllMedicalRecords";
import { CreateMedicalRecord } from "../../UseCases/MedicalRecords/CreateMedicalRecord";
import { GetCourtesyRecords } from "../../UseCases/Courtesy/GetCourtesyRecords";
import { ScheduleSession } from "../../UseCases/Courtesy/ScheduleSession";
import { GetAllEvents } from "../../UseCases/Events/GetAllEvents";
import { CreateEvent } from "../../UseCases/Events/CreateEvent";
import { GetSettings } from "../../UseCases/Settings/GetSettings";
import { UpdateSettings } from "../../UseCases/Settings/UpdateSettings";
import { LoginUser } from "../../UseCases/Auth/LoginUser";
import { RegisterUser } from "../../UseCases/Auth/RegisterUser";
import { ChangePassword } from "../../UseCases/Auth/ChangePassword";
import { GetAllPharmacies } from "../../UseCases/Pharmacies/GetAllPharmacies";
import { CreatePharmacy } from "../../UseCases/Pharmacies/CreatePharmacy";
import { UpdatePharmacy } from "../../UseCases/Pharmacies/UpdatePharmacy";
import { DeletePharmacy } from "../../UseCases/Pharmacies/DeletePharmacy";
import { GetAllPharmacyGroups } from "../../UseCases/PharmacyGroups/GetAllPharmacyGroups";
import { CreatePharmacyGroup } from "../../UseCases/PharmacyGroups/CreatePharmacyGroup";
import { UpdatePharmacyGroup } from "../../UseCases/PharmacyGroups/UpdatePharmacyGroup";
import { DeletePharmacyGroup } from "../../UseCases/PharmacyGroups/DeletePharmacyGroup";
import { GetAllUsers } from "../../UseCases/Users/GetAllUsers";
import { CreateUser } from "../../UseCases/Users/CreateUser";
import { DeleteUser } from "../../UseCases/Users/DeleteUser";

// Controllers
import { ParticipantController } from "../../Adapters/Controllers/ParticipantController";
import { TriageController } from "../../Adapters/Controllers/TriageController";
import { MedicalRecordController } from "../../Adapters/Controllers/MedicalRecordController";
import { CourtesyController } from "../../Adapters/Controllers/CourtesyController";
import { EventController } from "../../Adapters/Controllers/EventController";
import { SettingsController } from "../../Adapters/Controllers/SettingsController";
import { AuthController } from "../../Adapters/Controllers/AuthController";
import { PharmacyController } from "../../Adapters/Controllers/PharmacyController";
import { PharmacyGroupController } from "../../Adapters/Controllers/PharmacyGroupController";
import { UserController } from "../../Adapters/Controllers/UserController";

import {
  authMiddleware,
  requireAuth,
  requireAdmin,
  requireGroupManager,
} from "../../Adapters/Middlewares/AuthMiddleware";

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Instanciação das dependências seguindo Clean Architecture
const participantRepo = new PrismaParticipantRepository();
const triageRepo = new PrismaTriageRepository();
const medicalRecordRepo = new PrismaMedicalRecordRepository();
const courtesyRepo = new PrismaCourtesyRepository();
const eventRepo = new PrismaEventRepository();
const settingsRepo = new PrismaSettingsRepository();
const userRepo = new PrismaUserRepository();
const pharmacyRepo = new PrismaPharmacyRepository();
const pharmacyGroupRepo = new PrismaPharmacyGroupRepository();

const participantController = new ParticipantController(
  new GetAllParticipants(participantRepo),
  new CreateParticipant(participantRepo),
  new AddAttendance(participantRepo)
);

const triageController = new TriageController(
  new GetAllTriages(triageRepo),
  new CreateTriage(triageRepo)
);

const medicalRecordController = new MedicalRecordController(
  new GetAllMedicalRecords(medicalRecordRepo),
  new CreateMedicalRecord(medicalRecordRepo)
);

const courtesyController = new CourtesyController(
  new GetCourtesyRecords(courtesyRepo),
  new ScheduleSession(courtesyRepo),
  courtesyRepo
);

const eventController = new EventController(
  new GetAllEvents(eventRepo),
  new CreateEvent(eventRepo)
);

const settingsController = new SettingsController(
  new GetSettings(settingsRepo),
  new UpdateSettings(settingsRepo)
);

const authController = new AuthController(
  new LoginUser(userRepo),
  new RegisterUser(userRepo),
  new ChangePassword(userRepo)
);

const pharmacyController = new PharmacyController(
  new GetAllPharmacies(pharmacyRepo),
  new CreatePharmacy(pharmacyRepo),
  new UpdatePharmacy(pharmacyRepo),
  new DeletePharmacy(pharmacyRepo)
);

const pharmacyGroupController = new PharmacyGroupController(
  new GetAllPharmacyGroups(pharmacyGroupRepo),
  new CreatePharmacyGroup(pharmacyGroupRepo),
  new UpdatePharmacyGroup(pharmacyGroupRepo),
  new DeletePharmacyGroup(pharmacyGroupRepo)
);

const userController = new UserController(
  new GetAllUsers(userRepo),
  new CreateUser(userRepo),
  new DeleteUser(userRepo)
);

// Rota de Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "PRO-MOVER Hub Backend",
    timestamp: new Date().toISOString(),
  });
});

// Autenticação & Troca de Senha
app.post("/api/auth/login", (req, res) => authController.login(req, res));
app.post("/api/auth/register", (req, res) => authController.register(req, res));
app.post("/api/auth/change-password", authMiddleware, requireAuth, (req, res) =>
  authController.changePassword(req, res)
);

// Grupos de Farmácias (Multi-Tenant)
app.get("/api/pharmacy-groups", authMiddleware, requireAuth, (req, res) =>
  pharmacyGroupController.list(req, res)
);
app.post("/api/pharmacy-groups", authMiddleware, requireAdmin, (req, res) =>
  pharmacyGroupController.create(req, res)
);
app.put("/api/pharmacy-groups/:id", authMiddleware, requireGroupManager, (req, res) =>
  pharmacyGroupController.update(req, res)
);
app.delete("/api/pharmacy-groups/:id", authMiddleware, requireAdmin, (req, res) =>
  pharmacyGroupController.delete(req, res)
);

// Gestão de Usuários (Multi-Tenant: Admin vê tudo; Gestor gerencia usuários do seu grupo)
app.get("/api/users", authMiddleware, requireGroupManager, (req, res) =>
  userController.list(req, res)
);
app.post("/api/users", authMiddleware, requireGroupManager, (req, res) =>
  userController.create(req, res)
);
app.delete("/api/users/:id", authMiddleware, requireGroupManager, (req, res) =>
  userController.delete(req, res)
);

// Eventos Comunitários
app.get("/api/events", authMiddleware, (req, res) => eventController.list(req, res));
app.post("/api/events", authMiddleware, (req, res) => eventController.create(req, res));

// Participantes
app.get("/api/participants", authMiddleware, (req, res) => participantController.list(req, res));
app.post("/api/participants", authMiddleware, (req, res) => participantController.create(req, res));
app.post("/api/participants/:id/attendances", authMiddleware, (req, res) =>
  participantController.addAttendance(req, res)
);

// Triagens Clínicas
app.get("/api/triages", authMiddleware, (req, res) => triageController.list(req, res));
app.post("/api/triages", authMiddleware, (req, res) => triageController.create(req, res));

// Prontuários Médicos
app.get("/api/medical-records", authMiddleware, (req, res) => medicalRecordController.list(req, res));
app.post("/api/medical-records", authMiddleware, (req, res) => medicalRecordController.create(req, res));

// Sessões Cortesia
app.get("/api/courtesy", authMiddleware, (req, res) => courtesyController.list(req, res));
app.post("/api/courtesy/concede", authMiddleware, (req, res) => courtesyController.concede(req, res));
app.post("/api/courtesy/schedule", authMiddleware, (req, res) => courtesyController.schedule(req, res));

// Configurações
app.get("/api/settings", authMiddleware, (req, res) => settingsController.get(req, res));
app.put("/api/settings", authMiddleware, requireAdmin, (req, res) => settingsController.update(req, res));

// Farmácias Vinculadas ao Sistema (100% Persistidas no PostgreSQL)
app.get("/api/pharmacies", authMiddleware, (req, res) => pharmacyController.list(req, res));
app.post("/api/pharmacies", authMiddleware, (req, res) => pharmacyController.create(req, res));
app.put("/api/pharmacies/:id", authMiddleware, (req, res) => pharmacyController.update(req, res));
app.delete("/api/pharmacies/:id", authMiddleware, (req, res) => pharmacyController.delete(req, res));

export default app;
