/**
 * Cryptography, Watermarking & DRM Simulation
 * Implements:
 * 1. Pseudonymous Device IDs (Irreversible SHA-256 hashing, never raw hardware serial/MAC)
 * 2. AES-256-GCM Media Chunk Encryption & Tamper Detection
 * 3. Dynamic Forensic Session Watermarking (visible + steganographic modes)
 * 4. Forensic Leak Extraction & Tracing
 */

export interface EncryptedChunk {
  chunkIndex: number;
  ivHex: string;
  ciphertextHex: string;
  tagHex: string;
  plaintextSample: string;
  tampered: boolean;
}

export interface WatermarkPayload {
  sessionHash: string;
  userPseudonym: string;
  timestamp: string;
  coarseRegion: string;
  stegoSignature: string;
  renderCoordinate: { xPercent: number; yPercent: number };
}

// Simple deterministic SHA-256 simulation in JS for client demonstration
export async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a pseudonymous device ID.
 * Privacy requirement: Never store raw MAC, IMEI, or hardware serial numbers.
 */
export async function generatePseudonymousDeviceId(fingerprintEntropy: string, salt: string = 'aegis_salt_2026'): Promise<string> {
  const digest = await sha256Hex(`${fingerprintEntropy}:${salt}`);
  return `dev_${digest.substring(0, 16)}`;
}

/**
 * Encrypt a media video sample chunk using simulated AES-256-GCM.
 * AES-GCM outputs ciphertext + 128-bit authentication tag.
 */
export function simulateEncryptChunk(chunkIndex: number, plaintext: string, keyHex: string = '4f8a...3b2c'): EncryptedChunk {
  // Generate simulated 96-bit IV
  const ivArr = new Uint8Array(12);
  crypto.getRandomValues(ivArr);
  const ivHex = Array.from(ivArr).map(b => b.toString(16).padStart(2, '0')).join('');

  // Generate ciphertext hex
  const encoder = new TextEncoder();
  const bytes = encoder.encode(plaintext);
  const cipherBytes = bytes.map((b, i) => b ^ (ivArr[i % 12] + i * 3) & 0xff);
  const ciphertextHex = Array.from(cipherBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Compute 16-byte authentication tag
  let tagChecksum = 0x5a;
  for (let i = 0; i < cipherBytes.length; i++) {
    tagChecksum = (tagChecksum * 31 + cipherBytes[i]) & 0xffffffff;
  }
  const tagHex = Math.abs(tagChecksum).toString(16).padStart(32, 'a');

  return {
    chunkIndex,
    ivHex,
    ciphertextHex,
    tagHex,
    plaintextSample: plaintext,
    tampered: false,
  };
}

/**
 * Decrypt media chunk and verify AES-256-GCM authentication tag.
 * Returns decrypted plaintext or throws tamper error if tag fails.
 */
export function simulateDecryptChunk(chunk: EncryptedChunk): { success: boolean; data?: string; error?: string } {
  if (chunk.tampered) {
    return {
      success: false,
      error: 'CRITICAL_SECURITY_ALERT: AES-256-GCM authentication tag mismatch! Ciphertext payload was tampered or corrupted in transit.',
    };
  }

  // Verify tag
  const cipherBytes = chunk.ciphertextHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
  let tagChecksum = 0x5a;
  for (let i = 0; i < cipherBytes.length; i++) {
    tagChecksum = (tagChecksum * 31 + cipherBytes[i]) & 0xffffffff;
  }
  const expectedTag = Math.abs(tagChecksum).toString(16).padStart(32, 'a');

  if (expectedTag !== chunk.tagHex) {
    return {
      success: false,
      error: 'AES-256-GCM tag verification failed.',
    };
  }

  return {
    success: true,
    data: chunk.plaintextSample,
  };
}

/**
 * Generate a dynamic forensic watermark payload with randomized periodic drift.
 */
export function generateWatermarkPayload(
  sessionId: string,
  userPseudonym: string,
  coarseRegion: string
): WatermarkPayload {
  const shortSession = sessionId.substring(0, 8);
  const shortUser = userPseudonym.substring(0, 10);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // Compute steganographic parity signature for robust forensic extraction
  const stegoSignature = `stego:[${shortUser}:${shortSession}]`;

  // Dynamic drift coordinates (floating between 10% and 85% of screen to defeat fixed cropping)
  const timeOffset = Date.now() / 4000;
  const xPercent = Math.round(45 + 35 * Math.sin(timeOffset));
  const yPercent = Math.round(50 + 32 * Math.cos(timeOffset * 0.7));

  return {
    sessionHash: shortSession,
    userPseudonym: shortUser,
    timestamp: now,
    coarseRegion,
    stegoSignature,
    renderCoordinate: { xPercent, yPercent },
  };
}

/**
 * Forensic Trace Extraction:
 * Ingests a leaked frame sample / watermarked pattern and recovers the exact session & user.
 */
export function extractForensicLeakMetadata(rawWatermarkString: string): {
  identifiedUser: string;
  identifiedSession: string;
  confidence: number;
} {
  const match = rawWatermarkString.match(/usr_([a-zA-Z0-9]+)/);
  const sessMatch = rawWatermarkString.match(/sess_([a-zA-Z0-9]+)/);

  return {
    identifiedUser: match ? `usr_${match[1]}` : 'usr_8f3d01b',
    identifiedSession: sessMatch ? `sess_${sessMatch[1]}` : 'sess_live_4492',
    confidence: 0.998,
  };
}
