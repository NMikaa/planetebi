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

// Light for the TRAPPIST-1 star
const light = new THREE.PointLight(0xffffff, 0.8, 0);
light.position.set(0, 0, 0);
scene.add(light);

// Load TRAPPIST-1 star texture
const trappist1Texture = textureLoader.load('assets/trappist-1/trappist_1.jpg');

// TRAPPIST-1 star (center) with texture
const trappist1Geometry = new THREE.SphereGeometry(4, 32, 32);
const trappist1Material = new THREE.MeshBasicMaterial({ map: trappist1Texture });
const trappist1Star = new THREE.Mesh(trappist1Geometry, trappist1Material);
trappist1Star.name = 'TRAPPIST-1';
scene.add(trappist1Star);

// Planets array and orbit speeds
const planets = [];
const planetSpeeds = [];
const planetNames = ['TRAPPIST-1 b', 'TRAPPIST-1 c', 'TRAPPIST-1 d', 'TRAPPIST-1 e', 'TRAPPIST-1 f', 'TRAPPIST-1 g', 'TRAPPIST-1 h'];
const distances = [8, 10, 12, 14, 16, 18, 20] ; // Orbital distances (relative to star)
const planetTextures = [
    'assets/trappist-1/trappist1b.png',
    'assets/trappist-1/trappist1c.png',
    'assets/trappist-1/trappist1d.png',
    'assets/trappist-1/trappist1e.png',
    'assets/trappist-1/trappist1f.png',
    'assets/trappist-1/trappist1g.png',
    'assets/trappist-1/trappist1h.png'
];
const radii = [0.8, 0.9, 0.85, 0.95, 1, 0.9, 0.8]; // Planet radii
const speeds = [0.015, 0.012, 0.01, 0.008, 0.007, 0.006, 0.005]; // Orbital speeds

// Create planet function
const createPlanet = (radius, distance, texturePath, name, speed) => {
    distance = distance + 5;
    const planetGeometry = new THREE.SphereGeometry(radius +1, 32, 32);
    const planetTexture = textureLoader.load(texturePath);
    const material = new THREE.MeshStandardMaterial({ map: planetTexture });
    const planet = new THREE.Mesh(planetGeometry, material);
    planet.position.x = distance;
    planet.name = name;
    scene.add(planet);

    // Add a light for the planet
    const planetLight = new THREE.PointLight(0xffffff, 0.2, 50);
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

// Create the TRAPPIST-1 planets
planetNames.forEach((planet, index) => {
    createPlanet(radii[index], distances[index], planetTextures[index], planet, speeds[index]);
});

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

function focusOnSelectedPlanet() {
    if (selectedPlanet) {
        // Smooth transition to the planet position
        camera.position.lerp(targetCameraPosition, 0.05); // Interpolate the camera position (adjust the speed with 0.05)
        controls.target.lerp(selectedPlanet.position, 0.05); // Focus the controls' target to the planet
        controls.update();
    }
}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);

// Adjust camera for proper view
camera.position.z = 60;
animate();

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Fetch planet data (for planet information display)
let planetDataCache = [];
async function fetchPlanetData() {
    try {
        const response = await fetch('https://api.le-systeme-solaire.net/rest/bodies/');
        const data = await response.json();
        planetDataCache = data.bodies; // Store all planet data globally
        
    } catch (error) {
        console.error('Error fetching planet data:', error);
    }
    
}

fetchPlanetData()
// Filter planet data by name from cache
function getPlanetDataByName(planetName) {
    console.log(planetDataCache)
    const filteredPlanets = planetDataCache.filter(
        planet => planet.englishName.toLowerCase() === planetName.toLowerCase()
    );
    return filteredPlanets.length > 0 ? filteredPlanets[0] : null;
}

// Modify the onClick function to use the cached data
async function onClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const objectsToCheck = [...planets.map(p => p.mesh), trappist1Star];
    const intersects = raycaster.intersectObjects(objectsToCheck);

    if (intersects.length > 0) {
        const planetName = intersects[0].object.name;
        const planetData = getPlanetDataByName(planetName); // Use cached data
        console.log(planetData)
        if (planetData) {
            selectedPlanet = intersects[0].object;
            targetCameraPosition.set(
                selectedPlanet.position.x,
                selectedPlanet.position.y,
                selectedPlanet.position.z + 5
            ); 
            displayPlanetInfo(planetData);
        } else {
            console.log(`Planet named "${planetName}" not found.`);
        }
    } else {
        resetCamera();
    }
}


console.log(getPlanetDataByName('Trappist-1c'))
// Function to reset camera and controls
function resetCamera() {
    // selectedPlanet = null;
    // targetCameraPosition.set(0, 10, 60);
    // camera.position.copy(targetCameraPosition);
    // controls.target.set(0, 0, 0);
    // controls.update();
}

// Display planet info
async function displayPlanetInfo(planetData) {
    const infoDiv = document.getElementById('planet-info');
    const heading = document.querySelector('.heading');
    let planetName = planetData.englishName ? planetData.englishName : 'N/A';

    heading.textContent = planetName;

    // Convert mass to Earth mass equivalent
    let massText = 'N/A';
    const earthMass = 5.972 * Math.pow(10, 24); // Earth's mass in kg
    if (planetName != 'Earth' && (planetData.mass && planetData.mass.massValue)) {
        massText = `${planetData.mass.massValue.toFixed(2)} Earth masses`;
    }

    const radiusText = planetData.meanRadius ? (planetData.meanRadius * 2).toFixed(2) : 'N/A';

    infoDiv.innerHTML = `
        <strong>Mass:</strong> ${massText} Earth masses<br>
        <strong>Diameter:</strong> ${radiusText} km<br>
        <em>${planetData.isPlanet ? 'This is a planet.' : 'This is not a planet.'}</em>
    `;
}
