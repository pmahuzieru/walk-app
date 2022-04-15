import json
import pickle
import random
from typing import Any, Dict, Tuple

import folium
import requests
from shapely.geometry import LineString, Point, Polygon, mapping, shape
from shapely.ops import transform

from constants import *


def pickle_response_dict(r_dict):
    try:
        with open(SAVE_PATH, mode="wb") as f:
            pickle.dump(r_dict, f)
            print('Pickled.')
    except BaseException:
        print('Could not pickle.')
        raise


def load_responses():
    try:
        with open(SAVE_PATH, mode='rb') as f:
            response_dict = pickle.load(f)
        print('Unpickled.')
        return response_dict
    except FileNotFoundError:
        print("Pickle doesn't exist")
        return {}
        
    
def get_isochrone_geom(r):
    r_json = r.json()
    return shape(r_json['features'][0]['geometry'])


def show_in_map(r_dict, r_id):

    start_lng, start_lat = r_id[0]

    isochrone_geom = get_isochrone_geom(r_dict, r_id)
    poly_centroid = isochrone_geom.centroid
    centroid_lng, centroid_lat = poly_centroid.x, poly_centroid.y

    # Instantiate map
    m = folium.Map(location=[centroid_lat, centroid_lng], zoom_start=FOLIUM_START_ZOOM)

    # Add starting position
    folium.Marker([start_lng, start_lat], popup="Start location").add_to(m)

    # Add isochrone geometry
    isochrone_geom_geojson = json.dumps(mapping(isochrone_geom))
    folium.GeoJson(isochrone_geom_geojson).add_to(m)

    m.save(f"{ROOT_DIR}/maps/map.html")


def get_random_route(start_loc: Tuple, total_walking_minutes: int):
    """
    1. Fijar un punto de partida y un total de minutos caminados
    2. Suponer que ida y vuelta demoran lo mismo
    3. Tirar una isocrona de total_walking_minutes/2
    4. Elegir un punto del contorno de la isocrona aleatoriamente
    5. Calcular la ruta a ese punto y de vuelta
    6. Entregar la ruta en mapa y datos de la ruta (duración, distancia, etc.)
    """

    # Read user input: start location and walking time
    start_point_geom = Point(start_loc[0], start_loc[1])
    start_lng, start_lat = start_point_geom.x, start_point_geom.y
    halfway_isochrone_minutes = total_walking_minutes/2

    # Search if we already have an isochrone (maybe approximately)
    r_id = ((start_lng, start_lat), halfway_isochrone_minutes)
    r_isochrone = get_isochrone(r_id)

    # Get random point in perimeter
    isochrone_geom = get_isochrone_geom(r_isochrone)
    destination_point_geom = random_point_in_perimeter(isochrone_geom)

    # Get route to destination and back
    routes = get_walking_route(start_point_geom, destination_point_geom)
    route_geom = shape(routes.json()['routes'][0]['geometry'])

    m = elements_to_map(start_point_geom, destination_point_geom, route_geom)

    return m


def elements_to_map(start_point_geom, destination_point_geom, route_geom):

    m = folium.Map(location=[start_point_geom.y, start_point_geom.x], zoom_start=FOLIUM_START_ZOOM)

    # Add starting position
    folium.Marker([start_point_geom.y, start_point_geom.x], popup="Start location").add_to(m)

    # Add destination position
    folium.Marker([destination_point_geom.y, destination_point_geom.x], popup="End location").add_to(m)

    # Add route
    route_yx = transform(lambda x, y: (y, x), route_geom)
    folium.PolyLine(list(route_yx.coords)).add_to(m)

    return m


def get_walking_route(point_a, point_b):

    print('Requesting route to API...', end='')
    
    params = {
        'geometries':'geojson',
        'access_token':MAPBOX_ACCESS_TOKEN
    }

    coordinates_order_str = f'{point_a.x},{point_a.y};{point_b.x},{point_b.y};{point_a.x},{point_a.y}'
    url = f"{DEFAULT_DIRECTIONS_API_URL}{coordinates_order_str}"

    r = requests.get(url, params=params)

    if r.status_code == 200:
        print('OK')
        return r
    else:
        print('Request to API failed.')
        raise BaseException


def random_point_in_perimeter(poly_geom):
    poly_vertex_list = list(poly_geom.exterior.coords)

    rand_i = random.randrange(0, len(poly_vertex_list))
    
    vertex_1, vertex_2 = poly_vertex_list[rand_i], poly_vertex_list[rand_i-1]

    line_geom = LineString([vertex_1, vertex_2])

    rand_frac = random.random()

    random_point = line_geom.interpolate(rand_frac, normalized=True)
    
    return random_point


def get_isochrone(r_id):
    """
    Recibe tupla identificadora y busca si existe (o una similar eventualmente)
    """

    (start_lng, start_lat), halfway_isochrone_minutes = r_id

    isochrone_response_dict = load_responses()

    isochrone_response = isochrone_response_dict.get(r_id, False)

    if not isochrone_response:
        isochrone_response = request_to_api(start_lng, start_lat, halfway_isochrone_minutes)
    return isochrone_response


def request_to_api(lng, lat, minutes):

    print('Requesting isochrone to API...', end='')
    params = {
        'contours_minutes':minutes,
        'polygons':DEFAULT_POLYGONS,
        'access_token':MAPBOX_ACCESS_TOKEN
    }

    r = requests.get(f"{DEFAULT_ISOCHRONE_API_URL}{lng},{lat}", params=params)
    
    if r.status_code == 200:
        print('OK')
        response_dict = load_responses()
        request_id = ((lng, lat), minutes)
        response_dict.update({request_id:r})
        pickle_response_dict(response_dict)
        return r
    else:
        print('Request to API failed.')
        raise 
