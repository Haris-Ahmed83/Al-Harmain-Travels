/**
 * Fixed-Fare Rate Test Suite — Al Harmain Travels
 *
 * Verifies every rate in FIXED_RATE_TABLE against its exact expected value and
 * exercises the resolveFixedFare() function for all positive, negative, and
 * edge-case combinations.
 *
 * Run with:   npx tsx src/lib/__tests__/fixed-fare.test.ts
 *
 * Exit code 0 = all tests passed.
 * Exit code 1 = one or more tests failed.
 */

import {
  resolveFixedFare,
  FIXED_RATE_TABLE,
  getAvailableVehicles,
  formatFareSAR,
} from '../fixed-fare';
import type { VehicleCategory, ServiceType, TerminalCode } from '../../types';

// ─── Minimal test harness ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

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
    failures.push(label);
  }
}

function describe(suite: string, fn: () => void) {
  process.stdout.write('\n── ' + suite + ' ──\n');
  fn();
}

// ─── A. Sedan — Toyota Camry / Hyundai Sonata ────────────────────────────────

describe('A. Sedan fares', () => {
  const cat: VehicleCategory = 'sedan';

  // Sedan NEVER uses terminal pricing — all sedan rows have terminal: null
  const cases: [ServiceType, TerminalCode, number][] = [
    ['intercity_jeddah_makkah', null, 200],
    ['intercity_makkah_jeddah', null, 180],
    ['intercity_makkah_madinah', null, 350],
    ['intercity_makkah_madinah_sameday', null, 650],
    ['ziyarat_taif', null, 350],
    ['ziyarat_taif_bani_saad', null, 500],
    ['ziyarat_makkah', null, 180],
  ];

  for (const [svc, terminal, expected] of cases) {
    const result = resolveFixedFare(cat, svc, terminal);
    expect_eq(
      'sedan | ' + svc + ' | terminal=' + terminal + ' -> SAR ' + expected,
      result.found ? result.fare : null,
      expected
    );
    if (result.found) {
      expect_eq("  fareType is 'fixed'", result.fareType, 'fixed');
      expect_eq("  currency is 'SAR'", result.currency, 'SAR');
    }
  }

  // Sedan on Jeddah->Makkah should ignore terminal flags — still resolves via null terminal
  const terminals: NonNullable<TerminalCode>[] = ['terminal_1', 'terminal_h', 'terminal_n'];
  for (const t of terminals) {
    const result = resolveFixedFare(cat, 'intercity_jeddah_makkah', t);
    expect_eq(
      'sedan | intercity_jeddah_makkah | terminal=' + t + ' -> SAR 200 (no terminal pricing)',
      result.found ? result.fare : null,
      200
    );
  }
});

// ─── B. Hyundai Staria ───────────────────────────────────────────────────────

describe('B. Staria fares', () => {
  const cat: VehicleCategory = 'staria';

  const cases: [ServiceType, TerminalCode, number][] = [
    ['intercity_jeddah_makkah', 'terminal_1', 300],
    ['intercity_jeddah_makkah', 'terminal_h', 350],
    ['intercity_makkah_jeddah', null, 250],
    ['intercity_makkah_madinah', null, 500],
    ['intercity_makkah_madinah_sameday', null, 800],
    ['ziyarat_taif', null, 400],
    ['ziyarat_taif_bani_saad', null, 600],
    ['ziyarat_makkah', null, 250],
  ];

  for (const [svc, terminal, expected] of cases) {
    const result = resolveFixedFare(cat, svc, terminal);
    expect_eq(
      'staria | ' + svc + ' | terminal=' + terminal + ' -> SAR ' + expected,
      result.found ? result.fare : null,
      expected
    );
  }

  // Staria on Jeddah->Makkah without terminal = not-found (terminal required)
  const noTerminal = resolveFixedFare(cat, 'intercity_jeddah_makkah', null);
  expect_eq('staria | intercity_jeddah_makkah | no terminal -> found: false', noTerminal.found, false);
});

// ─── C. GMC — Nusuk ──────────────────────────────────────────────────────────

describe('C. GMC fares', () => {
  const cat: VehicleCategory = 'gmc';

  const cases: [ServiceType, TerminalCode, number][] = [
    ['intercity_jeddah_makkah', 'terminal_h', 650],
    ['intercity_jeddah_makkah', 'terminal_1', 600],
    ['intercity_jeddah_makkah', 'terminal_n', 600],
    ['intercity_makkah_jeddah', null, 500],
    ['intercity_makkah_madinah', null, 900],
    ['ziyarat_taif', null, 700],
    ['ziyarat_taif_bani_saad', null, 1000],
    ['ziyarat_makkah', null, 450],
  ];

  for (const [svc, terminal, expected] of cases) {
    const result = resolveFixedFare(cat, svc, terminal);
    expect_eq(
      'gmc | ' + svc + ' | terminal=' + terminal + ' -> SAR ' + expected,
      result.found ? result.fare : null,
      expected
    );
  }

  // GMC on Jeddah->Makkah without terminal: not-found
  const noTerminal = resolveFixedFare(cat, 'intercity_jeddah_makkah', null);
  expect_eq('gmc | intercity_jeddah_makkah | no terminal -> found: false', noTerminal.found, false);

  // Madinah same-day is NOT listed for GMC
  const sameDayGmc = resolveFixedFare(cat, 'intercity_makkah_madinah_sameday', null);
  expect_eq('gmc | intercity_makkah_madinah_sameday -> found: false (not in rate table)', sameDayGmc.found, false);
});

// ─── D. HiRoof — Nusuk ───────────────────────────────────────────────────────

describe('D. HiRoof fares', () => {
  const cat: VehicleCategory = 'hiroof';

  const cases: [ServiceType, TerminalCode, number][] = [
    ['intercity_jeddah_makkah', 'terminal_h', 450],
    ['intercity_jeddah_makkah', 'terminal_1', 400],
    ['intercity_jeddah_makkah', 'terminal_n', 400],
    ['intercity_makkah_jeddah', null, 300],
    ['intercity_makkah_madinah', null, 600],
    ['ziyarat_taif', null, 500],
    ['ziyarat_taif_bani_saad', null, 750],
    ['ziyarat_makkah', null, 300],
  ];

  for (const [svc, terminal, expected] of cases) {
    const result = resolveFixedFare(cat, svc, terminal);
    expect_eq(
      'hiroof | ' + svc + ' | terminal=' + terminal + ' -> SAR ' + expected,
      result.found ? result.fare : null,
      expected
    );
  }

  // HiRoof on Jeddah->Makkah without terminal: not-found
  const noTerminal = resolveFixedFare(cat, 'intercity_jeddah_makkah', null);
  expect_eq('hiroof | intercity_jeddah_makkah | no terminal -> found: false', noTerminal.found, false);
});

// ─── E. Rate table integrity ─────────────────────────────────────────────────

describe('E. Rate table integrity', () => {
  // 7 Sedan + 8 Staria + 8 GMC + 8 HiRoof = 31 total entries
  expect_eq('FIXED_RATE_TABLE length = 31', FIXED_RATE_TABLE.length, 31);

  const ids = FIXED_RATE_TABLE.map((r) => r.id);
  const uniqueIds = new Set(ids);
  expect_eq('No duplicate rate IDs', ids.length, uniqueIds.size);

  const combos = FIXED_RATE_TABLE.map((r) => r.vehicle_category + '|' + r.service_type + '|' + r.terminal);
  const uniqueCombos = new Set(combos);
  expect_eq('No duplicate route combos', combos.length, uniqueCombos.size);

  const allPositive = FIXED_RATE_TABLE.every((r) => r.fare_amount > 0 && Number.isInteger(r.fare_amount));
  expect_eq('All fares are positive integers', allPositive, true);

  const sedanRates = FIXED_RATE_TABLE.filter((r) => r.vehicle_category === 'sedan');
  expect_eq('Sedan has 7 rates', sedanRates.length, 7);
  expect_eq('All sedan rates have terminal=null', sedanRates.every((r) => r.terminal === null), true);

  const stariaRates = FIXED_RATE_TABLE.filter((r) => r.vehicle_category === 'staria');
  expect_eq('Staria has 8 rates', stariaRates.length, 8);

  const gmcRates = FIXED_RATE_TABLE.filter((r) => r.vehicle_category === 'gmc');
  expect_eq('GMC has 8 rates', gmcRates.length, 8);

  const hiroofRates = FIXED_RATE_TABLE.filter((r) => r.vehicle_category === 'hiroof');
  expect_eq('HiRoof has 8 rates', hiroofRates.length, 8);

  // Standard and same-day Makkah->Madinah are distinct entries
  const sedanStd = resolveFixedFare('sedan', 'intercity_makkah_madinah', null);
  const sedanSD = resolveFixedFare('sedan', 'intercity_makkah_madinah_sameday', null);
  expect_eq('sedan standard madinah = 350', sedanStd.found ? (sedanStd as any).fare : null, 350);
  expect_eq('sedan same-day madinah = 650', sedanSD.found ? (sedanSD as any).fare : null, 650);
  expect_eq(
    'Standard != same-day fare',
    sedanStd.found && sedanSD.found && (sedanStd as any).fare !== (sedanSD as any).fare,
    true
  );
});

// ─── F. Invalid / unsupported combinations ────────────────────────────────────

describe('F. Unsupported combinations', () => {
  const badVehicle = resolveFixedFare('bus' as VehicleCategory, 'intercity_jeddah_makkah', null);
  expect_eq('Unknown vehicle -> found: false', badVehicle.found, false);

  // Staria with Terminal N — not in table
  const stariaTermN = resolveFixedFare('staria', 'intercity_jeddah_makkah', 'terminal_n');
  expect_eq('staria | Jeddah->Makkah | Terminal N -> found: false', stariaTermN.found, false);

  // Wrong terminal context for a route that has no terminal pricing
  const gmcBadContext = resolveFixedFare('gmc', 'intercity_makkah_jeddah', 'terminal_1');
  expect_eq(
    'gmc | makkah->jeddah | terminal_1 -> found: false (route has no terminal variants)',
    gmcBadContext.found,
    false
  );
});

// ─── G. getAvailableVehicles helper ─────────────────────────────────────────

describe('G. getAvailableVehicles()', () => {
  const mj = getAvailableVehicles('intercity_makkah_jeddah');
  expect_eq('Makkah->Jeddah: all 4 vehicles available', mj.length, 4);
  expect_eq('includes sedan', mj.includes('sedan'), true);
  expect_eq('includes staria', mj.includes('staria'), true);
  expect_eq('includes gmc', mj.includes('gmc'), true);
  expect_eq('includes hiroof', mj.includes('hiroof'), true);

  // terminal_1: sedan (null-terminal), staria, gmc, hiroof all available
  const jmT1 = getAvailableVehicles('intercity_jeddah_makkah', 'terminal_1');
  expect_eq('Jeddah->Makkah terminal_1: sedan available', jmT1.includes('sedan'), true);
  expect_eq('Jeddah->Makkah terminal_1: staria available', jmT1.includes('staria'), true);
  expect_eq('Jeddah->Makkah terminal_1: gmc available', jmT1.includes('gmc'), true);
  expect_eq('Jeddah->Makkah terminal_1: hiroof available', jmT1.includes('hiroof'), true);

  // terminal_n: staria NOT available (only terminal_1 and terminal_h for staria)
  const jmTN = getAvailableVehicles('intercity_jeddah_makkah', 'terminal_n');
  expect_eq('Jeddah->Makkah terminal_n: staria NOT available', jmTN.includes('staria'), false);
  expect_eq('Jeddah->Makkah terminal_n: gmc available (has terminal_n rate)', jmTN.includes('gmc'), true);

  const ziyaratVehicles = getAvailableVehicles('ziyarat_makkah');
  expect_eq('ziyarat_makkah: all 4 available', ziyaratVehicles.length, 4);
});

// ─── H. formatFareSAR() ───────────────────────────────────────────────────────

describe('H. formatFareSAR()', () => {
  expect_eq('formatFareSAR(200)  = "SAR 200"', formatFareSAR(200), 'SAR 200');
  expect_eq('formatFareSAR(1000) = "SAR 1,000"', formatFareSAR(1000), 'SAR 1,000');
  expect_eq('formatFareSAR(650)  = "SAR 650"', formatFareSAR(650), 'SAR 650');
});

// ─── I. Rate ID regression pins ───────────────────────────────────────────────

describe('I. Rate ID regression pins', () => {
  const checks: [VehicleCategory, ServiceType, TerminalCode, string][] = [
    ['sedan', 'intercity_jeddah_makkah', null, 'sedan-jeddah-makkah'],
    ['staria', 'intercity_jeddah_makkah', 'terminal_1', 'staria-jeddah-makkah-t1'],
    ['staria', 'intercity_jeddah_makkah', 'terminal_h', 'staria-jeddah-makkah-th'],
    ['gmc', 'intercity_jeddah_makkah', 'terminal_h', 'gmc-jeddah-makkah-th'],
    ['gmc', 'intercity_jeddah_makkah', 'terminal_n', 'gmc-jeddah-makkah-tn'],
    ['hiroof', 'intercity_jeddah_makkah', 'terminal_n', 'hiroof-jeddah-makkah-tn'],
    ['gmc', 'ziyarat_taif_bani_saad', null, 'gmc-taif-bani-saad'],
    ['hiroof', 'intercity_makkah_madinah', null, 'hiroof-makkah-madinah'],
    ['sedan', 'intercity_makkah_madinah_sameday', null, 'sedan-makkah-madinah-sameday'],
    ['staria', 'intercity_makkah_madinah_sameday', null, 'staria-makkah-madinah-sameday'],
  ];

  for (const [cat, svc, terminal, expectedId] of checks) {
    const result = resolveFixedFare(cat, svc, terminal);
    expect_eq(
      'rateId: ' + cat + ' | ' + svc + ' | ' + terminal + ' = "' + expectedId + '"',
      result.found ? result.rateId : null,
      expectedId
    );
  }
});

// ─── Summary ──────────────────────────────────────────────────────────────────

process.stdout.write('\n');
process.stdout.write('===============================================\n');
process.stdout.write('  Fixed-Fare Test Results\n');
process.stdout.write('  Passed: ' + passed + '  |  Failed: ' + failed + '\n');
process.stdout.write('===============================================\n');

if (failures.length > 0) {
  process.stdout.write('\nFailed tests:\n');
  failures.forEach((f) => process.stdout.write('  - ' + f + '\n'));
  process.stdout.write('\n');
  process.exit(1);
} else {
  process.stdout.write('  All tests passed\n\n');
  process.exit(0);
}
