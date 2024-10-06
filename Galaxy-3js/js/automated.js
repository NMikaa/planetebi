// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
let selectedPlanet = null;
let targetCameraPosition = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isPlaying = true;
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
const SOLAR_RADIUS_SCALING = 200;  // Scale factor for stars
const EARTH_RADIUS_SCALING = 2;  
const ORBITAL_DISTANCE_SCALING = 1; 
let focusedOnCanvas = false;

const planetTextures = {
    hot: [],
    earth_like: [],
    icy: []
};
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('assets/milkyway.jpg');

camera.position.z = 60;


// Create a large sphere for the background
const backgroundGeometry = new THREE.SphereGeometry(500, 64, 64);
const backgroundMaterial = new THREE.MeshBasicMaterial({ 
    map: backgroundTexture, 
    side: THREE.BackSide 
});
const backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
scene.add(backgroundSphere);

const light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(0, 0, 0);
scene.add(light);


let planetarySystems = new Map(); // Map to hold planetary systems data
let planets = [];
let orbits = [];
let planetSpeeds = [];
let currentStar = null;
// Function to load random planet textures
function getRandomTexture(folderPath) {
    const textures = [
        `${folderPath}/planet1.png`,
        `${folderPath}/planet2.png`,
        `${folderPath}/planet3.png`,
        `${folderPath}/planet4.png`,
        `${folderPath}/planet5.png`,
        `${folderPath}/planet6.png`,
        `${folderPath}/planet7.png`,
    ];
    return textures[Math.floor(Math.random() * textures.length)];
}

function setupSystem(systemData) {
    planetSpeeds = [];
    console.log(systemData)

    // Remove previous star and planets from the scene
    if (currentStar) {
        scene.remove(currentStar);
        currentStar.geometry.dispose();
        currentStar.material.dispose();
        currentStar = null;
    }

    planets.forEach(p => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
    });
    orbits.forEach(p => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
    });
    planets = [];
    orbits = [];
    planetSpeeds = [0.01];

    // Create star (the central "Sun")
    const starTexture = textureLoader.load('assets/stars/star8.jpg');
    const starRadius = systemData[0].star_radius * SOLAR_RADIUS_SCALING; // Star radius in Solar radii, scaled
    const starGeometry = new THREE.SphereGeometry(starRadius, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({ map: starTexture });
    currentStar = new THREE.Mesh(starGeometry, starMaterial);
    currentStar.name = systemData[0].star_name;
    scene.add(currentStar);

    // Adjust the distance of the first planet based on the star's radius
    const baseDistance = starRadius * 2; // Set the first planet's distance relative to star radius

    // Create planets
    systemData.forEach((planetData, index) => {
        // Distance from the star for each planet
        const distance = baseDistance + index * planetData.planet_radius * EARTH_RADIUS_SCALING * 6; // Adjust based on star size and planet index
        createPlanet(planetData, distance, planetData.planet_name);
        planetSpeeds.push(planetSpeeds[planetSpeeds.length - 1] / 2);
    });
    console.log(planetSpeeds);

}

camera.position.z = 100;
const MINIMUM_ORBITAL_DISTANCE = 20;

function createPlanet(planetData, distance, planetName) {
    let temp = planetData.planet_temperature != null ? planetData.planet_temperature : 
            calculatePlanetTemperature(planetData.star_temperature, planetData.star_mass, planetData.star_radius, planetData.orbital_period);

    const type = classifyPlanetByTemperature(temp);
    const radius = planetData.planet_radius; // Planet radius to be used as is
    const usedTextures = new Set();
    // const baseDistance = (planetData.star_radius * 10);  // Base distance
    // const distance = Math.max(baseDistance + (index + 1) * (10 * ORBITAL_DISTANCE_SCALING), MINIMUM_ORBITAL_DISTANCE);

    const availableTextures = planetTextures[type].filter(texture => !usedTextures.has(texture));
    const randomIndex = Math.floor(Math.random() * availableTextures.length);
    const selectedTexture = availableTextures[randomIndex];

    const planetGeometry = new THREE.SphereGeometry(planetData.planet_radius * EARTH_RADIUS_SCALING, 32, 32);
    const planetTexture = textureLoader.load(selectedTexture);
    const material = new THREE.MeshStandardMaterial({ map: planetTexture });
    const planet = new THREE.Mesh(planetGeometry, material);
    planet.position.x = distance; // Set the planet's distance from the star
    console.log(planetName)
    planet.name = planetName; 

    scene.add(planet);
    usedTextures.add(selectedTexture); // Mark this texture as used
    planets.push({ mesh: planet, distance, angle: 0 });

    const orbitGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 64); 
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
    orbits.push({ mesh: orbit, distance, angle: 0 });
}


function loadPlanetTextures() {
    const types = ['hot', 'earth_like', 'icy'];
    types.forEach(type => {
        for (let i = 1; i <= 7; i++) {
            const texturePath = `assets/${type}/planet${i}.png`;
            planetTextures[type].push(texturePath);
        }
    });
}
loadPlanetTextures();

function classifyPlanetByTemperature(temperature) {
    if (temperature > 310) {
        return 'hot';
    } else if (temperature > 200 && temperature <= 310) {
        return 'earth_like';
    } else {
        return 'icy';
    }
}

function calculatePlanetTemperature(starTemperature, starMassSolar, starRadiusSolar, orbitalPeriodDays, albedo = 0.3) {
    const G = 6.67430e-11;  // Gravitational constant in m^3 kg^-1 s^-2
    const solarMassKg = 1.989e30;  // Mass of the Sun in kg
    const solarRadiusM = 6.96e8;  // Radius of the Sun in meters
    const starMassKg = starMassSolar * solarMassKg;
    const starRadiusM = starRadiusSolar * solarRadiusM;
    const orbitalPeriodSeconds = orbitalPeriodDays * 86400;
    const aCubed = (G * starMassKg * Math.pow(orbitalPeriodSeconds, 2)) / (4 * Math.pow(Math.PI, 2));
    const semiMajorAxis = Math.pow(aCubed, 1 / 3);
    const planetTemperature = starTemperature * Math.sqrt(starRadiusM / (2 * semiMajorAxis)) * Math.pow((1 - albedo), 0.25);

    return planetTemperature;
}


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

createAsteroidBelt(2000, 35, 40); // 2000 asteroids between the distance of Mars (35) and Jupiter (40)
createAsteroidBelt(4000, 55, 65); // 2000 asteroids between the distance of Mars (35) and Jupiter (40)

async function displaySystemInfo(systemData) {
    const heading = document.querySelector('.heading');
    const infoDiv = document.getElementById('planet-info');
    
    // Get the star name from the system data
    let starName = systemData[0].star_name;
    
    // Update the heading and info text
    heading.textContent = `System: ${starName} system`;
    infoDiv.textContent = "Click on any planet to see its information.";
}



async function displayPlanetInfo(planetData) {
    const infoDiv = document.getElementById('planet-info');
    const heading = document.querySelector('.heading');
    
    // Update info content with the selected planet's data
    let content = `
        <strong>Planet Name:</strong> ${planetData.planet_name}<br>
        <strong>Planet Radius:</strong> ${planetData.planet_radius} Earth radii<br>
        <strong>Planet Mass:</strong> ${planetData.planet_mass} Earth masses<br>
        <strong>Star Temperature:</strong> ${planetData.star_temperature} K<br>
        <strong>Star Radius:</strong> ${planetData.star_radius} Solar radii<br><br>
        

        <div style="position: fixed; top: 20px; right: 20px; width: 300px; padding: 20px; border: 1px solid #ccc; border-radius: 10px; background-color: rgba(0, 0, 0, 0.5); z-index: 999999;">
            <label for="planet-radius">Enter Planet Radius (km):</label>
            <input type="text" id="planet-radius" placeholder="Radius (km)" style="width: 150px; border-radius: 5px; border: 1px solid #ccc; background-color: transparent; color: white; padding: 5px; margin-bottom: 10px;"><br>

            <label for="planet-color">Enter Planet Color:</label>
            <input type="text" id="planet-color" placeholder="Color (e.g., blue)" style="width: 150px; border-radius: 5px; border: 1px solid #ccc; background-color: transparent; color: white; padding: 5px; margin-bottom: 10px;"><br>

            <label for="planet-temperature">Enter Planet Temperature (K):</label>
            <input type="text" id="planet-temperature" placeholder="Temperature (K)" style="width: 150px; border-radius: 5px; border: 1px solid #ccc; background-color: transparent; color: white; padding: 5px; margin-bottom: 10px;"><br>

            <label>Type:</label>
            <span style="display: inline-block; margin-left: 10px;">
                <label style="margin-right: 10px;">
                    <input type="checkbox" id="cloudy" value="Cloudy" style="width: 20px; height: 20px;"> Cloudy
                </label>
                <label style="margin-right: 10px;">
                    <input type="checkbox" id="gas" value="Gas" style="width: 20px; height: 20px;"> Gas
                </label>
                <label style="margin-right: 10px;">
                    <input type="checkbox" id="rocky" value="Rocky" style="width: 20px; height: 20px;"> Rocky
                </label>
                <label style="margin-right: 10px;">
                    <input type="checkbox" id="ice" value="Ice" style="width: 20px; height: 20px;"> Ice
                </label>
            </span>
            
            <br><br>

            <button id="save-button" style="background-color: blue; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Save</button>
        </div>
        `;
        
    infoDiv.innerHTML = content;
// Add event listener for the "Save" button
    const saveButton = document.getElementById('save-button');
    saveButton.onclick = async () => {
        event.preventDefault();
        const sizeInput = document.getElementById('planet-radius').value;
        const newSize = parseFloat(sizeInput); // Parse the input as a float

        const color = document.getElementById('planet-color').value;
        const temperature = document.getElementById('planet-temperature').value;

        const types = [];
        if (document.getElementById('cloudy').checked) types.push('Cloudy');
        if (document.getElementById('gas').checked) types.push('Gas');
        if (document.getElementById('rocky').checked) types.push('Rocky');
        if (document.getElementById('ice').checked) types.push('Ice');

        const data = {
            color: color,
            temperature: temperature,
            types: types,
        };

        try {
            const response = await fetch("http://127.0.0.1:8000/generate_image/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({temperature: temperature, color: color, types: types}),
            });

            if (response.ok) {
                const result = await response.json();
                const imageUrl = result.img_url; // Assuming the server returns { "imageUrl": "link-to-image.png" }
                console.log(imageUrl); // Add this to see the exact image URL returned
                // Now load the texture to the selected planet
                const textureLoader = new THREE.TextureLoader();
                textureLoader.load(imageUrl, (texture) => {
                    selectedPlanet.material.map = texture;
                    selectedPlanet.material.needsUpdate = true;  // To ensure Three.js updates the material with the new texture
                });
                console.log("gamevitane");
            } else {
                console.error("Error:", response.statusText);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }

        if (selectedPlanet) {
            selectedPlanet.customSize = newSize; // Store size
            // selectedPlanet.customColor = color; // Store color
            // selectedPlanet.customTemperature = temperature; // Store temperature

            console.log(`Saved data for ${selectedPlanet.name}: Size: ${newSize}, Color: ${color}, Temperature: ${temperature}, Type: ${types}`);
        }

        if (!isNaN(newSize) && newSize > 0) {
            // Update the planet's scale
            selectedPlanet.scale.set(newSize, newSize, newSize);
            // Optionally, you can also update the planet's geometry to keep the proportions accurate
            const newGeometry = new THREE.SphereGeometry(newSize, 32, 32);
            const planetMaterial = selectedPlanet.material; // Keep the same material
            const newPlanetMesh = new THREE.Mesh(newGeometry, planetMaterial);
            newPlanetMesh.position.copy(selectedPlanet.position); // Keep the same position
            newPlanetMesh.name = selectedPlanet.name; // Preserve the name
            newPlanetMesh = structuredClone(selectedPlanet);
            scene.remove(selectedPlanet); // Remove the old planet mesh
            scene.add(newPlanetMesh); // Add the new planet mesh
            const idx = planets.indexOf(selectedPlanet)
            planets.splice(idx,1);
            planets.splice(idx,0,newPlanetMesh);
            // console.log(planets.length)
            selectedPlanet = newPlanetMesh; // Update the reference to the selected planet
        }
    };
    
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Create stars in the scene
const createStars = (numStars) => {
const starGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Small spheres for stars
// const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White color for stars

for (let i = 0; i < numStars; i++) {
    const starMaterial = new THREE.MeshBasicMaterial({
        color: i < numStars / 2 ? 0xffffff : new THREE.Color(Math.random(), Math.random(), Math.random()) // Random color for half
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    // Randomly position stars in a spherical volume around the sun
    const radius = Math.random() * 500; // Adjust the radius as needed
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    star.position.x = radius * Math.sin(phi) * Math.cos(theta);
    star.position.y = radius * Math.sin(phi) * Math.sin(theta);
    star.position.z = radius * Math.cos(phi);

    scene.add(star);
}
};

// Call the function to create stars
// createStars(2000); // You can adjust the number of stars here

// Fetch and load exoplanetary data
async function fetchSystemData() {
    try {
        const response = await fetch('planets.json');
        const data = await response.json();
        
        // Organize the data into the map
        data.forEach(system => {
            if (!planetarySystems.has(system.star_name)) {
                planetarySystems.set(system.star_name, []);
            }
            planetarySystems.get(system.star_name).push(system);
        });
        
        // Set initial heading and info text
        document.querySelector('.heading').textContent = 'Exoplanetary System';
        document.getElementById('planet-info').textContent = 'Just type any exoplanet star name to display the system.';
    } catch (error) {
        console.error('Error fetching system data:', error);
    }
}

fetchSystemData();


// Input event listener for searching a planetary system by host star name
const input = document.getElementById('hostNameInput');
input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const hostName = input.value.trim();
        if (planetarySystems.has(hostName)) {
            const systemData = planetarySystems.get(hostName);
            setupSystem(systemData); // Setup the 3D visualization
            displaySystemInfo(systemData); // Display system information
        } else {
            alert('System not found.');
        }
    }
});

let isAnimating = true;
// Orbiting animation
function animate() {
    if (!isAnimating) return;
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

animate();
function toggleAnimation(play) {
    if (play) {
        isAnimating = true;
        animate();
        console.log("Animation started");
    } else {
        isAnimating = false;
        console.log("Animation paused");
    }
}

        
// window.addEventListener('keyup',(event)=>{
//     if(event.code == "Space"){
//         isPlaying = !isPlaying; // Toggle play state
//         if (isPlaying) {
//             playButton.textContent = "❚❚"; // Change button to pause icon
//             toggleAnimation(true); // Call your function to start or continue the animation
//         } else {
//             playButton.textContent = "▶"; // Change button to play icon
//             toggleAnimation(false); // Call your function to pause the animation
//         }
//     }
// })

function focusOnSelectedPlanet() {
    if (selectedPlanet) {
        // Smooth transition to the planet position
        camera.position.lerp(targetCameraPosition, 0.05); // Interpolate the camera position (adjust the speed with 0.05)
        controls.target.lerp(selectedPlanet.position, 0.05); // Focus the controls' target to the planet
        controls.update();
    }    
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

const playButton = document.getElementById("play-button");

playButton.addEventListener("click", () => {
    isPlaying = !isPlaying; // Toggle play state
    if (isPlaying) {
        playButton.textContent = "❚❚"; // Change button to pause icon
        toggleAnimation(true); // Call your function to start or continue the animation
    } else {
        playButton.textContent = "▶"; // Change button to play icon
        toggleAnimation(false); // Call your function to pause the animation
    }
});

async function onClick(event) {
    if(event.target == renderer.domElement){
        focusedOnCanvas = true;
    }else {
        focusedOnCanvas = false;
    }
    raycaster.setFromCamera(mouse, camera);
    const objectsToCheck = [...planets.map(p => p.mesh), currentStar];
    const intersects = raycaster.intersectObjects(objectsToCheck);
    // Check if the click was on an input field or the save button
    const targetElement = event.target;

    if (targetElement.id === "save-button" || targetElement.matches("input")) {
        // If the click was on the save button or any input field, do not reset the camera
        return;
    }
    if (intersects.length > 0) {
        isPlaying = true;
        playButton.textContent = "❚❚"; // Change button to pause icon
        toggleAnimation(true);

        alert(intersects[0])

        const planetName = intersects[0].object.name;
        const planetData = getPlanetDataByName(planetName); // Use cached data
        if (planetData) {
            selectedPlanet = intersects[0].object;
            targetCameraPosition.set(
                selectedPlanet.position.x + selectedPlanet.geometry.parameters.radius * 2,
                selectedPlanet.position.y + selectedPlanet.geometry.parameters.radius * 2,
                selectedPlanet.position.z + selectedPlanet.geometry.parameters.radius * 1
            ); // Zoom in
            displayPlanetInfo(planetData);
            console.log(planetData)
        } else {
            console.log(`Planet named "${planetName}" not found.`);
        }
    }
}

function getPlanetDataByName(planetName) {
    // Flatten the values from the planetary systems map into a single array of planet objects
    const allPlanets = Array.from(planetarySystems.values()).flat();

    // Filter planets by name
    const filteredPlanets = allPlanets.filter(
        planet => planet.planet_name.toLowerCase() === planetName.toLowerCase()
    );
    
    // Return the first match or null if no match is found
    return filteredPlanets.length > 0 ? filteredPlanets[0] : null;
}


function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);


// Function to reset camera and controls
function resetCamera() {
    const infoDiv = document.getElementById('planet-info');
    const title = document.querySelector('.heading');
    infoDiv.textContent = "Click on a planet to see its information";
    title.textContent = 'Solar System';
    selectedPlanet = null;
    targetCameraPosition.set(0, 20, 50); // Your default camera position
    camera.position.copy(targetCameraPosition); // Reset the camera position

    // Reset the OrbitControls target (important)
    controls.target.set(0, 0, 0); // Reset target to center of the system
    controls.update(); // Ensure the controls recognize the change
}

window.addEventListener('keyup',(event)=>{
    if(event.code == "Space" && focusedOnCanvas){
        isPlaying = !isPlaying; // Toggle play state
        if (isPlaying) {
            playButton.textContent = "❚❚"; // Change button to pause icon
            toggleAnimation(true); // Call your function to start or continue the animation
        } else {
            playButton.textContent = "▶"; // Change button to play icon
            toggleAnimation(false); // Call your function to pause the animation
        }
    }
    if(event.code == 'Escape'){
        resetCamera();
    }
})

// function createSolarSystem(){
//     createSolarPlanet(1.422, 10, 'assets/mercury.jpg', 'Mercury', 0.01); 
//     createSolarPlanet(1.664, 15, 'assets/venus.jpg', 'Venus', 0.005);  
//     createSolarPlanet(1.7, 20, 'assets/earth.jpg', 'Earth', 0.0025);  
//     createSolarPlanet(1.494, 25, 'assets/mars.jpg', 'Mars', 0.002);  
//     createSolarPlanet(5.1, 45, 'assets/jupiter.jpg', 'Jupiter', 0.0005); 
//     createSolarPlanet(4.38, 65, 'assets/saturn.jpg', 'Saturn', 0.0002);  
//     createSolarPlanet(2.16, 80, 'assets/uranus.jpg', 'Uranus', 0.0015);  
//     createSolarPlanet(2.1, 95, 'assets/neptune.jpg', 'Neptune', 0.001);  
// }

