import { Router } from 'express';
import { ProviderServiceDiscoveryController } from '../controllers/providerServiceDiscoveryController.js';

const router = Router();

router.get('/by-approved-service', ProviderServiceDiscoveryController.getApprovedProvidersByServiceName);

export default router;
