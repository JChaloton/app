-- CreateTable
CREATE TABLE "parts" (
    "lcsc_id" TEXT NOT NULL PRIMARY KEY,
    "mpn" TEXT,
    "manufacturer" TEXT,
    "description" TEXT,
    "stock_level" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "part_id" TEXT NOT NULL,
    "price_paid" REAL NOT NULL,
    "order_date" DATETIME NOT NULL,
    "source_file" TEXT NOT NULL,
    CONSTRAINT "price_history_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts" ("lcsc_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "total_cost" REAL NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "price_history_part_id_order_date_id_idx" ON "price_history"("part_id", "order_date", "id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_key" ON "projects"("name");
