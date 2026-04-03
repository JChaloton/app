import { prisma } from "@/lib/prisma";
import { parseProjectBomLines } from "@/lib/project-bom";

export async function getDashboardData() {
  const [totalParts, parts, recentHistory, projects] = await Promise.all([
    prisma.part.count(),
    prisma.part.findMany({
      orderBy: { lcscId: "asc" },
      include: {
        priceHistory: {
          orderBy: [{ orderDate: "desc" }, { id: "desc" }],
          take: 8,
        },
      },
    }),
    prisma.priceHistory.findMany({
      orderBy: [{ orderDate: "desc" }, { id: "desc" }],
      take: 8,
      include: {
        part: true,
      },
    }),
    prisma.project.findMany({
      orderBy: { id: "desc" },
      take: 5,
    }),
  ]);

  const inventoryValue = parts.reduce((sum, part) => {
    const latestPrice = part.priceHistory[0]?.pricePaid ?? 0;
    return sum + part.stockLevel * latestPrice;
  }, 0);

  const partsWithoutHistory = parts.filter((part) => part.priceHistory.length === 0).length;

  return {
    totalParts,
    inventoryValue,
    pendingOrdersLabel: "Not tracked",
    partsWithoutHistory,
    recentHistory,
    latestProjects: projects.map((project) => ({
      ...project,
      bomLines: parseProjectBomLines(project.bomLinesJson),
    })),
  };
}

export async function getParts(search: string) {
  return prisma.part.findMany({
    where: search
      ? {
          OR: [
            { lcscId: { contains: search } },
            { mpn: { contains: search } },
            { manufacturer: { contains: search } },
            { description: { contains: search } },
            { packageName: { contains: search } },
            { storageLocation: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { lcscId: "asc" },
    include: {
      priceHistory: {
        orderBy: [{ orderDate: "desc" }, { id: "desc" }],
        take: 8,
      },
    },
  });
}

export async function getPartById(lcscId: string) {
  return prisma.part.findUnique({
    where: { lcscId },
    include: {
      priceHistory: {
        orderBy: [{ orderDate: "desc" }, { id: "desc" }],
      },
      stockMovements: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 25,
      },
    },
  });
}

export async function getProjects() {
  const projects = await prisma.project.findMany({
    orderBy: [{ name: "asc" }],
  });

  return projects.map((project) => ({
    ...project,
    bomLines: parseProjectBomLines(project.bomLinesJson),
  }));
}
