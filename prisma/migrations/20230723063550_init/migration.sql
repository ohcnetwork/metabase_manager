/*
  Warnings:

  - A unique constraint covering the columns `[sourceCardID,destinationServer]` on the table `SyncMapping` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SyncMapping_sourceCardID_destinationServer_key" ON "SyncMapping"("sourceCardID", "destinationServer");
