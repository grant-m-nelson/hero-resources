import csv
import json
import re

def python_dict_to_json_string(python_dict_str: str) -> str:
    json_str = python_dict_str.replace("'", '"')
    json_str = re.sub(r'\bTrue\b', 'true', json_str)
    json_str = re.sub(r'\bFalse\b', 'false', json_str)
    json_str = re.sub(r'\bNone\b', 'null', json_str)

    return json_str

def csv_to_json(csv_filename, json_filename):
    with open(csv_filename, mode='r', newline='', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        headers = next(reader)

        all_rows = []

        for row in reader:
            # Skip empty lines
            if not row or len(row) < len(headers):
                continue

            row_dict = {}
            for header, value in zip(headers, row):
                if header.lower() == 'modifiers':
                    json_like = python_dict_to_json_string(value)
                    # Now parse as JSON
                    row_dict[header] = json.loads(json_like)
                else:
                    try:
                        row_dict[header] = float(value)
                    except ValueError:
                        row_dict[header] = value

            all_rows.append(row_dict)

    with open(json_filename, mode='w', encoding='utf-8') as outfile:
        json.dump(all_rows, outfile, indent=4)

if __name__ == "__main__":
    input_csv = "steady_states.csv"
    output_json = "steady_states.json"
    csv_to_json(input_csv, output_json)
    print(f"Finished converting {input_csv} -> {output_json}")
