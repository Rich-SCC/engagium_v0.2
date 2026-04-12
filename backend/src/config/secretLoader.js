const fs = require('fs');

const PLACEHOLDER_PATTERN = /CHANGE_ME|YOUR-|your-|example|engagium_password/i;

const readSecretFile = (filePath) => {
  const value = fs.readFileSync(filePath, 'utf8').trim();
  if (!value) {
    throw new Error(`Secret file is empty: ${filePath}`);
  }

  return value;
};

const getSecret = (name, options = {}) => {
  const { required = false, fallback } = options;
  const fileEnvKey = `${name}_FILE`;

  const secretFilePath = process.env[fileEnvKey]?.trim();
  if (secretFilePath) {
    return readSecretFile(secretFilePath);
  }

  const directValue = process.env[name]?.trim();
  if (directValue) {
    return directValue;
  }

  if (typeof fallback !== 'undefined') {
    return fallback;
  }

  if (required) {
    throw new Error(`Missing required secret: set ${name} or ${fileEnvKey}`);
  }

  return '';
};

const assertSecretNotPlaceholder = (name, value) => {
  if (!value || !value.trim()) {
    throw new Error(`Missing required secret value for ${name}`);
  }

  if (PLACEHOLDER_PATTERN.test(value)) {
    throw new Error(`${name} contains a placeholder value. Configure a real secret before startup.`);
  }
};

module.exports = {
  assertSecretNotPlaceholder,
  getSecret,
};
