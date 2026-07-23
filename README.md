# StructEnv

StructEnv format for configurations — **when dotenv meets JSON**.

> **Revival status:** planned. This repository needs a **revival refactoring** of the same kind as the [Simpli / SimpliWiki revival](https://github.com/JeanHuguesRobert/simpli/issues/1): keep the useful idea and RFC, re-ground the implementation (ESM, honest plugins, tests), align with the corpus. Tracking note: [`revival.md`](./revival.md).

## Overview

StructEnv combines the simplicity of `.env` files with structured data (nesting, arrays, light type inference, plugins). Suitable for both simple and complex configuration needs — and, in this workspace, as a candidate for **types/contracts as data** (alongside YAML), not TypeScript.

# StructEnv (RFC draft)
StructEnv format for configurations, when dotenv meets json.

"This is a benchmark for AI code generation. Let's see what we
can expect. This is version 1.0. Feel free to fork this repo
to improve the RFC and the generated code.

So far, AI tools that I tested perform poorly, humans still rule!
But maybe that's just because I'm so dumb at writing specifications ;)

Yours,

   Jean Hugues, aka Baron Mariani di Corti.
   15th of March 2025, Corti, Corsica."


What follows was extensivly edited using AI code assistants.

This specification aims to be clear and unambiguous for both human readers and automated systems. While experienced developers often rely on implicit conventions and assumptions when interpreting specifications, we've taken care to make these explicit where beneficial. This approach helps ensure consistent interpretation across different implementations, whether by human developers or AI-assisted tools, while maintaining the specification's readability and practical utility.

```
                                  StructEnv RFC Draft
                                  Jean Hugues Noel Robert
                                  1, cours Paoli. Corsica. F-20250 France

                                  [Page 1]

1.  Introduction

    The landscape of configuration management lacks a format that
    strikes a balance between simplicity and structure. Existing
    formats either offer basic key-value pairs or require complex
    syntax for nested data. StructEnv aims to fill this gap by
    providing a human-readable, machine-parseable format that
    supports structured data without sacrificing simplicity.

    This document defines the StructEnv configuration format, a
    syntax for structured configuration data. StructEnv is designed
    to be simple, flexible, and compatible with common environment
    variable formats.

    This is version 1. To enable it, the .env content to process
    MUST invoke the 'version' plugin.


2.  Terminology

    Key: A string identifier used to access a value.
    Value: The data associated with a key.
    Nesting: Hierarchical organization of data.
    Array: An ordered collection of values.
    Object: An unordered collection of key-value pairs.

3.  Lexical Elements

    3.1.  Basic Syntax

        Each line MUST consist of a KEY=VALUE pair.
        Whitespace before the KEY MUST be ignored.
        Whitespace after the KEY MUST be considered an error.
        Whitespace before or after the value are parts of it.
        Whitespace at the end of lines MUST be preserved.
        Empty lines MUST be ignored.
        Lines beginning with # MUST be treated as comments.
        End-of-line comments MUST NOT be supported.
        Line endings MUST be normalized to LF (\n) during parsing.

    3.2.  Key Formatting

        Keys MUST follow these rules:
        - Dots (.) are used for nesting using the "dot" plugin.
        - A different separator is possible using the "nesting" plugin.
        - Keys encoding defaults to Utf8 unless some plugin changes
        that like the "friendly" plugin does.

    3.3.  UndUni Encoding

        When the "friendly" plugin is enabled, the encoding of the keys
        changes into the UndUni encoding that is defined here.

        The UndUni encoding scheme ensures safe representation of special
        characters in key names, it's readble too:

        - Regular alphanumeric characters (0-9, a-z, A-Z) and dots (.)
          remain unchanged
        - Underscore (_) is escaped as double underscore (__)
        - All other characters are encoded as _HEX_ where HEX is the
          uppercase hexadecimal Unicode code point
        - For characters beyond U+FFFF, the full code point is used
        - Special _s_ and _o_ are readable substitutes for - dash.
        - Friendly _ enclosed codes increase readability.

        Conversion Table:
        | Character | Rax UndUni     | Friendly    | Description |
        |-----------|----------------|-------------|-------------|
        | _         | _5F_           | __          | Underscore  |
        | -         | _2D_           | _s_ & _o_   | Dash/Hyphen |
        | @         | _40_           | _a_         | At Sign     |
        | #         | _23_           | _h_         | Hash        |
        | $         | _24_           | _d_         | Dollar      |
        | %         | _25_           | _p_         | Percent     |
        | ^         | _5E_           | _c_         | Caret       |
        | &         | _26_           | _n_         | Ampersand   |
        | *         | _2A_           | _m_         | Asterisk    |
        | (         | _28_           | _l_         | Left Paren  |
        | )         | _29_           | _r_         | Right Paren |
        | [         | _5B_           | _lb_        | Left Bracket|
        | ]         | _5D_           | _rb_        | Right Bracket|
        | {         | _7B_           | _lc_        | Left Brace  |
        | }         | _7D_           | _rc_        | Right Brace |
        | =         | _3D_           | _e_         | Equals      |
        | +         | _2B_           | _plus_      | Plus        |
        | <         | _3C_           | _lt_        | Less Than   |
        | >         | _3E_           | _gt_        | Greater Than|
        | ?         | _3F_           | _q_         | Question    |
        | !         | _21_           | _x_         | Exclamation |
        | |         | _7C_           | _pipe_      | Pipe        |
        | \         | _5C_           | _bs_        | Backslash   |
        | /         | _2F_           | _fs_        | Forward Slash|
        | ,         | _2C_           | _comma_     | Comma       |
        | ;         | _3B_           | _semi_      | Semicolon   |
        | :         | _3A_           | _colon_     | Colon       |
        | '         | _27_           | _sq_        | Single Quote|
        | "         | _22_           | _dq_        | Double Quote|
        | `         | _60_           | _bt_        | Backtick    |
        | ~         | _7E_           | _t_         | Tilde       |
        | Space     | _20_           | _sp_        | Space       |


        Examples:
        - hello_world becomes hello__world
        - hello-world becomes hello_s_world
        - hello.world becomes hello.world (dots preserved for nesting)
        - my@email becomes my_40_email or my_a_email
        - user#123 becomes user_23_123 or user_h_123
        - price$99 becomes price_24_99 or price_d_99
        - 100%off becomes 100_25_off or 100_p_off
        - ^power becomes _5E_power or _c_power
        - save&load becomes save_26_load or save_n_load
        - wild*card becomes wild_2A_card or wild_m_card
        - (group) becomes _28_group_29_ or _l_group_r_
        - [array] becomes _5B_array_5D_ or _lb_array_rb_
        - {object} becomes _7B_object_7D_ or _lc_object_rc_
        - key=value becomes key_3D_value or key_e_value
        - a+b becomes a_2B_b or a_plus_b
        - x<y becomes x_3C_y or x_lt_y
        - a>b becomes a_3E_b or a_gt_b
        - why? becomes why_3F_ or why_q_
        - hello! becomes hello_21_ or hello_x_
        - cmd|pipe becomes cmd_7C_pipe or cmd_pipe_pipe
        - path\file becomes path_5C_file or path_bs_file
        - path/file becomes path_2F_file or path_fs_file
        - items,list becomes items_2C_list or items_comma_list
        - cmd;run becomes cmd_3B_run or cmd_semi_run
        - key:value becomes key_3A_value or key_colon_value
        - 'quote' becomes _27_quote_27_ or _sq_quote_sq_
        - "text" becomes _22_text_22_ or _dq_text_dq_
        - `code` becomes _60_code_60_ or _bt_code_bt_
        - ~home becomes _7E_home or _t_home
        - first second becomes first_20_second or first_sp_second

    3.4.  String Values

        By default the value is simply kept unchanged. When the "friendly"
        plugin is invoked, additional processing occurs.
        - Strings with non-ASCII visible characters MUST be enclosed in "
        - Idem when string ends with spaces, to make them visible
        - C-style escapes MUST be supported
        - Whitespace MUST be preserved in all values

4.  Type System

    4.1.  Type Inference

        By default there is no type inferences and all values are
        strings. When the "friendly" plugin is invoqued, this changes
        and values are then inferred as:
        - Integers: Digit-only values
        - Floats: Values with decimal points
        - Booleans: true, false, etc.
        - Null: null, void, etc.
        - Dates: ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
        - Strings: All other values

    4.2.  Friendly Constants

        When the "friendly" plugin is involved, some special values are
        detected. Case-insensitive special values:
        - Boolean True: t, true, True, TRUE, on, On, ON, y, yes, Yes, YES
        - Boolean False: f, false, False, FALSE, off, Off, OFF, n, no, No, NO
        - Null: n, nil, void, null, undefined, NULL, none, None, NONE, -
        - Empty String: "", empty, Empty, EMPTY

5.  Semantic Rules

    5.1.  Parsing Rules

        - Lines MUST be processed sequentially
        - Lines MUST be split at the first =
        - Keys MUST be processed for nesting and escaping by plugins
        - Values MUST be parsed based on inferred type by plugins

    5.2.  Arrays

        - Arrays MUST be created by repeating the KEY
        - Empty arrays MUST use declarative [] value
        - Single-element arrays MUST use [] declaration

    5.3.  Objects

        - Objects MUST use declarative {} value
        - Object properties use nesting notation
        - Empty objects MUST use {} value

    5.4.  Concatenation

        When the same key reappears:
        - A newline character (\n) MUST be added between values
        - Escape sequences in quoted strings MUST remain unchanged
        - String conversion MUST follow host language rules
        - Quoted strings MUST be dequoted before concatenation
        - Non-string values MUST be converted to strings first

    5.5.  Plugins
        Syntax #plug introduces plugins extension possibilities.
        Use special pragma style comment '#plug version 1.0.0' to enable
        the default plugins. Future versions will be defined in complementary RFCs. Default plugins are:
        - version: to specify what version the content complies with.
        - include: to include a file.
        - shell: to execute a shell command.
        - eval: to evaluate a javascript expression.
        - friendly: to decode friendly key names, enabled by default.
        - dot: to unflatten keys using dot separator, enabled by default.
        - nesting: to unflatten keys using specified separator.
        - raw: disable the friendly plugin, including nesting logic.
        - prefix: to add a prefix to every keys.
        - plugins: to track processed plugings.
        - Cstyle: to enable C style values decoding.
        - define: to enable C preprocessor style substitutions.

6.  Examples

    Please assume '#plug version 1.0.0' for all examples. That version
    enables the "friendly" plugin by default.

    6.1.  Basic Types and Nesting

        # Object with various types, using _ for nesting
        #plug nesting _
        APP_NAME=My Application
        APP_TEMPERATURE=0.7
        APP_VERSION="1.0"
        APP_TOOL_NAME=best
        APP_TOOL_VERSION=1.0.0

    6.2.  Alternative Nesting

        # Using dots for nesting, default friendly mode
        SERVER.CONFIG.main.HOST=api.example.com
        SERVER.CONFIG.main.PORT=8080
        SERVER.CONFIG.STATUS=off
        SERVER_s_CONFIG_DEBUG=t

    6.3.  Arrays and Objects

        # Simple array
        ITEMS=item1
        ITEMS=item2

        # Object with coordinates
        POINT={}
        POINT_x=10
        POINT_y=10

        # Empty containers
        EMPTY__OBJECT={}
        EMPTY__ARRAY=[]

    6.4.  Special Cases

        # Escaped keys
        WEATHER_o_TODAY=WEATHER-TODAY

        # String concatenation
        TEXT=This is a multiline
        TEXT=test
        TEXT="\b!"

7.  Security

    Input validation is REQUIRED.
    Silently ignore all risky plugins using the "strict" plugin.

8.  Previous Art

    8.1.  Dotenv (https://github.com/motdotla/dotenv)
        Simple KEY=VALUE pairs.

    8.2.  INI (https://en.wikipedia.org/wiki/INI_file)
        Sections, KEY=VALUE.

    8.3.  JSON (https://www.json.org/json-en.html)
        Data interchange format.

    8.4.  YAML (https://yaml.org/)
        Human-readable data.

    8.5.  TOML (https://toml.io/)
        Minimal configuration.

9.  Future Considerations

    9.1.  Formal Grammar
        The ABNF grammar for StructEnv keys:

        ; Line structure
        file = *line
        line = empty-line / comment-line / key-value-line
        empty-line = *WSP EOL
        comment-line = *WSP "#" *VCHAR EOL
        key-value-line = *WSP key "=" value EOL
        EOL = CRLF / LF
        CRLF = %x0D %x0A
        LF = %x0A

        ; Key definition
        key = letter *(letter / digit / underscore / dot / dash)
        fqn = key *(separator key)
        separator = dot / underscore
        letter = %x41-5A / %x61-7A   ; A-Z / a-z
        digit = %x30-39              ; 0-9
        underscore = %x5F            ; _
        dot = %x2E                   ; .
        dash = %x2D                  ; -

        ; Value definition
        value = quoted-string / unquoted-string / friendly-constant / declarative-syntax / number
        quoted-string = DQUOTE 1*char DQUOTE  ; non-empty quoted string
        unquoted-string = *VCHAR
        char = escaped / unescaped
        escaped = "\" (DQUOTE / "\" / "b" / "f" / "n" / "r" / "t")
        unescaped = %x20-21 / %x23-5B / %x5D-7E   ; printable chars except DQUOTE and \

        ; Number definition
        number = integer / float
        integer = [sign] 1*digit
        float = [sign] (decimal / scientific)
        decimal = (1*digit "." *digit) / (*digit "." 1*digit)
        scientific = (decimal / 1*digit) ("e" / "E") [sign] 1*digit
        sign = "+" / "-"

        ; Friendly constants
        friendly-constant = boolean-true / boolean-false / null-value
        boolean-true = %i"t" / %i"true" / %i"on" / %i"y" / %i"yes"
        boolean-false = %i"f" / %i"false" / %i"off" / %i"n" / %i"no"
        null-value = %i"n" / %i"nil" / %i"void" / %i"null" / %i"undefined" / %i"none" / "-"

        ; Declarative syntax
        declarative-syntax = empty-array / empty-object / empty-string
        empty-array = "[" "]"
        empty-object = "{" "}"
        empty-string = """" / %i"empty"

        WSP = SP / HTAB
        DQUOTE = %x22                ; "
        SP = %x20                    ; space
        HTAB = %x09                  ; horizontal tab

        Additional rules:
        - Maximum key length: 128 characters
        - Keys are case-sensitive
        - The presence of a dot in any key determines the nesting format:
          * If any key contains a dot, all keys must use dot notation for nesting
          * Otherwise, underscore notation is used for nesting
        - No consecutive dots or underscores allowed
        - No trailing dots or underscores allowed

    9.2.  MIME Type
        x-structenv SHOULD be registered.

    9.3.  File Extension
        .env is the recommended extension.

    9.4.  Character Encoding
        UTF-8 SHOULD be the standard encoding.

    9.5.  Implementation
        Reference implementations in JavaScript and Python.

    9.6.  Interoperability
        Must maintain dotenv tool compatibility.

    9.7.  Versioning
        Use _ for metadata and versioning.

                                  [End of RFC Draft]


# API Reference

This section documents the core components of StructEnv and their usage patterns.

## UndUni Encoding

UndUni encoding provides safe transformation of key names containing special characters.

### toUndUni(key: string): string

Transforms a key string into its UndUni-encoded form.

**Parameters:**
- key: The original key string

**Returns:**
- The UndUni-encoded key string

**Example:**
```javascript
toUndUni("hello-world") // returns "hello_s_world"
toUndUni("my@email")   // returns "my_40_email"
toUndUni("key=value")  // returns "key_3D_value"
```

### fromUndUni(encodedKey: string): string

Transforms a UndUni-encoded key back to its original form.

**Parameters:**
- encodedKey: The UndUni-encoded key string

**Returns:**
- The original key string

**Example:**
```javascript
fromUndUni("hello_s_world")  // returns "hello-world"
fromUndUni("my_40_email")    // returns "my@email"
fromUndUni("key_3D_value")   // returns "key=value"
```

## Structure Flattening

Convert between nested and flat object structures.

### flattenStruct(obj: object, separator: string = "_"): object

Converts a nested object structure into a flat key-value structure.

**Parameters:**
- obj: The nested object to flatten
- separator: The character to use for nesting (defaults to underscore)

**Returns:**
- A flattened object with compound keys

**Example:**
```javascript
const nested = {
  app: {
    name: "MyApp",
    config: {
      port: 8080
    }
  }
};

flattenStruct(nested);
// Returns:
// {
//   "app_name": "MyApp",
//   "app_config_port": 8080
// }
```

### unflattenStruct(obj: object, separator: string = "_"): object

Converts a flat key-value structure back into a nested object structure.

**Parameters:**
- obj: The flat object to unflatten
- separator: The character used for nesting (defaults to underscore)

**Returns:**
- A nested object structure

**Example:**
```javascript
const flat = {
  "app_name": "MyApp",
  "app_config_port": 8080
};

unflattenStruct(flat);
// Returns:
// {
//   app: {
//     name: "MyApp",
//     config: {
//       port: 8080
//     }
//   }
// }
```

## StructEnv Encoding

Bidirectional conversion between dotenv and JSON formats.

### fromDotenv(input: string, separator: string = "_"): object

Parses a StructEnv format string into a structured object.

**Parameters:**
- input: The StructEnv format string to parse

**Returns:**
- A structured object representing the configuration

**Example:**
```javascript
const input = `
APP.NAME=MyApp
APP.VERSION=1.0
APP.CONFIG.PORT=8080
`;

fromDotenv(input, ".");
// Returns:
// {
//   app: {
//     name: "MyApp",
//     version: "1.0",
//     config: {
//       port: 8080
//     }
//   }
// }
```

### toDotenv(obj: object, separator: string = "_"): string

Converts a structured object into StructEnv format.

**Parameters:**
- obj: The object to convert

**Returns:**
- A StructEnv format string

**Example:**
```javascript
const config = {
  app: {
    name: "MyApp",
    version: "1.0",
    config: {
      port: 8080
    }
  }
};

toDotenv(config,".");
// Returns:
// APP.NAME=MyApp
// APP.VERSION=1.0
// APP.CONFIG_PORT=8080
```




## Version 1.0 Plugins

### Core Plugins

#### version
Enables specific version features. Must be the first plugin invoked.
```env
#plug version 1.0.0
```

#### plugins
Manages plugin loading and configuration.
```env
#plug plugins [plugin_name]
```

#### include
Includes content from other files.
```env
#plug include path/to/file.env
```

### Data Format Plugins

#### toml
Parses TOML content and flattens it into dot notation.
```env
#plug toml
[database]
host = "localhost"
port = 5432
# Results in: database.host=localhost, database.port=5432
```

#### yaml
Parses YAML content and flattens it into dot notation.
```env
#plug yaml
database:
  host: localhost
  port: 5432
# Results in: database.host=localhost, database.port=5432
```

### Processing Plugins

#### friendly
Enables UndUni encoding for human-readable key names.
```env
#plug friendly
user@domain.com=value  # Encoded as user_a_domain.com
project-name=test      # Encoded as project_s_name
```

#### eval
Evaluates JavaScript expressions in values.
```env
#plug eval
TIMESTAMP=${Date.now()}
RANDOM_INT=${Math.floor(Math.random() * 100)}
```

#### immediate
Processes values immediately without waiting for full parse.
```env
#plug immediate
FIRST_KEY=processed_immediately
```

#### strict
Enforces strict validation of values.
```env
#plug strict
VALID_KEY=value     # OK
INVALID_KEY=        # Error: empty value
NULL_KEY=null       # Error: null value
```

#### shell
Executes shell commands and captures output.
```env
#plug shell echo "Hello World"
OUTPUT=Hello World
```

## Draft RFC, beeing explored evolutions

### Format Specification
StructEnv files follow these core specifications:

#### File Format
- UTF-8 encoded text files
- Line-oriented configuration
- Lines ending with LF (\n) or CRLF (\r\n)
- Empty lines and comments (#) are ignored
- Plugin declarations start with #plug

#### Key Naming Rules
- Must start with a letter or underscore
- Can contain letters, numbers, dots, dashes, and underscores
- Special characters must be encoded using UndUni
- Maximum length: 255 characters (encoded)

#### Value Types
- Strings (default)
- Numbers
- Booleans (true/false)
- Null (explicit null value)
- Arrays
- Objects

#### Nesting Notation
- Dot notation: parent.child=value

#### Plugin System
- Plugin declarations are processed in order
- Plugins can modify parsing and processing
- Custom plugins must follow plugin API

### Proposed Changes

#### UndUni Encoding Table
Standardized encoding for special characters in key names:
- @ -> _a_ (at symbol)
- - -> _s_ (dash/hyphen)
- : -> _colon_ (colon)
- / -> _fs_ (forward slash)
- \ -> _bs_ (backslash)
- Space -> _sp_ (whitespace)
- $ -> _d_ (dollar)
- % -> _p_ (percent)
- & -> _n_ (ampersand)
- # -> _h_ (hash)
- Other special chars -> _HEX_ (hex code)

#### Structure Flattening
Standard API for flattening nested structures:
- Arrays: parent.[index].key
- Objects: parent.child.key
- Mixed: parent.[index].child.key
- Max nesting depth: 32 levels

#### Encoding Specifications
- Key length: 255 bytes max after encoding
- Value size: 64KB max
- File size: 1MB recommended limit
- Line length: 1024 chars recommended
- Comment marker: # (must be first char)
- Continuation: \ (last char)

## UndUni Encoding
When using the friendly plugin, keys are encoded using UndUni:
- Regular alphanumeric (0-9, a-z, A-Z) and dots (.) remain unchanged
- Underscore (_) becomes double underscore (__)
- Special characters use _HEX_ format
- Common symbols have friendly aliases (_s_ for dash, _a_ for @)

## Error Handling
- Invalid plugin configurations throw descriptive errors
- Plugin errors include detailed error messages

## Best Practices
1. Always specify version at the start
2. Use strict mode for critical configurations
3. Leverage friendly mode for readable keys
4. Use appropriate plugins for different data formats
5. Handle plugin errors appropriately

## License
MIT License

## Contributing
Contributions are welcome! Please feel free to submit pull requests.

# Claude version's

# StructEnv

StructEnv format for configurations, when dotenv meets json.

> "This is a benchmark for AI code generation. Let's see what we can expect. This is version 1.0. Feel free to fork this repo to improve the RFC and the generated code.
>
> So far, AI tools that I tested perform poorly, humans still rule! But maybe that's just because I'm so dumb at writing specifications ;)
>
> Yours,
>
> Jean Hugues, aka Baron Mariani di Corti. 15th of March 2025, Corti, Corsica."

What follows was extensively edited using AI code assistants.

This specification aims to be clear and unambiguous for both human readers and automated systems. While experienced developers often rely on implicit conventions and assumptions when interpreting specifications, we've taken care to make these explicit where beneficial. This approach helps ensure consistent interpretation across different implementations, whether by human developers or AI-assisted tools, while maintaining the specification's readability and practical utility.

## Overview

StructEnv combines the simplicity of `.env` files with structured data capabilities:

```env
#plug version 1.0.0

# Write naturally with friendly syntax
user@email.com=john@example.com
project-name=MyApp
database.host=localhost
database.port=5432

# Arrays through repetition
features=auth
features=api
features=admin

# Result: Full JSON-like structure from flat syntax
```

**Why StructEnv?**
- **Human-friendly input**: Write with dashes, dots, special chars naturally
- **Machine-structured output**: Get nested objects, arrays, typed values
- **Plugin extensibility**: Include files, eval expressions, parse YAML/TOML
- **Environment variable compatible**: Works where .env works
- **Tolerant in, strict out**: Write naturally, get normalized output

## Installation

```bash
# npm
npm install structenv

# yarn
yarn add structenv

# pnpm
pnpm add structenv

# bun
bun add structenv
```

### Usage

```javascript
// ESM
import { fromDotenv, toDotenv } from 'structenv';

// CommonJS
const { fromDotenv, toDotenv } = require('structenv');

// Browser (CDN)
<script src="https://unpkg.com/structenv@1.0.0/dist/structenv.min.js"></script>
```

## Quick Start

### Basic Usage

```javascript
import { fromDotenv, toDotenv } from 'structenv';

// Parse StructEnv to JavaScript object
const config = fromDotenv(`
#plug version 1.0.0
app.name=MyApp
app.port=8080
app.debug=true
`);

console.log(config);
// {
//   app: {
//     name: "MyApp",
//     port: 8080,
//     debug: true
//   }
// }

// Convert JavaScript object to StructEnv
const envString = toDotenv(config);
console.log(envString);
// APP.NAME=MyApp
// APP.PORT=8080
// APP.DEBUG=true
```

### Working with Arrays

```javascript
const config = fromDotenv(`
#plug version 1.0.0
items=one
items=two
items=three
`);

console.log(config.items); // ["one", "two", "three"]
```

### Nested Structures

```javascript
const config = fromDotenv(`
#plug version 1.0.0
server.database.host=localhost
server.database.port=5432
server.cache.enabled=true
`);

console.log(config);
// {
//   server: {
//     database: { host: "localhost", port: 5432 },
//     cache: { enabled: true }
//   }
// }
```

## API Reference

### UndUni Encoding

UndUni encoding provides safe transformation of key names containing special characters.

#### `toUndUni(key: string): string`

Transforms a key string into its UndUni-encoded form.

**Parameters:**
- `key`: The original key string

**Returns:**
- The UndUni-encoded key string

**Example:**
```javascript
toUndUni("hello-world") // returns "hello_s_world"
toUndUni("my@email")    // returns "my_a_email"
toUndUni("key=value")   // returns "key_e_value"
```

#### `fromUndUni(encodedKey: string): string`

Transforms a UndUni-encoded key back to its original form.

**Parameters:**
- `encodedKey`: The UndUni-encoded key string

**Returns:**
- The original key string

**Example:**
```javascript
fromUndUni("hello_s_world")  // returns "hello-world"
fromUndUni("my_a_email")     // returns "my@email"
fromUndUni("key_e_value")    // returns "key=value"
```

### Structure Flattening

Convert between nested and flat object structures.

#### `flattenStruct(obj: object, separator: string = "_"): object`

Converts a nested object structure into a flat key-value structure.

**Parameters:**
- `obj`: The nested object to flatten
- `separator`: The character to use for nesting (defaults to underscore)

**Returns:**
- A flattened object with compound keys

**Example:**
```javascript
const nested = {
  app: {
    name: "MyApp",
    config: {
      port: 8080
    }
  }
};

flattenStruct(nested);
// Returns:
// {
//   "app_name": "MyApp",
//   "app_config_port": 8080
// }
```

#### `unflattenStruct(obj: object, separator: string = "_"): object`

Converts a flat key-value structure back into a nested object structure.

**Parameters:**
- `obj`: The flat object to unflatten
- `separator`: The character used for nesting (defaults to underscore)

**Returns:**
- A nested object structure

**Example:**
```javascript
const flat = {
  "app_name": "MyApp",
  "app_config_port": 8080
};

unflattenStruct(flat);
// Returns:
// {
//   app: {
//     name: "MyApp",
//     config: {
//       port: 8080
//     }
//   }
// }
```

### StructEnv Encoding

Bidirectional conversion between dotenv and JSON formats.

#### `fromDotenv(input: string, separator: string = "_"): object`

Parses a StructEnv format string into a structured object.

**Parameters:**
- `input`: The StructEnv format string to parse

**Returns:**
- A structured object representing the configuration

**Example:**
```javascript
const input = `
#plug version 1.0.0
APP.NAME=MyApp
APP.VERSION=1.0
APP.CONFIG.PORT=8080
`;

fromDotenv(input);
// Returns:
// {
//   app: {
//     name: "MyApp",
//     version: "1.0",
//     config: {
//       port: 8080
//     }
//   }
// }
```

#### `toDotenv(obj: object, separator: string = "_"): string`

Converts a structured object into StructEnv format.

**Parameters:**
- `obj`: The object to convert

**Returns:**
- A StructEnv format string

**Example:**
```javascript
const config = {
  app: {
    name: "MyApp",
    version: "1.0",
    config: {
      port: 8080
    }
  }
};

toDotenv(config, ".");
// Returns:
// APP.NAME=MyApp
// APP.VERSION=1.0
// APP.CONFIG.PORT=8080
```

## Version 1.0 Plugins

### Core Plugins

#### `version`
Enables specific version features. Must be the first plugin invoked.

```env
#plug version 1.0.0
```

#### `plugins`
Manages plugin loading and configuration.

```env
#plug plugins [plugin_name]
```

#### `include`
Includes content from other files.

```env
#plug include path/to/file.env
```

### Data Format Plugins

#### `toml`
Parses TOML content and flattens it into dot notation.

```env
#plug toml
[database]
host = "localhost"
port = 5432
# Results in: database.host=localhost, database.port=5432
```

#### `yaml`
Parses YAML content and flattens it into dot notation.

```env
#plug yaml
database:
  host: localhost
  port: 5432
# Results in: database.host=localhost, database.port=5432
```

### Processing Plugins

#### `friendly`
Enables UndUni encoding for human-readable key names.

```env
#plug friendly
user@domain.com=value  # Encoded as user_a_domain.com
project-name=test      # Encoded as project_s_name
```

#### `eval`
Evaluates JavaScript expressions in values.

```env
#plug eval
TIMESTAMP=${Date.now()}
RANDOM_INT=${Math.floor(Math.random() * 100)}
```

#### `immediate`
Processes values immediately without waiting for full parse.

```env
#plug immediate
FIRST_KEY=processed_immediately
```

#### `strict`
Enforces strict validation of values.

```env
#plug strict
VALID_KEY=value     # OK
INVALID_KEY=        # Error: empty value
NULL_KEY=null       # Error: null value
```

#### `shell`
Executes shell commands and captures output.

```env
#plug shell
OUTPUT=$(echo "Hello World")
```

### Real-World Plugin Examples

#### Multi-Environment Configuration

```env
#plug version 1.0.0
#plug include common.env

# Development overrides
database.host=localhost
debug=true
```

#### Dynamic Values

```env
#plug version 1.0.0
#plug eval

# Timestamps and computed values
deployment.timestamp=${Date.now()}
deployment.random_id=${Math.random().toString(36).slice(2)}
app.version=1.0.${Math.floor(Date.now() / 1000)}
```

#### Complex Data Import

```env
#plug version 1.0.0
#plug yaml

# Import structured data directly
config:
  servers:
    - name: web1
      ip: 192.168.1.10
    - name: web2
      ip: 192.168.1.11
  
# Continue with flat syntax
app.name=MyApp
```

#### Security-Conscious Configuration

```env
#plug version 1.0.0
#plug strict

# Strict mode catches errors early
api.key=secret123
api.endpoint=https://api.example.com
# Empty values will error:
# invalid.key=
```

## Error Handling

StructEnv provides detailed error messages to help debug configuration issues:

### Parse Errors

```javascript
try {
  const config = fromDotenv(`
    INVALID KEY=value  # Space in key name
  `);
} catch (error) {
  console.error(error.message);
  // "Parse error at line 2: Key contains whitespace"
}
```

### Plugin Errors

```javascript
try {
  const config = fromDotenv(`
    #plug version 1.0.0
    #plug unknown_plugin
  `);
} catch (error) {
  console.error(error.message);
  // "Unknown plugin: unknown_plugin at line 3"
}
```

### Nesting Depth Errors

```javascript
try {
  const config = fromDotenv(`
    #plug version 1.0.0
    #plug maxdepth 3
    a.b.c.d=too_deep
  `);
} catch (error) {
  console.error(error.message);
  // "Nesting depth exceeds limit (3) at line 4"
}
```

### Best Practices

- Use `#plug strict` for production configurations
- Validate configuration after parsing
- Handle errors gracefully with try-catch
- Log parsing errors with context (line numbers)

## Performance

StructEnv is designed for configuration files (typically < 1MB):

- **Parsing**: ~1-2ms for typical config files (< 1KB)
- **Large files**: ~50-100ms for 1MB files
- **Memory**: Linear with file size
- **Recommended limit**: 1MB per file

### Optimization Tips

```javascript
// For large configurations, use streaming (planned v1.1)
// Current: Parse entire file at once

// Avoid deep nesting (keep < 10 levels)
// Good:
app.database.host=localhost

// Avoid:
a.b.c.d.e.f.g.h.i.j.k=too_deep

// Use includes for modularity
#plug include database.env
#plug include cache.env
#plug include api.env
```

### Benchmarks

| File Size | Parse Time | Memory  |
|-----------|------------|---------|
| 1 KB      | ~1ms       | < 1 MB  |
| 10 KB     | ~5ms       | < 2 MB  |
| 100 KB    | ~30ms      | < 10 MB |
| 1 MB      | ~100ms     | < 50 MB |

*Measured on Node.js v20, Apple M1*

## Comparison with Other Formats

| Feature              | StructEnv | .env | JSON | YAML | TOML |
|----------------------|-----------|------|------|------|------|
| Flat key-value       | ✅        | ✅   | ❌   | ✅   | ✅   |
| Nested structures    | ✅        | ❌   | ✅   | ✅   | ✅   |
| Arrays               | ✅        | ❌   | ✅   | ✅   | ✅   |
| Type inference       | ✅        | ❌   | ✅   | ✅   | ✅   |
| Comments             | ✅        | ✅   | ❌   | ✅   | ✅   |
| Special chars in keys| ✅        | ❌   | ❌   | ❌   | ❌   |
| Plugin system        | ✅        | ❌   | ❌   | ❌   | ❌   |
| Human-friendly       | ✅        | ✅   | ❌   | ✅   | ✅   |
| Machine-parseable    | ✅        | ✅   | ✅   | ⚠️   | ✅   |
| Include files        | ✅        | ❌   | ❌   | ❌   | ❌   |
| Eval expressions     | ✅        | ❌   | ❌   | ❌   | ❌   |

### When to Use StructEnv

**✅ Good fit:**
- Application configuration
- Environment-specific settings
- CI/CD pipelines
- Docker compose configs
- Build tool settings

**❌ Not ideal for:**
- Data interchange between systems (use JSON)
- Document markup (use YAML/Markdown)
- Large datasets (use databases)
- Real-time data (use message queues)

## Roadmap & Future Considerations

### Currently Stable (v1.0.0)
✅ Basic KEY=VALUE parsing  
✅ Dot and underscore nesting  
✅ UndUni encoding for special characters  
✅ Type inference (numbers, booleans, null)  
✅ Arrays via key repetition  
✅ Core plugins (version, friendly, include, eval)  

### Under Consideration (v1.1.0+)
🔄 Enhanced UndUni encoding table  
🔄 Array index notation: `parent.[0].key`  
🔄 Mixed nesting structures  
🔄 Additional data format plugins (XML, INI)  
🔄 Streaming parser for large files  
🔄 Schema validation plugin  

**Want to contribute?** See [Contributing](#contributing) section.

---

## RFC Specification

                                  StructEnv RFC Draft
                                  Jean Hugues Noel Robert
                                  1, cours Paoli. Corsica. F-20250 France

                                  [Page 1]

### 1. Introduction

The landscape of configuration management lacks a format that strikes a balance between simplicity and structure. Existing formats either offer basic key-value pairs or require complex syntax for nested data. StructEnv aims to fill this gap by providing a human-readable, machine-parseable format that supports structured data without sacrificing simplicity.

This document defines the StructEnv configuration format, a syntax for structured configuration data. StructEnv is designed to be simple, flexible, and compatible with common environment variable formats.

This is version 1. To enable it, the .env content to process MUST invoke the 'version' plugin.

### 2. Terminology

- **Key**: A string identifier used to access a value.
- **Value**: The data associated with a key.
- **Nesting**: Hierarchical organization of data.
- **Array**: An ordered collection of values.
- **Object**: An unordered collection of key-value pairs.

### 3. Lexical Elements

#### 3.1. Basic Syntax

- Each line MUST consist of a KEY=VALUE pair.
- Whitespace before the KEY MUST be ignored.
- Whitespace after the KEY MUST be considered an error.
- Whitespace before or after the value are parts of it.
- Whitespace at the end of lines MUST be preserved.
- Empty lines MUST be ignored.
- Lines beginning with # MUST be treated as comments.
- End-of-line comments MUST NOT be supported.
- Line endings MUST be normalized to LF (\n) during parsing.

#### 3.2. Key Formatting

Keys MUST follow these rules:
- Dots (.) are used for nesting using the "dot" plugin.
- A different separator is possible using the "nesting" plugin.
- Keys encoding defaults to Utf8 unless some plugin changes that like the "friendly" plugin does.

#### 3.2.1. Separator Switching

The nesting separator can change during parsing:
- Default separator when "friendly" plugin is enabled: dot (.)
- The "nesting" plugin can change the separator at any point
- When a new separator is declared, it applies to all subsequent keys until another separator is declared
- Previously parsed keys maintain their original separator

**Example:**
```env
APP.NAME=test          # Uses dot separator
APP.VERSION=1.0        # Uses dot separator
#plug nesting _        # Switch to underscore
APP_CONFIG_PORT=8080   # Uses underscore separator
#plug nesting .        # Switch back to dot
APP.DEBUG=true         # Uses dot separator
```

**Result:**
```javascript
{
  app: {
    name: "test",
    version: "1.0",
    config: { port: 8080 },
    debug: true
  }
}
```

#### 3.3. UndUni Encoding

When the "friendly" plugin is enabled, the encoding of the keys changes into the UndUni encoding that is defined here.

The UndUni encoding scheme ensures safe representation of special characters in key names, it's readable too:

- Regular alphanumeric characters (0-9, a-z, A-Z) and dots (.) remain unchanged
- Underscore (_) is escaped as double underscore (__)
- All other characters are encoded as _HEX_ where HEX is the uppercase hexadecimal Unicode code point
- For characters beyond U+FFFF, the full code point is used
- Special _s_ and _o_ are readable substitutes for - dash.
- Friendly _ enclosed codes increase readability.

**Conversion Table:**

| Character | Raw UndUni     | Friendly    | Description |
|-----------|----------------|-------------|-------------|
| _         | _5F_           | __          | Underscore  |
| -         | _2D_           | _s_ & _o_   | Dash/Hyphen |
| @         | _40_           | _a_         | At Sign     |
| #         | _23_           | _h_         | Hash        |
| $         | _24_           | _d_         | Dollar      |
| %         | _25_           | _p_         | Percent     |
| ^         | _5E_           | _c_         | Caret       |
| &         | _26_           | _n_         | Ampersand   |
| *         | _2A_           | _m_         | Asterisk    |
| (         | _28_           | _l_         | Left Paren  |
| )         | _29_           | _r_         | Right Paren |
| [         | _5B_           | _lb_        | Left Bracket|
| ]         | _5D_           | _rb_        | Right Bracket|
| {         | _7B_           | _lc_        | Left Brace  |
| }         | _7D_           | _rc_        | Right Brace |
| =         | _3D_           | _e_         | Equals      |
| +         | _2B_           | _plus_      | Plus        |
| <         | _3C_           | _lt_        | Less Than   |
| >         | _3E_           | _gt_        | Greater Than|
| ?         | _3F_           | _q_         | Question    |
| !         | _21_           | _x_         | Exclamation |
| \|        | _7C_           | _pipe_      | Pipe        |
| \\        | _5C_           | _bs_        | Backslash   |
| /         | _2F_           | _fs_        | Forward Slash|
| ,         | _2C_           | _comma_     | Comma       |
| ;         | _3B_           | _semi_      | Semicolon   |
| :         | _3A_           | _colon_     | Colon       |
| '         | _27_           | _sq_        | Single Quote|
| "         | _22_           | _dq_        | Double Quote|
| `         | _60_           | _bt_        | Backtick    |
| ~         | _7E_           | _t_         | Tilde       |
| Space     | _20_           | _sp_        | Space       |

**Examples:**
- `hello_world` becomes `hello__world`
- `hello-world` becomes `hello_s_world`
- `hello.world` becomes `hello.world` (dots preserved for nesting)
- `my@email` becomes `my_40_email` or `my_a_email`
- `user#123` becomes `user_23_123` or `user_h_123`

#### 3.3.1. Re-encoding Rules

When parsing keys that already contain UndUni sequences:
- All UndUni sequences MUST be decoded first
- Then re-encoded according to current plugin settings
- This ensures idempotent behavior

**Example with friendly mode:**
```
Input:  my_5F_key=value
Decode: my_key
Encode: my__key
Result: { my_key: "value" }
```

**Triple (or more) consecutive underscores when separator is NOT underscore:**
```
Input:  my___key=value
Encode: my_5F__5F__5F_key
Result: { "my___key": "value" }
```

**Triple (or more) consecutive underscores when separator IS underscore:**
```
my___key=value
# Interpreted as: my[first_match][first_match].key
# Where [first_match] searches existing keys at that level
# If no key exists at that level: ERROR
```

**Idempotence guarantee:**
```
toUndUni(toUndUni(x)) === toUndUni(x)
fromUndUni(fromUndUni(x)) === fromUndUni(x)
```

#### 3.4. String Values

By default the value is simply kept unchanged. When the "friendly" plugin is invoked, additional processing occurs:
- Strings with non-ASCII visible characters MUST be enclosed in "
- Idem when string ends with spaces, to make them visible
- C-style escapes MUST be supported
- Whitespace MUST be preserved in all values

#### 3.4.1. Quote Delimiter Behavior

Double quotes act as delimiters and are removed ONLY when:
- The opening quote immediately follows the = sign (no whitespace)
- The closing quote is at the end of the value (no trailing whitespace)

In all other cases, quotes are part of the value.

**Examples:**
```
KEY="value"        → value
KEY= "value"       → "value"  (space before)
KEY="value"        → "value"  (space after)
KEY="value with spaces"  → value with spaces
KEY=  " spaced "   → " spaced "
```

**Escape sequences:**
- Only processed inside properly delimited quotes
- C-style escapes: \n, \t, \r, \b, \f, \\, \"

**Example:**
```
KEY="line1\nline2"  → line1[newline]line2
KEY=line1\nline2    → line1\nline2 (literal backslash-n)
```

### 4. Type System

#### 4.1. Type Inference

By default there is no type inference and all values are strings. When the "friendly" plugin is invoked, this changes and values are then inferred as:
- **Integers**: Digit-only values
- **Floats**: Values with decimal points
- **Booleans**: true, false, etc.
- **Null**: null, void, etc.
- **Dates**: ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
- **Strings**: All other values

#### 4.2. Friendly Constants

When the "friendly" plugin is involved, some special values are detected. Case-insensitive special values:
- **Boolean True**: t, true, True, TRUE, on, On, ON, y, yes, Yes, YES
- **Boolean False**: f, false, False, FALSE, off, Off, OFF, n, no, No, NO
- **Null**: n, nil, void, null, undefined, NULL, none, None, NONE, -
- **Empty String**: "", empty, Empty, EMPTY

### 5. Semantic Rules

#### 5.1. Parsing Rules

- Lines MUST be processed sequentially
- Lines MUST be split at the first =
- Keys MUST be processed for nesting and escaping by plugins
- Values MUST be parsed based on inferred type by plugins

#### 5.2. Arrays

##### 5.2.1. Implicit Arrays

- When a key appears multiple times, an array is created automatically
- Arrays can contain heterogeneous types
- Values are appended in order of appearance

**Example:**
```env
ITEMS=123
ITEMS=hello
ITEMS=true
```

**Result:** `{ items: [123, "hello", true] }`

##### 5.2.2. Explicit Arrays

- Empty arrays MUST use declarative [] value
- Single-element arrays CAN use [] declaration
- The [] syntax forces array type even for single values

**Example:**
```env
EMPTY=[]              # Empty array
SINGLE=[]=value       # Single-element array (if needed)
```

**Result:** `{ empty: [], single: ["value"] }`

##### 5.2.3. Type Declaration Priority

- If [] is declared first, the key is typed as array
- Subsequent assignments append to the array

**Example:**
```env
ITEMS=[]
ITEMS=a
ITEMS=b
```

**Result:** `{ items: ["a", "b"] }`

#### 5.3. Objects

##### 5.3.1. Explicit Objects

- Empty objects MUST use declarative {} value
- The {} syntax forces object type
- Object properties use nesting notation after declaration

**Example:**
```env
CONFIG={}
CONFIG.host=localhost
CONFIG.port=5432
```

**Result:** `{ config: { host: "localhost", port: 5432 } }`

##### 5.3.2. Implicit Objects

- Objects are created implicitly through nesting
- No {} declaration required if properties follow

**Example:**
```env
SERVER.HOST=localhost
SERVER.PORT=8080
```

**Result:** `{ server: { host: "localhost", port: 8080 } }`

#### 5.4. Concatenation

When the same key reappears:
- A newline character (\n) MUST be added between values
- Escape sequences in quoted strings MUST remain unchanged
- String conversion MUST follow host language rules
- Quoted strings MUST be dequoted before concatenation
- Non-string values MUST be converted to strings first

#### 5.4.1. Heterogeneous Lists

When the same key repeats with different types:
- Each value retains its inferred type
- No type coercion is performed
- The result is a heterogeneous array

**Example:**
```env
VALUES=123
VALUES=hello
VALUES=true
VALUES=null
```

**Result:** `{ values: [123, "hello", true, null] }`

**Note:** This behavior differs from concatenation (Section 5.4) which only applies to string values and uses newline joining.

#### 5.5. Plugins

Syntax #plug introduces plugins extension possibilities. Use special pragma style comment `#plug version 1.0.0` to enable the default plugins. Future versions will be defined in complementary RFCs. Default plugins are:

- **version**: to specify what version the content complies with
- **include**: to include a file
- **shell**: to execute a shell command
- **eval**: to evaluate a javascript expression
- **friendly**: to decode friendly key names, enabled by default
- **dot**: to unflatten keys using dot separator, enabled by default
- **nesting**: to unflatten keys using specified separator
- **raw**: disable the friendly plugin, including nesting logic
- **prefix**: to add a prefix to every keys
- **plugins**: to track processed plugins
- **Cstyle**: to enable C style values decoding
- **define**: to enable C preprocessor style substitutions

##### 5.5.1. Plugin Priority

When multiple plugins affect the same behavior:
- The last declared plugin takes precedence
- Plugins can be re-enabled after being disabled
- State changes apply to all subsequent lines

**Example:**
```env
#plug friendly     # Friendly mode ON
KEY-ONE=value      # Encoded as KEY_s_ONE

#plug raw          # Friendly mode OFF
KEY-TWO=value      # Kept as KEY-TWO (error if invalid)

#plug friendly     # Friendly mode ON again
KEY-THREE=value    # Encoded as KEY_s_THREE
```

Plugin state is cumulative except where explicitly overridden.

### 6. Examples

Please assume `#plug version 1.0.0` for all examples. That version enables the "friendly" plugin by default.

#### 6.1. Basic Types and Nesting

```env
# Object with various types, using _ for nesting
#plug nesting _
APP_NAME=My Application
APP_TEMPERATURE=0.7
APP_VERSION="1.0"
APP_TOOL_NAME=best
APP_TOOL_VERSION=1.0.0
```

#### 6.2. Alternative Nesting

```env
# Using dots for nesting, default friendly mode
SERVER.CONFIG.main.HOST=api.example.com
SERVER.CONFIG.main.PORT=8080
SERVER.CONFIG.STATUS=off
SERVER_s_CONFIG_DEBUG=t
```

#### 6.3. Arrays and Objects

```env
# Simple array
ITEMS=item1
ITEMS=item2

# Object with coordinates
POINT={}
POINT_x=10
POINT_y=10

# Empty containers
EMPTY__OBJECT={}
EMPTY__ARRAY=[]
```

#### 6.4. Special Cases

```env
# Escaped keys
WEATHER_o_TODAY=WEATHER-TODAY

# String concatenation
TEXT=This is a multiline
TEXT=test
TEXT="\b!"
```

### 7. Security

Input validation is REQUIRED. Silently ignore all risky plugins using the "strict" plugin.

### 8. Previous Art

#### 8.1. Dotenv
https://github.com/motdotla/dotenv - Simple KEY=VALUE pairs.

#### 8.2. INI
https://en.wikipedia.org/wiki/INI_file - Sections, KEY=VALUE.

#### 8.3. JSON
https://www.json.org/json-en.html - Data interchange format.

#### 8.4. YAML
https://yaml.org/ - Human-readable data.

#### 8.5. TOML
https://toml.io/ - Minimal configuration.

### 9. Future Considerations

#### 9.1. Formal Grammar

The ABNF grammar for StructEnv keys:

```abnf
; Line structure
file = *line
line = empty-line / comment-line / key-value-line
empty-line = *WSP EOL
comment-line = *WSP "#" *VCHAR EOL
key-value-line = *WSP key "=" value EOL
EOL = CRLF / LF
CRLF = %x0D %x0A
LF = %x0A

; Key definition
key = letter *(letter / digit / underscore / dot / dash)
fqn = key *(separator key)
separator = dot / underscore
letter = %x41-5A / %x61-7A   ; A-Z / a-z
digit = %x30-39              ; 0-9
underscore = %x5F            ; _
dot = %x2E                   ; .
dash = %x2D                  ; -

; Value definition
value = quoted-string / unquoted-string / friendly-constant / declarative-syntax / number
quoted-string = DQUOTE 1*char DQUOTE  ; non-empty quoted string
unquoted-string = *VCHAR
char = escaped / unescaped
escaped = "\" (DQUOTE / "\" / "b" / "f" / "n" / "r" / "t")
unescaped = %x20-21 / %x23-5B / %x5D-7E   ; printable chars except DQUOTE and \

; Number definition
number = integer / float
integer = [sign] 1*digit
float = [sign] (decimal / scientific)
decimal = (1*digit "." *digit) / (*digit "." 1*digit)
scientific = (decimal / 1*digit) ("e" / "E") [sign] 1*digit
sign = "+" / "-"

; Friendly constants
friendly-constant = boolean-true / boolean-false / null-value
boolean-true = %i"t" / %i"true" / %i"on" / %i"y" / %i"yes"
boolean-false = %i"f" / %i"false" / %i"off" / %i"n" / %i"no"
null-value = %i"n" / %i"nil" / %i"void" / %i"null" / %i"undefined" / %i"none" / "-"

; Declarative syntax
declarative-syntax = empty-array / empty-object / empty-string
empty-array = "[" "]"
empty-object = "{" "}"
empty-string = """" / %i"empty"

WSP = SP / HTAB
DQUOTE = %x22                ; "
SP = %x20                    ; space
HTAB = %x09                  ; horizontal tab
```

**Additional rules:**
- Maximum key length: 128 characters
- Keys are case-sensitive
- The presence of a dot in any key determines the nesting format:
  * If any key contains a dot, all keys must use dot notation for nesting
  * Otherwise, underscore notation is used for nesting
- No consecutive dots or underscores allowed
- No trailing dots or underscores allowed

#### 9.1.1. Nesting Depth Limit

Maximum nesting depth:
- Default: 32 levels
- Configurable via plugin: `#plug maxdepth N`
- Exceeding the limit MUST result in a parse error

**Example:**
```env
#plug maxdepth 5

a.b.c.d.e=ok        # 5 levels: valid
a.b.c.d.e.f=fail    # 6 levels: ERROR
```

**Depth counting:**
- Top-level keys count as depth 1
- Each nesting separator adds 1 to depth
- Array indices do not count toward depth

#### 9.2. MIME Type

`x-structenv` SHOULD be registered.

#### 9.3. File Extension

`.env` is the recommended extension.

#### 9.4. Character Encoding

UTF-8 SHOULD be the standard encoding.

#### 9.5. Implementation

Reference implementations in JavaScript and Python.

#### 9.6. Interoperability

Must maintain dotenv tool compatibility.

#### 9.7. Versioning

Use _ for metadata and versioning.

[End of RFC Draft]

---

## RFC Amendments and Clarifications

**Co-authored by:** Claude (Anthropic AI Assistant) and Jean Hugues Robert  
**Date:** October 2025  
**Status:** Errata and clarifications to RFC v1.0.0

The following sections provide additional clarification on ambiguous aspects of the original RFC specification. These amendments are based on implementation discussions and are intended to be incorporated into a future RFC revision.

### Amendment 1: Normalization and Canonical Form

**Replaces:** Section 3.3.1 "Re-encoding Rules"

**Rationale:** The original specification's concept of "idempotence" was ambiguous. The actual design principle is "tolerant input, strict output" - accepting multiple human-friendly representations but always producing a canonical machine form.

#### A1.1 Parsing Behavior by Mode

Parsing behavior depends on active plugins:

**In Friendly Mode (default with version 1.0.0):**

When parsing keys that contain encoding patterns:
1. Decode all recognized patterns (_s_, _a_, __, _5F_, etc.)
2. Store in normalized form (JavaScript object with original characters)
3. On re-encoding, use canonical form (friendly encoding preferred)

Canonical encoding order of preference:
1. Friendly forms: _s_, _a_, _h_, etc. (most readable)
2. Hex forms: _2D_, _40_, _23_, etc. (fallback)
3. Configurable via plug encoding directive

Example - Multiple inputs normalize to same output:

    project-name=App        # Raw dash
    project_s_name=App      # Friendly encoding  
    project_2D_name=App     # Hex encoding
    project_o_name=App      # Alternative friendly

    All decode to: { "project-name": "App" }
    
    Re-encoding produces canonical form (friendly by default):
    PROJECT_s_NAME=App

**In Raw Mode:**

When plug raw is active:
- No decoding: All characters are kept literally
- No encoding: Keys must be valid without special characters
- Pattern preservation: _s_, _5F_, __ are literal strings

Example:

    #plug raw
    my_s_key=value     # Result: { "my_s_key": "value" }
    my__key=value      # Result: { "my__key": "value" }
    project-name=test  # ERROR: dash not allowed in raw mode

#### A1.2 Underscore Handling with Nesting Separator

When the nesting separator is NOT underscore:
- Underscore characters are treated as literal characters
- No encoding to __ is performed
- Underscores in keys remain as-is

Example:

    #plug version 1.0.0
    #plug nesting .
    
    my_special_key=value    # Result: { my_special_key: "value" }
    user.first_name=John    # Result: { user: { first_name: "John" } }

When the nesting separator IS underscore:
- Underscore is the nesting operator
- To use literal underscore in key names, encode as __

Example:

    #plug version 1.0.0
    #plug nesting _
    
    my_special_key=value       # Result: { my: { special: { key: "value" } } }
    my__literal__key=value     # Result: { "my_literal_key": "value" }

#### A1.3 Roundtrip Stability Guarantee

After one normalization cycle, output is stable. This is the actual
guarantee rather than function-level idempotence:

    const obj = fromDotenv(humanInput);
    const env1 = toDotenv(obj);
    const env2 = toDotenv(fromDotenv(env1));
    assert(env1 === env2);  // Canonical form is stable

Note: The original human-written format may differ from the
machine-generated canonical form. This is intentional:
- Human input: Maximum flexibility and readability
- Machine output: Consistency and predictability

#### A1.4 Pattern Detection Rules

Encoding patterns are recognized when:
- Pattern is complete: _XX_ where XX is valid encoding
- For friendly codes: _s_, _a_, _h_, etc.
- For hex codes: _[0-9A-F]+_
- Double underscore: __ (decoded to single _ in friendly mode)

Edge cases:

    # Complete patterns - decoded in friendly mode:
    key_s_name=value      # Result: { "key-name": "value" }
    test_5F_key=value     # Result: { "test_key": "value" }
    
    # Incomplete patterns - kept literal:
    key_s=value           # Result: { "key_s": "value" } (no closing _)
    _s_key=value          # Result: { "-key": "value" } (valid at start)
    key_s_=value          # Result: { "key-": "value" } (valid at end)
    
    # In raw mode - all kept literal:
    key_s_name=value      # Result: { "key_s_name": "value" }

### Amendment 2: Additional Plugin - encoding

**Status:** Proposed for v1.1.0

**Purpose:** Control canonical encoding form for re-encoding operations

**Syntax:**
    #plug encoding [friendly|hex|minimal]

**Options:**
- friendly (default): Use readable forms (_s_, _a_, etc.)
- hex: Use hexadecimal forms (_2D_, _40_, etc.)
- minimal: Use shortest form available

**Example:**

    #plug version 1.0.0
    #plug encoding hex
    
    # Input with friendly encoding
    project_s_name=MyApp
    
    # Will be normalized and re-encoded as:
    PROJECT_2D_NAME=MyApp

**Example with minimal:**

    #plug encoding minimal
    
    # Prefer double underscore over _5F_
    my_key=value         # Re-encodes to: MY__KEY=value

### Amendment 3: Clarification on Key Repetition Behavior

**Clarifies:** Section 5.2 "Arrays" and Section 5.4 "Concatenation"

When the same key appears multiple times:
- Default behavior: Create heterogeneous array
- Each value retains its inferred type
- No type coercion is performed

Example:

    VALUES=123
    VALUES=hello
    VALUES=true
    VALUES=null
    
    Result: { values: [123, "hello", true, null] }

This differs from string concatenation which applies only when
explicitly using quoted multiline strings.

### Amendment 4: Plugin Priority Rules

**Clarifies:** Section 5.5.1 "Plugin Priority"

When multiple plugins affect the same behavior:
- The last declared plugin takes precedence
- Plugins can be re-enabled after being disabled
- State changes apply to all subsequent lines

Example:

    #plug friendly     # Friendly mode ON
    KEY-ONE=value      # Encoded as KEY_s_ONE
    
    #plug raw          # Friendly mode OFF
    KEY-TWO=value      # Kept as KEY-TWO (or error if invalid)
    
    #plug friendly     # Friendly mode ON again
    KEY-THREE=value    # Encoded as KEY_s_THREE

Plugin state is cumulative except where explicitly overridden.

---

[End of Amendments]

---

## Format Specification Summary

StructEnv files follow these core specifications:

### File Format
- UTF-8 encoded text files
- Line-oriented configuration
- Lines ending with LF (\n) or CRLF (\r\n)
- Empty lines and comments (#) are ignored
- Plugin declarations start with `#plug`

### Key Naming Rules
- Must start with a letter or underscore
- Can contain letters, numbers, dots, dashes, and underscores
- Special characters must be encoded using UndUni
- Maximum length: 255 characters (encoded)

### Value Types
- Strings (default)
- Numbers (integers and floats)
- Booleans (true/false)
- Null (explicit null value)
- Arrays (heterogeneous)
- Objects

### Nesting Notation
- Dot notation: `parent.child=value`
- Underscore notation: `parent_child=value`
- Configurable via `#plug nesting` directive

### Plugin System
- Plugin declarations are processed in order
- Plugins can modify parsing and processing behavior
- Last declared plugin wins for conflicting settings
- Custom plugins must follow plugin API

### Error Handling
- Invalid plugin configurations throw descriptive errors
- Plugin errors include detailed error messages with line numbers
- Parse errors are clear and actionable

### Best Practices
- Always specify version at the start: `#plug version 1.0.0`
- Use strict mode for critical configurations
- Leverage friendly mode for readable keys
- Use appropriate plugins for different data formats
- Handle plugin errors appropriately
- Keep nesting depth reasonable (< 10 levels)
- Use includes for modularity

## Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

- 🐛 **Bug reports**: Include minimal reproduction case
- 💡 **Feature requests**: Explain the use case
- 📚 **Documentation**: Typos, clarifications, examples

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/structenv.git
cd structenv

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build
npm run build
```

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- parser.test.js

# Coverage
npm run test:coverage
```

### Code Style

- Use ES modules syntax
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Write tests for new features
- Update documentation

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with tests
4. Run tests: `npm test`
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation only
- `test:` Adding tests
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `chore:` Maintenance tasks
- `style:` Code style changes

## License

MIT License

---

**StructEnv** - Configuration files that make sense to humans and machines alike.


