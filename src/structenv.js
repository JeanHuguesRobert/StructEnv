
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
      this.data['EMPTY_OBJECT'] = {};
      return;
    }
    if (key === 'EMPTY_ARRAY') {
      this.data['EMPTY_ARRAY'] = [];
      return;
    }
    
    const parts = key.split('_');
    let current = this.data;
    
    // Check if this key already exists as an array
    if (current[parts[0]] instanceof Array) {
      current[parts[0]].push(this.parseValue(value));
      return;
    }
    
    // If the key exists but isn't an array, convert it
    if (parts.length === 1 && current[parts[0]] !== undefined) {
      const oldValue = current[parts[0]];
      current[parts[0]] = [oldValue, this.parseValue(value)];
      return;
    }

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = current[parts[i]] || {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = this.parseValue(value);
  }

  parseValue(value) {
    if (value === '{}') return {};
    if (value === '[]') return [];
    if (value === 'void' || value === 'null' || value === 'undefined') return null;
    if (value === 'on' || value === 't' || value === 'true') return true;
    if (value === 'off' || value === 'f' || value === 'false') return false;
    if (!isNaN(value) && !value.startsWith('"')) return Number(value);
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
    return value;
  }
}

module.exports = StructEnv;
