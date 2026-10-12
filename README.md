# EBCDIC Code Page Converter

Converts byte buffers between ASCII (ISO-8859-1) and EBCDIC for IBM code pages 037, 500, and 1047. ESM only, zero dependencies.

```js
import { asciiToEbcdic, ebcdicToAscii } from './src/index.js';

const text = new TextEncoder().encode('Hello');
const ebcdic = asciiToEbcdic(text, '037');   // Uint8Array of EBCDIC bytes
const back = ebcdicToAscii(ebcdic, '037');   // Uint8Array, round-trips to 'Hello'
```

## Why this exists

Mainframe interop tooling periodically needs to translate fixed-width byte records between EBCDIC and ASCII. The standard `iconv` bindings are not always available in sandboxed or embedded environments, and pulling in a general-purpose encoding library to get three code pages is overkill. This library ships exactly the three tables that matter for legacy IBM data interchange (037 for US English, 500 for international, 1047 for open-systems Unix on z/OS) and nothing else.

The trade-off: the tables are 256-entry flat arrays and conversion is a direct index lookup. This is fast and simple, but it means every byte passes through a single defined mapping. There is no fallback or transliteration layer.

## Edge cases you will hit

- **Non-ASCII input**: the library treats input as raw bytes indexed 0–255. If you pass UTF-8 multibyte sequences, each byte is converted independently, which will not produce meaningful EBCDIC.
- **Unmapped reverse bytes**: some EBCDIC byte values have no corresponding ASCII source in the forward table. `ebcdicToAscii` returns `0x00` (NUL) for these rather than throwing. If you need strict validation, check the output for NUL bytes yourself.
- **Code page 1047 vs 037 newline handling**: in 037, ASCII `0x0a` (LF) maps to EBCDIC `0x25`; in 1047 it maps to `0x15` (NEL). If you are converting line-oriented records, pick the code page that matches your platform — 1047 for z/OS Unix System Services, 037 for traditional MVS datasets.

## API

All exports come from the package root:

- `asciiToEbcdic(input: Uint8Array, codePage: string | number): Uint8Array`
- `ebcdicToAscii(input: Uint8Array, codePage: string | number): Uint8Array`
- `getForwardTable(codePage): Uint8Array` — the raw 256-byte ASCII→EBCDIC table
- `getReverseTable(codePage): Uint8Array` — the raw 256-byte EBCDIC→ASCII table
- `supportedCodePages(): string[]` — returns `['037', '1047', '500']`

`codePage` accepts both the string `'037'` and the number `37`; it is zero-padded internally.

## Running the tests

```
node --test
```

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

