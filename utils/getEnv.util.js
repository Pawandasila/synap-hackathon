
const getEnv = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined || value === "") {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return defaultValue;
  }
  return value;
};

export default getEnv;
