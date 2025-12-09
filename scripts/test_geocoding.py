import ssl
from urllib.request import urlopen
from urllib.parse import quote
import json
import time

def geocode(address):
    time.sleep(1.1)
    context = ssl._create_unverified_context()
    url = f"https://nominatim.openstreetmap.org/search?q={quote(address)}&format=json&limit=1"
    try:
        with urlopen(url, context=context) as response:
            data = json.loads(response.read().decode())
            if data:
                return data[0]['lat'], data[0]['lon']
    except Exception as e:
        print(f"Error: {e}")
    return None, None

addresses = [
    "Westbound 16th Street between Potrero and Bryant, San Francisco, CA",
    "Linda Vista Ave. and Terra Bella Ave, Mountain View, CA",
    "BACK PARKING LOT OF NVIDIA ENDEAVOR, SANTA CLARA, CA"
]

print("Testing original addresses:")
for addr in addresses:
    print(f"'{addr}': {geocode(addr)}")

print("\nTesting cleaned/fallback addresses:")
cleaned_addresses = [
    "16th Street and Potrero, San Francisco, CA",
    "Linda Vista Ave and Terra Bella Ave, Mountain View, CA",
    "Santa Clara, CA"
]
for addr in cleaned_addresses:
    print(f"'{addr}': {geocode(addr)}")
