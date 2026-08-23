// Small hand-built ESC/POS byte-sequence builder - deliberately not a
// dependency on a third-party printer SDK, since a v1 kitchen ticket / bill
// layout only needs a handful of commands (init, bold, double-size, cut) and
// building it directly keeps the byte stream fully inspectable/testable
// (see the Phase 8 smoke test, which points this at a plain TCP listener).
const ESC = 0x1b;
const GS = 0x1d;

export class EscPosBuilder {
  private chunks: Buffer[] = [Buffer.from([ESC, 0x40])]; // ESC @ - initialize

  text(line = ''): this {
    this.chunks.push(Buffer.from(line + '\n', 'ascii'));
    return this;
  }

  bold(on: boolean): this {
    this.chunks.push(Buffer.from([ESC, 0x45, on ? 1 : 0]));
    return this;
  }

  doubleSize(on: boolean): this {
    this.chunks.push(Buffer.from([GS, 0x21, on ? 0x11 : 0x00]));
    return this;
  }

  divider(width = 32): this {
    return this.text('-'.repeat(width));
  }

  feed(lines = 1): this {
    this.chunks.push(Buffer.alloc(lines, 0x0a));
    return this;
  }

  cut(): this {
    this.chunks.push(Buffer.from([GS, 0x56, 0x00])); // full cut
    return this;
  }

  build(): Buffer {
    return Buffer.concat(this.chunks);
  }
}
