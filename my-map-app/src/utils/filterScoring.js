/**
 * Utility functions for scoring regions based on filter criteria
 */

/**
 * Calculate how well a value matches a filter range
 * @param {number} value - The actual value
 * @param {number} min - Minimum filter value (or null if not set)
 * @param {number} max - Maximum filter value (or null if not set)
 * @returns {number} Score between 0 and 1
 */
function scoreValue(value, min, max) {
  // If no filter is set (both null or max is at default), return neutral score
  if ((min === null || min === 0) && (max === null || max === 0)) {
    return 0.5;
  }
  
  // If only max is set (min is 0 or null), prefer values close to max
  // This matches the slider behavior where user sets a max value
  if ((min === null || min === 0) && max !== null && max > 0) {
    // Score: 1.0 if value equals max, decreasing as value moves away
    // Prefer values that are close to the max (within 20% gets high score)
    const distanceFromMax = Math.abs(value - max);
    const tolerance = max * 0.2; // 20% tolerance
    if (distanceFromMax <= tolerance) {
      return 1.0 - (distanceFromMax / tolerance) * 0.3; // 0.7 to 1.0
    }
    // Values below max but within range get good score
    if (value <= max) {
      const normalized = value / max;
      return 0.4 + normalized * 0.3; // 0.4 to 0.7
    }
    // Values above max get lower score
    return Math.max(0, 0.4 - ((value - max) / max) * 0.4);
  }
  
  if (max === null && min !== null && min > 0) {
    // Only min filter set - prefer higher values
    const normalized = Math.min(1, value / min);
    return normalized;
  }
  
  // Both min and max set - prefer values in the middle of the range
  const range = max - min;
  if (range === 0) {
    // Min and max are the same, check if value matches
    return Math.abs(value - min) < (min * 0.1) ? 1 : 0;
  }
  
  // Calculate distance from center of range
  const center = (min + max) / 2;
  const distanceFromCenter = Math.abs(value - center);
  const maxDistance = range / 2;
  
  // Score: 1.0 at center, decreasing as we move away
  const score = Math.max(0, 1 - (distanceFromCenter / maxDistance));
  
  // Bonus if within range
  if (value >= min && value <= max) {
    return Math.min(1, score + 0.2);
  }
  
  return score;
}

/**
 * Calculate cumulative score for a region based on active filters
 * @param {Object} city - City/region object with metrics
 * @param {Object} filters - Active filter values
 * @returns {number} Cumulative score (0-4 typically, since we have 4 metrics)
 */
export function calculateFilterScore(city, filters) {
  if (!filters) return 0;
  
  let cumulativeScore = 0;
  
  // Score population density
  const popDensity = parseFloat(city.population_density || 0);
  const popScore = scoreValue(
    popDensity,
    filters.populationDensityMin || null,
    filters.populationDensityMax || null
  );
  cumulativeScore += popScore;
  
  // Score business density
  const bizDensity = parseFloat(city.business_density || 0);
  const bizScore = scoreValue(
    bizDensity,
    filters.businessDensityMin || null,
    filters.businessDensityMax || null
  );
  cumulativeScore += bizScore;
  
  // Score transport score
  const transportScore = parseFloat(city.transport_score || 0);
  const transScore = scoreValue(
    transportScore,
    filters.transportScoreMin || null,
    filters.transportScoreMax || null
  );
  cumulativeScore += transScore;
  
  // Score apartment count
  const aptCount = parseFloat(city.apartment_count || 0);
  const aptScore = scoreValue(
    aptCount,
    filters.apartmentCountMin || null,
    filters.apartmentCountMax || null
  );
  cumulativeScore += aptScore;
  
  return cumulativeScore;
}

/**
 * Calculate scores for all cities and categorize into three tiers
 * @param {Array} cities - Array of city objects
 * @param {Object} filters - Active filter values
 * @returns {Array} Array of cities with added score and shade information
 */
export function calculateAllFilterScores(cities, filters) {
  if (!filters || !cities || cities.length === 0) {
    return cities.map(city => ({ ...city, filterScore: 0, shade: 'none' }));
  }
  
  // Calculate scores for all cities
  const citiesWithScores = cities.map(city => ({
    ...city,
    filterScore: calculateFilterScore(city, filters)
  }));
  
  // Sort by score to determine tiers
  const sorted = [...citiesWithScores].sort((a, b) => b.filterScore - a.filterScore);
  
  // Determine thresholds for three tiers
  const totalCities = sorted.length;
  const topThirdIndex = Math.floor(totalCities / 3);
  const middleThirdIndex = Math.floor((totalCities * 2) / 3);
  
  const topThirdScore = sorted[topThirdIndex]?.filterScore || 0;
  const middleThirdScore = sorted[middleThirdIndex]?.filterScore || 0;
  
  // Assign shades based on score
  return citiesWithScores.map(city => {
    let shade = 'faint';
    if (city.filterScore >= topThirdScore) {
      shade = 'dark';
    } else if (city.filterScore >= middleThirdScore) {
      shade = 'medium';
    }
    
    return {
      ...city,
      shade
    };
  });
}

/**
 * Get color shade based on shade category
 * @param {string} shade - 'dark', 'medium', 'faint', or 'none'
 * @returns {string} Hex color code
 */
export function getShadeColor(shade) {
  switch (shade) {
    case 'dark':
      return '#ec4899'; // Dark pink
    case 'medium':
      return '#f472b6'; // Medium pink
    case 'faint':
      return '#6b7280'; // Darker gray shade
    default:
      return 'transparent';
  }
}

