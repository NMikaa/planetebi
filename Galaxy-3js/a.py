import pandas as pd
import json

# Load the CSV file
file_path = 'data.csv' 
json_file = 'planets.json' # Update the path to your CSV file
try:
    df = pd.read_csv(file_path)
except Exception as e:
    print(f"Error reading the CSV file: {e}")

# Check if DataFrame is empty
if df.empty:
    print("DataFrame is empty.")
else:
    # Convert to JSON
    json_data = df.to_json(orient='records')

    with open(json_file, mode='w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=4)
