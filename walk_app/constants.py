import os

# APP DIR DATA
ROOT_DIR = os.path.dirname(os.path.realpath(__file__))
SAVE_PATH = f"{ROOT_DIR}/data/responses.pickle"

# MAPBOX API DATA
MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoicG1haHV6aWVydSIsImEiOiJja3I0enNnOWUzMGFhMnB0OWtrcWFqZ3ljIn0.NL3sZAS49APOCjfTebkrZw"
API_DEFAULT_PROFILE = 'walking'
DEFAULT_POLYGONS = 'true'
DEFAULT_ISOCHRONE_API_URL = f'https://api.mapbox.com/isochrone/v1/mapbox/{API_DEFAULT_PROFILE}/'
DEFAULT_DIRECTIONS_API_URL = f'https://api.mapbox.com/directions/v5/mapbox/{API_DEFAULT_PROFILE}/'

# FOLIUM CONFIG
FOLIUM_START_ZOOM = 15