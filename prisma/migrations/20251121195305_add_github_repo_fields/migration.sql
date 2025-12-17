-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "githubRepoId" TEXT,
ADD COLUMN     "githubRepoUrl" TEXT;

-- CreateIndex
CREATE INDEX "Project_githubRepoId_idx" ON "Project"("githubRepoId");
