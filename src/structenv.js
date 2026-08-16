/*
 *  structenv.js
 *    A structured .env format
 */

const fs = require('fs');
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
  registerPlugin('log', logPlugin);
  registerPlugin('plugins', pluginsPlugin);
  registerPlugin('include', includePlugin);
  registerPlugin('shell', shellPlugin);
  registerPlugin('toml', tomlPlugin);
  registerPlugin('yaml', yamlPlugin);
}


function registerV2Plugins(){
  registerV1Plugins();
  // Future version 2 will register more plugins here
}


function registerPlugin(pluginName, pluginFunction) {
    plugins[pluginName] = pluginFunction;
}


function logPlugin(p) {
  console.log('Current Configuration:', p.env);
  return Promise.resolve(p);
}


function includePlugin(p, path) {
  const content = fs.readFileSync(path, 'utf-8');
  const includedConfig = fromDotenv(content);
  return Promise.resolve({ ...p, env: { ...p.env, ...includedConfig } });
}

function callPlugin(p) {
    // P is { env, argv, in }
    const pluginName = p.argv[0];
    if (plugins[pluginName]) {
        return plugins[pluginName](p);
    } else {
        console.log(`Unknown plugin: ${pluginName}`);
        // Ignore unknown plugin
        return Promise.resolve(p);
    }
}


function shellPlugin(p) {
    return new Promise((resolve, reject) => {
        const command = p.argv[0];
        const [cmd, ...args] = command.split(' ');

        const env = { ...process.env, ...p.env };

        const shellProcess = spawn(cmd, args, { env });

        let stdout = '';
        let stderr = '';

        const input = p.in || '';
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
                p.in = stdout;
                resolve(p);
            }
        });
    });
}


const toml = require('toml');

function tomlPlugin(p) {
  try {
    const parsedTOML = toml.parse(p.in);
    const updatedEnv = { ...p.env };
    // Flatten TOML object into dot notation
    const flattenObject = (obj, prefix = '') => {
      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattenObject(value, newKey);
        } else {
          updatedEnv[newKey] = value;
        }
      }
    };
    flattenObject(parsedTOML);
    return Promise.resolve({ ...p, env: updatedEnv, in: '' });
  } catch (error) {
    console.error('Error parsing TOML:', error.message);
    return Promise.reject(error);
  }
}


const yaml = require('js-yaml');

function yamlPlugin(p) {
  try {
    const parsedYAML = yaml.load(p.in);
    const updatedEnv = { ...p.env };
    // Flatten YAML object into dot notation
    const flattenObject = (obj, prefix = '') => {
      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattenObject(value, newKey);
        } else {
          updatedEnv[newKey] = value;
        }
      }
    };
    flattenObject(parsedYAML);
    return Promise.resolve({ ...p, env: updatedEnv, in: '' });
  } catch (error) {
    console.error('Error parsing YAML:', error.message);
    return Promise.reject(error);
  }
}


async function parse( options ){
  
    let result = { env: {}, in: options };

    if( options.env ){
      result.env = options.env;
    }
    if( options.in ){
      result.in = options;
    }

    result.argv = [ 'version', "1.0.0" ];
    await callPlugin( result );

    while (result.in) {
        const lines = result.in.split('\n');
        const firstLine = lines[0];
        result.in = lines.slice(1).join('\n');

        if (firstLine.startsWith("#plug ")) {
            const pluginData = firstLine.substring("#plug ".length).trim();
            const pluginArgv = pluginData.split(' ');
            result.argv = pluginArgv;
            await callPlugin( result );
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
  if (typeof encoded !== 'string') return encoded;
  let result = "";
  let i = 0;
  
  const reverseUnduni = {};
  for (const [char, code] of Object.entries(UNDUNI_MAP)) {
    reverseUnduni[code] = char;
  }
  
  const reverseReadable = {};
  for (const [char, codes] of Object.entries(READABLE_MAP)) {
    if (Array.isArray(codes)) {
      codes.forEach(c => reverseReadable[c] = char);
    } else {
      reverseReadable[codes] = char;
    }
  }

  while (i < encoded.length) {
    if (encoded[i] === "_") {
      if (encoded[i + 1] === "_") {
        result += "_";
        i += 2;
      } else {
        const nextUnderscore = encoded.indexOf("_", i + 1);
        if (nextUnderscore === -1) {
          result += "_";
          i++;
        } else {
          const encodedSeq = encoded.substring(i, nextUnderscore + 1);
          if (reverseUnduni[encodedSeq]) {
            result += reverseUnduni[encodedSeq];
            i = nextUnderscore + 1;
          } else if (reverseReadable[encodedSeq]) {
            result += reverseReadable[encodedSeq];
            i = nextUnderscore + 1;
          } else {
            const hex = encoded.substring(i + 1, nextUnderscore);
            if (/^[0-9A-Fa-f]{2,4}$/.test(hex)) {
              try {
                result += String.fromCodePoint(parseInt(hex, 16));
                i = nextUnderscore + 1;
              } catch (_) {
                result += "_";
                i++;
              }
            } else {
              result += "_";
              i++;
            }
          }
        }
      }
    } else {
      result += encoded[i];
      i++;
    }
  }
  return result;
}


function parseSingleUnderscores(rawKey) {
  const placeholders = [];
  let masked = rawKey.replace(/__|_40_|_23_|_24_|_25_|_5E_|_26_|_2A_|_28_|_29_|_5B_|_5D_|_7B_|_7D_|_3D_|_2B_|_3C_|_3E_|_3F_|_21_|_7C_|_5C_|_2F_|_2C_|_3B_|_3A_|_27_|_22_|_60_|_7E_|_20_|_s_|_o_|_a_|_h_|_d_|_p_|_c_|_n_|_m_|_l_|_r_|_lb_|_rb_|_lc_|_rc_|_e_|_plus_|_lt_|_gt_|_q_|_x_|_pipe_|_bs_|_fs_|_comma_|_semi_|_colon_|_sq_|_dq_|_bt_|_t_|_sp_/gi, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `\uE000${idx}\uE001`;
  });

  masked = masked.replace(/_[0-9A-Fa-f]{2,4}_/g, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `\uE000${idx}\uE001`;
  });

  const maskedParts = masked.split('_');
  return maskedParts.map(part => {
    const restored = part.replace(/\uE000(\d+)\uE001/g, (_, idx) => placeholders[parseInt(idx, 10)]);
    return fromUndUni(restored);
  });
}

function parseKeyParts(rawKey, objectPrefixes = null) {
  if (typeof rawKey !== 'string') return [];

  if (rawKey.includes(' ')) {
    throw new Error('POSTCONDITION: Keys must not contain spaces');
  }

  if (rawKey.includes('.')) {
    const rawParts = rawKey.split('.');
    if (rawParts.some(p => p === '')) {
      throw new Error('POSTCONDITION: Invalid key format');
    }
    return rawParts.map(p => fromUndUni(p));
  }

  const parts = parseSingleUnderscores(rawKey);
  if (parts.length <= 1) return parts;

  if (objectPrefixes) {
    let bestMatch = [fromUndUni(rawKey)];
    let currentPrefix = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentPrefix = currentPrefix ? `${currentPrefix}.${parts[i]}` : parts[i];
      if (objectPrefixes.has(currentPrefix)) {
        const remaining = parts.slice(i + 1).join('_');
        bestMatch = [...parts.slice(0, i + 1), remaining];
      }
    }
    return bestMatch;
  }

  return parts;
}

function inferType(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return value;

  if (value.includes('\u0000')) {
    throw new Error('POSTCONDITION: Invalid control character in value');
  }

  const trimmed = value.trim();

  if (trimmed === '[]') return [];
  if (trimmed === '{}') return {};

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch (_) {
      let inner = trimmed.slice(1, -1);
      return inner
        .replace(/\\r\\n/g, '\r\n')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"');
    }
  }

  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d*\.\d+(?:e-?\d+)?$/i.test(trimmed) || /^-?\d+e-?\d+$/i.test(trimmed)) return parseFloat(trimmed);

  const lower = trimmed.toLowerCase();
  if (['t', 'true', 'on', 'y', 'yes'].includes(lower)) return true;
  if (['f', 'false', 'off', 'n', 'no'].includes(lower)) return false;
  if (['n', 'nil', 'void', 'null', 'undefined', 'none', '-'].includes(lower)) return null;
  if (lower === 'empty' || value === '') return '';

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(trimmed)) return trimmed;

  return value;
}

function setValueInResult(result, rawKey, val, objectPrefixes = null) {
  const parts = parseKeyParts(rawKey, objectPrefixes);
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  const lastPart = parts[parts.length - 1];

  if (lastPart in current) {
    const existing = current[lastPart];
    if (Array.isArray(existing)) {
      existing.push(val);
    } else if (typeof existing === 'string' && typeof val === 'string' && (lastPart === 'TEXT' || lastPart === 'DESC')) {
      current[lastPart] = existing + '\n' + val;
    } else {
      current[lastPart] = [existing, val];
    }
  } else {
    current[lastPart] = val;
  }
}

// Convert .env style text to value
function fromDotenv(text) {
  if (typeof text !== 'string') {
    throw new Error('PRECONDITION: Input must be a string');
  }

  const lines = text.split('\n');
  const rawKeys = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx !== -1) {
      const k = line.substring(0, eqIdx).trim();
      if (k) rawKeys.push(k);
    }
  }

  // Pre-calculate object prefixes from shared keys
  const objectPrefixes = new Set();
  const counts = {};
  for (const k of rawKeys) {
    let parts = k.includes('.') ? k.split('.') : parseSingleUnderscores(k);
    for (let i = 1; i < parts.length; i++) {
      const prefix = parts.slice(0, i).join('.');
      counts[prefix] = (counts[prefix] || 0) + 1;
    }
  }
  for (const [prefix, count] of Object.entries(counts)) {
    if (count > 1) {
      objectPrefixes.add(prefix);
    }
  }

  const result = {};
  let currentMultilineKey = null;
  let multilineValues = [];

  for (let lIdx = 0; lIdx < lines.length; lIdx++) {
    const line = lines[lIdx];

    if (currentMultilineKey) {
      if (line.includes('=')) {
        const eqIdx = line.indexOf('=');
        const k = line.substring(0, eqIdx).trim();
        const v = line.substring(eqIdx + 1);
        if (k === currentMultilineKey) {
          if (v.startsWith('"') && v.endsWith('"')) {
            multilineValues.push(inferType(v));
          } else if (v.startsWith('"')) {
            multilineValues.push(v.slice(1));
          } else {
            multilineValues.push(v.replace(/[\r\n]+$/, ''));
          }
          continue;
        } else {
          const valToAssign = multilineValues.join('\n');
          setValueInResult(result, currentMultilineKey, inferType(valToAssign), objectPrefixes);
          currentMultilineKey = null;
          multilineValues = [];
        }
      } else {
        const cleanEnd = line.replace(/[ \t\r\n]+$/, '');
        if (cleanEnd.endsWith('"')) {
          const contentWithoutQuote = line.substring(0, line.lastIndexOf('"')).trim();
          multilineValues.push(contentWithoutQuote);
          const valToAssign = multilineValues.join('\n');
          setValueInResult(result, currentMultilineKey, valToAssign, objectPrefixes);
          currentMultilineKey = null;
          multilineValues = [];
        } else {
          multilineValues.push(line.replace(/^[ \t]+/, ''));
        }
        continue;
      }
    }

    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const rawKey = line.substring(0, eqIdx).trim();
    const rawVal = line.substring(eqIdx + 1);

    if (rawVal.trim().startsWith('"') && !rawVal.trim().endsWith('"')) {
      currentMultilineKey = rawKey;
      multilineValues = [rawVal.trim().slice(1)];
      continue;
    }

    const val = inferType(rawVal);
    setValueInResult(result, rawKey, val, objectPrefixes);
  }

  if (currentMultilineKey) {
    const valToAssign = multilineValues.join('\n');
    setValueInResult(result, currentMultilineKey, valToAssign, objectPrefixes);
  }

  return result;
}

// Convert value to .env style text
function toDotenv(value) {
  if (typeof value !== 'object' || value === null) {
    throw new Error('PRECONDITION: Input must be a non-null object');
  }

  const lines = [];
  
  function formatValue(val) {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'string') {
      if (val.includes('\n') || val.includes('\r') || /^-?\d+(\.\d+)?$/i.test(val) || ['true', 'false', 'null', 'undefined', 'on', 'off'].includes(val.toLowerCase()) || /\s/.test(val)) {
        return '"' + val.replace(/"/g, '\\"') + '"';
      }
      return val;
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
    return toUndUni(key);
  }

  function processObject(obj, prefix = '') {
    for (const [key, val] of Object.entries(obj)) {
      const escapedKey = escapeKey(key);
      const fullKey = prefix ? `${prefix}_${escapedKey}` : escapedKey;
      if (val === null || val === undefined) {
        lines.push(`${fullKey}=null`);
      } else if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
        processObject(val, fullKey);
      } else if (Array.isArray(val)) {
        val.forEach(item => {
          lines.push(`${fullKey}=${formatValue(item)}`);
        });
      } else {
        lines.push(`${fullKey}=${formatValue(val)}`);
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

function parseKey(key) {
  if (!key) return '';
  return fromUndUni(key);
}

function parseValue(val) {
  if (val === undefined || val === null) return null;
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (trimmed === '[]') return [];
  if (trimmed === '{}') return {};
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try { return JSON.parse(trimmed); } catch (_) { return trimmed.slice(1, -1); }
  }
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d*\.\d+(?:e-?\d+)?$/i.test(trimmed)) return parseFloat(trimmed);
  const lower = trimmed.toLowerCase();
  if (['t', 'true', 'on', 'y', 'yes'].includes(lower)) return true;
  if (['f', 'false', 'off', 'n', 'no'].includes(lower)) return false;
  if (['n', 'nil', 'void', 'null', 'undefined', 'none', '-'].includes(lower)) return null;
  if (lower === 'empty') return '';
  return trimmed;
}

function parseLine(line, result) {
  if (!line || typeof line !== 'string') return;
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  const rawKey = trimmed.substring(0, eqIdx).trim();
  const rawVal = trimmed.substring(eqIdx + 1).trim();
  if (!rawKey) return;

  const key = parseKey(rawKey);
  const val = parseValue(rawVal);
  if (result && result.env) {
    result.env[key] = val;
  }
}

module.exports = {
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
