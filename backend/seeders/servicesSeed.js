import prisma from '../prisma/client.js';
import { SERVICE_CATEGORIES } from '../../frontend/src/data.js';

export async function seedServicesIfEmpty() {
  const existing = await prisma.service.findMany();
  if (existing.length > 0) return;

  for (const cat of SERVICE_CATEGORIES) {
    await prisma.service.create({
      data: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        basePrice: cat.basePrice,
        popularIssues: cat.popularIssues || []
      }
    });
  }
}

