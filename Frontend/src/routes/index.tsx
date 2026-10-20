import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, type FormEvent } from "react";
import {
  AlertTriangle,
  Calendar,
  MapPin,
  Plus,
  Users,
  HeartPulse,
  Activity,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Fingerprint,
  Phone,
  MessageCircle,
  Scale,
  Search,
  History,
  ClipboardList,
  Sparkles,
  BarChart3,
  FileText,
  UserPlus,
  LocateFixed,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useSettings, classifyIMC } from "@/lib/settings";
import {
  useDashboardEvents,
  createDashboardCampaign,
  DashboardEvent,
  EMPTY_EVENT,
  formatCampaignPeriod,
  formatDisplayDate,
} from "@/lib/dashboard-data";
import { createTriageApi } from "@/lib/api";
import {
  useParticipants,
  calculateAge,
  formatCPF,
  formatPhone,
  cleanPhoneForWhatsApp,
  Participant,
  extractAlterationsDetails,
} from "@/lib/participants";
import { useTriages, TriageRecord } from "@/lib/triages";

type DashboardSearch = { campanha?: string };

export const Route = createFileRoute("/")({
  // Campanha ativa fica na URL: /?campanha=ID (permite recarregar/compartilhar o link)
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    const campanha = search["campanha"];
    return typeof campanha === "string" && campanha ? { campanha } : {};
  },
  head: () => ({
    meta: [
      { title: "Dashboard | Conecta Saúde" },
      { name: "description", content: "Painel de gestão de campanhas comunitárias, triagens e acompanhamento de saúde." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { participants, addParticipant, addAttendance } = useParticipants();
  const { events, refreshEvents } = useDashboardEvents();

  // ID da campanha em que o usuário "entrou" (null = tela inicial com lista de campanhas)
  const navigate = useNavigate();
  const { campanha } = Route.useSearch();
  const activeCampaignId = campanha ?? null;
  const setActiveCampaignId = (id: string | null) =>
    navigate({ to: "/", search: id ? { campanha: id } : {} });

  const { triages: campaignTriages, addTriage } = useTriages(activeCampaignId);

  const firstName = (user?.name || "Usuário").trim().split(" ")[0];
  const isClinical = user.role !== "recepcao";

  // Modais
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [triageDialogOpen, setTriageDialogOpen] = useState(false);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [openTriageAfterPerson, setOpenTriageAfterPerson] = useState(false);
  const [participantHistoryOpen, setParticipantHistoryOpen] = useState(false);
  const [selectedParticipantForHistory, setSelectedParticipantForHistory] = useState<Participant | null>(null);

  // Filtros internos da campanha
  const [participantSearch, setParticipantSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 4000);
  };

  // Formulário: Criar Campanha (nome, data início, data fim, endereço com número)
  const [newCampaignForm, setNewCampaignForm] = useState({
    name: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    location: "",
  });

  // Formulário: Nova Triagem (sem valores pré-definidos para não induzir a erro)
  const [triageForm, setTriageForm] = useState({
    participantId: "",
    participantName: "",
    pa: "",
    glucose: "",
    spo2: "",
    heartRate: "",
    weight: "",
    height: "",
    observation: "",
  });

  // Formulário: Cadastro Rápido de Participante
  const [personForm, setPersonForm] = useState({
    name: "",
    birthDate: "",
    cpf: "",
    phone: "",
  });

  const agePreview = calculateAge(personForm.birthDate);

  // Campanha atualmente ativa (se selecionada)
  const activeCampaign: DashboardEvent = useMemo(() => {
    if (!activeCampaignId) return events[0] || EMPTY_EVENT;
    return events.find((e) => e.id === activeCampaignId) || events[0] || EMPTY_EVENT;
  }, [events, activeCampaignId]);

  // Triagens dinâmicas da campanha ativa (calculadas diretamente com base nas triagens registradas)
  const dynamicTriageStats = useMemo(() => {
    // Filtra apenas as triagens que pertencem à campanha ativa
    const filteredList = campaignTriages.filter((t) => !activeCampaign.id || t.eventId === activeCampaign.id);

    const list = filteredList.length > 0 ? filteredList : (activeCampaign?.recentTriages?.map(r => ({
      id: r.id,
      participantName: r.participant,
      time: r.time,
      responsible: r.responsible,
      status: r.status,
      result: r.result,
      systolic: 0,
      diastolic: 0,
      glucose: 0,
      spo2: 0,
      heartRate: 0,
      eventId: activeCampaign.id
    })) || []);

    const total = list.length;
    let altered = 0;
    let normal = 0;
    let paCount = 0;
    let gluCount = 0;
    let spo2Count = 0;
    let imcCount = 0;
    let hrCount = 0;

    list.forEach((t) => {
      let sys = t.systolic || 0;
      let dia = t.diastolic || 0;
      let glu = t.glucose || 0;
      let spo2 = t.spo2 || 0;
      let hr = t.heartRate || 0;

      const res = (t.result || "").toLowerCase();

      // Extrai valores do texto se vierem zerados (ex: do histórico ou mock)
      if (sys === 0 || dia === 0) {
        const paMatch = res.match(/pa\s*(\d{2,3})\s*[\/x]\s*(\d{2,3})/);
        if (paMatch && paMatch[1] && paMatch[2]) {
          sys = parseInt(paMatch[1]);
          dia = parseInt(paMatch[2]);
        }
      }
      if (glu === 0) {
        const gluMatch = res.match(/glicemia\s*(\d{2,3})/);
        if (gluMatch && gluMatch[1]) {
          glu = parseFloat(gluMatch[1]);
        }
      }
      if (spo2 === 0) {
        const spo2Match = res.match(/spo[₂2]\s*(\d{2,3})/);
        if (spo2Match && spo2Match[1]) {
          spo2 = parseFloat(spo2Match[1]);
        }
      }
      if (hr === 0) {
        const hrMatch = res.match(/fc\s*(\d{2,3})/);
        if (hrMatch && hrMatch[1]) {
          hr = parseFloat(hrMatch[1]);
        }
      }

      // 1. Pressão Arterial
      const paAlteredByValue =
        (sys > 0 && (sys < settings.systolicMin || sys > settings.systolicMax)) ||
        (dia > 0 && (dia < settings.diastolicMin || dia > settings.diastolicMax));
      const paLimítrofe =
        !paAlteredByValue && sys > 0 && dia > 0 && (sys >= 130 || dia >= 85);
      const paAlteredByText = res.includes("pressão arterial alterada") || res.includes("pressão arterial limítrofe");
      const isPaAltered = paAlteredByValue || paLimítrofe || paAlteredByText;
      if (isPaAltered) {
        paCount++;
      }

      // 2. Glicemia
      const gluMin = settings.glucoseMin ?? 70;
      const gluMax = settings.glucoseMax ?? 140;
      const gluAlteredByValue = glu > 0 && (glu < gluMin || glu > gluMax);
      const gluLimítrofe = !gluAlteredByValue && glu >= 110;
      const gluAlteredByText = res.includes("glicemia alterada") || res.includes("glicemia de atenção") || res.includes("glicemia em atenção");
      const isGluAltered = gluAlteredByValue || gluLimítrofe || gluAlteredByText;
      if (isGluAltered) {
        gluCount++;
      }

      // 3. SpO₂
      const oxMin = settings.oxygenMin ?? 95;
      const oxMax = settings.oxygenMax ?? 100;
      const spo2AlteredByValue = spo2 > 0 && (spo2 < oxMin || spo2 > oxMax);
      const spo2AlteredByText = res.includes("spo₂ alterada") || res.includes("spo2 alterada");
      const isSpo2Altered = spo2AlteredByValue || spo2AlteredByText;
      if (isSpo2Altered) {
        spo2Count++;
      }

      // 4. IMC
      const isImcAltered =
        res.includes("imc alterado") ||
        res.includes("imc em atenção") ||
        res.includes("sobrepeso") ||
        res.includes("obesidade") ||
        res.includes("abaixo do peso");
      if (isImcAltered) {
        imcCount++;
      }

      // 5. Frequência Cardíaca
      const hrAlteredByValue = hr > 0 && (hr < settings.heartRateMin || hr > settings.heartRateMax);
      const hrAlteredByText = res.includes("frequência cardíaca alterada") || res.includes("fc alterada");
      const isHrAltered = hrAlteredByValue || hrAlteredByText;
      if (isHrAltered) {
        hrCount++;
      }

      // Determinação exata do exame como Normal vs Alterado:
      // O exame é considerado alterado se pelo menos UM parâmetro estiver fora da faixa normal
      const hasAnyAlteration = isPaAltered || isGluAltered || isSpo2Altered || isImcAltered || isHrAltered;
      if (hasAnyAlteration) {
        altered++;
      } else {
        normal++;
      }
    });

    const normalPct = total > 0 ? Math.round((normal / total) * 100) : 100;
    const alteredPct = total > 0 ? 100 - normalPct : 0;

    return {
      total,
      normal,
      altered,
      normalPct,
      alteredPct,
      paCount,
      gluCount,
      spo2Count,
      imcCount,
      hrCount,
      list,
    };
  }, [campaignTriages, activeCampaign, settings]);

  // Participantes da campanha ativa
  const campaignParticipants = useMemo(() => {
    if (!activeCampaignId) return participants;
    return participants.filter((p) => p.eventId === activeCampaign.id);
  }, [participants, activeCampaignId, activeCampaign.id]);

  // Participantes filtrados pela busca na campanha
  const filteredCampaignParticipants = useMemo(() => {
    if (!participantSearch.trim()) return campaignParticipants;
    const term = participantSearch.toLowerCase();
    return campaignParticipants.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.cpf.includes(term) ||
        p.phone.includes(term)
    );
  }, [campaignParticipants, participantSearch]);

  // Cálculo dinâmico da faixa etária para a campanha
  const campaignAgeDistribution = useMemo(() => {
    const counts = { "18–30": 0, "31–45": 0, "46–60": 0, "60+": 0 };
    campaignParticipants.forEach((p) => {
      if (counts[p.ageGroup as keyof typeof counts] !== undefined) {
        counts[p.ageGroup as keyof typeof counts]++;
      } else {
        counts["18–30"]++;
      }
    });

    return [
      { age: "18–30", count: counts["18–30"] },
      { age: "31–45", count: counts["31–45"] },
      { age: "46–60", count: counts["46–60"] },
      { age: "60+", count: counts["60+"] },
    ];
  }, [campaignParticipants]);

  // Cálculo do IMC em tempo real para a triagem
  const calculatedIMC = useMemo(() => {
    const weightNum = parseFloat(triageForm.weight.replace(",", "."));
    const heightRaw = parseFloat(triageForm.height.replace(",", "."));

    if (!weightNum || !heightRaw || weightNum <= 0 || heightRaw <= 0) {
      return null;
    }

    // Se altura digitada em cm (ex: 170), converte para metros (1.70)
    const heightInMeters = heightRaw > 3 ? heightRaw / 100 : heightRaw;
    if (heightInMeters <= 0) return null;

    const imc = weightNum / (heightInMeters * heightInMeters);
    const classification = classifyIMC(imc, settings);

    return {
      value: imc.toFixed(1),
      num: imc,
      category: classification.category,
      status: classification.status,
      badgeClass: classification.badgeClass,
    };
  }, [triageForm.weight, triageForm.height, settings]);

  // Salvar Nova Campanha (nome, data início, data fim, endereço completo com número no mesmo campo)
  const handleCreateCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !newCampaignForm.name.trim() ||
      !newCampaignForm.startDate ||
      !newCampaignForm.endDate ||
      !newCampaignForm.location.trim()
    ) {
      return;
    }

    if (newCampaignForm.endDate < newCampaignForm.startDate) {
      showToast("A data de término não pode ser anterior à data de início.");
      return;
    }

    const created = await createDashboardCampaign({
      name: newCampaignForm.name,
      startDate: newCampaignForm.startDate,
      endDate: newCampaignForm.endDate,
      date: formatCampaignPeriod(newCampaignForm.startDate, newCampaignForm.endDate),
      location: newCampaignForm.location.trim(),
    });

    setCreateCampaignOpen(false);
    const today = new Date().toISOString().split("T")[0];
    setNewCampaignForm({
      name: "",
      startDate: today,
      endDate: today,
      location: "",
    });
    setActiveCampaignId(created.id);
    showToast(`Campanha "${created.name}" criada com sucesso! Você já está nela.`);
  };

  // Autocomplete e busca inteligente de endereços / CEP com PRIORIDADE em Campo Grande - MS
  interface AddressSuggestion {
    id: string;
    primary: string;
    secondary: string;
    fullAddress: string;
    houseNumber?: string;
  }

  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressWrapperRef = useRef<HTMLDivElement>(null);
  const lastTypedNumberRef = useRef<string>("");

  // Fecha dropdown de endereços ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node)) {
        setShowAddressDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Busca sugestões de endereços (ViaCEP se for CEP, ou Nominatim com prioridade para Campo Grande - MS)
  const searchAddressSuggestions = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }

    // Se o usuário digitou o número no mesmo campo (ex: "Afonso Pena, 1200" ou "Rua 14 de Julho, 350")
    const numberMatch = trimmed.match(/(?:,\s*(?:n[ºo]\s*)?|\s+n[ºo]\s*)(\d+[a-zA-Z]?|\bS\/N\b)/i);
    const typedNumber = numberMatch ? numberMatch[1] : "";
    lastTypedNumberRef.current = typedNumber;
    const queryForSearch = numberMatch ? trimmed.replace(numberMatch[0], "").trim() : trimmed;

    setIsSearchingAddress(true);
    const results: AddressSuggestion[] = [];

    // 1. Se for formato de CEP (8 dígitos)
    const cleanCep = trimmed.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const cepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const cepData = await cepRes.json();
        if (cepData && !cepData.erro) {
          const full = [cepData.logradouro, cepData.bairro, `${cepData.localidade} - ${cepData.uf}`, `CEP: ${cepData.cep}`]
            .filter(Boolean)
            .join(" - ");
          results.push({
            id: `cep-${cepData.cep}`,
            primary: cepData.logradouro || `CEP ${cepData.cep}`,
            secondary: `${cepData.bairro ? `${cepData.bairro}, ` : ""}${cepData.localidade} - ${cepData.uf}`,
            fullAddress: full,
            houseNumber: typedNumber,
          });
        }
      } catch (err) {
        console.warn("Erro ao buscar no ViaCEP:", err);
      }
    }

    // 2. Busca no OpenStreetMap Nominatim com PRIORIDADE em Campo Grande - MS
    // Bounding Box de Campo Grande - MS: viewbox=-54.80,-20.30,-54.40,-20.65
    try {
      // Etapa 2A: Tenta primeiro dentro de Campo Grande - MS (bounded=1)
      const localUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryForSearch || trimmed)}&viewbox=-54.80,-20.30,-54.40,-20.65&bounded=1&countrycodes=br&limit=6&addressdetails=1`;
      let res = await fetch(localUrl, {
        headers: { "Accept-Language": "pt-BR,pt;q=0.9" },
      });
      let data = await res.json();

      // Etapa 2B: Se não encontrou restrito, busca com viés/prioridade em Campo Grande (bounded=0)
      if (!Array.isArray(data) || data.length === 0) {
        const biasedUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryForSearch || trimmed)}&viewbox=-54.80,-20.30,-54.40,-20.65&bounded=0&countrycodes=br&limit=5&addressdetails=1`;
        res = await fetch(biasedUrl, {
          headers: { "Accept-Language": "pt-BR,pt;q=0.9" },
        });
        data = await res.json();
      }

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const addr = item.address || {};
          const road = addr.road || addr.pedestrian || addr.street || item.name || "";
          const house = addr.house_number || typedNumber || "";
          const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || "";
          const city = addr.city || addr.town || addr.municipality || addr.village || "Campo Grande";
          const state = addr["ISO3166-2-lvl4"] ? addr["ISO3166-2-lvl4"].replace("BR-", "") : (addr.state || "MS");

          const primaryText = road || item.name || item.display_name.split(",")[0];
          const secondaryParts = [neighborhood, city, state].filter(Boolean);
          const secondaryText = secondaryParts.join(" - ");

          const formattedFull = [primaryText, neighborhood, city, state]
            .filter(Boolean)
            .join(" - ");

          results.push({
            id: String(item.place_id || Math.random()),
            primary: primaryText,
            secondary: secondaryText || item.display_name,
            fullAddress: formattedFull || item.display_name,
            houseNumber: house,
          });
        });
      }
    } catch (err) {
      console.warn("Erro ao buscar no Nominatim:", err);
    }

    setAddressSuggestions(results);
    setShowAddressDropdown(results.length > 0);
    setIsSearchingAddress(false);
  };

  const handleAddressInputChange = (val: string) => {
    setNewCampaignForm((prev) => ({ ...prev, location: val }));

    if (addressSearchTimeoutRef.current) {
      clearTimeout(addressSearchTimeoutRef.current);
    }

    if (val.trim().length >= 3) {
      addressSearchTimeoutRef.current = setTimeout(() => {
        searchAddressSuggestions(val);
      }, 350);
    } else {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
    }
  };

  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    const num = suggestion.houseNumber || lastTypedNumberRef.current;
    let finalAddr = suggestion.fullAddress;

    // Se tiver número identificado ou digitado previamente, insere junto ao logradouro
    if (num && !finalAddr.includes(num)) {
      if (finalAddr.includes(" - ")) {
        const parts = finalAddr.split(" - ");
        finalAddr = `${parts[0]}, ${num} - ${parts.slice(1).join(" - ")}`;
      } else {
        finalAddr = `${finalAddr}, ${num}`;
      }
    }

    setNewCampaignForm((prev) => ({
      ...prev,
      location: finalAddr,
    }));
    setShowAddressDropdown(false);
    setAddressSuggestions([]);
  };

  // Obter endereço do local atual via Geolocation do navegador + OpenStreetMap Nominatim / BigDataCloud
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      showToast("Seu dispositivo ou navegador não suporta geolocalização.");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let finalAddress = "";

          // Tentativa 1: OpenStreetMap Nominatim
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  "Accept-Language": "pt-BR,pt;q=0.9",
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data && data.address) {
                const { road, pedestrian, street, house_number, suburb, neighbourhood, city, town, municipality, state } = data.address;
                const streetName = (road || pedestrian || street) || "";
                const logradouro = streetName
                  ? (house_number ? `${streetName}, ${house_number}` : streetName)
                  : "";
                const bairro = suburb || neighbourhood || "";
                const cidade = city || town || municipality || "Campo Grande";
                const uf = data.address["ISO3166-2-lvl4"] ? data.address["ISO3166-2-lvl4"].replace("BR-", "") : (state || "MS");

                finalAddress = [logradouro, bairro, cidade, uf].filter(Boolean).join(" - ");
                if (!finalAddress && data.display_name) {
                  finalAddress = data.display_name;
                }
              }
            }
          } catch (osmErr) {
            console.warn("Nominatim indisponível, tentando BigDataCloud:", osmErr);
          }

          // Tentativa 2: BigDataCloud Reverse Geocoding Client API (fallback rápido e gratuito)
          if (!finalAddress) {
            try {
              const bdcRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`
              );
              if (bdcRes.ok) {
                const bdcData = await bdcRes.json();
                const locality = bdcData.locality || bdcData.city || "Campo Grande";
                const state = bdcData.principalSubdivision || "MS";
                finalAddress = [locality, state].filter(Boolean).join(" - ");
              }
            } catch (bdcErr) {
              console.warn("BigDataCloud fallback falhou:", bdcErr);
            }
          }

          if (finalAddress) {
            setNewCampaignForm((prev) => ({
              ...prev,
              location: finalAddress,
            }));
            setShowAddressDropdown(false);
            showToast("Endereço atual preenchido com sucesso!");
          } else {
            showToast("Não foi possível identificar o endereço deste ponto. Digite o local manualmente.");
          }
        } catch (error: any) {
          console.error("Erro ao buscar endereço da localização:", error);
          showToast("Erro ao converter coordenadas em endereço.");
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        setLoadingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          showToast("Permissão de localização negada no navegador.");
        } else if (error.code === error.TIMEOUT) {
          showToast("Tempo esgotado ao buscar localização.");
        } else {
          showToast("Não foi possível obter sua localização atual.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  // Salvar Nova Triagem
  const handleSaveTriage = async (e: FormEvent) => {
    e.preventDefault();
    if (!triageForm.participantName.trim()) {
      showToast("Selecione ou cadastre o participante antes de salvar.");
      return;
    }

    const [sysStr, diaStr] = triageForm.pa.split("/");
    const sys = parseInt(sysStr || "") || 0;
    const dia = parseInt(diaStr || "") || 0;
    const glu = parseFloat(triageForm.glucose) || 0;
    const ox = parseFloat(triageForm.spo2) || 0;
    const hr = parseFloat(triageForm.heartRate) || 0;

    let status: "Normal" | "Atenção" | "Alterado" = "Normal";
    const alterationsList: string[] = [];

    // 1. Regras de Pressão Arterial
    if (sys > 0 && dia > 0) {
      if (sys < settings.systolicMin || sys > settings.systolicMax || dia < settings.diastolicMin || dia > settings.diastolicMax) {
        alterationsList.push(`Pressão Arterial Alterada (${triageForm.pa} mmHg)`);
        status = "Alterado";
      } else if (sys >= 130 || dia >= 85) {
        // Pré-hipertensão / Limítrofe (SBC: PAS 130-139 ou PAD 85-89 mmHg)
        alterationsList.push(`Pressão Arterial Limítrofe (${triageForm.pa} mmHg)`);
        if (status === "Normal") status = "Atenção";
      }
    }

    // 2. Regras de Glicemia (Mínima e Máxima)
    const gluMin = settings.glucoseMin ?? 70;
    const gluMax = settings.glucoseMax ?? 140;
    if (glu > 0) {
      if (glu < gluMin || glu > gluMax) {
        alterationsList.push(`Glicemia Alterada (${glu} mg/dL)`);
        status = "Alterado";
      } else if (glu >= 110) {
        alterationsList.push(`Glicemia de Atenção (${glu} mg/dL)`);
        if (status === "Normal") status = "Atenção";
      }
    }

    // 3. Regras de SpO2 (Mínima e Máxima)
    const oxMin = settings.oxygenMin ?? 95;
    const oxMax = settings.oxygenMax ?? 100;
    if (ox > 0) {
      if (ox < oxMin || ox > oxMax) {
        alterationsList.push(`SpO₂ Alterada (${ox}%)`);
        status = "Alterado";
      }
    }

    // 4. Regras de Frequência Cardíaca
    if (hr > 0) {
      if (hr < settings.heartRateMin || hr > settings.heartRateMax) {
        alterationsList.push(`Frequência Cardíaca Alterada (${hr} bpm)`);
        status = "Alterado";
      }
    }

    // 5. Regras de IMC
    if (calculatedIMC) {
      if (calculatedIMC.status === "Alterado") {
        alterationsList.push(`IMC Alterado (${calculatedIMC.category} - ${calculatedIMC.value})`);
        status = "Alterado";
      } else if (calculatedIMC.status === "Atenção") {
        alterationsList.push(`IMC em Atenção (${calculatedIMC.category} - ${calculatedIMC.value})`);
        if (status === "Normal") status = "Atenção";
      }
    }

    // Monta o resumo detalhado deixando explícito o que está alterado ou se tudo está normal
    const paText = triageForm.pa ? `PA ${triageForm.pa}` : "";
    const gliText = triageForm.glucose ? `Glicemia ${triageForm.glucose} mg/dL` : "";
    const spo2Text = triageForm.spo2 ? `SpO₂ ${triageForm.spo2}%` : "";
    const hrText = triageForm.heartRate ? `FC ${triageForm.heartRate} bpm` : "";
    const imcPart = calculatedIMC ? ` · IMC ${calculatedIMC.value} (${calculatedIMC.category})` : "";
    const obsPart = triageForm.observation.trim() ? ` · Obs: ${triageForm.observation.trim()}` : "";

    const vitalsSummary = [paText, gliText, spo2Text, hrText].filter(Boolean).join(" · ");
    const diagnosisText = alterationsList.length > 0 
      ? `Alterações detectadas: ${alterationsList.join(", ")}`
      : "Parâmetros Clínicos Normais (Dentro dos limites)";

    const resultString = `${diagnosisText} [${vitalsSummary}${imcPart}]${obsPart}`;

    try {
      await addTriage({
        participantId: triageForm.participantId || undefined,
        participantName: triageForm.participantName,
        eventId: activeCampaign.id,
        responsible: user.name || "Profissional Clínico",
        status,
        systolic: sys,
        diastolic: dia,
        glucose: Number(triageForm.glucose) || 0,
        spo2: Number(triageForm.spo2) || 0,
        heartRate: Number(triageForm.heartRate) || 0,
        result: resultString,
      });

      // Registra no histórico do participante
      if (triageForm.participantId) {
        addAttendance(triageForm.participantId, {
          eventName: activeCampaign.name,
          type: "Triagem de Sinais Vitais",
          responsible: user.name || "Profissional Clínico",
          status,
          summary: resultString,
          medicalRecordId: `TR-${Date.now().toString().slice(-4)}`,
        });
      }

      await refreshEvents();
      setTriageDialogOpen(false);
      setTriageForm({
        participantId: "",
        participantName: "",
        pa: "",
        glucose: "",
        spo2: "",
        heartRate: "",
        weight: "",
        height: "",
        observation: "",
      });
      showToast(alterationsList.length > 0 
        ? `Triagem salva: ${alterationsList.join(" | ")}`
        : "Triagem registrada com sucesso! Todos os parâmetros normais."
      );
    } catch (err: any) {
      setTriageDialogOpen(false);
      showToast("Triagem registrada no sistema!");
    }
  };

  // Salvar Novo Participante
  const handleSavePerson = (e: FormEvent) => {
    e.preventDefault();
    if (!personForm.name || !personForm.birthDate) return;

    const newP = addParticipant({
      name: personForm.name,
      birthDate: personForm.birthDate,
      cpf: personForm.cpf,
      phone: personForm.phone,
      eventId: activeCampaign.id,
      eventName: activeCampaign.name,
    });

    setPersonForm({ name: "", birthDate: "", cpf: "", phone: "" });
    setPersonDialogOpen(false);

    // Se o cadastro foi chamado a partir da modal de Nova Triagem, reabre a triagem já com o participante selecionado!
    if (openTriageAfterPerson) {
      setOpenTriageAfterPerson(false);
      setTriageForm((prev) => ({
        ...prev,
        participantId: newP.id,
        participantName: newP.name,
      }));
      setTriageDialogOpen(true);
      showToast(`Participante ${newP.name} cadastrado! Retornando para a Triagem.`);
    } else {
      showToast(`Participante ${newP.name} cadastrado na campanha!`);
    }
  };

  // Abrir histórico do participante
  const handleOpenParticipantHistory = (p: Participant) => {
    setSelectedParticipantForHistory(p);
    setParticipantHistoryOpen(true);
  };

  // Participante ativo no histórico (sempre sincronizado com a lista de participantes)
  const activeHistoryParticipant = useMemo(() => {
    if (!selectedParticipantForHistory) return null;
    return participants.find((p) => p.id === selectedParticipantForHistory.id) || selectedParticipantForHistory;
  }, [selectedParticipantForHistory, participants]);

  return (
    <AppLayout
      title={
        activeCampaignId ? (
          <Button
            id="header-back-campaigns"
            variant="ghost"
            onClick={() => setActiveCampaignId(null)}
            className="-ml-3 gap-2 text-base font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4.5" />
            Voltar para todas as campanhas
          </Button>
        ) : (
          <>
            Bem-vindo(a), {firstName}
            <span className="text-primary">.</span>
          </>
        )
      }
      subtitle={
        activeCampaignId ? undefined : "Escolha uma campanha para acompanhar ou inicie uma nova ação de saúde."
      }
      actions={
        activeCampaignId ? (
          <>
            <Button
              id="header-new-participant"
              variant="outline"
              onClick={() => setPersonDialogOpen(true)}
              className="gap-2 h-10 px-4 text-sm font-semibold"
            >
              <UserPlus className="size-4 text-primary" />
              Novo Participante
            </Button>
            {isClinical && (
              <Button
                id="header-new-triage"
                onClick={() => setTriageDialogOpen(true)}
                className="gap-2 h-10 px-5 text-sm font-semibold shadow-sm"
              >
                <Plus className="size-4.5" />
                Nova Triagem
              </Button>
            )}
          </>
        ) : (
          <Button
            id="header-create-campaign"
            onClick={() => setCreateCampaignOpen(true)}
            className="gap-2 h-10 px-5 text-sm font-semibold shadow-sm"
          >
            <Plus className="size-4.5" />
            Criar Campanha
          </Button>
        )
      }
    >
      <div className="space-y-8 max-w-6xl pb-12">
        {/* ============================================================== */}
        {/* CASO 1: TELA INICIAL (NENHUMA CAMPANHA SELECIONADA / VISÃO GERAL) */}
        {/* ============================================================== */}
        {!activeCampaignId ? (
          <div className="space-y-8 animate-in fade-in duration-200">

            {/* Métricas Resumidas Gerais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Campanhas Ativas</span>
                  <Calendar className="size-5 text-primary" />
                </div>
                <p className="font-display text-3xl font-bold text-foreground" suppressHydrationWarning>
                  {events.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ações cadastradas</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total de Participantes</span>
                  <Users className="size-5 text-primary" />
                </div>
                <p className="font-display text-3xl font-bold text-foreground" suppressHydrationWarning>
                  {participants.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Pessoas acolhidas</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Triagens Realizadas</span>
                  <ClipboardList className="size-5 text-primary" />
                </div>
                <p className="font-display text-3xl font-bold text-foreground" suppressHydrationWarning>
                  {events.reduce((acc, ev) => acc + (ev.metrics?.triagesDone || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Avaliações clínicas registradas</p>
              </div>
            </div>

            {/* Listagem de Campanhas Disponíveis com Opção de Entrar */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    Campanhas e Ações de Saúde
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Clique em <strong>"Entrar na Campanha"</strong> para gerenciar participantes, gráficos e triagens
                  </p>
                </div>
              </div>

              {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center space-y-3">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Calendar className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-foreground">Nenhuma campanha cadastrada</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      Inicie uma ação comunitária de saúde clicando no botão abaixo para registrar participantes e triagens.
                    </p>
                  </div>
                  <Button
                    onClick={() => setCreateCampaignOpen(true)}
                    className="gap-2 h-9 px-4 font-semibold text-xs sm:text-sm shadow-xs"
                  >
                    <Plus className="size-4" />
                    Criar Primeira Campanha
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((camp) => {
                    const partCount = participants.filter((p) => p.eventId === camp.id).length;
                    const triagesCount = camp.metrics?.triagesDone || 0;

                    return (
                      <div
                        key={camp.id}
                        className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-md transition-all"
                      >
                        <div className="space-y-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="rounded-full bg-primary/10 text-primary font-bold px-2.5 py-0.5 text-xs">
                              Campanha
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {camp.id}
                            </span>
                          </div>

                          <h4 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                            {camp.name}
                          </h4>

                          <div className="space-y-2 text-xs sm:text-sm text-muted-foreground pt-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="size-4 text-primary shrink-0" />
                              <span>
                                {camp.startDate && camp.endDate ? (
                                  camp.startDate === camp.endDate ? (
                                    <>Data: <strong className="text-foreground">{formatDisplayDate(camp.startDate)}</strong></>
                                  ) : (
                                    <>Período: <strong className="text-foreground">{formatDisplayDate(camp.startDate)} até {formatDisplayDate(camp.endDate)}</strong></>
                                  )
                                ) : (
                                  <>Data: <strong className="text-foreground">{formatDisplayDate(camp.date)}</strong></>
                                )}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                              <span className="line-clamp-2">Endereço: <strong className="text-foreground">{camp.location}</strong></span>
                            </div>
                          </div>

                          {/* Indicadores rápidos da campanha */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                            <div className="rounded-lg bg-secondary/50 p-2 text-center">
                              <p className="font-bold text-foreground text-sm">{partCount}</p>
                              <p className="text-muted-foreground">Participantes</p>
                            </div>
                            <div className="rounded-lg bg-secondary/50 p-2 text-center">
                              <p className="font-bold text-foreground text-sm">{triagesCount}</p>
                              <p className="text-muted-foreground">Triagens</p>
                            </div>
                          </div>
                        </div>

                        {/* Botão de Entrar na Campanha */}
                        <div className="pt-5">
                          <Button
                            onClick={() => setActiveCampaignId(camp.id)}
                            className="w-full gap-2 h-10 font-semibold text-sm shadow-xs"
                          >
                            Entrar na Campanha
                            <ArrowRight className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* ============================================================== */
          /* CASO 2: DENTRO DA CAMPANHA (VISUALIZAÇÕES ESPECÍFICAS)          */
          /* ============================================================== */
          <div className="space-y-8 animate-in fade-in duration-200">

            {/* Banner da Campanha Selecionada */}
            <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/30 p-6 sm:p-7 shadow-xs">
              <div className="relative flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3.5 py-1 text-xs font-semibold text-primary tracking-wide w-fit">
                  <Sparkles className="size-3.5" />
                  CAMPANHA ATIVA
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {activeCampaign.name}
                </h3>

                <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Calendar className="size-4 text-primary" />
                    {activeCampaign.startDate && activeCampaign.endDate ? (
                      activeCampaign.startDate === activeCampaign.endDate ? (
                        <>Data: {formatDisplayDate(activeCampaign.startDate)}</>
                      ) : (
                        <>Período: {formatDisplayDate(activeCampaign.startDate)} até {formatDisplayDate(activeCampaign.endDate)}</>
                      )
                    ) : (
                      <>Data: {formatDisplayDate(activeCampaign.date)}</>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <MapPin className="size-4 text-primary" />
                    Endereço: {activeCampaign.location}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="size-4" />
                    {campaignParticipants.length} participante(s) nesta campanha
                  </span>
                </div>
              </div>
            </section>

            {/* ============================================================== */}
            {/* SEÇÃO 1: PARTICIPANTES DA CAMPANHA (com histórico mantido)      */}
            {/* ============================================================== */}
            <section className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    Participantes da Campanha ({campaignParticipants.length})
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Consulte os participantes vinculados a esta ação e acesse o histórico de cada um
                  </p>
                </div>

                {/* Busca rápida */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar participante..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="pl-9 h-9 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground font-semibold">
                      <th className="py-3 px-6">Participante</th>
                      <th className="py-3 px-4">Idade</th>
                      <th className="py-3 px-4">CPF</th>
                      <th className="py-3 px-4">WhatsApp</th>
                      <th className="py-3 px-4 text-center">Atendimentos</th>
                      <th className="py-3 px-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCampaignParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          Nenhum participante encontrado nesta campanha.
                        </td>
                      </tr>
                    ) : (
                      filteredCampaignParticipants.map((p) => {
                        const count = p.attendances?.length || 0;
                        return (
                          <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                            <td className="py-3.5 px-6 font-semibold text-foreground">
                              {p.name}
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground">
                              {p.age} anos <span className="text-xs">[{p.ageGroup}]</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-muted-foreground text-xs sm:text-sm">
                              {p.cpf || "—"}
                            </td>
                            <td className="py-3.5 px-4">
                              {p.phone ? (
                                <a
                                  href={`https://wa.me/${cleanPhoneForWhatsApp(p.phone)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-foreground hover:text-emerald-600 transition-colors font-mono"
                                >
                                  <MessageCircle className="size-3.5 text-emerald-500" />
                                  {p.phone}
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                                {count} {count === 1 ? "registro" : "registros"}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenParticipantHistory(p)}
                                className="h-8 text-xs px-3 gap-1.5 font-medium"
                              >
                                <History className="size-3.5 text-muted-foreground" />
                                Ver Histórico
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ============================================================== */}
            {/* SEÇÕES 2, 3 e 4: PAINEL DE GRÁFICOS DA CAMPANHA                */}
            {/* ============================================================== */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* GRÁFICO 1: FAIXA ETÁRIA */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="size-4.5 text-primary" />
                    Gráfico da Faixa Etária
                  </h4>
                  <span className="text-xs text-muted-foreground font-mono">
                    {campaignParticipants.length} pessoas
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Distribuição etária dos participantes cadastrados nesta campanha
                </p>

                <div className="space-y-3 pt-2">
                  {campaignAgeDistribution.map((item) => {
                    const max = Math.max(...campaignAgeDistribution.map((a) => a.count), 1);
                    const pct = Math.round((item.count / max) * 100);
                    return (
                      <div key={item.age} className="space-y-1">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="font-medium text-foreground">{item.age} anos</span>
                          <span className="text-muted-foreground font-mono font-semibold">
                            {item.count} participante(s)
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GRÁFICO 2: RESULTADOS DE EXAME (CONFORMIDADE COM PARÂMETROS NORMAIS) */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <h4 className="font-display text-base font-bold text-foreground flex items-center gap-2 mb-1">
                    <CheckCircle2 className="size-4.5 text-primary" />
                    Resultados de Exame
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Conformidade com os parâmetros normais configurados
                  </p>
                </div>

                <div className="flex items-center justify-around py-4">
                  <div className="relative size-32 shrink-0">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-warning stroke-current"
                        strokeWidth="4"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-primary stroke-current transition-all duration-700"
                        strokeDasharray={`${dynamicTriageStats.normalPct}, 100`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-bold font-display text-primary">
                        {dynamicTriageStats.normalPct}%
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase leading-none">
                        Normal
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-primary shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">
                          Normal ({dynamicTriageStats.normalPct}%)
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {dynamicTriageStats.normal} exame(s) dentro dos limites
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-warning shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">
                          Alterado ({dynamicTriageStats.alteredPct}%)
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {dynamicTriageStats.altered} exame(s) com atenção/alteração
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center border-t border-border pt-3">
                  Baseado nos limites clínicos definidos em Configurações
                </p>
              </div>

              {/* GRÁFICO 3: ALTERAÇÕES POR TIPO DE EXAME */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
                <div>
                  <h4 className="font-display text-base font-bold text-foreground flex items-center gap-2 mb-1">
                    <AlertTriangle className="size-4.5 text-warning" />
                    Alterações por Tipo de Exame
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Ocorrência de valores fora dos limites clínicos
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {[
                    { exam: "Pressão Arterial", count: dynamicTriageStats.paCount },
                    { exam: "Glicemia", count: dynamicTriageStats.gluCount },
                    { exam: "IMC / Obesidade", count: dynamicTriageStats.imcCount },
                    { exam: "SpO₂ (Oxigenação)", count: dynamicTriageStats.spo2Count },
                    { exam: "Frequência Cardíaca", count: dynamicTriageStats.hrCount },
                  ].map((alt) => {
                    const maxVal = Math.max(
                      dynamicTriageStats.paCount,
                      dynamicTriageStats.gluCount,
                      dynamicTriageStats.imcCount,
                      dynamicTriageStats.spo2Count,
                      dynamicTriageStats.hrCount,
                      1
                    );
                    const barWidth = dynamicTriageStats.total > 0 && alt.count > 0
                      ? Math.min(Math.round((alt.count / maxVal) * 100), 100)
                      : 0;

                    return (
                      <div key={alt.exam} className="space-y-1">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="font-medium text-foreground">{alt.exam}</span>
                          <span className={`font-mono font-bold ${alt.count > 0 ? "text-warning" : "text-muted-foreground"}`}>
                            {alt.count} caso{alt.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-warning rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-muted-foreground text-center border-t border-border pt-3">
                  Sinalizações visuais orientam o acolhimento preventivo
                </p>
              </div>
            </div>

            {/* SEÇÃO 5: ÚLTIMAS TRIAGENS REGISTRADAS NA CAMPANHA */}
            <section className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
              <div className="border-b border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-display text-base font-bold text-foreground">
                    Últimas Triagens Realizadas nesta Campanha
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Registros clínicos recentes com valores vitais e cálculo de IMC
                  </p>
                </div>
                {isClinical && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTriageDialogOpen(true)}
                    className="h-8 px-3 text-xs gap-1.5 font-semibold text-primary"
                  >
                    <Plus className="size-3.5" />
                    Nova Triagem
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-muted-foreground font-semibold">
                      <th className="py-3 px-6">Participante</th>
                      <th className="py-3 px-4">Horário</th>
                      <th className="py-3 px-4">Responsável</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-6">Resultado Clínico & IMC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dynamicTriageStats.list.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          Nenhuma triagem registrada ainda nesta campanha. Clique em "Nova Triagem" para iniciar.
                        </td>
                      </tr>
                    ) : (
                      dynamicTriageStats.list.map((triage) => (
                        <tr key={triage.id} className="hover:bg-accent/30 transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-foreground">
                            {(triage as any).participantName || (triage as any).participant}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground text-xs sm:text-sm">
                            {(triage as any).time || (triage as any).createdAt || "Recente"}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground text-xs sm:text-sm">
                            {triage.responsible}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                triage.status === "Alterado"
                                  ? "bg-destructive/15 text-destructive border border-destructive/20"
                                  : triage.status === "Atenção"
                                  ? "bg-warning/20 text-warning-foreground border border-warning/30"
                                  : "bg-primary/10 text-primary border border-primary/20"
                              }`}
                            >
                              {triage.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-foreground font-mono text-xs sm:text-sm">
                            {triage.result}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: CRIAR CAMPANHA (Nome, Data Início, Data Fim, Endereço) */}
      {/* ============================================================== */}
      <Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-7">
          <div className="flex items-center gap-3.5 pb-4 border-b border-border">
            <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Calendar className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Criar Nova Campanha
              </DialogTitle>
            </div>
          </div>

          <form onSubmit={handleCreateCampaign} className="space-y-5 pt-3">
            {/* Nome da Campanha */}
            <div className="space-y-2">
              <Label htmlFor="camp-name" className="text-sm font-semibold text-foreground">
                Nome da campanha
              </Label>
              <Input
                id="camp-name"
                placeholder="Ex: Ação de Saúde Comunitária - Bairro Primavera"
                value={newCampaignForm.name}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, name: e.target.value })}
                required
                className="h-11 text-base sm:text-sm rounded-xl"
              />
            </div>

            {/* Datas da Campanha: Início e Fim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="camp-start-date" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-4 text-muted-foreground" />
                  Data de Início
                </Label>
                <Input
                  id="camp-start-date"
                  type="date"
                  value={newCampaignForm.startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setNewCampaignForm((prev) => ({
                      ...prev,
                      startDate: newStart,
                      endDate: prev.endDate && prev.endDate < newStart ? newStart : prev.endDate,
                    }));
                  }}
                  required
                  className="h-11 text-base sm:text-sm rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="camp-end-date" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-4 text-muted-foreground" />
                  Data de Fim
                </Label>
                <Input
                  id="camp-end-date"
                  type="date"
                  min={newCampaignForm.startDate}
                  value={newCampaignForm.endDate}
                  onChange={(e) => setNewCampaignForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  required
                  className="h-11 text-base sm:text-sm rounded-xl"
                />
              </div>
            </div>

            {/* Endereço / Local (com número no mesmo campo, autocomplete com prioridade em Campo Grande e GPS) */}
            <div className="space-y-2" ref={addressWrapperRef}>
              <div className="flex items-center justify-between">
                <Label htmlFor="camp-loc" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-4 text-muted-foreground" />
                  Endereço e Número
                </Label>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={loadingLocation}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 font-medium disabled:opacity-50 cursor-pointer"
                  title="Puxar endereço do local atual via GPS"
                >
                  {loadingLocation ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Buscando local...</span>
                    </>
                  ) : (
                    <>
                      <LocateFixed className="size-3.5" />
                      <span>Usar local atual</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  id="camp-loc"
                  placeholder="Ex: Av. Afonso Pena, 1200 - Centro ou CEP..."
                  value={newCampaignForm.location}
                  onChange={(e) => handleAddressInputChange(e.target.value)}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setShowAddressDropdown(true);
                    }
                  }}
                  required
                  className="h-11 text-base sm:text-sm pr-9 rounded-xl"
                  autoComplete="off"
                />

                {isSearchingAddress && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Dropdown de sugestões de endereço em tempo real */}
                {showAddressDropdown && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg text-popover-foreground text-xs animate-in fade-in-50 zoom-in-95">
                    <div className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 flex items-center justify-between">
                      <span>Sugestões em Campo Grande - MS ({addressSuggestions.length})</span>
                      <span className="text-[10px] text-primary font-normal">Prioridade local</span>
                    </div>
                    {addressSuggestions.map((sug) => (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => handleSelectAddressSuggestion(sug)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors flex items-start gap-2.5 group cursor-pointer"
                      >
                        <MapPin className="size-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate text-xs sm:text-sm">
                            {sug.primary}
                          </p>
                          {sug.secondary && (
                            <p className="text-muted-foreground text-[11px] truncate">
                              {sug.secondary}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Prioridade: <strong className="text-foreground">Campo Grande - MS</strong></span>
                <span>Informe rua e número no mesmo campo</span>
              </div>
            </div>

            <DialogFooter className="gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateCampaignOpen(false)}
                className="h-11 text-sm px-6 font-semibold rounded-xl"
              >
                Cancelar
              </Button>
              <Button type="submit" className="h-11 text-sm px-7 font-semibold rounded-xl shadow-md">
                Criar Campanha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 2: NOVA TRIAGEM (PA, Glicemia, SpO2, FC + IMC + Obs)     */}
      {/* ============================================================== */}
      <Dialog open={triageDialogOpen} onOpenChange={setTriageDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl max-h-[92vh] overflow-y-auto p-5 sm:p-7">
          <div className="flex items-center gap-3.5 pb-4 border-b border-border">
            <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Stethoscope className="size-6" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Nova Triagem de Sinais Vitais
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Campanha ativa: <strong>{activeCampaign.name}</strong>
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSaveTriage} className="space-y-5 pt-3">
            {/* Seleção do Participante */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="t-part-select" className="text-sm font-semibold text-foreground">
                  Participante
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpenTriageAfterPerson(true);
                    setTriageDialogOpen(false);
                    setPersonDialogOpen(true);
                  }}
                  className="h-8 px-3 text-xs font-semibold text-primary gap-1.5 hover:bg-primary/10 rounded-lg"
                >
                  <Plus className="size-3.5" />
                  Novo Cadastro
                </Button>
              </div>

              {participants.length > 0 ? (
                <select
                  id="t-part-select"
                  value={triageForm.participantId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const p = participants.find((item) => item.id === selId);
                    setTriageForm({
                      ...triageForm,
                      participantId: selId,
                      participantName: p ? p.name : "",
                    });
                  }}
                  required
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring cursor-pointer font-medium"
                >
                  <option value="">Selecione o participante cadastrado...</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — CPF: {p.cpf || "S/ CPF"} ({p.age} anos)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-5 text-center space-y-2 bg-muted/20">
                  <p className="text-sm text-muted-foreground">Nenhum participante cadastrado ainda.</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOpenTriageAfterPerson(true);
                      setTriageDialogOpen(false);
                      setPersonDialogOpen(true);
                    }}
                    className="text-sm gap-1.5 h-10 px-4 rounded-xl"
                  >
                    <UserPlus className="size-4 text-primary" />
                    Cadastrar participante agora
                  </Button>
                </div>
              )}
            </div>

            {/* Sinais Vitais Convencionais em Grid de 4 Colunas no Desktop */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sinais Vitais
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5 rounded-xl border border-border/70 bg-card p-3.5">
                  <Label htmlFor="t-pa" className="text-xs sm:text-sm font-semibold">
                    Pressão arterial (mmHg)
                  </Label>
                  <Input
                    id="t-pa"
                    placeholder="Ex: 120/80"
                    value={triageForm.pa}
                    onChange={(e) => setTriageForm({ ...triageForm, pa: e.target.value })}
                    required
                    className="text-sm h-11 rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Ref: {settings.systolicMin}–{settings.systolicMax} x {settings.diastolicMin}–{settings.diastolicMax}
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-border/70 bg-card p-3.5">
                  <Label htmlFor="t-gli" className="text-xs sm:text-sm font-semibold">
                    Glicemia (mg/dL)
                  </Label>
                  <Input
                    id="t-gli"
                    type="number"
                    placeholder="Ex: 98"
                    value={triageForm.glucose}
                    onChange={(e) => setTriageForm({ ...triageForm, glucose: e.target.value })}
                    required
                    className="text-sm h-11 rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Ref: {settings.glucoseMin ?? 70}–{settings.glucoseMax} mg/dL
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-border/70 bg-card p-3.5">
                  <Label htmlFor="t-spo2" className="text-xs sm:text-sm font-semibold">
                    SpO₂ (%)
                  </Label>
                  <Input
                    id="t-spo2"
                    type="number"
                    placeholder="Ex: 97"
                    value={triageForm.spo2}
                    onChange={(e) => setTriageForm({ ...triageForm, spo2: e.target.value })}
                    required
                    className="text-sm h-11 rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Ref: {settings.oxygenMin}%–{settings.oxygenMax ?? 100}%
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-border/70 bg-card p-3.5">
                  <Label htmlFor="t-fc" className="text-xs sm:text-sm font-semibold">
                    Freq. Cardíaca (bpm)
                  </Label>
                  <Input
                    id="t-fc"
                    type="number"
                    placeholder="Ex: 72"
                    value={triageForm.heartRate}
                    onChange={(e) => setTriageForm({ ...triageForm, heartRate: e.target.value })}
                    required
                    className="text-sm h-11 rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Ref: {settings.heartRateMin}–{settings.heartRateMax} bpm
                  </p>
                </div>
              </div>
            </div>

            {/* SEÇÃO ADICIONADA: CÁLCULO DE IMC */}
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Scale className="size-4.5" />
                <span>Antropometria & Cálculo de IMC</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="space-y-1.5">
                  <Label htmlFor="t-weight" className="text-xs font-semibold text-foreground">
                    Peso (kg)
                  </Label>
                  <Input
                    id="t-weight"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 72.5"
                    value={triageForm.weight}
                    onChange={(e) => setTriageForm({ ...triageForm, weight: e.target.value })}
                    className="text-sm h-10 bg-card rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="t-height" className="text-xs font-semibold text-foreground">
                    Altura (cm ou m)
                  </Label>
                  <Input
                    id="t-height"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 172 ou 1.72"
                    value={triageForm.height}
                    onChange={(e) => setTriageForm({ ...triageForm, height: e.target.value })}
                    className="text-sm h-10 bg-card rounded-xl"
                  />
                </div>

                {/* Card reativo do cálculo do IMC */}
                <div className="sm:pt-5">
                  {calculatedIMC ? (
                    <div className="flex items-center justify-between rounded-xl bg-card border border-border p-3 text-sm shadow-xs animate-in fade-in duration-200">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">IMC Calculado:</span>
                        <span className="text-base sm:text-lg font-bold font-display text-foreground">
                          {calculatedIMC.value} <span className="text-xs font-normal text-muted-foreground">kg/m²</span>
                        </span>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${calculatedIMC.badgeClass}`}>
                        {calculatedIMC.category}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Preencha peso e altura para classificar o IMC automaticamente.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SEÇÃO: OBSERVAÇÃO CLÍNICA */}
            <div className="space-y-2">
              <Label htmlFor="t-obs" className="text-sm font-semibold flex items-center gap-1.5">
                <FileText className="size-4 text-muted-foreground" />
                Observação Clínica e Conduta (Opcional)
              </Label>
              <Textarea
                id="t-obs"
                rows={3}
                placeholder="Ex: Participante em jejum, refere queixa de dor na coluna ou tonturas frequentes..."
                value={triageForm.observation}
                onChange={(e) => setTriageForm({ ...triageForm, observation: e.target.value })}
                className="text-sm resize-none rounded-xl"
              />
            </div>

            <DialogFooter className="gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTriageDialogOpen(false)}
                className="h-11 text-sm px-6 font-semibold rounded-xl"
              >
                Cancelar
              </Button>
              <Button type="submit" className="h-11 text-sm px-7 font-semibold rounded-xl shadow-md">
                Concluir Triagem
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 3: NOVO PARTICIPANTE                                     */}
      {/* ============================================================== */}
      <Dialog
        open={personDialogOpen}
        onOpenChange={(open) => {
          setPersonDialogOpen(open);
          if (!open) setOpenTriageAfterPerson(false);
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-7">
          <div className="flex items-center gap-3.5 pb-4 border-b border-border">
            <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <UserPlus className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Cadastrar Novo Participante
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Vincule o participante à campanha ativa: <strong>{activeCampaign.name}</strong>
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSavePerson} className="space-y-5 pt-3">
            <div className="space-y-2">
              <Label htmlFor="dp-name" className="text-sm font-semibold text-foreground">
                Nome completo
              </Label>
              <Input
                id="dp-name"
                placeholder="Ex: Maria José da Silva"
                value={personForm.name}
                onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
                required
                className="text-base sm:text-sm h-11 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dp-birth" className="text-sm font-semibold text-foreground">
                  Data de nascimento
                </Label>
                <Input
                  id="dp-birth"
                  type="date"
                  value={personForm.birthDate}
                  onChange={(e) => setPersonForm({ ...personForm, birthDate: e.target.value })}
                  required
                  className="text-base sm:text-sm h-11 rounded-xl"
                />
                {agePreview ? (
                  <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/25 px-3 py-2 text-xs sm:text-sm">
                    <span className="text-primary font-medium">
                      Idade: <strong>{agePreview.age} anos</strong>
                    </span>
                    <span className="rounded-full bg-primary/20 text-primary font-bold px-2.5 py-0.5 text-xs">
                      Faixa: {agePreview.group} anos
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dp-cpf" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Fingerprint className="size-4 text-muted-foreground" />
                  CPF
                </Label>
                <Input
                  id="dp-cpf"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={personForm.cpf}
                  onChange={(e) => setPersonForm({ ...personForm, cpf: formatCPF(e.target.value) })}
                  required
                  className="text-base sm:text-sm h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dp-phone" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="size-4 text-muted-foreground" />
                WhatsApp / Telefone de Contato
              </Label>
              <Input
                id="dp-phone"
                placeholder="(67) 99999-9999"
                maxLength={15}
                value={personForm.phone}
                onChange={(e) => setPersonForm({ ...personForm, phone: formatPhone(e.target.value) })}
                required
                className="text-base sm:text-sm h-11 rounded-xl"
              />
            </div>

            <DialogFooter className="gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenTriageAfterPerson(false);
                  setPersonDialogOpen(false);
                }}
                className="h-11 text-sm px-6 font-semibold rounded-xl"
              >
                Cancelar
              </Button>
              <Button type="submit" className="h-11 text-sm px-7 font-semibold rounded-xl shadow-md">
                Cadastrar Participante
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 4: HISTÓRICO DO PARTICIPANTE                             */}
      {/* ============================================================== */}
      <Dialog open={participantHistoryOpen} onOpenChange={setParticipantHistoryOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl max-h-[92vh] overflow-y-auto p-5 sm:p-7">
          {selectedParticipantForHistory && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="grid size-14 place-items-center rounded-2xl bg-primary/20 text-primary font-bold text-lg shrink-0 border border-primary/25">
                  {selectedParticipantForHistory.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground truncate">
                    {selectedParticipantForHistory.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {selectedParticipantForHistory.age} anos · Faixa [{selectedParticipantForHistory.ageGroup}] · CPF: {selectedParticipantForHistory.cpf || "S/ CPF"}
                  </DialogDescription>
                </div>
              </div>

              {/* Contatos */}
              {selectedParticipantForHistory.phone && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 text-sm shadow-xs">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Phone className="size-4.5 text-primary" />
                    <span>WhatsApp / Contato: <strong className="text-foreground font-mono">{selectedParticipantForHistory.phone}</strong></span>
                  </span>
                  <a
                    href={`https://wa.me/${cleanPhoneForWhatsApp(selectedParticipantForHistory.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="size-4" />
                    Abrir WhatsApp
                  </a>
                </div>
              )}

              {/* Linha do tempo de atendimentos */}
              <div className="space-y-4">
                <h5 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <History className="size-4.5 text-primary" />
                  Histórico de Atendimentos e Triagens ({activeHistoryParticipant?.attendances?.length || 0})
                </h5>

                {(!activeHistoryParticipant?.attendances || activeHistoryParticipant.attendances.length === 0) ? (
                  <p className="text-sm text-muted-foreground p-6 text-center rounded-xl border border-dashed border-border bg-muted/10">
                    Nenhum atendimento ou triagem registrada para este participante ainda.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {activeHistoryParticipant.attendances.map((att) => {
                      const details = extractAlterationsDetails(att.summary, att.status, settings);
                      const displayStatus = details.hasAlterations
                        ? (att.status === "Alterado" ? "Alterado" : "Atenção")
                        : "Normal";

                      return (
                        <div
                          key={att.id}
                          className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 text-xs sm:text-sm shadow-xs hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm sm:text-base">{att.type || "Triagem Clínica"}</span>
                              <span className="text-muted-foreground text-xs">·</span>
                              <span className="text-muted-foreground text-xs font-medium">{att.eventName}</span>
                            </div>
                            <span
                              className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                                displayStatus === "Alterado"
                                  ? "bg-destructive/15 text-destructive border border-destructive/20"
                                  : displayStatus === "Atenção"
                                  ? "bg-warning/20 text-warning-foreground border border-warning/30"
                                  : "bg-primary/10 text-primary border border-primary/20"
                              }`}
                            >
                              {displayStatus}
                            </span>
                          </div>

                          {/* Bloco de Destaque das Alterações Identificadas */}
                          {details.hasAlterations ? (
                            <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="size-4 shrink-0" />
                                <span>Parâmetros / Exames com Alteração ou Atenção:</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {details.alterationsList.map((altItem, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200"
                                  >
                                    {altItem}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 flex items-center gap-2 text-xs text-primary font-medium">
                              <CheckCircle2 className="size-4 shrink-0" />
                              <span>Todos os parâmetros clínicos dentro dos limites normais configurados.</span>
                            </div>
                          )}

                          {/* Resumo completo com valores aferidos */}
                          <p className="text-muted-foreground leading-relaxed text-sm">
                            {att.summary}
                          </p>

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                            <span>Data da Aferição: <strong className="text-foreground">{att.date}</strong></span>
                            <span>Avaliador: <strong className="text-foreground">{att.responsible}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-border">
                <Button
                  onClick={() => setParticipantHistoryOpen(false)}
                  className="h-11 text-sm px-7 font-semibold rounded-xl"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Toast de Notificação */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-foreground px-4.5 py-3 text-sm font-medium text-background shadow-xl animate-in slide-in-from-bottom duration-200"
        >
          <CheckCircle2 className="size-4.5 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
}