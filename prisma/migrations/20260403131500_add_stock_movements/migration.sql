CREATE TABLE "stock_movements" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "part_id" TEXT NOT NULL,
  "project_id" INTEGER,
  "quantity_delta" INTEGER NOT NULL,
  "note" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_movements_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts" ("lcsc_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "stock_movements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "stock_movements_part_id_created_at_id_idx" ON "stock_movements"("part_id", "created_at", "id");
CREATE INDEX "stock_movements_project_id_idx" ON "stock_movements"("project_id");
