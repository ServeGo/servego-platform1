import { ServiceModel } from '../models/serviceModel.js';
import { SERVICE_CATEGORIES } from '../../frontend/src/data.js';

export async function seedServicesIfEmpty() {
  const existing = await ServiceModel.getAll();
  if (existing.length > 0) return;

  // Seed from existing frontend hardcoded categories
  for (const cat of SERVICE_CATEGORIES) {
    await ServiceModel.create({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      basePrice: cat.basePrice,
      popularIssues: cat.popularIssues || []
    });
  }
}

