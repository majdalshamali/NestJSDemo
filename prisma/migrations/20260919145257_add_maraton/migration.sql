-- CreateTable
CREATE TABLE "maraton" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maraton_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maraton_participate" (
    "id" TEXT NOT NULL,
    "maratonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maraton_participate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maraton_authorId_idx" ON "maraton"("authorId");

-- CreateIndex
CREATE INDEX "maraton_participate_userId_idx" ON "maraton_participate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "maraton_participate_maratonId_userId_key" ON "maraton_participate"("maratonId", "userId");

-- AddForeignKey
ALTER TABLE "maraton" ADD CONSTRAINT "maraton_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maraton_participate" ADD CONSTRAINT "maraton_participate_maratonId_fkey" FOREIGN KEY ("maratonId") REFERENCES "maraton"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maraton_participate" ADD CONSTRAINT "maraton_participate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
