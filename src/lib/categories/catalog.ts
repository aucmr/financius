export const DEFAULT_AREA_CATEGORY_CATALOG = [
  {
    name: "Alimentação",
    color: "#0f766e",
    icon: "utensils",
    subcategories: ["Mercado", "Restaurante", "Outros"],
  },
  {
    name: "Casa",
    color: "#0f766e",
    icon: "home",
    subcategories: [
      "Prestação",
      "Seguro",
      "Condomínio",
      "IPTU",
      "Energia",
      "Água",
      "Internet",
      "TV",
      "Faxina",
      "Pets",
      "Outros",
    ],
  },
  {
    name: "Educação",
    color: "#0f766e",
    icon: "book-open",
    subcategories: ["Curso", "Livro", "Outros"],
  },
  {
    name: "Filhos",
    color: "#0f766e",
    icon: "baby",
    subcategories: ["Saúde", "Escola", "Vacina", "Outros"],
  },
  {
    name: "Lazer",
    color: "#0f766e",
    icon: "gamepad-2",
    subcategories: ["Clube", "Confraternização", "Passeio", "Outros"],
  },
  {
    name: "Outros",
    color: "#0f766e",
    icon: "package",
    subcategories: ["Extras Diários", "Presentes", "Doações", "Tarifas"],
  },
  {
    name: "Pessoal",
    color: "#0f766e",
    icon: "user-round",
    subcategories: ["Esporte", "Vestuário", "Assinaturas", "Outros"],
  },
  {
    name: "Saúde",
    color: "#0f766e",
    icon: "heart-pulse",
    subcategories: ["Plano de Saúde", "Dentista", "Medicamentos", "Outros"],
  },
  {
    name: "Transporte",
    color: "#0f766e",
    icon: "car-front",
    subcategories: ["IPVA", "Seguro", "Combustível", "Manutenção", "Uber", "Outros"],
  },
  {
    name: "Viagens",
    color: "#0f766e",
    icon: "plane",
    subcategories: [
      "Passagem",
      "Hospedagem",
      "Alimentação",
      "Transporte",
      "Entretenimento",
      "Outros",
    ],
  },
] as const;

export const DEFAULT_PROFILE_CATEGORY_CATALOG = [
  { name: "Conhecimento", color: "#b45309", icon: "brain" },
  { name: "Conforto", color: "#b45309", icon: "armchair" },
  { name: "CustoFixo", color: "#b45309", icon: "receipt-text" },
  { name: "Liberdade", color: "#b45309", icon: "bird" },
  { name: "Prazer", color: "#b45309", icon: "party-popper" },
] as const;

export const CATEGORY_ICON_NAMES = [
  "shapes",
  "sliders-horizontal",
  "home",
  "utensils",
  "heart-pulse",
  "car-front",
  "book-open",
  "plane",
  "gift",
  "wallet",
  "baby",
  "gamepad-2",
  "package",
  "user-round",
  "brain",
  "armchair",
  "receipt-text",
  "bird",
  "party-popper",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];
export type CategoryKindValue = "AREA" | "PROFILE";

export const CATEGORY_ICON_LABELS = {
  shapes: "Formas",
  "sliders-horizontal": "Ajustes",
  home: "Casa",
  utensils: "Alimentação",
  "heart-pulse": "Saúde",
  "car-front": "Transporte",
  "book-open": "Educação",
  plane: "Viagens",
  gift: "Presentes",
  wallet: "Carteira",
  baby: "Filhos",
  "gamepad-2": "Lazer",
  package: "Outros",
  "user-round": "Pessoal",
  brain: "Conhecimento",
  armchair: "Conforto",
  "receipt-text": "Custo fixo",
  bird: "Liberdade",
  "party-popper": "Prazer",
} satisfies Record<CategoryIconName, string>;

export const CATEGORY_ICON_OPTIONS = CATEGORY_ICON_NAMES.map((value) => ({
  value,
  label: CATEGORY_ICON_LABELS[value],
}));

export function getDefaultCategoryAppearance(kind: CategoryKindValue) {
  return kind === "AREA"
    ? { color: "#0f766e", icon: "shapes" as const }
    : { color: "#b45309", icon: "sliders-horizontal" as const };
}
