/**
 * Public entry point for the EBCDIC Code Page Converter.
 *
 * Re-exports the narrow, stable surface from core.js. Keeping the barrel
 * separate from the implementation means consumers depend only on names we
 * explicitly promote; internal helpers like `buildReverse` stay private even
 * if someone greps the source tree.
 */
export {
  asciiToEbcdic,
  ebcdicToAscii,
  getForwardTable,
  getReverseTable,
  supportedCodePages,
} from './core.js';
