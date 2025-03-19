# StructEnv
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


