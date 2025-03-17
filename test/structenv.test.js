
const assert = require('assert');
const { fromDotenv, toDotenv } = require('../src/structenv');

describe('StructEnv', () => {


  it('should parse basic app configuration', () => {
    const input = `
      APP_NAME=My Application
      APP_TEMPERATURE=0.7
      APP_VERSION=1.0
      APP_TOOL_NAME=best
      APP_TOOL_VERSION=1.0.0
    `;
    const result = fromDotenv(input);
    assert.deepStrictEqual(result, {
      APP: {
        NAME: "My Application",
        TEMPERATURE: 0.7,
        VERSION: 1.0,
        TOOL: {
          NAME: "best",
          VERSION: "1.0.0"
        }
      }
    });
  });

  it('should parse server configuration with dot notation', () => {
    const input = `
      SERVER.CONFIG.main.HOST=api.example.com
      SERVER.CONFIG.main.PORT=8080
      SERVER.CONFIG=main
      SERVER.CONFIG.STATUS=off
    `;
    const result = fromDotenv(input);
    assert.deepStrictEqual(result, {
      SERVER: {
        CONFIG: {
          main: {
            HOST: "api.example.com",
            PORT: 8080
          },
          STATUS: false
        }
      }
    });
  });

  it('should parse arrays', () => {
    const input = `
      ITEMS=item1
      ITEMS=item2
    `;
    const result = fromDotenv(input);
    assert.deepStrictEqual(result, {
      ITEMS: ["item1", "item2"]
    });
  });

  it('should parse empty objects and arrays', () => {
    const input = `
      EMPTY__OBJECT={}
      EMPTY__ARRAY=[]
    `;
    const result = fromDotenv(input);
    assert.deepStrictEqual(result, {
      EMPTY_OBJECT: {},
      EMPTY_ARRAY: []
    });
  });

  it('should parse multiline strings', () => {
    const input = `
      TEXT=This is a multiline
      TEXT=test
      TEXT="\b!"
    `;
    const result = fromDotenv(input);
    assert.deepStrictEqual(result, {
      TEXT: "This is a multiline\ntest\n\b!"
    });
  });

  it('should handle special values', () => {
    const input = `
      NULL=null
      VOID=void
      UNDEFINED=undefined
      TRUE=true
      FALSE=false
      ON=on
      OFF=off
    `;
    const result = fromDotenv(input);
    assert.deepStrictEqual(result, {
      NULL: null,
      VOID: null,
      UNDEFINED: null,
      TRUE: true,
      FALSE: false,
      ON: true,
      OFF: false
    });
  });

  it('should handle quoted multiline strings', () => {
    const input = `
      DESC="Line 1
      Line 2
      Line 3"
      NAME=test
    `;
    const result = fromDotenv(input);
    assert.deepStrictEqual(result, {
      DESC: 'Line 1\nLine 2\nLine 3',
      NAME: 'test'
    });
  });

  it('should handle error conditions', () => {
    assert.throws(() => fromDotenv(null), /PRECONDITION: Input must be a string/);
    assert.throws(() => fromDotenv('KEY SPACE=value'), /POSTCONDITION: Keys must not contain spaces/);
    assert.throws(() => fromDotenv('INVALID.=value'), /POSTCONDITION: Invalid key format/);
    assert.throws(() => fromDotenv('KEY=\u0000'), /POSTCONDITION: Invalid control character in value/);
  });

  it('should handle complex nested structures with mixed notation', () => {
    const input = `
      CONFIG.API.URL=https://api.example.com
      CONFIG_API_VERSION=2.0
      CONFIG.API.ENDPOINTS=[]
      CONFIG.API.ENDPOINTS=users
      CONFIG.API.ENDPOINTS=posts
      CONFIG_API_TIMEOUT=30
    `;
    const result = fromDotenv(input);
    assert.deepStrictEqual(result, {
      CONFIG: {
        API: {
          URL: 'https://api.example.com',
          VERSION: 2.0,
          ENDPOINTS: ['users', 'posts'],
          TIMEOUT: 30
        }
      }
    });
  });

  it('should handle date and numeric values with type inference', () => {
    const input = `
      DATE=2023-12-25T12:00:00Z
      TIMESTAMP=1703505600000
      FLOAT=-123.456
      SCIENTIFIC=1.23e-4
      QUOTED_NUMBER="123"
    `;
    const result = fromDotenv(input);
    assert.strictEqual(result.DATE, '2023-12-25T12:00:00Z');
    assert.strictEqual(typeof result.TIMESTAMP, 'number');
    assert.strictEqual(result.FLOAT, -123.456);
    assert.strictEqual(result.SCIENTIFIC, 1.23e-4);
    assert.strictEqual(result.QUOTED_NUMBER, '123');
  });

  it('should handle empty values and special characters', () => {
    const input = `
      EMPTY=empty
      BLANK=
      ESCAPED="Line\nWith\tTabs\r\nAnd\\Backslash"
      UNICODE="Hello\u0020World"
    `;
    const result = fromDotenv(input);
    assert.strictEqual(result.EMPTY, '');
    assert.strictEqual(result.BLANK, '');
    assert.strictEqual(result.ESCAPED, 'Line\nWith\tTabs\r\nAnd\\Backslash');
    assert.strictEqual(result.UNICODE, 'Hello World');
  });

  describe('toDotenv', () => {
    it('should convert object to env format', () => {
      const input = {
        APP: {
          NAME: 'Test App',
          VERSION: "1.0",
          CONFIG: {
            DEBUG: true,
            ITEMS: ['a', 'b']
          }
        }
      };
      const result = toDotenv(input);
      const parsed = fromDotenv(result);
      assert.deepStrictEqual(parsed, input);
    });

    it('should handle multiline values', () => {
      const input = {
        DESC: 'Line 1\nLine 2\nLine 3'
      };
      const result = toDotenv(input);
      assert.ok(result.includes('DESC="Line 1\nLine 2\nLine 3"'));
    });

    it('should handle error conditions', () => {
      assert.throws(() => toDotenv(null), /PRECONDITION: Input must be a non-null object/);
    });
  });
});
