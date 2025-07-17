import CryptoJS from 'crypto-js';

// Use import.meta.env for Vite
const SECRET_KEY = import.meta.env.VITE_CRYPTO_SECRET || '31XQvPlwLC';

export const encryptData = (data) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

export const decryptData = (encryptedData) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

export const encryptFile = (fileArrayBuffer) => {
  try {
    const wordArray = CryptoJS.lib.WordArray.create(fileArrayBuffer);
    const encrypted = CryptoJS.AES.encrypt(wordArray, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('File encryption error:', error);
    return null;
  }
};

export const decryptFile = (encryptedFileData) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedFileData, SECRET_KEY);
    const typedArray = new Uint8Array(decrypted.sigBytes);
    
    for (let i = 0; i < decrypted.sigBytes; i++) {
      typedArray[i] = (decrypted.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    
    return typedArray.buffer;
  } catch (error) {
    console.error('File decryption error:', error);
    return null;
  }
};

export const generateTransferId = () => {
  return CryptoJS.lib.WordArray.random(16).toString();
};

export const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};

export const generateSecureKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};
