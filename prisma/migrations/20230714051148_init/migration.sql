-- CreateTable
CREATE TABLE "SyncMapping" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "sourceServer" TEXT NOT NULL,
    "sourceCardID" TEXT NOT NULL,
    "destinationServer" TEXT NOT NULL,
    "destinationCardID" TEXT NOT NULL,

    CONSTRAINT "SyncMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncMapping_id_key" ON "SyncMapping"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SyncMapping_sourceCardID_destinationCardID_key" ON "SyncMapping"("sourceCardID", "destinationCardID");
