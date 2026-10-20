UPDATE "Category"
SET "icon" = 'utensils'
WHERE "kind" = 'AREA'
  AND "type" = 'EXPENSE'
  AND "name" = 'Alimentação'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'utensils', '🍽️'));

UPDATE "Category"
SET "icon" = 'home'
WHERE "kind" = 'AREA'
  AND "type" = 'EXPENSE'
  AND "name" = 'Casa'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'home', '🏠'));

UPDATE "Category"
SET "icon" = 'book-open'
WHERE "kind" = 'AREA'
  AND "type" = 'EXPENSE'
  AND "name" = 'Educação'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'book-open', '📚'));

UPDATE "Category"
SET "icon" = 'baby'
WHERE "kind" = 'AREA'
  AND "type" = 'EXPENSE'
  AND "name" = 'Filhos'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'baby', '👶'));

UPDATE "Category"
SET "icon" = 'gamepad-2'
WHERE "kind" = 'AREA'
  AND "type" = 'EXPENSE'
  AND "name" = 'Lazer'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'gamepad-2', '🎮'));

UPDATE "Category"
SET "icon" = 'package'
WHERE "kind" = 'AREA'
  AND "type" = 'EXPENSE'
  AND "name" = 'Outros'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'package', '📦'));

UPDATE "Category"
SET "icon" = 'user-round'
WHERE "kind" = 'AREA'
  AND "type" = 'EXPENSE'
  AND "name" = 'Pessoal'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'user-round', '👤'));

UPDATE "Category"
SET "icon" = 'heart-pulse'
WHERE "kind" = 'AREA'
  AND "type" = 'EXPENSE'
  AND "name" = 'Saúde'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'heart-pulse', '🏥'));

UPDATE "Category"
SET "icon" = 'car-front'
WHERE "kind" = 'AREA'
  AND "type" = 'EXPENSE'
  AND "name" = 'Transporte'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'car-front', '🚗'));

UPDATE "Category"
SET "icon" = 'plane'
WHERE "kind" = 'AREA'
  AND "type" = 'EXPENSE'
  AND "name" = 'Viagens'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'plane', '✈️'));

UPDATE "Category"
SET "icon" = 'brain'
WHERE "kind" = 'PROFILE'
  AND "type" = 'EXPENSE'
  AND "name" = 'Conhecimento'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'brain', '🧠'));

UPDATE "Category"
SET "icon" = 'armchair'
WHERE "kind" = 'PROFILE'
  AND "type" = 'EXPENSE'
  AND "name" = 'Conforto'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'armchair', '☕'));

UPDATE "Category"
SET "icon" = 'receipt-text'
WHERE "kind" = 'PROFILE'
  AND "type" = 'EXPENSE'
  AND "name" = 'CustoFixo'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'receipt-text', '📋'));

UPDATE "Category"
SET "icon" = 'bird'
WHERE "kind" = 'PROFILE'
  AND "type" = 'EXPENSE'
  AND "name" = 'Liberdade'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'bird', '🦅'));

UPDATE "Category"
SET "icon" = 'party-popper'
WHERE "kind" = 'PROFILE'
  AND "type" = 'EXPENSE'
  AND "name" = 'Prazer'
  AND ("icon" IS NULL OR "icon" IN ('shapes', 'sliders-horizontal', 'party-popper', '🎉'));
