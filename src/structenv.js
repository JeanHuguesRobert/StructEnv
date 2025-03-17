
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
      if (trimmedValue.endsWith('"')) {
        this.multilineValue.push(trimmedValue.slice(0, -1));
        this.processKeyValue(trimmedKey, this.multilineValue.join('\n'));
        this.currentMultiline = null;
        this.multilineValue = [];
      } else {
        this.multilineValue.push(trimmedValue);
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
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof current[parts[i]] === 'string') {
        current[parts[i]] = {};
      }
      current[parts[i]] = current[parts[i]] || {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = this.parseValue(value);
  }

  handleUnderscoreNotation(key, value) {
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
