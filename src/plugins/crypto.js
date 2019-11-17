const ecies = require('eth-ecies');
const crypto = require('crypto');

export default {
  encryptECIES(publicKey, data) {
    let userPublicKey = new Buffer(publicKey, 'hex');
    let bufferData = new Buffer(data);

    let encryptedData = ecies.encrypt(userPublicKey, bufferData);

    return encryptedData.toString('base64')
  },

  decryptECIES(privateKey, encryptedData) {
    let userPrivateKey = new Buffer(privateKey, 'hex');
    let bufferEncryptedData = new Buffer(encryptedData, 'base64');

    let decryptedData = ecies.decrypt(userPrivateKey, bufferEncryptedData);

    return decryptedData.toString('utf8');
  },

  encryptAES(text, key) {
    const iv = crypto.randomBytes(16);
    //ISO/IEC 10116:2017
    let cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {iv: iv.toString('hex'), encryptedData: encrypted.toString('base64')};
  },

  decryptAES(text, key, init_vector) {
    let iv = Buffer.from(init_vector, 'hex');
    let encryptedText = Buffer.from(text, 'base64');
    let decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
  },
}