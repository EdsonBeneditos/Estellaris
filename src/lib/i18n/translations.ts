export type Language = "pt-BR" | "en-US" | "es-ES";

interface CommonTranslations {
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  search: string;
  loading: string;
  noData: string;
  confirm: string;
  back: string;
}

interface AuthTranslations {
  login: string;
  logout: string;
  email: string;
  password: string;
  accessBlocked: string;
  outsideBusinessHours: string;
  accessBlockedMessage: string;
  allowedHours: string;
  allowedDays: string;
  contactAdmin: string;
}

interface SettingsTranslations {
  title: string;
  organization: string;
  theme: string;
  language: string;
  accessControl: string;
  startTime: string;
  endTime: string;
  allowedDays: string;
  themeDefault: string;
  themeLight: string;
  themeDark: string;
}

interface DaysTranslations {
  seg: string;
  ter: string;
  qua: string;
  qui: string;
  sex: string;
  sab: string;
  dom: string;
}

export interface TranslationKeys {
  common: CommonTranslations;
  auth: AuthTranslations;
  settings: SettingsTranslations;
  days: DaysTranslations;
}

export const translations: Record<Language, TranslationKeys> = {
  "pt-BR": {
    common: {
      save: "Salvar",
      cancel: "Cancelar",
      delete: "Excluir",
      edit: "Editar",
      add: "Adicionar",
      search: "Buscar",
      loading: "Carregando...",
      noData: "Nenhum dado encontrado",
      confirm: "Confirmar",
      back: "Voltar",
    },
    auth: {
      login: "Entrar",
      logout: "Sair",
      email: "E-mail",
      password: "Senha",
      accessBlocked: "Acesso Bloqueado",
      outsideBusinessHours: "Fora do Horário Comercial",
      accessBlockedMessage: "O acesso ao sistema está restrito ao horário comercial definido pela sua organização.",
      allowedHours: "Horário permitido",
      allowedDays: "Dias permitidos",
      contactAdmin: "Entre em contato com o administrador caso precise de acesso.",
    },
    settings: {
      title: "Configurações",
      organization: "Organização",
      theme: "Tema",
      language: "Idioma",
      accessControl: "Controle de Acesso",
      startTime: "Horário de Início",
      endTime: "Horário de Fim",
      allowedDays: "Dias Permitidos",
      themeDefault: "Padrão (Slate)",
      themeLight: "Claro (Pure White)",
      themeDark: "Escuro (Deep Dark)",
    },
    days: {
      seg: "Segunda",
      ter: "Terça",
      qua: "Quarta",
      qui: "Quinta",
      sex: "Sexta",
      sab: "Sábado",
      dom: "Domingo",
    },
  },
  "en-US": {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      loading: "Loading...",
      noData: "No data found",
      confirm: "Confirm",
      back: "Back",
    },
    auth: {
      login: "Sign In",
      logout: "Sign Out",
      email: "Email",
      password: "Password",
      accessBlocked: "Access Blocked",
      outsideBusinessHours: "Outside Business Hours",
      accessBlockedMessage: "System access is restricted to business hours defined by your organization.",
      allowedHours: "Allowed hours",
      allowedDays: "Allowed days",
      contactAdmin: "Contact your administrator if you need access.",
    },
    settings: {
      title: "Settings",
      organization: "Organization",
      theme: "Theme",
      language: "Language",
      accessControl: "Access Control",
      startTime: "Start Time",
      endTime: "End Time",
      allowedDays: "Allowed Days",
      themeDefault: "Default (Slate)",
      themeLight: "Light (Pure White)",
      themeDark: "Dark (Deep Dark)",
    },
    days: {
      seg: "Monday",
      ter: "Tuesday",
      qua: "Wednesday",
      qui: "Thursday",
      sex: "Friday",
      sab: "Saturday",
      dom: "Sunday",
    },
  },
  "es-ES": {
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      add: "Añadir",
      search: "Buscar",
      loading: "Cargando...",
      noData: "Sin datos",
      confirm: "Confirmar",
      back: "Volver",
    },
    auth: {
      login: "Iniciar Sesión",
      logout: "Cerrar Sesión",
      email: "Correo",
      password: "Contraseña",
      accessBlocked: "Acceso Bloqueado",
      outsideBusinessHours: "Fuera del Horario Comercial",
      accessBlockedMessage: "El acceso al sistema está restringido al horario comercial definido por su organización.",
      allowedHours: "Horario permitido",
      allowedDays: "Días permitidos",
      contactAdmin: "Contacte al administrador si necesita acceso.",
    },
    settings: {
      title: "Configuración",
      organization: "Organización",
      theme: "Tema",
      language: "Idioma",
      accessControl: "Control de Acceso",
      startTime: "Hora de Inicio",
      endTime: "Hora de Fin",
      allowedDays: "Días Permitidos",
      themeDefault: "Predeterminado (Slate)",
      themeLight: "Claro (Pure White)",
      themeDark: "Oscuro (Deep Dark)",
    },
    days: {
      seg: "Lunes",
      ter: "Martes",
      qua: "Miércoles",
      qui: "Jueves",
      sex: "Viernes",
      sab: "Sábado",
      dom: "Domingo",
    },
  },
};
