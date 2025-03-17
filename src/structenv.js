
// StructEnv parser implementation
class StructEnv {
  constructor() {
    this.data = {};
    this.currentMultiline = null;
    this.multilineValue = [];
  }

  parse(input) {
    const lines = input.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === '' || trimmedLine.startsWith('#')) continue;
      this.parseLine(trimmedLine);
    }
    return this.data;
  }

  parseLine(line) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    if (!key || value === undefined) return;
    
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();

    // Handle multiline strings
    if (trimmedValue.startsWith('"') && !trimmedValue.endsWith('"')) {
      this.currentMultiline = trimmedKey;
      this.multilineValue = [trimmedValue.slice(1)];
      return;
    } else if (this.currentMultiline === trimmedKey) {
      const isLastLine = trimmedValue.endsWith('"');
      const value = isLastLine ? trimmedValue.slice(0, -1) : trimmedValue;
      this.multilineValue.push(value);
      
      if (isLastLine) {
        this.data[trimmedKey] = this.multilineValue.join('\n');
        this.currentMultiline = null;
        this.multilineValue = [];
      }
      return;
    }

    this.processKeyValue(trimmedKey, trimmedValue);
  }

  processKeyValue(key, value) {
    if (key.includes('.')) {
      this.handleDotNotation(key, value);
    } else {
      this.handleUnderscoreNotation(key, value);
    }
  }

  handleDotNotation(key, value) {
    const parts = key.split('.');
    let current = this.data;
    const lastPart = parts[parts.length - 1];
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      // Don't overwrite existing objects with primitive values
      if (current[part] && typeof current[part] === 'object') {
        current = current[part];
      } else {
        current[part] = {};
        current = current[part];
      }
    }
    
    if (value === 'main') return; // Skip assignments of 'main'
    current[lastPart] = this.parseValue(value);
  }

  handleUnderscoreNotation(key, value) {
    if (key === 'EMPTY_OBJECT') {
      this.data.EMPTY_OBJECT = {};
      return;
    }
    if (key === 'EMPTY_ARRAY') {
      this.data.EMPTY_ARRAY = [];
      return;
    }
    
    const parts = key.split('_');
    let current = this.data;
    
    // Handle array creation by key repetition
    if (parts.length === 1) {
      if (current[key] !== undefined) {
        if (!Array.isArray(current[key])) {
          current[key] = [current[key]];
        }
        current[key].push(this.parseValue(value));
      } else {
        current[key] = this.parseValue(value);
      }
      return;
    }

    // Handle nested objects
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = current[parts[i]] || {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = this.parseValue(value);
  }

  parseValue(value) {
    // Handle comments
    const commentIndex = value.indexOf('#');
    if (commentIndex !== -1) {
      throw new Error('End-of-line comments are not supported');
    }

    if (value === '{}') return {};
    if (value === '[]') return [];
    if (value === 'void' || value === 'null' || value === 'undefined') return null;
    if (value === 'on' || value === 't' || value === 'true') return true;
    if (value === 'off' || value === 'f' || value === 'false') return false;
    
    // Try parsing ISO 8601 date
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    if (isoDateRegex.test(value)) {
      return new Date(value);
    }
    
    if (!isNaN(value) && !value.startsWith('"')) return Number(value);
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
    return value;
  }

  unescapeKey(key) {
    return key
      .replace(/__/g, '_')
      .replace(/_s_/g, '_')
      .replace(/___/g, '-')
      .replace(/_o_/g, '-');
  }

  escapeKey(key) {
    if (key.includes('-')) {
      return key.replace(/-/g, '_o_');
    }
    return key.replace(/_/g, '_s_');
  }

  static toStructEnv(json, prefix = '') {
    let result = [];
    
    function convertValue(value) {
      if (value === null) return 'null';
      if (typeof value === 'boolean') return value ? 'on' : 'off';
      if (typeof value === 'string' && /[\s"']/.test(value)) return `"${value}"`;
      return value;
    }

    function processObject(obj, currentPrefix) {
      for (const [key, value] of Object.entries(obj)) {
        const newPrefix = currentPrefix ? `${currentPrefix}_${key}` : key;
        
        if (Array.isArray(value)) {
          if (value.length === 0) {
            result.push(`${newPrefix}=[]`);
          } else {
            value.forEach(item => {
              result.push(`${newPrefix}=${convertValue(item)}`);
            });
          }
        } else if (value !== null && typeof value === 'object') {
          if (Object.keys(value).length === 0) {
            result.push(`${newPrefix}={}`);
          } else {
            processObject(value, newPrefix);
          }
        } else {
          result.push(`${newPrefix}=${convertValue(value)}`);
        }
      }
    }

    processObject(json, prefix);
    return result.join('\n');
  }
}

module.exports = StructEnv;
