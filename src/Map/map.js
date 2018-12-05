import mapbox from "mapbox-gl";
import { blockColorProperty } from "../colors";
import Layer, { addBelowLabels } from "../Layers/Layer";

mapbox.accessToken =
    "pk.eyJ1IjoiZGlzdHJpY3RyIiwiYSI6ImNqbjUzMTE5ZTBmcXgzcG81ZHBwMnFsOXYifQ.8HRRLKHEJA0AismGk2SX2g";

// TODO: Just use map.fitBounds() on the bounding box of the tileset,
// instead of computing the center and guessing the zoom.

export function initializeMap(mapContainer) {
    const map = new mapbox.Map({
        container: mapContainer,
        style: "mapbox://styles/mapbox/light-v9",
        attributionControl: false,
        center: [-86.0, 37.83],
        zoom: 3
    });
    const nav = new mapbox.NavigationControl();
    map.addControl(nav, "top-left");
    return map;
}

function addUnits(map, tileset) {
    const units = new Layer(
        map,
        {
            id: tileset.sourceLayer,
            source: tileset.sourceLayer,
            "source-layer": tileset.sourceLayer,
            type: "fill",
            paint: {
                "fill-color": blockColorProperty,
                "fill-opacity": 0.8
            }
        },
        addBelowLabels
    );
    const unitsBorders = new Layer(
        map,
        {
            id: "units-borders",
            type: "line",
            source: tileset.sourceLayer,
            "source-layer": tileset.sourceLayer,
            paint: {
                "line-color": "#777777",
                "line-width": 1,
                "line-opacity": 0.3
            }
        },
        addBelowLabels
    );

    return { units, unitsBorders };
}

function addPoints(map, tileset) {
    return new Layer(map, {
        id: "units-points",
        type: "circle",
        source: tileset.sourceLayer,
        "source-layer": tileset.sourceLayer,
        paint: {
            "circle-opacity": 0
        }
    });
}

export function addLayers(map, tilesets) {
    for (let tileset of tilesets) {
        map.addSource(tileset.sourceLayer, tileset.source);
    }

    const { units, unitsBorders } = addUnits(
        map,
        tilesets.find(tileset => tileset.type === "fill")
    );
    const points = addPoints(
        map,
        tilesets.find(tileset => tileset.type === "circle")
    );

    return { units, unitsBorders, points };
}