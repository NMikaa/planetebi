async function fetchPlanetData(planetName) {
    try {
        // Fetching planet data from the NASA API or another API
        const response = await fetch('https://api.le-systeme-solaire.net/rest/bodies/');
        const data = await response.json();

        // Filtering the planets based on the provided name
        const filteredPlanets = data.bodies.filter(planet => planet.name.toLowerCase() === planetName.toLowerCase());

        // Check if any planet is found
        if (filteredPlanets.length > 0) {
            console.log(`Found planet: ${JSON.stringify(filteredPlanets[0], null, 2)}`);
            return filteredPlanets[0]; // Return the first matched planet
        } else {
            console.log(`Planet named "${planetName}" not found.`);
            return null; // No planet found
        }
    } catch (error) {
        console.error('Error fetching planet data:', error);
    }
}

// Example usage: Fetch and log data for Mars
fetchPlanetData('Mars');
