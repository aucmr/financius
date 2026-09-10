import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";
import { CategoryKind, TransactionType } from "./generated/enums";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg(connectionString, {
  schema: process.env.DATABASE_SCHEMA ?? "public",
});
const prisma = new PrismaClient({ adapter });

const areaCategories = {
  Casa: [
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
  Alimentação: ["Mercado", "Restaurante", "Outros"],
  Saúde: ["Plano de Saúde", "Dentista", "Medicamentos", "Outros"],
  Transporte: ["IPVA", "Seguro", "Combustível", "Manutenção", "Uber", "Outros"],
  Pessoal: ["Esporte", "Vestuário", "Assinaturas", "Outros"],
  Filhos: ["Saúde", "Escola", "Vacina", "Outros"],
  Educação: ["Curso", "Livro", "Outros"],
  Lazer: ["Clube", "Confraternização", "Passeio", "Outros"],
  Viagens: [
    "Passagem",
    "Hospedagem",
    "Alimentação",
    "Transporte",
    "Entretenimento",
    "Outros",
  ],
  Outros: ["Extras Diários", "Presentes", "Doações", "Tarifas"],
} as const;

const profileCategories = [
  "CustoFixo",
  "Conforto",
  "Prazer",
  "Conhecimento",
  "Liberdade",
] as const;

async function seedCategories() {
  for (const [name, subcategories] of Object.entries(areaCategories)) {
    const category = await prisma.category.upsert({
      where: { name_kind: { name, kind: CategoryKind.AREA } },
      update: { type: TransactionType.EXPENSE },
      create: {
        name,
        kind: CategoryKind.AREA,
        type: TransactionType.EXPENSE,
        color: "#0f766e",
        icon: "icon-[tabler--category]",
      },
    });

    for (const subcategoryName of subcategories) {
      await prisma.areaSubcategory.upsert({
        where: {
          areaCategoryId_name: {
            areaCategoryId: category.id,
            name: subcategoryName,
          },
        },
        update: {},
        create: {
          areaCategoryId: category.id,
          name: subcategoryName,
        },
      });
    }
  }

  for (const name of profileCategories) {
    await prisma.category.upsert({
      where: { name_kind: { name, kind: CategoryKind.PROFILE } },
      update: { type: TransactionType.EXPENSE },
      create: {
        name,
        kind: CategoryKind.PROFILE,
        type: TransactionType.EXPENSE,
        color: "#b45309",
        icon: "icon-[tabler--adjustments-horizontal]",
      },
    });
  }
}

async function main() {
  await seedCategories();
  console.log("Expense categories seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
