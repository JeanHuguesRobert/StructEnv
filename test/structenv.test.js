
const assert = require('assert');
const StructEnv = require('../src/structenv');

describe('StructEnv', () => {
  let parser;

  beforeEach(() => {
    parser = new StructEnv();
  });

  it('should parse basic app configuration', () => {
    const input = `
      APP_NAME=My Application
      APP_TEMPERATURE=0.7
      APP_VERSION="1.0"
      APP_TOOL_NAME=best
      APP_TOOL_VERSION=1.0.0
    `;
    const result = parser.parse(input);
    assert.deepStrictEqual(result, {
      APP: {
        NAME: "My Application",
        TEMPERATURE: 0.7,
        VERSION: "1.0",
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
    const result = parser.parse(input);
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
    const result = parser.parse(input);
    assert.deepStrictEqual(result, {
      ITEMS: ["item1", "item2"]
    });
  });

  it('should parse empty objects and arrays', () => {
    const input = `
      EMPTY_OBJECT={}
      EMPTY_ARRAY=[]
    `;
    const result = parser.parse(input);
    assert.deepStrictEqual(result, {
      EMPTY_OBJECT: {},
      EMPTY_ARRAY: []
    });
  });

  it('should parse multiline strings', () => {
    const input = `
      TEXT="This is a multiline
      TEXT=test
      TEXT=\\b!"
    `;
    const result = parser.parse(input);
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
    const result = parser.parse(input);
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
});
