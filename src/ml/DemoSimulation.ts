import { calculateFreshnessIntelligence, LogisticsInput } from './freshness_engine';

/**
 * Utility to run simulated scenarios for the demo without needing the backend yet.
 */
export const runFreshnessDemo = () => {
    // SCENARIO 1: Perfect Execution (Seer Fish)
    const perfectCatchOptions: LogisticsInput = {
        species: 'Seer Fish',
        basePricePerKg: 349,
        catchTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        landingTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // Landed fast
        packingTime: new Date(Date.now() - 3.2 * 60 * 60 * 1000), // Packed fast
        dispatchTime: new Date(Date.now() - 3.0 * 60 * 60 * 1000), // Dispatched fast
        arrivalEta: new Date(Date.now() + 2 * 60 * 60 * 1000),
        coldChainMaintained: true
    };

    // SCENARIO 2: Delayed Prawns (Highly Sensitive, Triggers Flash Drop)
    const delayedSensitives: LogisticsInput = {
        species: 'Prawns',
        basePricePerKg: 389,
        catchTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        landingTime: new Date(Date.now() - 7 * 60 * 60 * 1000),
        packingTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // Sat on dock for 2 hours!
        dispatchTime: new Date(Date.now() - 4 * 60 * 60 * 1000), 
        arrivalEta: new Date(Date.now() + 1 * 60 * 60 * 1000),
        coldChainMaintained: true
    };

    console.log("=== AI FRESHNESS ENGINE TEST ===");
    console.log("Scenario 1 (Seer Fish, Fast Logistics):", calculateFreshnessIntelligence(perfectCatchOptions));
    console.log("Scenario 2 (Prawns, Dock Delay):", calculateFreshnessIntelligence(delayedSensitives));
}
