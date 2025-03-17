import json
import re

def env_to_json(env_str):
    """Convert StructEnv string to JSON object."""
    result = {}
    lines = env_str.split('\n')
    current_multiline_key = None
    multiline_values = []
    use_dots = '.' in env_str
    has_dash = bool(re.search(r'[^_o-]-', env_str))

    def infer_type(value):
        if value == '[]': return []
        if value == '{}': return {}
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1].encode().decode('unicode_escape')
            return value
        if value.isdigit():
            return int(value)
        if value.replace('.', '').isdigit() and '.' in value:
            return float(value)
        lower_value = value.lower()
        if lower_value in {'t', 'true', 'on', 'y', 'yes'}:
            return True
        if lower_value in {'f', 'false', 'off', 'n', 'no'}:
            return False
        if lower_value in {'n', 'nil', 'void', 'null', 'undefined', 'none', '-'}:
            return None
        if lower_value in {'empty'} or value == '':
            return ''
        if re.match(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$', value):
            return value
        return value

    for line in lines:
        if not re.match(r'^\s*[^\s=]+=', line):
            continue
        line = re.sub(r'^\s+', '', line)
        if not line or line.startswith('#'):
            continue

        try:
            key, value = line.split('=', 1)
            if ' ' in key:
                continue
        except ValueError:
            continue

        if current_multiline_key:
            if key == current_multiline_key and not value.startswith('"'):
                multiline_values.append(value)
                continue
            else:
                result[current_multiline_key] = '\n'.join(multiline_values)
                current_multiline_key = None
                multiline_values = []

        if value.startswith('"') and not value.endswith('"'):
            current_multiline_key = key
            multiline_values = [value[1:]]
            continue

        parts = key.split('.') if use_dots else key.split('_')
        separator = '.' if use_dots else '_'
        escaped_parts = [
            p if has_dash else p.replace(f'{separator}{separator}', separator)
                               .replace(f'{separator}s{separator}', separator)
                               .replace('___', '-')
                               .replace('_o_', '-')
            for p in parts
        ]

        current = result
        for i, part in enumerate(escaped_parts[:-1]):
            if part not in current:
                current[part] = {}
            current = current[part]

        last_key = escaped_parts[-1]
        typed_value = infer_type(value)

        if last_key in current and isinstance(current[last_key], list):
            current[last_key].append(typed_value)
        elif last_key in current and not isinstance(current[last_key], dict):
            current[last_key] = [current[last_key], typed_value]
        else:
            current[last_key] = typed_value

    if current_multiline_key:
        result[current_multiline_key] = '\n'.join(multiline_values)

    return json.dumps(result, indent=2)

def json_to_env(json_str):
    """Convert JSON string to StructEnv format."""
    data = json.loads(json_str)
    lines = []
    use_dots = '.' in json_str
    has_dash = '-' in json_str

    def escape_key(key):
        if has_dash:
            return key
        if use_dots:
            return key.replace('.', '_s_').replace('-', '_o_')
        return key.replace('_', '__').replace('-', '___')

    def value_to_str(value):
        if value is True:
            return 'on'
        if value is False:
            return 'off'
        if value is None:
            return 'void'
        if value == '':
            return 'empty'
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, str):
            if '\n' in value or any(ord(c) > 127 for c in value) or value in ('[]', '{}'):
                return f'"{value.replace('"', '\\"')}"'
            return value
        if isinstance(value, list):
            return '[]' if not value else None
        if isinstance(value, dict):
            return '{}' if not value else None
        return str(value)

    def process_node(obj, prefix=''):
        if isinstance(obj, (dict, list)) and obj is not None:
            if isinstance(obj, list):
                if not obj:
                    lines.append(f'{prefix}=[]')
                else:
                    for item in obj:
                        str_value = value_to_str(item)
                        if str_value is not None:
                            lines.append(f'{prefix}={str_value}')
            else:
                for key, value in obj.items():
                    full_key = f'{prefix}{escape_key(key)}' if prefix else escape_key(key)
                    str_value = value_to_str(value)
                    if str_value is not None:
                        lines.append(f'{full_key}={str_value}')
                    if isinstance(value, (dict, list)) and value:
                        process_node(value, f'{full_key}{"." if use_dots else "_"}')

    process_node(data)
    return '\n'.join(lines)
    