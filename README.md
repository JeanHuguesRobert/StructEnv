# StructEnv
StructEnv format for configurations, when dotenv meets json.

```
                                  StructEnv RFC Draft
                                  Jean Hugues Noel Robert
                                  1, cours Paoli. Corsica. F20250 France

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

3.  Format Specification

    3.1.  Basic Syntax

        Each line MUST consist of a KEY=VALUE pair.
        Whitespace before the KEY MUST be ignored.
        Whitespace after the KEY MUST be considered an error.
        Empty lines MUST be ignored.
        Lines beginning with # MUST be treated as comments.
        End-of-line comments MUST NOT be supported.

    3.2.  Nesting

        Nesting MUST be achieved with underscores (_) in keys.
        Example: PARENT_CHILD_VALUE=123

    3.3.  Arrays

        Arrays MUST be created by repeating the KEY.
        Example:
        ITEMS=item1
        ITEMS=item2
        Empty array and single elements MUST use a declarative
        [] value.

    3.4.  Objects

        Objects MUST use a declarative {} value.
        Example:
        POINT={}
        POINT_x=10
        POINT_y=20

    3.5.  Multiline Strings

        Multiline strings MUST start with " in the VALUE.
        Subsequent lines with the same KEY MUST be appended.
        Multiline strings MUST end on a different KEY.
        Example:
        TEXT="This is a multiline
        TEXT=string.
        NEXT_KEY=Next value

    3.6.  Type Inference

        Integers: Digit-only values.
        Floats: Values with decimal points.
        Booleans: on, off.
        Null: void.
        Dates: ISO 8601 (YYYY-MM-DDTHH:MM:SSZ).

    3.7.  Key Escaping

        _ MUST be escaped as __.
        - MUST be escaped as _o_.

    3.8.  Strings

        Strings with non ASCII visible characters MUST be enclosed in ".
        C-style escapes MUST be supported.

4.  Parsing Rules

    Lines MUST be processed sequentially.
    Lines MUST be split at the first =.
    Keys MUST be processed for nesting and escaping.
    Values MUST be parsed based on infered type.

5.  Ambiguous Cases

    There MUST be no ambiguous cases in the final draft.

                                  [Page 2]

6.  Examples

    APP_NAME=My Application
    APP_TEMPERATURE=0.7
    APP_VERSION="1.0"
    APP_TOOL_NAME=best
    APP_TOOL_VERSION=1.0.0
    SERVER_CONFIG_HOST=api.example.com
    ITEMS=item1
    ITEMS=item2
    POINT={}
    POINT_x=10
    POINT_y=10
    EMPTY__OBJECT={}
    EMPTY__ARRAY=[]
    SINGLE__ITEM=[]
    SINGLE__ITEM=SINGLE_ITEM
    WEATHER_o_TODAY=WEATHER-TODAY
    TEXT="This is a multiline
    TEXT=string.
    NEXT_KEY=Next value
    CSTYLE="Ring the \b!"

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

9.  Future

    Discussion on GitHubhttps://github.com/JeanHuguesRobert/StructEnv

10. Rationale

10.1. Formal Grammar (ABNF):
    Proposition: A formal grammar using ABNF SHOULD be added to
    provide a definitive specification.

10.2. MIME Type Registration:
    Proposition: A MIME type SHOULD be registered to enable
    proper file handling.

10.3. File Extension:
    Proposition: A standardized file extension SHOULD be
    recommended.

10.4. Character Encoding:
    Proposition: UTF-8 SHOULD be the specified character
    encoding.

10.5. Example Test Suite:
    *Proposition:* A comprehensive test suite SHOULD be included.

10.6. Security:
    *Proposition:* Expanded security guidance SHOULD be added.

10.7. Implementation:
    *Proposition:* Practical implementation guidance SHOULD be
    included.

10.8. Interoperability:
    Proposition: Interoperability guidance SHOULD be provided.

10.9. Versioning:
    Proposition: A versioning strategy SHOULD be defined.

10.10. Community:
    Proposition: Community involvement SHOULD be encouraged.

10.11 IANA Considerations:
    Proposition: If a MIME type is registered, IANA
    considerations SHOULD be added.

10.12. References:
    References to standards SHOULD be included.

                                  [End of RFC Draft]
```

