import requests
import utils
from constants import MAPBOX_ACCESS_TOKEN

if __name__ == '__main__':
    
    profile = 'walking'
    contours_minutes = 10
    polygons = 'true'
    lng, lat = -71.545205, -32.935273  # Arenales 156, Concón

    base_url = f'https://api.mapbox.com/isochrone/v1/mapbox/{profile}/{lng},{lat}' 

    params = {
        'contours_minutes':contours_minutes,
        'polygons':polygons,
        'access_token':MAPBOX_ACCESS_TOKEN
    }

    r = requests.get(base_url, params=params)

    if r.status_code == 200:
        response_dict = utils.load_responses()
        request_id = ((lng, lat), contours_minutes)
        response_dict.update({request_id:r})
        utils.pickle_response_dict(response_dict)


