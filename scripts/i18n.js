/**
 * i18n (Internationalization) Module
 * Handles loading and applying translations
 */

let currentLocale = 'pt_br';
let translations = {};

/**
 * Load locales from JSON file
 */
export async function loadLocales() {
    try {
        const response = await fetch('./locales/locales.json');
        translations = await response.json();
        
        // Load saved locale preference
        const savedLocale = localStorage.getItem('selectedLocale');
        if (savedLocale && translations[savedLocale]) {
            currentLocale = savedLocale;
        }
        
        return true;
    } catch (error) {
        console.error('Failed to load locales:', error);
        return false;
    }
}

/**
 * Set the current locale
 * @param {string} locale - The locale code (e.g., 'pt_br', 'en_us')
 */
export function setLocale(locale) {
    if (translations[locale]) {
        currentLocale = locale;
        localStorage.setItem('selectedLocale', locale);
        applyTranslations();
    } else {
        console.warn(`Locale ${locale} not found`);
    }
}

/**
 * Get translation for a key
 * @param {string} key - The translation key
 * @param {Object} params - Optional parameters for string interpolation
 * @returns {string} - The translated text
 */
export function t(key, params = {}) {
    let text = translations[currentLocale]?.[key] || key;
    
    // Simple parameter interpolation
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
}

/**
 * Apply translations to all elements with data-i18n attribute
 */
export function applyTranslations() {
    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        // Apply to text content or specific attributes
        const attr = element.getAttribute('data-i18n-attr');
        if (attr) {
            element.setAttribute(attr, translation);
        } else {
            element.textContent = translation;
        }
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
    
    // Translate titles
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });
}

/**
 * Get current locale
 * @returns {string} - Current locale code
 */
export function getCurrentLocale() {
    return currentLocale;
}
