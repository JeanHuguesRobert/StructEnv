
// Convert .env style text to value
function fromDotenv(text) {
  // Preconditions
  if (typeof text !== 'string') {
    throw new Error('PRECONDITION: Input must be a string');
  }
  
  // Invariants
  const invariantCheck = () => {
    if (!(result instanceof Object)) {
      throw new Error('INVARIANT: Result must be an object');
    }
    if (currentMultilineKey !== null && !Array.isArray(multilineValues)) {
      throw new Error('INVARIANT: Multiline values must be an array when processing multiline');
    }
  };

  const result = {};
  const lines = text.split('\n');
  let currentMultilineKey = null;
  let multilineValues = [];
  const useDots = lines.some(line => {
    if (!/^\s*[^\s=]+=/.test(line)) return false;
    const trimmedLine = line.replace(/^\s+/, '');
    if (!trimmedLine || trimmedLine.startsWith('#')) return false;
    const key = trimmedLine.split('=')[0];
    return key.includes('.');
  });
  const hasDash = /[^_o-]-/.test(text);

  function inferType(value) {
    if (value === '[]') return [];
    if (value === '{}') return {};
    if (value.startsWith('"') && value.endsWith('"')) {
      try {
        return JSON.parse(value);
      } catch {
        return value.slice(1, -1);
      }
    }
    if (/^-?\d+$/.test(value)) return parseInt(value);
    if (/^-?\d*\.\d+(?:e-?\d+)?$/.test(value)) return parseFloat(value);
    const lowerValue = value.toLowerCase();
    if (['t', 'true', 'on', 'y', 'yes'].includes(lowerValue)) return true;
    if (['f', 'false', 'off', 'n', 'no'].includes(lowerValue)) return false;
    if (['n', 'nil', 'void', 'null', 'undefined', 'none', '-'].includes(lowerValue)) return null;
    if (lowerValue === 'empty' || value === '') return '';
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) return value;
    return value;
  }

  for (const line of lines) {
    if (!/^\s*[^\s=]+=/.test(line)) continue;
    const trimmedLine = line.replace(/^\s+/, '');
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    const [key, ...valueParts] = trimmedLine.split('=');
    if (!key || key.includes(' ')) continue;
    const value = valueParts.join('=');

    if (currentMultilineKey) {
      if (key === currentMultilineKey) {
        if (value.startsWith('"') && value.endsWith('"')) {
          multilineValues.push(JSON.parse(value));
        } else if (!value.startsWith('"')) {
          multilineValues.push(value);
        } else {
          multilineValues.push(value.slice(1));
        }
        continue;
      } else {
        result[currentMultilineKey] = multilineValues.join('\n');
        currentMultilineKey = null;
        multilineValues = [];
      }
    }

    if (value.startsWith('"') && !value.endsWith('"')) {
      currentMultilineKey = key;
      multilineValues = [value.slice(1)];
      continue;
    }

    const parts = useDots ? key.split('.') : key.split('_');
    const separator = useDots ? '.' : '_';
    const escapedParts = parts.map(p => {
      if (hasDash) return p;
      return p.replace(`${separator}${separator}`, separator)
              .replace(`${separator}s${separator}`, separator)
              .replace('___', '-')
              .replace('_o_', '-');
    });

    let current = result;
    for (let i = 0; i < escapedParts.length - 1; i++) {
      const part = escapedParts[i];
      if (!(part in current)) current[part] = {};
      current = current[part];
    }

    const lastKey = escapedParts[escapedParts.length - 1];
    const typedValue = inferType(value);

    if (lastKey in current && Array.isArray(current[lastKey])) {
      current[lastKey].push(typedValue);
    } else if (lastKey in current && !(current[lastKey] instanceof Object)) {
      current[lastKey] = [current[lastKey], typedValue];
    } else {
      current[lastKey] = typedValue;
    }
  }

  if (currentMultilineKey) {
    result[currentMultilineKey] = multilineValues.join('\n');
  }

  // Postconditions
  if (typeof result !== 'object' || result === null) {
    throw new Error('POSTCONDITION: Result must be a non-null object');
  }
  
  // Verify no invalid nesting occurred
  const verifyNesting = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (key.includes(' ')) {
        throw new Error('POSTCONDITION: Keys must not contain spaces');
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        verifyNesting(value);
      }
    }
  };
  verifyNesting(result);
  
  return result;
}

// Convert value to .env style text
function toDotenv(value) {
  // Preconditions
  if (typeof value !== 'object' || value === null) {
    throw new Error('PRECONDITION: Input must be a non-null object');
  }
  
  // Invariants
  const invariantCheck = () => {
    if (!Array.isArray(lines)) {
      throw new Error('INVARIANT: Lines must be an array');
    }
    if (lines.some(line => typeof line !== 'string')) {
      throw new Error('INVARIANT: All lines must be strings');
    }
  };

  const lines = [];
  
  function formatValue(val) {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'string') {
      if (val.includes('\n')) {
        return '"' + val.replace(/\n/g, '\n') + '"';
      }
      return '"' + val + '"';
    }
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      return val;
    }
    if (typeof val === 'object' && Object.keys(val).length === 0) return '{}';
    return String(val);
  }

  function processObject(obj, prefix = '') {
    for (const [key, val] of Object.entries(obj)) {
      if (val === null || val === undefined) {
        lines.push(`${prefix}${key}=null`);
      } else if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
        processObject(val, prefix ? `${prefix}${key}_` : `${key}_`);
      } else if (Array.isArray(val)) {
        val.forEach(item => {
          lines.push(`${prefix}${key}=${formatValue(item)}`);
        });
      } else {
        lines.push(`${prefix}${key}=${formatValue(val)}`);
      }
    }
  }

  processObject(value);
  return lines.join('\n');
}

module.exports = { fromDotenv, toDotenv };
