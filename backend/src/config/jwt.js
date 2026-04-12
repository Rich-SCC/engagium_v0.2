const { getSecret, assertSecretNotPlaceholder } = require('./secretLoader');

const isProduction = process.env.NODE_ENV === 'production';

const getJwtSecret = () => getSecret('JWT_SECRET', { required: true });

const getJwtRefreshSecret = () => {
  const accessSecret = getJwtSecret();
  const refreshSecret = getSecret('JWT_REFRESH_SECRET', { required: true });

  if (refreshSecret === accessSecret) {
    throw new Error('JWT_REFRESH_SECRET must be distinct from JWT_SECRET');
  }

  return refreshSecret;
};

const assertJwtSecretsConfigured = () => {
  const accessSecret = getJwtSecret();
  const refreshSecret = getJwtRefreshSecret();

  if (isProduction) {
    assertSecretNotPlaceholder('JWT_SECRET', accessSecret);
    assertSecretNotPlaceholder('JWT_REFRESH_SECRET', refreshSecret);
  }
};

module.exports = {
  assertJwtSecretsConfigured,
  getJwtRefreshSecret,
  getJwtSecret,
};