/**
 * build-elements-json.js
 *
 * Pre-processing script (developer tooling — run at build time, NOT in browser).
 *
 * Fetches element data from Bowserinator/Periodic-Table-JSON (MIT license),
 * transforms each record into the ElementRecord schema defined in
 * contracts/elements-json-schema.md, validates all 118 records, and writes
 * the result to src/assets/data/elements.json.
 *
 * Usage:
 *   node scripts/build-elements-json.js
 *
 * The `shells` array in the source data already contains IUPAC simplified
 * Bohr model shell counts (e.g., Potassium: [2, 8, 8, 1]) and is used directly.
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const SOURCE_URL =
  'https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json';

const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'assets', 'data', 'elements.json');

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        res.resume();
        return;
      }
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error('Failed to parse source JSON'));
        }
      });
    }).on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

/**
 * Maps one Bowserinator source record to our ElementRecord schema.
 * The source record's `shells` field already contains IUPAC simplified counts.
 *
 * @param {object} src - One element from the Bowserinator dataset.
 * @returns {object} ElementRecord
 */
function transform(src) {
  const record = {
    atomicNumber: src.number,
    name: src.name,
    symbol: src.symbol,
    atomicMass: typeof src.atomic_mass === 'number' ? src.atomic_mass : parseFloat(src.atomic_mass),
    shells: src.shells,
  };

  if (src.summary && typeof src.summary === 'string' && src.summary.trim().length > 0) {
    record.summary = src.summary.trim();
  }

  return record;
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

/**
 * Validates a single ElementRecord. Throws with a descriptive message on failure.
 *
 * @param {object} record
 * @param {number} idx - Index in array, for error messages.
 */
function validateRecord(record, idx) {
  const prefix = `Element[${idx}] (atomicNumber ${record.atomicNumber})`;

  if (!Number.isInteger(record.atomicNumber) || record.atomicNumber < 1 || record.atomicNumber > 118) {
    throw new Error(`${prefix}: atomicNumber out of range [1, 118]: ${record.atomicNumber}`);
  }

  if (!record.name || typeof record.name !== 'string' || record.name.trim().length === 0) {
    throw new Error(`${prefix}: name must be a non-empty string`);
  }

  if (
    !record.symbol ||
    typeof record.symbol !== 'string' ||
    record.symbol.length < 1 ||
    record.symbol.length > 3
  ) {
    throw new Error(`${prefix}: symbol must be 1–3 characters: "${record.symbol}"`);
  }

  if (!/^[A-Z]/.test(record.symbol)) {
    throw new Error(`${prefix}: symbol must start with an uppercase letter: "${record.symbol}"`);
  }

  if (typeof record.atomicMass !== 'number' || isNaN(record.atomicMass) || record.atomicMass <= 0) {
    throw new Error(`${prefix}: atomicMass must be a positive number: ${record.atomicMass}`);
  }

  if (!Array.isArray(record.shells) || record.shells.length === 0 || record.shells.length > 7) {
    throw new Error(`${prefix}: shells must be a non-empty array of length 1–7`);
  }

  for (let i = 0; i < record.shells.length; i++) {
    if (!Number.isInteger(record.shells[i]) || record.shells[i] <= 0) {
      throw new Error(`${prefix}: shells[${i}] must be a positive integer, got ${record.shells[i]}`);
    }
  }

  const shellSum = record.shells.reduce((a, b) => a + b, 0);
  if (shellSum !== record.atomicNumber) {
    throw new Error(
      `${prefix}: shells sum (${shellSum}) does not equal atomicNumber (${record.atomicNumber})`
    );
  }

  if (record.summary !== undefined && typeof record.summary !== 'string') {
    throw new Error(`${prefix}: summary must be a string or absent`);
  }
}

/**
 * Validates the full array of ElementRecords. Throws on any failure.
 *
 * @param {object[]} records
 */
function validateAll(records) {
  if (records.length !== 118) {
    throw new Error(`Expected 118 element records, got ${records.length}`);
  }

  for (let i = 0; i < records.length; i++) {
    validateRecord(records[i], i);

    if (records[i].atomicNumber !== i + 1) {
      throw new Error(
        `Record at index ${i} has atomicNumber ${records[i].atomicNumber}, expected ${i + 1}`
      );
    }
  }

  // Check uniqueness of atomicNumber
  const seen = new Set();
  for (const r of records) {
    if (seen.has(r.atomicNumber)) {
      throw new Error(`Duplicate atomicNumber: ${r.atomicNumber}`);
    }
    seen.add(r.atomicNumber);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Fetching element data from Bowserinator/Periodic-Table-JSON…');
  const source = await fetchJson(SOURCE_URL);

  if (!source.elements || !Array.isArray(source.elements)) {
    throw new Error('Unexpected source format: missing "elements" array');
  }

  console.log(`Fetched ${source.elements.length} source records.`);

  // Transform — filter to exactly elements 1–118 (source may include unconfirmed entries)
  const records = source.elements
    .filter((src) => src.number >= 1 && src.number <= 118)
    .map(transform)
    .sort((a, b) => a.atomicNumber - b.atomicNumber);

  // Validate
  console.log('Validating all 118 records…');
  validateAll(records);
  console.log('Validation passed.');

  // Write
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(records, null, 2), 'utf8');
  console.log(`Written to ${OUTPUT_PATH}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
