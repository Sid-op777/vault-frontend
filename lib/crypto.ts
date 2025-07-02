// src/lib/crypto.ts

// --- Helper Functions ---

function strToArr(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function arrToStr(arr: BufferSource): string {
  return new TextDecoder().decode(arr);
}

function arrToBase64(arr: ArrayBuffer): string {
    const standardBase64 = Buffer.from(arr).toString('base64');
    return standardBase64
    .replace(/\+/g, '-') // Replace + with -
    .replace(/\//g, '_') // Replace / with _
    .replace(/=/g, '');
//   return Buffer.from(arr).toString('base64url');
}

function base64ToArr(str: string): ArrayBuffer {
    let standardBase64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (standardBase64.length % 4) {
    standardBase64 += '=';
  }
  
  const buf = Buffer.from(standardBase64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
//   const buf = Buffer.from(str, 'base64url');
//   return new Uint8Array(buf).buffer;
}


// --- Constants ---

const AES_ALGORITHM = 'AES-GCM';
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

// --- Core Key Functions ---

export async function generateDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return arrToBase64(exportedKey);
}

export async function importKey(keyStr: string): Promise<CryptoKey> {
  const keyArr = base64ToArr(keyStr);
  return crypto.subtle.importKey(
    'raw',
    keyArr,
    { name: AES_ALGORITHM },
    true,
    ['encrypt', 'decrypt']
  );
}

// --- Password-less Flow ---

export async function encryptText(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv: iv },
    key,
    strToArr(plaintext)
  );

  const payload = {
    iv: arrToBase64(iv.buffer),
    ciphertext: arrToBase64(ciphertext),
  };
  
  return arrToBase64(new Uint8Array(strToArr(JSON.stringify(payload))).buffer);
}

export async function decryptText(base64Payload: string, key: CryptoKey): Promise<string> {
  const payloadStr = arrToStr(base64ToArr(base64Payload));
  const payload = JSON.parse(payloadStr);
  
  const iv = new Uint8Array(base64ToArr(payload.iv));
  const ciphertext = base64ToArr(payload.ciphertext);

  const decryptedArr = await crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv: iv },
    key,
    ciphertext
  );
  return arrToStr(decryptedArr);
}

// --- Password-Protected Flow ---

async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordArr = strToArr(password);
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordArr,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    importedKey,
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    true,
    ['wrapKey', 'unwrapKey']
  );
}

export async function encryptTextWithPassword(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const wrappingKey = await deriveKeyFromPassword(password, salt);
  const dataKey = await generateDataKey();
  
  const text_iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv: text_iv },
    dataKey,
    strToArr(plaintext)
  );
  
  const wrapped_iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const wrappedDataKey = await crypto.subtle.wrapKey(
    'raw',
    dataKey,
    wrappingKey,
    { name: AES_ALGORITHM, iv: wrapped_iv }
  );

  const payload = {
    salt: arrToBase64(salt.buffer),
    text_iv: arrToBase64(text_iv.buffer),
    wrapped_iv: arrToBase64(wrapped_iv.buffer),
    wrapped_data_key: arrToBase64(wrappedDataKey),
    ciphertext: arrToBase64(ciphertext),
  };
  
  return arrToBase64(new Uint8Array(strToArr(JSON.stringify(payload))).buffer);
}

export async function decryptTextWithPassword(base64Payload: string, password: string): Promise<string> {
  const payloadStr = arrToStr(base64ToArr(base64Payload));
  const payload = JSON.parse(payloadStr);

  const salt = new Uint8Array(base64ToArr(payload.salt));
  const text_iv = new Uint8Array(base64ToArr(payload.text_iv));
  const wrapped_iv = new Uint8Array(base64ToArr(payload.wrapped_iv));
  const wrappedDataKey = base64ToArr(payload.wrapped_data_key);
  const ciphertext = base64ToArr(payload.ciphertext);

  const wrappingKey = await deriveKeyFromPassword(password, salt);
  
  const dataKey = await crypto.subtle.unwrapKey(
    'raw',
    wrappedDataKey,
    wrappingKey,
    { name: AES_ALGORITHM, iv: wrapped_iv },
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  const decryptedArr = await crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv: text_iv },
    dataKey,
    ciphertext
  );

  return arrToStr(decryptedArr);
}