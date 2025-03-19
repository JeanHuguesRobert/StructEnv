/*
 *  structenv.js
 *    A structured .env format
 */

const { spawn } = require('child_process');

// Plugin handlers
const plugins = {
    'version': function(result) {
        if( result.argv[1].startsWith( "1.") ){
          registerV1Plugins();
        }
        if( result.argv[1].startsWith( "2.") ){
          // Next version's plugins
          registerV2Plugins();
        }
        return Promise.resolve(result);
    }
};


function registerV1Plugins(){
  registerPlugin( 'plugins', pluginsPlugin );
  registerPlugin( 'include', includePlugin );
  registerPlugin( 'friendly', friendlyPlugin );
  registerPlugin( 'shell', shellPlugin );
  registerPlugin( 'eval', evalPlugin );
  registerPlugin( 'immediate', immediatePlugin );
  registerPlugin( 'strict', strictPlugin );
}


function registerV2Plugins(){
  registerV1Plugins();
  // Future version 2 will register more plugins here
}


function registerPlugin(pluginName, pluginFunction) {
    plugins[pluginName] = pluginFunction;
}


function callPlugin(pluginName, argument, input, result) {
    if (plugins[pluginName]) {
        return plugins[pluginName](argument, input, result);
    } else {
        console.log(`Unknown plugin: ${pluginName}`);
        return Promise.resolve(result);
    }
}


function shellPlugin(command, input, result) {
    return new Promise((resolve, reject) => {
        const [cmd, ...args] = command.split(' ');

        const env = { ...process.env, ...result.parsed };

        const shellProcess = spawn(cmd, args, { env });

        let stdout = '';
        let stderr = '';

        shellProcess.stdin.write(input);
        shellProcess.stdin.end();

        shellProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        shellProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        shellProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Command exited with code ${code}: ${stderr}`);
                reject(new Error(stderr));
            } else {
                console.log(`Command output: ${stdout}`);
                result.rest = stdout;
                resolve(result);
            }
        });
    });
}

async function parse( options ){
  
    let result = { env: {}, in: options };

    if( options.env ){
      result.env = options.env;
    }
    if( options.in ){
      result.in = options;
    }

    await callPlugin( [ 'version', "1.0.0" ], result );

    while (result.in) {
        const lines = result.in.split('\n');
        const firstLine = lines[0];
        result.in = lines.slice(1).join('\n');

        if (firstLine.startsWith("#plug ")) {
            const pluginData = firstLine.substring("#plug ".length).trim();
            const pluginArgv = pluginData.split(' ');
            await callPlugin( pluginArgv, result );
        } else {
            parseLine( firstLine, result );
        }
    }
}

// When stored in a .env style format, keys are encoded.
// UndUni encoding map for special characters
const UNDUNI_MAP = {
  '_': '__',
  '-': '_s_',
  '@': '_40_',
  '#': '_23_',
  '$': '_24_',
  '%': '_25_',
  '^': '_5E_',
  '&': '_26_',
  '*': '_2A_',
  '(': '_28_',
  ')': '_29_',
  '[': '_5B_',
  ']': '_5D_',
  '{': '_7B_',
  '}': '_7D_',
  '=': '_3D_',
  '+': '_2B_',
  '<': '_3C_',
  '>': '_3E_',
  '?': '_3F_',
  '!': '_21_',
  '|': '_7C_',
  '\\': '_5C_',
  '/': '_2F_',
  ',': '_2C_',
  ';': '_3B_',
  ':': '_3A_',
  '\'': '_27_',
  '"': '_22_',
  '`': '_60_',
  '~': '_7E_',
  ' ': '_20_'
};

// Readable alternatives for common special characters
const READABLE_MAP = {
  '-': ['_s_', '_o_'],
  '@': '_a_',
  '#': '_h_',
  '$': '_d_',
  '%': '_p_',
  '^': '_c_',
  '&': '_n_',
  '*': '_m_',
  '(': '_l_',
  ')': '_r_',
  '[': '_lb_',
  ']': '_rb_',
  '{': '_lc_',
  '}': '_rc_',
  '=': '_e_',
  '+': '_plus_',
  '<': '_lt_',
  '>': '_gt_',
  '?': '_q_',
  '!': '_x_',
  '|': '_pipe_',
  '\\': '_bs_',
  '/': '_fs_',
  ',': '_comma_',
  ';': '_semi_',
  ':': '_colon_',
  '\'': '_sq_',
  '"': '_dq_',
  '`': '_bt_',
  '~': '_t_',
  ' ': '_sp_'
};

function toUndUni(text) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[0-9a-zA-Z.]/.test(char)) {
      result += char;
    } else if (UNDUNI_MAP[char]) {
      result += UNDUNI_MAP[char];
    } else {
      const code = text.codePointAt(i);
      const hex = code.toString(16).toUpperCase();
      result += `_${hex}_`;
      if (code > 0xFFFF) i++;
    }
  }
  return result;
}

function fromUndUni(encoded) {
  let result = "";
  let i = 0;
  
  // Create reverse maps for decoding
  const reverseUnduni = Object.entries(UNDUNI_MAP).reduce((acc, [char, code]) => {
    acc[code] = char;
    return acc;
  }, {});
  
  const reverseReadable = Object.entries(READABLE_MAP).reduce((acc, [char, codes]) => {
    if (Array.isArray(codes)) {
      codes.forEach(code => acc[code] = char);
    } else {
      acc[codes] = char;
    }
    return acc;
  }, {});

  while (i < encoded.length) {
    if (encoded[i] === "_") {
      if (encoded[i + 1] === "_") {
        result += "_";
        i += 2;
      } else {
        // Look for the next underscore
        const nextUnderscore = encoded.indexOf("_", i + 1);
        if (nextUnderscore === -1) {
          throw new Error("Invalid UndUni format: missing closing underscore");
        }

        // Extract the encoded sequence
        const encodedSeq = encoded.substring(i, nextUnderscore + 1);
        
        // Try to decode using the maps
        if (reverseUnduni[encodedSeq]) {
          result += reverseUnduni[encodedSeq];
        } else if (reverseReadable[encodedSeq]) {
          result += reverseReadable[encodedSeq];
        } else {
          // Try to decode as hex
          try {
            const hex = encoded.substring(i + 1, nextUnderscore);
            result += String.fromCodePoint(parseInt(hex, 16));
          } catch (e) {
            throw new Error(`Invalid UndUni sequence: ${encodedSeq}`);
          }
        }
        i = nextUnderscore + 1;
      }
    } else {
      result += encoded[i];
      i++;
    }
  }
  return result;
}


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
  const hasDash = /[^_os-]-/.test(text);

  function inferType(value) {
    if (value === '[]') return [];
    if (value === '{}') return {};
    if (value.startsWith('"') && value.endsWith('"')) {
      return JSON.parse(value);
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
      let processed = p;
      // Handle explicit dash escapes first
      processed = processed.replace('___', '-').replace('_o_', '-');
      // Then handle general separators
      processed = processed.replace(`${separator}${separator}`, separator)
                         .replace(`${separator}s${separator}`, separator);
      return processed;
    });

    let lastPart = escapedParts[escapedParts.length - 1];
    let current = result;
    
    for (let i = 0; i < escapedParts.length - 1; i++) {
      const part = escapedParts[i];
      const nextPart = escapedParts[i + 1];
      
      if (i === escapedParts.length - 2 && current[part] === nextPart) {
        current[part] = {};
      } else if (!(part in current)) {
        current[part] = {};
      } else if (typeof current[part] !== 'object' || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }

    const typedValue = inferType(valueParts.join('='));
    if (lastPart in current && Array.isArray(current[lastPart])) {
      current[lastPart].push(typedValue);
    } else if (lastPart in current && !(current[lastPart] instanceof Object)) {
      current[lastPart] = [current[lastPart], typedValue];
    } else {
      current[lastPart] = typedValue;
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

  function escapeKey(key) {
    return key.replace(/-/g, '_o_');
  }

  function processObject(obj, prefix = '') {
    for (const [key, val] of Object.entries(obj)) {
      const escapedKey = escapeKey(key);
      if (val === null || val === undefined) {
        lines.push(`${prefix}${escapedKey}=null`);
      } else if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
        processObject(val, prefix ? `${prefix}${escapedKey}_` : `${escapedKey}_`);
      } else if (Array.isArray(val)) {
        val.forEach(item => {
          lines.push(`${prefix}${escapedKey}=${formatValue(item)}`);
        });
      } else {
        lines.push(`${prefix}${escapedKey}=${formatValue(val)}`);
      }
    }
  }

  processObject(value);
  return lines.join('\n');
}

function flattenStruct(obj, separator = "_") {
  const result = {};
  
  function flatten(current, prefix = "") {
    for (const [key, value] of Object.entries(current)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        flatten(value, newKey);
      } else {
        result[newKey] = value;
      }
    }
  }
  
  flatten(obj);
  return result;
}

function unflattenStruct(obj, separator = "_") {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split(separator);
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  return result;
}

const package = {
  fromDotenv,
  toDotenv,
  fromUndUni,
  toUndUni,
  flattenStruct,
  unflattenStruct,
  registerPlugin,
  parse,
  parseLine,
  parseKey,
  parseValue
};

module.exports = package;
