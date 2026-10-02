import {
  resolveFixedFare,
  getAvailableVehicles,
  getActiveServiceTypes,
  getActiveTerminalsForService,
  formatFareSAR,
} from '../fixed-fare';
import type { FixedFareRate } from '../../types';

let passed = 0;
let failed = 0;

function expect_eq(label: string, actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    process.stdout.write('  \u2713 ' + label + '\n');
  } else {
    failed++;
    const msg =
      '  \u2717 FAIL: ' +
      label +
      '\n    expected: ' +
      JSON.stringify(expected) +
      '\n    received: ' +
      JSON.stringify(actual);
    process.stdout.write(msg + '\n');
  }
}

console.log('\n── Dynamic Admin Rate List & Customer Booking Tests ──');

// 1. Initial test rate list
const initialRates: FixedFareRate[] = [
  {
    id: 'rate-1',
    vehicle_category: 'sedan',
    service_type: 'intercity_jeddah_makkah',
    terminal: null,
    fare_amount: 200,
    currency: 'SAR',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rate-2',
    vehicle_category: 'staria',
    service_type: 'intercity_jeddah_makkah',
    terminal: 'terminal_1',
    fare_amount: 300,
    currency: 'SAR',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rate-3',
    vehicle_category: 'gmc',
    service_type: 'intercity_makkah_madinah',
    terminal: null,
    fare_amount: 900,
    currency: 'SAR',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Test 1: Resolve active fare
const res1 = resolveFixedFare('sedan', 'intercity_jeddah_makkah', null, initialRates);
expect_eq('Customer can resolve active rate directly from Admin list', res1.found, true);
if (res1.found) {
  expect_eq('Exact fixed fare configured by Admin is returned (200 SAR)', res1.fare, 200);
}

// Test 2: Admin edits the fare
const editedRates = initialRates.map((r) =>
  r.id === 'rate-1' ? { ...r, fare_amount: 230 } : r
);
const res2 = resolveFixedFare('sedan', 'intercity_jeddah_makkah', null, editedRates);
expect_eq('Edited fare is immediately reflected in customer booking (230 SAR)', (res2 as any).fare, 230);

// Test 3: Admin deactivates a rate
const deactivatedRates = initialRates.map((r) =>
  r.id === 'rate-1' ? { ...r, is_active: false } : r
);
const res3 = resolveFixedFare('sedan', 'intercity_jeddah_makkah', null, deactivatedRates);
expect_eq('Deactivated rate is no longer available for customer booking', res3.found, false);

// Test 4: Admin deletes/removes a rate
const deletedRates = initialRates.filter((r) => r.id !== 'rate-1');
const res4 = resolveFixedFare('sedan', 'intercity_jeddah_makkah', null, deletedRates);
expect_eq('Deleted rate is no longer available for customer booking', res4.found, false);

// Test 5: getAvailableVehicles only returns vehicles with active rates
const avail1 = getAvailableVehicles('intercity_jeddah_makkah', null, initialRates);
expect_eq('Only sedan is available when staria requires terminal', avail1, ['sedan']);

const avail2 = getAvailableVehicles('intercity_jeddah_makkah', 'terminal_1', initialRates);
expect_eq('Both sedan and staria are available for Terminal 1', avail2.sort(), ['sedan', 'staria'].sort());

// Test 6: Deactivating staria removes it from available vehicles
const avail3 = getAvailableVehicles('intercity_jeddah_makkah', 'terminal_1', deactivatedRates);
expect_eq('Deactivated vehicle disappears from available options', avail3, ['staria']); // wait, rate-1 was sedan, staria is rate-2

const deactivatedStaria = initialRates.map((r) =>
  r.id === 'rate-2' ? { ...r, is_active: false } : r
);
const avail4 = getAvailableVehicles('intercity_jeddah_makkah', 'terminal_1', deactivatedStaria);
expect_eq('Deactivating staria removes it from terminal 1', avail4, ['sedan']);

// Test 7: Active routes detection
const activeRoutes = getActiveServiceTypes(initialRates);
expect_eq('Active routes include only routes with active rates', activeRoutes.sort(), [
  'intercity_jeddah_makkah',
  'intercity_makkah_madinah',
].sort());

// Test 8: Active terminals detection
const activeTerminals = getActiveTerminalsForService('intercity_jeddah_makkah', initialRates);
expect_eq('Active terminals detected correctly', activeTerminals, ['terminal_1']);

console.log(`\n===============================================`);
console.log(`  Dynamic Rates Test Results`);
console.log(`  Passed: ${passed}  |  Failed: ${failed}`);
console.log(`===============================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
