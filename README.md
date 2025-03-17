# StructEnv
StructEnv format for configurations, when dotenv meets json.

"This is a benchmark for AI code generation. Let's see what we
can expect. This is version 1.0. Feel free to fork this repo
to improve the RFC and the generated code.

So far, AI tools that I tested perform poorly, humans still rule!
But maybe that's just because I'm so dumb at writting specifications ;)

Yours,

   Jean Hugues, aka Baron Mariani di Corti.
   15th of March 2025, Corti, Corsica.
"

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
        - Underscores (_) are used for nesting by default
        - When a dot (.) appears in any key, dots become the nesting separator
        - _ MUST be escaped as __ or _s_ when _ is used for nesting
        - - MUST be escaped as ___ or _o_ unless a dash (-) appears in a key

    3.3.  String Values

        - Strings with non-ASCII visible characters MUST be enclosed in "
        - C-style escapes MUST be supported
        - A " prefix forces string type, overriding inference
        - Whitespace MUST be preserved in all values

4.  Type System

    4.1.  Type Inference

        Values are inferred as:
        - Integers: Digit-only values
        - Floats: Values with decimal points
        - Booleans: true, false, etc.
        - Null: null, void, etc.
        - Dates: ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
        - Strings: All other values

    4.2.  Friendly Constants

        Case-insensitive special values:
        - Boolean True: t, true, True, TRUE, on, On, ON, y, yes, Yes, YES
        - Boolean False: f, false, False, FALSE, off, Off, OFF, n, no, No, NO
        - Null: n, nil, void, null, undefined, NULL, none, None, NONE, -
        - Empty String: "", empty, Empty, EMPTY

5.  Semantic Rules

    5.1.  Parsing Rules

        - Lines MUST be processed sequentially
        - Lines MUST be split at the first =
        - Keys MUST be processed for nesting and escaping
        - Values MUST be parsed based on inferred type

    5.2.  Arrays

        - Arrays MUST be created by repeating the KEY
        - Empty arrays MUST use [] value
        - Single-element arrays MUST use [] declaration

    5.3.  Objects

        - Objects MUST use {} value
        - Object properties use nesting notation
        - Empty objects MUST use {} value

    5.4.  Concatenation

        When the same key reappears:
        - A newline character (\n) MUST be added between values
        - Escape sequences in quoted strings MUST remain unchanged
        - String conversion MUST follow host language rules
        - Quoted strings MUST be dequoted before concatenation
        - Non-string values MUST be converted to strings first

6.  Examples

    6.1.  Basic Types and Nesting

        # Object with various types
        APP_NAME=My Application
        APP_TEMPERATURE=0.7
        APP_VERSION="1.0"
        APP_TOOL_NAME=best
        APP_TOOL_VERSION=1.0.0

    6.2.  Alternative Nesting

        # Using dots for nesting
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

This is a benchmark for AI code generation. Let's see what we
can expect. This is version 1.0. Feel free to fork this repo
to improve the RFC and the generated code.

Yours,

   Jean Hugues, aka Baron Mariani di Corti.
   15th of March 2025, Corti, Corsica.

