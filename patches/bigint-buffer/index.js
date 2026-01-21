/**
 * Pure JavaScript polyfill for bigint-buffer
 * Replaces the native addon version to address CVE security vulnerabilities
 */

/**
 * Convert a BigInt to a big-endian buffer
 * @param {bigint} big - The BigInt to convert
 * @param {number} [width] - Optional fixed width in bytes
 * @returns {Buffer}
 */
function toBufferBE(big, width) {
  if (big < 0n) {
    throw new RangeError('Cannot convert negative BigInt to buffer');
  }
  
  let hex = big.toString(16);
  if (hex.length % 2) {
    hex = '0' + hex;
  }
  
  const len = hex.length / 2;
  const buf = Buffer.alloc(width || len);
  
  const offset = width ? width - len : 0;
  
  for (let i = 0; i < len; i++) {
    buf[offset + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  
  return buf;
}

/**
 * Convert a BigInt to a little-endian buffer
 * @param {bigint} big - The BigInt to convert
 * @param {number} [width] - Optional fixed width in bytes
 * @returns {Buffer}
 */
function toBufferLE(big, width) {
  const be = toBufferBE(big, width);
  return Buffer.from(be.reverse());
}

/**
 * Convert a big-endian buffer to BigInt
 * @param {Buffer} buf - The buffer to convert
 * @returns {bigint}
 */
function toBigIntBE(buf) {
  const hex = buf.toString('hex');
  if (hex.length === 0) {
    return 0n;
  }
  return BigInt('0x' + hex);
}

/**
 * Convert a little-endian buffer to BigInt
 * @param {Buffer} buf - The buffer to convert
 * @returns {bigint}
 */
function toBigIntLE(buf) {
  const reversed = Buffer.from(buf).reverse();
  return toBigIntBE(reversed);
}

module.exports = {
  toBufferBE,
  toBufferLE,
  toBigIntBE,
  toBigIntLE,
  // Unsafe variants are aliases - the safe versions already handle all cases
  // In the original native addon, Unsafe skips validation for performance
  // In pure JS, we use the same implementation
  toBigIntBEUnsafe: toBigIntBE,
  toBigIntLEUnsafe: toBigIntLE,
  toBufferBEUnsafe: toBufferBE,
  toBufferLEUnsafe: toBufferLE
};
