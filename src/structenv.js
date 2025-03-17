// StructEnv parser implementation
class StructEnv {
  constructor() {
    this.data = {};
    this.currentMultiline = null;
    this.multilineValue = [];
    this.shouldEscapeDashes = true; // Flag for dashes
    this.shouldEscapeDots = true; // Flag for dots
  }
  parse(input) {
    const lines = input.split("\n");

    // First Pass: Check for dashes or dots in keys
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === "" || trimmedLine.startsWith("#")) continue;
      const key = trimmedLine.split("=")[0].trim();
      if (key.includes("-")) {
        this.shouldEscapeDashes = false; // Set flag to false if dash is found
      }
      if (key.includes(".")) {
        this.shouldEscapeDots = false; // Set flag to false if dot is found
      }
    }
    // Second Pass: Process the lines
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === "" || trimmedLine.startsWith("#")) continue;
      this.parseLine(trimmedLine);
    }
    return this.data;
  }
  parseLine(line) {
    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=");
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
      const multilineValue = isLastLine
        ? trimmedValue.slice(0, -1)
        : trimmedValue;
      this.multilineValue.push(multilineValue);

      if (isLastLine) {
        this.data[this.currentMultiline] = this.multilineValue.join("\n");
        this.currentMultiline = null;
        this.multilineValue = [];
      }
      return;
    }
    this.processKeyValue(trimmedKey, trimmedValue);
  }
  processKeyValue(key, value) {
    const processedKey = this.shouldEscapeDashes ? this.escapeKey(key) : key;
    const keys = processedKey.split(".");

    let current = this.data;
    // Create nested structure for keys with dot notation
    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        current[k] = this.parseValue(value);
      } else {
        // Create nested object if needed
        current[k] = current[k] || {};
        current = current[k];
      }
    });
  }
  parseValue(value) {
    // Handle comments
    const commentIndex = value.indexOf("#");
    if (commentIndex !== -1) {
      throw new Error("End-of-line comments are not supported");
    }
    // Detect empty structures based on the value, not on the key name
    if (value === "{}" || value.trim() === "") return {};
    if (value === "[]" || value.trim() === "") return [];
    if (value === "void" || value === "null" || value === "undefined")
      return null;
    if (value === "on" || value === "t" || value === "true") return true;
    if (value === "off" || value === "f" || value === "false") return false;
    // Try parsing ISO 8601 date
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    if (isoDateRegex.test(value)) {
      return new Date(value);
    }
    if (!isNaN(value) && !value.startsWith('"')) return Number(value);
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
    return value;
  }
  escapeKey(key) {
    if (this.shouldEscapeDashes) {
      return key.replace(/-/g, "_o_");
    }
    if( !this.shouldEscapeDots) {
      return key.replace(/_/g, "_s_");
    }
  }
  static toStructEnv(json, prefix = "") {
    let result = [];

    function convertValue(value) {
      if (value === null) return "null";
      if (typeof value === "boolean") return value ? "on" : "off";
      if (typeof value === "string" && /[\s"']/.test(value))
        return `"${value}"`;
      return value;
    }

    function processObject(obj, currentPrefix) {
      for (const [key, value] of Object.entries(obj)) {
        const newPrefix = currentPrefix ? `${currentPrefix}_${key}` : key;

        if (Array.isArray(value)) {
          if (value.length === 0) {
            result.push(`${newPrefix}=[]`);
          } else {
            value.forEach((item) => {
              result.push(`${newPrefix}=${convertValue(item)}`);
            });
          }
        } else if (value !== null && typeof value === "object") {
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
    return result.join("\n");
  }
}

function env_to_json(env_str) {
  const result = {};
  const lines = env_str.split('\n');
  let current_multiline_key = null;
  let multiline_values = [];
  const useDots = env_str.includes('.');
  const hasDash = env_str.match(/[^_o]-/);

  function infer_type(value) {
      if (value === '[]') return [];
      if (value === '{}') return {};
      if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
          return value.replace(/\\([\\bfnrt"])/g, (match, p1) => {
              return { '\\': '\\', 'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t', '"': '"' }[p1];
          });
      }
      if (/^\d+$/.test(value)) return parseInt(value);
      if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
      const lowerValue = value.toLowerCase(); // Case-insensitive
      if (['t', 'true', 'on', 'y', 'yes'].includes(lowerValue)) return true;
      if (['f', 'false', 'off', 'n', 'no'].includes(lowerValue)) return false;
      if (['n', 'nil', 'void', 'null', 'undefined', 'none', '-'].includes(lowerValue)) return null;
      if (['empty'].includes(lowerValue) || value === '') return '';
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) return value;
      return value;
  }

  for (let line of lines) {
      if (!line.match(/^\s*[^\s=]+=/)) continue;
      line = line.trimLeft();
      if (!line || line.startsWith('#')) continue;

      const firstEqual = line.indexOf('=');
      if (firstEqual === -1 || line[firstEqual - 1] === ' ') continue;
      const key = line.slice(0, firstEqual);
      const value = line.slice(firstEqual + 1);

      if (current_multiline_key) {
          if (key === current_multiline_key && !value.startsWith('"')) {
              multiline_values.push(value);
              continue;
          } else {
              result[current_multiline_key] = multiline_values.join('\n');
              current_multiline_key = null;
              multiline_values = [];
          }
      }

      if (value.startsWith('"') && !value.endsWith('"')) {
          current_multiline_key = key;
          multiline_values = [value.slice(1)];
          continue;
      }

      const parts = useDots ? key.split('.') : key.split('_');
      const separator = useDots ? '.' : '_';
      const escapedParts = parts.map(p => {
          if (hasDash) return p;
          return p.replace(/___/g, '-').replace(/_o_/g, '-');
      });

      let current = result;
      for (let i = 0; i < escapedParts.length - 1; i++) {
          const part = escapedParts[i];
          if (!(part in current)) current[part] = {};
          current = current[part];
      }

      const last_key = escapedParts[escapedParts.length - 1];
      const typed_value = infer_type(value);

      if (last_key in current && Array.isArray(current[last_key])) {
          current[last_key].push(typed_value);
      } else if (last_key in current && typeof current[last_key] !== 'object') {
          current[last_key] = [current[last_key], typed_value];
      } else {
          current[last_key] = typed_value;
      }
  }

  if (current_multiline_key) {
      result[current_multiline_key] = multiline_values.join('\n');
  }

  return JSON.stringify(result, null, 2);
}

function json_to_env(json_str) {
  const data = JSON.parse(json_str);
  const lines = [];
  const useDots = JSON.stringify(data).includes('.');
  const hasDash = JSON.stringify(data).includes('-');

  function escape_key(key) {
      if (hasDash) return key;
      if (useDots) {
          return key.replace(/\./g, '_s_').replace(/-/g, '_o_');
      }
      return key.replace(/_/g, '__').replace(/-/g, '___');
  }

  function value_to_str(value) {
      if (value === true) return 'true';
      if (value === false) return 'false';
      if (value === null) return 'null';
      if (value === '') return '""';
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'string') {
          if (value.includes('\n') || /[^\x20-\x7E]/.test(value) || value === '[]' || value === '{}') {
              return `"${value.replace(/([\\"])/g, '\\$1')}"`;
          }
          return value;
      }
      if (Array.isArray(value)) return value.length === 0 ? '[]' : null;
      if (typeof value === 'object') return Object.keys(value).length === 0 ? '{}' : null;
      return String(value);
  }

  function process_node(obj, prefix = '') {
      if (typeof obj === 'object' && obj !== null) {
          if (Array.isArray(obj)) {
              if (obj.length === 0) {
                  lines.push(`${prefix}=[]`);
              } else {
                  for (const item of obj) {
                      const str_value = value_to_str(item);
                      if (str_value !== null) {
                          lines.push(`${prefix}=${str_value}`);
                      }
                  }
              }
          } else {
              for (const [key, value] of Object.entries(obj)) {
                  const full_key = prefix ? `${prefix}${escape_key(key)}` : escape_key(key);
                  const str_value = value_to_str(value);
                  
                  if (str_value !== null) {
                      lines.push(`${full_key}=${str_value}`);
                  }
                  if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
                      process_node(value, `${full_key}${useDots ? '.' : '_'}`);
                  }
              }
          }
      }
  }

  process_node(data);
  return lines.join('\n');
}

module.exports = { StructEnv, env_to_json, json_to_env };
