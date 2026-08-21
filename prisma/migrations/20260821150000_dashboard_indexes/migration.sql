-- CreateIndex
CREATE INDEX "customers_establishment_id_idx" ON "customers"("establishment_id");

-- CreateIndex
CREATE INDEX "events_establishment_id_type_created_at_idx" ON "events"("establishment_id", "type", "created_at");
