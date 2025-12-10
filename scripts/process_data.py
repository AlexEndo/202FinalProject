import json
import re
import os
import sys
import random
import time
import ssl
from urllib.request import urlopen
from urllib.parse import quote

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
INPUT_FILE = "data/collisions.json"
OUTPUT_FILE = "data/collisions_processed.json"
MOCK_GEOCODING = False  # Set to False to use real OpenStreetMap API

def geocode_request(query):
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={quote(query)}&format=json&limit=1"
        time.sleep(1.1)
        context = ssl._create_unverified_context()
        with urlopen(url, context=context) as response:
            data = json.loads(response.read().decode())
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        pass
    return None, None

def geocode_address(address, city, state="CA"):
    if MOCK_GEOCODING:
        if "San Francisco" in address or city == "San Francisco":
             return 37.7749 + random.uniform(-0.02, 0.02), -122.4194 + random.uniform(-0.02, 0.02)
        return 37.0 + random.uniform(-2, 2), -120.0 + random.uniform(-2, 2)

    cleaned = address
    prefixes = ["Parking lot at ", "Underground parking lot at ", "Back parking lot of ", "Westbound ", "Eastbound ", "Northbound ", "Southbound "]
    for p in prefixes:
        if cleaned.lower().startswith(p.lower()):
            cleaned = cleaned[len(p):].strip()
    
    lat, lon = geocode_request(f"{cleaned}")
    if lat: return lat, lon
    
    match = re.search(r'([A-Za-z0-9 .-]+)\s+(?:at|near|and)\s+([A-Za-z0-9 .-]+)', cleaned)
    if match:
        street1 = match.group(1).strip()
        street2 = match.group(2).split(',')[0].strip() 
        intersection_query = f"{street1} and {street2}, {city}, {state}"
        lat, lon = geocode_request(intersection_query)
        if lat: 
            return lat, lon

    lat, lon = geocode_request(f"{city}, {state}")
    if lat:
        lat += random.uniform(-0.008, 0.008)
        lon += random.uniform(-0.008, 0.008)
        return lat, lon

    return None, None

def parse_stream_json(content):
    objects = []
    decoder = json.JSONDecoder()
    pos = 0
    content = content.strip()
    
    while pos < len(content):
        while pos < len(content) and content[pos].isspace():
            pos += 1
        if pos >= len(content):
            break
            
        try:
            obj, idx = decoder.raw_decode(content[pos:])
            objects.append(obj)
            pos += idx
        except json.JSONDecodeError:
            break
            
    return objects

def process_data(input_path, output_path):
    if not os.path.exists(input_path):
        return

    with open(input_path, 'r') as f:
        raw_content = f.read()

    data = []
    try:
        data = json.loads(raw_content)
        if isinstance(data, list):
            pass
        else:
            data = [data]
    except json.JSONDecodeError:
        data = parse_stream_json(raw_content)

    processed = []
    for i, item in enumerate(data):
        if "form_type" in item or "section_1_manufacturer" in item:
            mfg = item.get("section_1_manufacturer", {}).get("manufacturer_name", "Unknown")
            
            veh1 = item.get("section_2_vehicle_1", {})
            date = veh1.get("date_of_accident", "")
            time_local = veh1.get("time_of_accident_local", "")
            
            injuries = item.get("section_4_injury_property", {}).get("persons", [])
            has_injury = False
            has_fatality = False
            for p in injuries:
                 if p.get("deceased"):
                     has_fatality = True
                 if p.get("injured"):
                     has_injury = True
            
            if has_fatality:
                severity = "Fatality"
            elif has_injury:
                severity = "Injury"
            else:
                severity = "Property Damage Only"
            
            acc = item.get("section_5_accident_details", {})
            narrative = acc.get("narrative_summary", "")
            mode = acc.get("mode", "Unknown")
            
            addr = veh1.get("location_address", "")
            city = veh1.get("location_city", "")
            state = veh1.get("location_state", "CA")
            
            if not city and "San Francisco" in narrative:
                city = "San Francisco"
            
            full_address = f"{addr}, {city}, {state}".strip(", ")
            
            col_type = "Other"
            desc_lower = narrative.lower()
            prop_desc = (item.get("section_4_injury_property", {}).get("property_damage_description") or "").lower()
            combined_desc = desc_lower + " " + prop_desc
            
            if "rear-end" in combined_desc or "rear end" in combined_desc:
                col_type = "Rear-end"
            elif "side-swipe" in combined_desc or "sideswipe" in combined_desc or "brush" in combined_desc:
                col_type = "Sideswipe"
            elif "stationary object" in combined_desc or "parked" in combined_desc:
                col_type = "Stationary Object"
            elif "broadside" in combined_desc or "t-bone" in combined_desc:
                col_type = "Broadside"
            
            lat, lon = None, None
            if full_address and len(full_address) > 5:
                lat, lon = geocode_address(full_address, city, state)

            processed.append({
                "id": f"report-{i+1}",
                "date": date,
                "time": time_local,
                "manufacturer": mfg,
                "location": full_address,
                "city": city,
                "collision_type": col_type,
                "severity": severity,
                "control_state": mode,
                "description": narrative,
                "lat": lat,
                "lon": lon
            })
        else:
            processed.append(item)
            
    with open(output_path, 'w') as f:
        json.dump(processed, f, indent=2)

if __name__ == "__main__":
    process_data(INPUT_FILE, OUTPUT_FILE)
