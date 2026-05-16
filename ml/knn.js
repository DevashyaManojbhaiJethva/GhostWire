const GRID_SIZE = 0.0045;
const K = 7;
const EARTH_RADIUS_M = 6371000;

function haversine(lat1, lng1, lat2, lng2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

function snapToGrid(lat, lng) {
  return {
    lat: Number((Math.round(lat / GRID_SIZE) * GRID_SIZE).toFixed(6)),
    lng: Number((Math.round(lng / GRID_SIZE) * GRID_SIZE).toFixed(6))
  };
}

function getGridId(lat, lng) {
  const snapped = snapToGrid(lat, lng);
  return `${snapped.lat}_${snapped.lng}`;
}

function getRiskLevel(crashCount) {
  if (crashCount >= 5) {
    return 'red';
  }

  if (crashCount >= 3) {
    return 'orange';
  }

  if (crashCount >= 1) {
    return 'yellow';
  }

  return 'green';
}

function runKNN(crashPoints) {
  try {
    if (!Array.isArray(crashPoints) || crashPoints.length === 0) {
      return [];
    }

    const cells = new Map();

    crashPoints.forEach((point) => {
      const center = snapToGrid(Number(point.lat), Number(point.lng));
      const gridId = getGridId(center.lat, center.lng);
      const existing = cells.get(gridId) || {
        grid_id: gridId,
        center,
        crash_count_30d: 0
      };

      existing.crash_count_30d += 1;
      cells.set(gridId, existing);
    });

    return Array.from(cells.values()).map((cell) => {
      const neighbors = crashPoints
        .map((point) => ({
          point,
          distance: haversine(cell.center.lat, cell.center.lng, Number(point.lat), Number(point.lng))
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, K);

      const riskScore = neighbors.reduce((sum, neighbor) => {
        return sum + 1 / (neighbor.distance + 1);
      }, 0);

      return {
        grid_id: cell.grid_id,
        center: cell.center,
        risk_score: Number(riskScore.toFixed(6)),
        risk_level: getRiskLevel(cell.crash_count_30d),
        crash_count_30d: cell.crash_count_30d
      };
    });
  } catch (error) {
    console.log(`❌ KNN scoring failed: ${error.message}`);
    return [];
  }
}

function toGeoJSON(scoredCells) {
  try {
    return {
      type: 'FeatureCollection',
      features: (scoredCells || []).map((cell) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [cell.center.lng, cell.center.lat]
        },
        properties: {
          grid_id: cell.grid_id,
          risk_score: cell.risk_score,
          risk_level: cell.risk_level,
          crash_count_30d: cell.crash_count_30d
        }
      }))
    };
  } catch (error) {
    console.log(`❌ GeoJSON conversion failed: ${error.message}`);
    return { type: 'FeatureCollection', features: [] };
  }
}

module.exports = {
  GRID_SIZE,
  K,
  haversine,
  snapToGrid,
  getGridId,
  getRiskLevel,
  runKNN,
  toGeoJSON
};
