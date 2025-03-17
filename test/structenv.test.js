
const assert = require('assert');
const StructEnv = require('../src/structenv');

describe('StructEnv', () => {
  let parser;

  beforeEach(() => {
    parser = new StructEnv();
  });

  it('should parse dot notation', () => {
    const input = 'SERVER.CONFIG.HOST=localhost';
    const result = parser.parse(input);
    assert.deepStrictEqual(result, {
      SERVER: {
        CONFIG: {
          HOST: 'localhost'
        }
      }
    });
  });

  it('should parse underscore notation', () => {
    const input = 'SERVER_CONFIG_PORT=3000';
    const result = parser.parse(input);
    assert.deepStrictEqual(result, {
      SERVER: {
        CONFIG: {
          PORT: 3000
        }
      }
    });
  });
});
