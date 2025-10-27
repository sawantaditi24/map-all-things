from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import Area, AreaMetric


def seed():
	with SessionLocal() as db:  # type: Session
		# Clear existing data first
		db.query(AreaMetric).delete()
		db.query(Area).delete()
		db.commit()

		# Major SoCal cities with coordinates and basic data
		areas = [
			# Los Angeles County
			{"name": "Downtown LA", "city": "Los Angeles", "county": "Los Angeles County", "latitude": "34.0522", "longitude": "-118.2437"},
			{"name": "Santa Monica", "city": "Santa Monica", "county": "Los Angeles County", "latitude": "34.0195", "longitude": "-118.4912"},
			{"name": "Beverly Hills", "city": "Beverly Hills", "county": "Los Angeles County", "latitude": "34.0736", "longitude": "-118.4004"},
			{"name": "Pasadena", "city": "Pasadena", "county": "Los Angeles County", "latitude": "34.1478", "longitude": "-118.1445"},
			{"name": "Glendale", "city": "Glendale", "county": "Los Angeles County", "latitude": "34.1425", "longitude": "-118.2551"},
			{"name": "Burbank", "city": "Burbank", "county": "Los Angeles County", "latitude": "34.1808", "longitude": "-118.3090"},
			{"name": "Long Beach", "city": "Long Beach", "county": "Los Angeles County", "latitude": "33.7701", "longitude": "-118.1937"},
			{"name": "Torrance", "city": "Torrance", "county": "Los Angeles County", "latitude": "33.8358", "longitude": "-118.3406"},
			{"name": "Manhattan Beach", "city": "Manhattan Beach", "county": "Los Angeles County", "latitude": "33.8847", "longitude": "-118.4109"},
			{"name": "Redondo Beach", "city": "Redondo Beach", "county": "Los Angeles County", "latitude": "33.8492", "longitude": "-118.3884"},
			{"name": "West Hollywood", "city": "West Hollywood", "county": "Los Angeles County", "latitude": "34.0900", "longitude": "-118.3617"},
			{"name": "Culver City", "city": "Culver City", "county": "Los Angeles County", "latitude": "34.0211", "longitude": "-118.3965"},
			{"name": "Inglewood", "city": "Inglewood", "county": "Los Angeles County", "latitude": "33.9617", "longitude": "-118.3531"},
			{"name": "Compton", "city": "Compton", "county": "Los Angeles County", "latitude": "33.8958", "longitude": "-118.2201"},
			{"name": "Carson", "city": "Carson", "county": "Los Angeles County", "latitude": "33.8314", "longitude": "-118.2822"},
			
			# Orange County
			{"name": "Anaheim", "city": "Anaheim", "county": "Orange County", "latitude": "33.8366", "longitude": "-117.9143"},
			{"name": "Santa Ana", "city": "Santa Ana", "county": "Orange County", "latitude": "33.7455", "longitude": "-117.8677"},
			{"name": "Irvine", "city": "Irvine", "county": "Orange County", "latitude": "33.6846", "longitude": "-117.8265"},
			{"name": "Huntington Beach", "city": "Huntington Beach", "county": "Orange County", "latitude": "33.6595", "longitude": "-117.9988"},
			{"name": "Newport Beach", "city": "Newport Beach", "county": "Orange County", "latitude": "33.6189", "longitude": "-117.9298"},
			{"name": "Costa Mesa", "city": "Costa Mesa", "county": "Orange County", "latitude": "33.6411", "longitude": "-117.9187"},
			{"name": "Fullerton", "city": "Fullerton", "county": "Orange County", "latitude": "33.8704", "longitude": "-117.9242"},
			{"name": "Orange", "city": "Orange", "county": "Orange County", "latitude": "33.7879", "longitude": "-117.8531"},
			{"name": "Garden Grove", "city": "Garden Grove", "county": "Orange County", "latitude": "33.7739", "longitude": "-117.9414"},
			{"name": "Tustin", "city": "Tustin", "county": "Orange County", "latitude": "33.7459", "longitude": "-117.8262"},
			{"name": "Laguna Beach", "city": "Laguna Beach", "county": "Orange County", "latitude": "33.5427", "longitude": "-117.7854"},
			{"name": "Mission Viejo", "city": "Mission Viejo", "county": "Orange County", "latitude": "33.6000", "longitude": "-117.6720"},
			{"name": "Aliso Viejo", "city": "Aliso Viejo", "county": "Orange County", "latitude": "33.5674", "longitude": "-117.7251"},
			{"name": "Laguna Niguel", "city": "Laguna Niguel", "county": "Orange County", "latitude": "33.5225", "longitude": "-117.7076"},
			{"name": "Lake Forest", "city": "Lake Forest", "county": "Orange County", "latitude": "33.6469", "longitude": "-117.6892"},
			{"name": "Yorba Linda", "city": "Yorba Linda", "county": "Orange County", "latitude": "33.8885", "longitude": "-117.8133"},
			{"name": "Brea", "city": "Brea", "county": "Orange County", "latitude": "33.9167", "longitude": "-117.9001"},
			{"name": "Placentia", "city": "Placentia", "county": "Orange County", "latitude": "33.8720", "longitude": "-117.8703"},
			{"name": "La Habra", "city": "La Habra", "county": "Orange County", "latitude": "33.9319", "longitude": "-117.9461"},
			{"name": "Buena Park", "city": "Buena Park", "county": "Orange County", "latitude": "33.8708", "longitude": "-117.9962"}
		]

		# Realistic population densities and metrics for SoCal cities
		city_metrics = {
			"Downtown LA": {"pop_density": 12000, "business_density": 120, "transport_score": 9.0},
			"Santa Monica": {"pop_density": 11000, "business_density": 95, "transport_score": 8.5},
			"Beverly Hills": {"pop_density": 6000, "business_density": 80, "transport_score": 7.0},
			"Pasadena": {"pop_density": 6000, "business_density": 70, "transport_score": 7.5},
			"Glendale": {"pop_density": 6500, "business_density": 75, "transport_score": 7.0},
			"Burbank": {"pop_density": 6200, "business_density": 85, "transport_score": 7.5},
			"Long Beach": {"pop_density": 9300, "business_density": 90, "transport_score": 8.0},
			"Torrance": {"pop_density": 6900, "business_density": 80, "transport_score": 7.0},
			"Manhattan Beach": {"pop_density": 9000, "business_density": 60, "transport_score": 6.5},
			"Redondo Beach": {"pop_density": 11500, "business_density": 70, "transport_score": 7.0},
			"West Hollywood": {"pop_density": 18500, "business_density": 110, "transport_score": 8.5},
			"Culver City": {"pop_density": 7900, "business_density": 85, "transport_score": 7.5},
			"Inglewood": {"pop_density": 11800, "business_density": 75, "transport_score": 7.0},
			"Compton": {"pop_density": 9600, "business_density": 65, "transport_score": 6.5},
			"Carson": {"pop_density": 5000, "business_density": 70, "transport_score": 6.0},
			"Anaheim": {"pop_density": 6800, "business_density": 90, "transport_score": 7.5},
			"Santa Ana": {"pop_density": 12200, "business_density": 100, "transport_score": 7.0},
			"Irvine": {"pop_density": 4700, "business_density": 85, "transport_score": 7.0},
			"Huntington Beach": {"pop_density": 6800, "business_density": 75, "transport_score": 6.5},
			"Newport Beach": {"pop_density": 4200, "business_density": 60, "transport_score": 6.0},
			"Costa Mesa": {"pop_density": 4700, "business_density": 80, "transport_score": 6.5},
			"Fullerton": {"pop_density": 6000, "business_density": 70, "transport_score": 7.0},
			"Orange": {"pop_density": 5500, "business_density": 65, "transport_score": 6.5},
			"Garden Grove": {"pop_density": 12200, "business_density": 85, "transport_score": 7.0},
			"Tustin": {"pop_density": 4500, "business_density": 70, "transport_score": 6.5},
			"Laguna Beach": {"pop_density": 1800, "business_density": 40, "transport_score": 5.5},
			"Mission Viejo": {"pop_density": 4600, "business_density": 60, "transport_score": 6.0},
			"Aliso Viejo": {"pop_density": 4600, "business_density": 65, "transport_score": 6.0},
			"Laguna Niguel": {"pop_density": 3800, "business_density": 55, "transport_score": 5.5},
			"Lake Forest": {"pop_density": 4700, "business_density": 60, "transport_score": 6.0},
			"Yorba Linda": {"pop_density": 3600, "business_density": 50, "transport_score": 5.5},
			"Brea": {"pop_density": 3200, "business_density": 55, "transport_score": 6.0},
			"Placentia": {"pop_density": 6100, "business_density": 60, "transport_score": 6.5},
			"La Habra": {"pop_density": 6100, "business_density": 65, "transport_score": 6.0},
			"Buena Park": {"pop_density": 4700, "business_density": 70, "transport_score": 6.5}
		}

		for a in areas:
			area = Area(**a)
			db.add(area)
			db.flush()
			
			# Get realistic metrics for this city
			metrics = city_metrics.get(area.name, {"pop_density": 5000, "business_density": 60, "transport_score": 6.5})
			
			metric = AreaMetric(
				area_id=area.id,
				population_density=metrics["pop_density"],
				business_density=metrics["business_density"],
				transport_score=metrics["transport_score"]
			)
			db.add(metric)

		db.commit()


if __name__ == "__main__":
	seed()
