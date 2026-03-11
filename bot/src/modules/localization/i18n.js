const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

const locales = {};
const FALLBACK_LANG = 'en';
const localesDir = path.join(__dirname, '../../../locales');

function loadLocales() {
  if (!fs.existsSync(localesDir)) {
    logger.warn('i18n', 'No locales directory found');
    return;
  }

  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const lang = file.replace('.json', '');
    try {
      const data = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf-8'));
      locales[lang] = data;
      logger.info('i18n', `Loaded locale: ${lang} (${Object.keys(data).length} keys)`);
    } catch (err) {
      logger.error('i18n', `Failed to load locale ${file}: ${err.message}`);
    }
  }
}

function t(lang, key, vars = {}) {
  let value = getNestedKey(locales[lang], key);

  if (value === undefined && lang !== FALLBACK_LANG) {
    value = getNestedKey(locales[FALLBACK_LANG], key);
  }

  if (value === undefined) return key;

  return value.replace(/\{(\w+)\}/g, (match, varName) => {
    return vars[varName] !== undefined ? vars[varName] : match;
  });
}

function getNestedKey(obj, key) {
  if (!obj) return undefined;
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (current[part] === undefined) return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function getAvailableLanguages() {
  return Object.keys(locales);
}

module.exports = { loadLocales, t, getAvailableLanguages };
