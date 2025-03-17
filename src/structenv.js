
// StructEnv parser implementation
class StructEnv {
  constructor() {
    this.data = {};
  }

  parse(input) {
    const lines = input.split('\n');
    for (const line of lines) {
      if (line.trim() === '' || line.startsWith('#')) continue;
      this.parseLine(line);
    }
    return this.data;
  }

  parseLine(line) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    if (!key || value === undefined) return;
    
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
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
      current[parts[i]] = current[parts[i]] || {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = this.parseValue(value);
  }

  handleUnderscoreNotation(key, value) {
    const parts = key.split('_');
    let current = this.data;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = current[parts[i]] || {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = this.parseValue(value);
  }

  parseValue(value) {
    if (value === 'void' || value === 'null' || value === 'undefined') return null;
    if (value === 'on' || value === 't' || value === 'true') return true;
    if (value === 'off' || value === 'f' || value === 'false') return false;
    if (!isNaN(value)) return Number(value);
    return value;
  }
}

module.exports = StructEnv;
