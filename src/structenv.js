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

module.exports = StructEnv;
