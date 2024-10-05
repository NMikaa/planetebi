// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Global variable to store the selected planet's mesh
let selectedPlanet = null;
let targetCameraPosition = new THREE.Vector3(); // Position to move the camera to
// OrbitControls for camera interaction
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth controls
controls.dampingFactor = 0.05;

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Load background texture
const backgroundTexture = textureLoader.load('assets/milkyway.jpg');

// Create a large sphere for the background
const backgroundGeometry = new THREE.SphereGeometry(500, 64, 64);
const backgroundMaterial = new THREE.MeshBasicMaterial({ 
    map: backgroundTexture, 
    side: THREE.BackSide // Render the texture on the inside of the sphere
});
const backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
scene.add(backgroundSphere);


// Light (the Sun)
const light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(0, 0, 0);
scene.add(light);

// Load Sun texture
const sunTexture = textureLoader.load('assets/sun.jpg'); 

// Sun (center) with texture
const sunGeometry = new THREE.SphereGeometry(6, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planets array and orbit speeds
const planets = [];
const planetSpeeds = []; // Speed array for each planet
const planetNames = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
const distances = [10, 15, 20, 25, 80, 65, 35, 50]; // Orbital distances

// Create planet function
const createPlanet = (radius, distance, texturePath, name, speed) => {
    const planetGeometry = new THREE.SphereGeometry(radius, 32, 32);
    const planetTexture = textureLoader.load(texturePath);
    const material = new THREE.MeshStandardMaterial({ map: planetTexture });
    const planet = new THREE.Mesh(planetGeometry, material);
    planet.position.x = distance;
    planet.name = name;
    scene.add(planet);

    // Add a light for the planet
    const planetLight = new THREE.PointLight(0xffffff, 0.5, 100);
    planetLight.position.set(distance, 0, 0);
    scene.add(planetLight);

    // Create an orbit
    const orbitGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 64); 
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);

    planets.push({ mesh: planet, distance, angle: 0 }); // Store angle for orbit
    planetSpeeds.push(speed); // Add speed for this planet
};

// Example planets with textures and speeds (adjust speeds for faster inner planets)
createPlanet(0.422, 10, 'assets/mercury.jpg', 'Mercury', 0.01); 
createPlanet(0.664, 15, 'assets/venus.jpg', 'Venus', 0.005);  
createPlanet(0.7, 20, 'assets/earth.jpg', 'Earth', 0.0025);  
createPlanet(0.494, 25, 'assets/mars.jpg', 'Mars', 0.002);  
createPlanet(5.1, 45, 'assets/jupiter.jpg', 'Jupiter', 0.0005); 
createPlanet(4.38, 65, 'assets/saturn.jpg', 'Saturn', 0.0002);  
createPlanet(2.16, 80, 'assets/uranus.jpg', 'Uranus', 0.0015);  
createPlanet(2.1, 95, 'assets/neptune.jpg', 'Neptune', 0.001);  


// Orbiting animation
function animate() {
    requestAnimationFrame(animate);

    planets.forEach((planet, index) => {
        // Increase the angle over time (based on speed)
        planet.angle += planetSpeeds[index];

        // Calculate new x and z positions to keep the planet on its circular orbit
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
    });

    focusOnSelectedPlanet();
    controls.update(); // Update the controls for damping
    renderer.render(scene, camera);
}

// Mouse event detection for interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

async function onClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const objectsToCheck = [...planets.map(p => p.mesh), sun]
    const intersects = raycaster.intersectObjects(objectsToCheck);

    if (intersects.length > 0) {
        const planetname = intersects[0].object.name;
        const planetData = await fetchPlanetData(planetname);
        alert(planetname)
        selectedPlanet = intersects[0].object;
        targetCameraPosition.set(selectedPlanet.position.x, selectedPlanet.position.y, selectedPlanet.position.z + 10); // Zoom in
        displayPlanetInfo(JSON.stringify(planetData))
        displayPlanetInfo(planetData)
        
    } else {
        const infoDiv = document.getElementById('planet-info');
        const title = document.querySelector('.heading');
        infoDiv.textContent = "Click on a planet to see its information"
        title.textContent = 'Solar System'
        selectedPlanet = null;
        targetCameraPosition.set(0, 20, 50); // Your default camera position
        camera.position.copy(targetCameraPosition); // Reset the camera position
    
        // Reset the OrbitControls target (important)
        controls.target.set(0, 0, 0); // Reset target to center of the system or any desired point
        controls.update(); // Ensure the controls recognize the change
    
        console.log("Esc key pressed!");
        // You can call another function or perform an action here
    }
}

function focusOnSelectedPlanet() {
    if (selectedPlanet) {
        // Smooth transition to the planet position
        camera.position.lerp(targetCameraPosition, 0.05); // Interpolate the camera position (adjust the speed with 0.05)
        controls.target.lerp(selectedPlanet.position, 0.05); // Focus the controls' target to the planet
        controls.update();
    } else{
        // camera.position.lerp(targetCameraPosition, 0.05); // Interpolate the camera position (adjust the speed with 0.05)
        // controls.target.lerp(sun.position, 0.05); // Focus the controls' target to the planet
        // controls.update();
    }
    
}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);

// Adjust camera for proper view
camera.position.z = 100;
animate();

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});


// Function to create asteroid belt
const createAsteroidBelt = (numAsteroids, innerRadius, outerRadius) => {
    for (let i = 0; i < numAsteroids; i++) {
        const asteroidGeometry = new THREE.SphereGeometry(0.1, 16, 16); // Small sphere for asteroids
        const asteroidMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        
        // Random distance and angle within the belt range
        const distance = Math.random() * (outerRadius - innerRadius) + innerRadius; 
        const angle = Math.random() * Math.PI * 2; // Random angle in radians

        // Position the asteroid
        asteroid.position.x = Math.cos(angle) * distance;
        asteroid.position.z = Math.sin(angle) * distance;

        scene.add(asteroid);
    }
};

// Function to create rings for Jupiter
const createSaturnRings = (innerRadius, outerRadius) => {
    planet = "Saturn";
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide }); // Gray color
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    
    // Rotate to make it horizontal
    ring.rotation.x = Math.PI / 2; 
    saturnRing.position.set(planet.mesh.position.x, 0, planet.mesh.position.z);
    scene.add(ring);

    return ring; // Return the ring mesh for further manipulation
};


// Create rings for Jupiter
// const saturnRing = createSaturnRings(10, 20); // Inner radius 6, outer radius 8


// Create asteroid belt between Mars and Jupiter
createAsteroidBelt(2000, 35, 40); // 2000 asteroids between the distance of Mars (35) and Jupiter (40)


// Adjust camera for proper view
camera.position.z = 100;

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

async function fetchPlanetData(planetName) {
    try {
        // Fetching planet data from the NASA API or another API
        const response = await fetch('https://api.le-systeme-solaire.net/rest/bodies/');
        const data = await response.json();

        // Filtering the planets based on the provided name
        const filteredPlanets = data.bodies.filter(planet => planet.englishName.toLowerCase() === planetName.toLowerCase());

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



async function displayPlanetInfo(planetData) {
    const infoDiv = document.getElementById('planet-info');
    const heading = document.querySelector('.heading');
    heading.textContent = `${planetData.englishName ? planetData.englishName : 'N/A' }`;
    infoDiv.innerHTML = `
        Mass: ${planetData.mass ? planetData.mass : 'N/A'} kg<br>
        Diameter: ${planetData.meanRadius ? planetData.meanRadius * 2 : 'N/A'} km<br>
        Distance from Sun: ${planetData.semimajorAxis ? planetData.semimajorAxis : 'N/A'} km<br>
        <em>${planetData.isPlanet ? 'This is a planet.' : 'This is not a planet.'}</em>
    `;
}