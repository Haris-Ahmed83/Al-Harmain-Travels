/**
 * Automated Verification Suite for Bulk Vehicle Pricing & Dynamic Terminal Selection
 * Al Harmain Travels Rate Master
 */

import {
  isAirportRoute,
  checkRateConflict,
  resolveFixedFare,
  getAvailableVehicles,
  getActiveTerminalsForService,
  formatFareSAR,
} from '../fixed-fare';
import type { FixedFareRate, VehicleCategory } from '@/types';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
    errors.push(testName);
  }
}

console.log('\n── 1. Dynamic Airport Route Detection (isAirportRoute) ──');
assert(isAirportRoute('intercity_jeddah_makkah'), 'Jeddah → Makkah is airport route');
assert(isAirportRoute('intercity_makkah_jeddah'), 'Makkah → Jeddah is airport route');
assert(isAirportRoute('jeddah_airport_to_hotel'), 'Custom airport route detected');
assert(isAirportRoute('kaia_terminal_transfer'), 'Custom KAIA terminal route detected');
assert(!isAirportRoute('intercity_makkah_madinah'), 'Makkah → Madinah is NOT airport route');
assert(!isAirportRoute('ziyarat_makkah'), 'Makkah Ziyarat is NOT airport route');
assert(!isAirportRoute('ziyarat_taif'), 'Taif Ziyarat is NOT airport route');

console.log('\n── 2. All Terminals Shared Rate & Conflict Prevention ──');
const mockActiveRates: FixedFareRate[] = [
  {
    id: 'staria-jm-all',
    vehicle_category: 'staria',
    service_type: 'intercity_jeddah_makkah',
    terminal: 'all_terminals',
    fare_amount: 300,
    currency: 'SAR',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'gmc-jm-t1',
    vehicle_category: 'gmc',
    service_type: 'intercity_jeddah_makkah',
    terminal: 'terminal_1',
    fare_amount: 600,
    currency: 'SAR',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Staria already has all_terminals: adding terminal_1 must conflict
const conflict1 = checkRateConflict('staria', 'intercity_jeddah_makkah', 'terminal_1', mockActiveRates);
assert(conflict1.hasConflict, 'Adding specific terminal when all_terminals exists is blocked');
assert(
  Boolean(conflict1.message && conflict1.message.includes('All Terminals')),
  'Conflict message mentions All Terminals'
);

// GMC already has terminal_1: adding all_terminals must conflict
const conflict2 = checkRateConflict('gmc', 'intercity_jeddah_makkah', 'all_terminals', mockActiveRates);
assert(conflict2.hasConflict, 'Adding all_terminals when specific terminal exists is blocked');
assert(
  Boolean(conflict2.message && conflict2.message.includes('Terminal 1')),
  'Conflict message mentions specific terminal'
);

// Updating the same rate (passing excludeRateId) does not self-conflict
const updateCheck = checkRateConflict('staria', 'intercity_jeddah_makkah', 'all_terminals', mockActiveRates, 'staria-jm-all');
assert(!updateCheck.hasConflict, 'Updating existing rate with same ID does not conflict');

// Adding a vehicle that has no rates (e.g. Sedan or HiRoof) for all_terminals has no conflict
const newVehCheck = checkRateConflict('hiroof', 'intercity_jeddah_makkah', 'all_terminals', mockActiveRates);
assert(!newVehCheck.hasConflict, 'New vehicle category can be configured without conflict');

console.log('\n── 3. Exact Fare Resolution with all_terminals Fallback ──');
// When customer books Staria for Terminal 1, it resolves to the configured all_terminals fare (300 SAR)
const stariaT1 = resolveFixedFare('staria', 'intercity_jeddah_makkah', 'terminal_1', mockActiveRates);
assert(stariaT1.found, 'Staria resolves for Terminal 1 using shared all_terminals rate');
if (stariaT1.found) {
  assert(stariaT1.fare === 300, 'Staria exact fare is 300 SAR (zero surge)');
  assert(stariaT1.rateId === 'staria-jm-all', 'Staria maps to all_terminals rate ID');
}

// When customer books Staria for Terminal H, it also resolves to 300 SAR
const stariaTH = resolveFixedFare('staria', 'intercity_jeddah_makkah', 'terminal_h', mockActiveRates);
assert(stariaTH.found && stariaTH.fare === 300, 'Staria resolves for Terminal H using shared all_terminals rate');

// GMC has specific Terminal 1 rate (600 SAR)
const gmcT1 = resolveFixedFare('gmc', 'intercity_jeddah_makkah', 'terminal_1', mockActiveRates);
assert(gmcT1.found && gmcT1.fare === 600, 'GMC exact terminal 1 rate resolves to 600 SAR');

// GMC Terminal H is not configured and has no all_terminals fallback -> should not be found
const gmcTH = resolveFixedFare('gmc', 'intercity_jeddah_makkah', 'terminal_h', mockActiveRates);
assert(!gmcTH.found, 'GMC Terminal H is unconfigured and returns found: false');

console.log('\n── 4. Dynamic Terminals Availability ──');
const activeTerms = getActiveTerminalsForService('intercity_jeddah_makkah', mockActiveRates);
assert(activeTerms.includes('all_terminals'), 'Active terminals includes all_terminals');
assert(activeTerms.includes('terminal_1'), 'Active terminals includes terminal_1');

console.log('\n===============================================');
console.log(`  Bulk Rates & Dynamic Terminal Validation`);
console.log(`  Passed: ${passed}  |  Failed: ${failed}`);
console.log('===============================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('  All validation criteria met successfully!\n');
}
