-- Migration: tie ProviderServiceRequest to existing Service
-- Adds requestedServiceId FK-like field to ProviderServiceRequest.

ALTER TABLE "ProviderServiceRequest" ADD COLUMN     "requestedServiceId" TEXT;

