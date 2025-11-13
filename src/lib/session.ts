import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export const getCurrentSession = cache(async () => {
  return getServerSession(authOptions);
});

export const getCurrentUser = cache(async () => {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
});

