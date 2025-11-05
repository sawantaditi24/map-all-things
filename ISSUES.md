# Known Issues

## Issue: Radius Filter Not Working Correctly

**Issue Name:** `radius-filter-not-applying`

**Description:** 
When applying the radius filter (e.g., 5 km) from Olympic venues in the Advanced Filters section, locations outside the specified radius are still being displayed on the map.

**Expected Behavior:**
- When user sets radius to 5 km and clicks "Apply Filters"
- Backend should filter locations to only show those within 5 km of any Olympic venue
- Only locations within the radius should appear on the map

**Current Behavior:**
- Locations outside the specified radius are still appearing
- Filter may not be applying correctly or distance calculation may be incorrect

**Technical Details:**
- Frontend sends `radius_km` in filters object to `/search/advanced` endpoint
- Backend loads Olympic venues from `olympic_sports_venues.json`
- Backend uses Haversine formula to calculate distances
- Backend checks `is_within_radius()` function to filter locations
- Filter logic: `if filters.radius_km is not None and venues: if not is_within_radius(...): continue`

**Files Involved:**
- `my-map-app/src/pages/BusinessIntegration.jsx` - Frontend filter passing
- `my-map-app/socal-business-intelligence/backend/main.py` - Backend filtering logic
- `my-map-app/socal-business-intelligence/backend/main.py` - `is_within_radius()` function
- `my-map-app/src/bi/AdvancedFiltersContent.jsx` - Radius slider UI

**Debugging Steps:**
1. Check browser console for `🔍 Applying filters with radius_km: [value]`
2. Check backend logs for `Radius filter active: [value] km, loaded [number] Olympic venues`
3. Verify Olympic venues JSON file is loading correctly
4. Verify distance calculation is correct (Haversine formula)
5. Check if coordinates are in correct order (lat, lon vs lon, lat)

**Status:** Open
**Priority:** High
**Date Reported:** Current session

---

