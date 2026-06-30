import { PrismaClient } from "./generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// AREA categories (what the expense is about)
const AREA_CATEGORIES = [
  { name: "Casa", color: "#3b82f6", icon: "🏠" },
  { name: "Alimentação", color: "#f59e0b", icon: "🍽️" },
  { name: "Saúde", color: "#ef4444", icon: "🏥" },
  { name: "Transporte", color: "#8b5cf6", icon: "🚗" },
  { name: "Pessoal", color: "#ec4899", icon: "👤" },
  { name: "Filhos", color: "#14b8a6", icon: "👶" },
  { name: "Educação", color: "#06b6d4", icon: "📚" },
  { name: "Lazer", color: "#f97316", icon: "🎮" },
  { name: "Viagens", color: "#7c3aed", icon: "✈️" },
  { name: "Outros", color: "#6b7280", icon: "📦" },
];

// PROFILE categories (how it's financially classified)
const PROFILE_CATEGORIES = [
  { name: "CustoFixo", color: "#dc2626", icon: "📋" },
  { name: "Conforto", color: "#f59e0b", icon: "☕" },
  { name: "Prazer", color: "#d946ef", icon: "🎉" },
  { name: "Conhecimento", color: "#3b82f6", icon: "🧠" },
  { name: "Liberdade", color: "#10b981", icon: "🦅" },
];

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  // Seed users
  await prisma.user.upsert({
    where: { email: "husband@financius.app" },
    update: {},
    create: {
      email: "husband@financius.app",
      password: hashedPassword,
      name: "Husband",
    },
  });

  await prisma.user.upsert({
    where: { email: "wife@financius.app" },
    update: {},
    create: {
      email: "wife@financius.app",
      password: hashedPassword,
      name: "Wife",
    },
  });

  console.log("✅ Seeded Husband and Wife accounts");

  // Seed AREA categories
  for (const cat of AREA_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_kind: { name: cat.name, kind: "AREA" } },
      update: {},
      create: {
        name: cat.name,
        kind: "AREA",
        type: "EXPENSE",
        color: cat.color,
        icon: cat.icon,
      },
    });
  }

  console.log(`✅ Seeded ${AREA_CATEGORIES.length} AREA categories`);

  // Seed PROFILE categories
  for (const cat of PROFILE_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_kind: { name: cat.name, kind: "PROFILE" } },
      update: {},
      create: {
        name: cat.name,
        kind: "PROFILE",
        type: "EXPENSE",
        color: cat.color,
        icon: cat.icon,
      },
    });
  }

  console.log(`✅ Seeded ${PROFILE_CATEGORIES.length} PROFILE categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
