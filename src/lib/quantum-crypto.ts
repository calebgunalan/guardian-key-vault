import * as sodium from 'libsodium-wrappers';
import { ml_kem768 } from 'noble-post-quantum/ml-kem';
import { ml_dsa65 } from 'noble-post-quantum/ml-dsa';

// Initialize libsodium
await sodium.ready;

/**
 * Quantum-Resistant Cryptography Library
 * Implements NIST-approved post-quantum algorithms
 */

export interface QuantumKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface QuantumSignature {
  signature: Uint8Array;
  publicKey: Uint8Array;
}

export interface QuantumEncryptedData {
  ciphertext: Uint8Array;
  encapsulatedKey: Uint8Array;
}

/**
 * Post-Quantum Key Encapsulation Mechanism (ML-KEM-768)
 * NIST-approved quantum-resistant algorithm
 */
export class QuantumKEM {
  static generateKeyPair(): QuantumKeyPair {
    const keyPair = ml_kem768.keygen();
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey
    };
  }

  static encapsulate(publicKey: Uint8Array): { sharedSecret: Uint8Array; ciphertext: Uint8Array } {
    return ml_kem768.encaps(publicKey);
  }

  static decapsulate(ciphertext: Uint8Array, privateKey: Uint8Array): Uint8Array {
    return ml_kem768.decaps(ciphertext, privateKey);
  }
}

/**
 * Post-Quantum Digital Signatures (ML-DSA-65)
 * NIST-approved quantum-resistant signature scheme
 */
export class QuantumSignatures {
  static generateKeyPair(): QuantumKeyPair {
    const keyPair = ml_dsa65.keygen();
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey
    };
  }

  static sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
    return ml_dsa65.sign(privateKey, message);
  }

  static verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
    return ml_dsa65.verify(publicKey, message, signature);
  }
}

/**
 * Quantum-Safe Symmetric Encryption using XChaCha20-Poly1305
 * Provides 256-bit security against quantum attacks
 */
export class QuantumSymmetric {
  static generateKey(): Uint8Array {
    return sodium.randombytes_buf(32); // 256-bit key
  }

  static generateNonce(): Uint8Array {
    return sodium.randombytes_buf(24); // 192-bit nonce for XChaCha20
  }

  static encrypt(message: Uint8Array, key: Uint8Array): { ciphertext: Uint8Array; nonce: Uint8Array } {
    const nonce = this.generateNonce();
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      message,
      null,
      null,
      nonce,
      key
    );
    return { ciphertext, nonce };
  }

  static decrypt(ciphertext: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array {
    return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ciphertext,
      null,
      nonce,
      key
    );
  }
}

/**
 * Quantum-Safe Password Hashing using Argon2id
 * Provides protection against quantum-enabled brute force attacks
 */
export class QuantumPasswordHash {
  static hash(
    password: string, 
    salt?: Uint8Array,
    options = {
      opsLimit: sodium.crypto_pwhash_OPSLIMIT_SENSITIVE,
      memLimit: sodium.crypto_pwhash_MEMLIMIT_SENSITIVE
    }
  ): { hash: Uint8Array; salt: Uint8Array } {
    const actualSalt = salt || sodium.randombytes_buf(32);
    const hash = sodium.crypto_pwhash(
      64, // 512-bit output
      password,
      actualSalt,
      options.opsLimit,
      options.memLimit,
      sodium.crypto_pwhash_ALG_ARGON2ID
    );
    return { hash, salt: actualSalt };
  }

  static verify(password: string, hash: Uint8Array, salt: Uint8Array): boolean {
    try {
      const computed = sodium.crypto_pwhash(
        64,
        password,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_SENSITIVE,
        sodium.crypto_pwhash_MEMLIMIT_SENSITIVE,
        sodium.crypto_pwhash_ALG_ARGON2ID
      );
      return sodium.memcmp(hash, computed);
    } catch {
      return false;
    }
  }
}

/**
 * Quantum-Safe Random Number Generation
 * Uses cryptographically secure random sources
 */
export class QuantumRandom {
  static bytes(length: number): Uint8Array {
    return sodium.randombytes_buf(length);
  }

  static string(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    const bytes = this.bytes(length);
    return Array.from(bytes)
      .map(byte => charset[byte % charset.length])
      .join('');
  }

  static uuid(): string {
    const bytes = this.bytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }
}

/**
 * Quantum-Safe Key Derivation
 * Uses HKDF-SHA3-512 for quantum resistance
 */
export class QuantumKeyDerivation {
  static deriveKey(
    masterKey: Uint8Array,
    info: string,
    length: number = 32,
    salt?: Uint8Array
  ): Uint8Array {
    const actualSalt = salt || new Uint8Array(32); // Use zero salt if none provided
    
    // Use HKDF-SHA3-512 equivalent implementation
    const infoBytes = new TextEncoder().encode(info);
    const prk = sodium.crypto_auth(masterKey, actualSalt);
    
    // Expand using HMAC-SHA512
    const okm = new Uint8Array(length);
    let t = new Uint8Array(0);
    let counter = 1;
    let offset = 0;
    
    while (offset < length) {
      const hmacInput = new Uint8Array(t.length + infoBytes.length + 1);
      hmacInput.set(t, 0);
      hmacInput.set(infoBytes, t.length);
      hmacInput[hmacInput.length - 1] = counter;
      
      t = sodium.crypto_auth(hmacInput, prk);
      const copyLength = Math.min(t.length, length - offset);
      okm.set(t.slice(0, copyLength), offset);
      offset += copyLength;
      counter++;
    }
    
    return okm;
  }
}

/**
 * Quantum-Safe Session Token Generation
 * Generates cryptographically secure session tokens
 */
export class QuantumSessionTokens {
  static generateToken(length: number = 64): string {
    const bytes = QuantumRandom.bytes(length);
    return sodium.to_base64(bytes, sodium.base64_variants.URLSAFE_NO_PADDING);
  }

  static generateAPIKey(): string {
    const prefix = 'qsk_'; // Quantum-Safe Key prefix
    const keyBytes = QuantumRandom.bytes(32);
    const key = sodium.to_base64(keyBytes, sodium.base64_variants.URLSAFE_NO_PADDING);
    return prefix + key;
  }

  static hashToken(token: string): string {
    const hash = sodium.crypto_generichash(64, token);
    return sodium.to_hex(hash);
  }
}

/**
 * Quantum-Safe Multi-Factor Authentication
 * Implements TOTP with quantum-resistant backing
 */
export class QuantumMFA {
  static generateSecret(): string {
    const secretBytes = QuantumRandom.bytes(32);
    return sodium.to_base32(secretBytes);
  }

  static generateBackupCodes(count: number = 10): string[] {
    return Array.from({ length: count }, () => 
      QuantumRandom.string(8, '0123456789').match(/.{4}/g)?.join('-') || ''
    );
  }

  static generateTOTP(secret: string, window: number = 0): string {
    const time = Math.floor(Date.now() / 1000 / 30) + window;
    const timeBytes = new Uint8Array(8);
    new DataView(timeBytes.buffer).setBigUint64(0, BigInt(time), false);
    
    const secretBytes = sodium.from_base32(secret);
    const hmac = sodium.crypto_auth(timeBytes, secretBytes);
    
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;
    
    return code.toString().padStart(6, '0');
  }

  static verifyTOTP(token: string, secret: string, window: number = 1): boolean {
    for (let i = -window; i <= window; i++) {
      if (this.generateTOTP(secret, i) === token) {
        return true;
      }
    }
    return false;
  }
}