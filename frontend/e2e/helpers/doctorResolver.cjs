'use strict';

/**
 * Resolve seeded doctor1 (or first available doctor) for E2E booking flows.
 * Avoids hardcoded IDs that break on fresh CI databases.
 */
async function resolveDoctor1Id(I) {
  const doctors = await I.getDoctors();
  const doctor1 = doctors.find((d) => d.username === 'doctor1');
  if (doctor1?.id) return doctor1.id;
  if (doctors[0]?.id) return doctors[0].id;
  throw new Error(
    'E2E: no doctors available — check SEED_TEST_DATA=true and admin API credentials'
  );
}

async function resolveDoctor1(I) {
  const doctors = await I.getDoctors();
  return doctors.find((d) => d.username === 'doctor1') || doctors[0] || null;
}

/** Last token of doctor full name — works for seeded "Doctor One" → "One". */
function searchTermForDoctors(doctors) {
  const preferred = doctors.find((d) => d.username === 'doctor1') || doctors[0];
  const fullName = preferred?.fullName || 'Doctor One';
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || fullName;
}

module.exports = {
  resolveDoctor1Id,
  resolveDoctor1,
  searchTermForDoctors,
};
