export function initMap(containerId, center = { lat: 12.9716, lng: 77.5946 }, zoom = 12) {
  const map = new google.maps.Map(document.getElementById(containerId), { center, zoom });
  return map;
}

export function addMarker(map, bunk, onClick) {
  const marker = new google.maps.Marker({
    position: { lat: bunk.lat, lng: bunk.lng },
    map,
    title: bunk.name
  });
  marker.addListener("click", () => onClick(bunk));
}
