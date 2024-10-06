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
sun.name = 'Sun';
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
    const planetLight = new THREE.PointLight(0xffffff, 0.5, 1);
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
createPlanet(1.422, 10, 'assets/mercury.jpg', 'Mercury', 0.01); 
createPlanet(1.664, 15, 'assets/venus.jpg', 'Venus', 0.005);  
createPlanet(1.7, 20, 'assets/earth.jpg', 'Earth', 0.0025);  
createPlanet(1.494, 25, 'assets/mars.jpg', 'Mars', 0.002);  
createPlanet(5.1, 45, 'assets/jupiter.jpg', 'Jupiter', 0.0005); 
createPlanet(4.38, 65, 'assets/saturn.jpg', 'Saturn', 0.0002);  
createPlanet(2.16, 80, 'assets/uranus.jpg', 'Uranus', 0.0015);  
createPlanet(2.1, 95, 'assets/neptune.jpg', 'Neptune', 0.001);  

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



// async function displayPlanetInfo(planetData) {
//     const infoDiv = document.getElementById('planet-info');
//     const heading = document.querySelector('.heading');
    
//     heading.textContent = `${planetData.englishName ? planetData.englishName : 'N/A'}`;
    
//     // Format mass with exponent
//     let massText = 'N/A';
//     if (planetData.mass && planetData.mass.massValue && planetData.mass.massExponent) {
//         massText = `${planetData.mass.massValue} × 10<sup>${planetData.mass.massExponent}</sup> kg`;
//     }

//     infoDiv.innerHTML = `
//         <strong>Mass:</strong> ${massText}<br>
//         <strong>Diameter:</strong> ${planetData.meanRadius ? planetData.meanRadius * 2 : 'N/A'} km<br>
//         <strong>Distance from Sun:</strong> ${planetData.semimajorAxis ? planetData.semimajorAxis : 'N/A'} km<br>
//         <em>${planetData.isPlanet ? 'This is a planet.' : 'This is not a planet.'}</em>
//     `;
// }

async function displayPlanetInfo(planetData) {
    const infoDiv = document.getElementById('planet-info');
    const heading = document.querySelector('.heading');

    infoDiv.style.display = 'block'; // Show the info div
    let planetname = planetData.englishName ? planetData.englishName : 'N/A';

    heading.textContent = planetname;

    // Convert mass to Earth mass equivalent
    let massText = 'N/A';
    const earthMass = 5.972 * Math.pow(10, 24); // Earth's mass in kg
    if (planetname != 'Earth' && (planetData.mass && planetData.mass.massValue && planetData.mass.massExponent)) {
        const planetMass = planetData.mass.massValue * Math.pow(10, planetData.mass.massExponent);
        const massInEarthMass = planetMass / earthMass;
        massText = `${massInEarthMass.toFixed(2)} Earth masses`;
    } else if (planetname == 'Earth') {
        if (planetData.mass && planetData.mass.massValue && planetData.mass.massExponent) {
            massText = `${planetData.mass.massValue} × 10<sup>${planetData.mass.massExponent}</sup> kg`;
        }
    }
    let distanceText = '0';
    const kilometersToLightYears = 9.461e12; // Conversion factor (km to light years)
    if (planetData.semimajorAxis) {
        const distanceInLightYears = planetData.semimajorAxis / kilometersToLightYears;
        distanceText = `${distanceInLightYears.toFixed(6)} light-years`;
    }
    



    // Populate the info div with modified labels and button style
    infoDiv.innerHTML = `
        <strong>Mass:</strong> ${massText}<br>
        <strong>Diameter:</strong> ${planetData.meanRadius ? planetData.meanRadius * 2 : 'N/A'} km<br>
        <strong>Distance from Sun:</strong> ${distanceText}<br>
        <em>${planetData.isPlanet ? 'This is a planet.' : 'This is not a planet.'}</em><br><br>
       
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

    // Add event listener for the "Save" button
    const saveButton = document.getElementById('save-button');
    const loadingIndicator = document.getElementById('loading-indicator'); // Get the loading element
    let loadingAnimation; // Variable to hold the animation interval

    // Function to start the "Loading..." animation
    function startLoadingAnimation() {
        let canv =  document.querySelector("canvas");
        canv.style.opacity =  "0.7";
        const loadingText = "Loading...";
        let currentIndex = 0;

        // Show the loading indicator
        loadingIndicator.style.display = 'block';

        // Set up an interval to update the text
        loadingAnimation = setInterval(() => {
            currentIndex = (currentIndex + 1) % (loadingText.length + 1); // Loop around after reaching full text

            if (currentIndex <= loadingText.length) {
                loadingIndicator.textContent = loadingText.substring(0, currentIndex); // Show progressively longer text
            } else {
                loadingIndicator.textContent = loadingText.substring(0, currentIndex - (loadingText.length + 1)); // Restart from "L"
            }
        }, 300); // Change the text every 300ms (adjust for faster or slower animation)
    }

    // Function to stop the "Loading..." animation
    function stopLoadingAnimation() {
        clearInterval(loadingAnimation);
        let canv =  document.querySelector("canvas");
        canv.style.opacity =  "1";
        loadingIndicator.style.display = 'none'; // Hide the loading indicator
    }
    
    saveButton.onclick = async (event) => {
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
        if(types.length > 0 || color !== "" || temperature !== ""){
            try {
                // Show the loading indicator
                // loadingIndicator.style.display = 'block';
                startLoadingAnimation();
    
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
                    console.log("Image successfully loaded");
                } else {
                    console.error("Error:", response.statusText);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                // Hide the loading indicator after the response is received
                // loadingIndicator.style.display = 'none';
                stopLoadingAnimation();
            }
        }
    
        if (selectedPlanet) {
            selectedPlanet.customSize = newSize; // Store size
            console.log(`Saved data for ${selectedPlanet.name}: Size: ${newSize}, Color: ${color}, Temperature: ${temperature}, Type: ${types}`);
        }
    
        if (!isNaN(newSize) && newSize > 0) {
            // Update the planet's scale
            selectedPlanet.scale.set(newSize, newSize, newSize);
    
            const newGeometry = new THREE.SphereGeometry(newSize, 32, 32);
            const planetMaterial = selectedPlanet.material; // Keep the same material
            const newPlanetMesh = new THREE.Mesh(newGeometry, planetMaterial);
            newPlanetMesh.position.copy(selectedPlanet.position); // Keep the same position
            newPlanetMesh.name = selectedPlanet.name; // Preserve the name

            scene.remove(selectedPlanet); // Remove the old planet mesh
            scene.add(newPlanetMesh); // Add the new planet mesh
<<<<<<< HEAD
=======
            const idx = planets.indexOf(selectedPlanet);
            planets.splice(idx, 1);
            planets.splice(idx, 0, newPlanetMesh);
>>>>>>> 79b567d469d39cfe91b1dc521732f0ad81803908
            selectedPlanet = newPlanetMesh; // Update the reference to the selected planet
        }
    };    
}

// Fetch planet data and store it in cache
async function fetchPlanetData() {
    try {
        const response = await fetch('https://api.le-systeme-solaire.net/rest/bodies/');
        const data = await response.json();
        planetDataCache = data.bodies; // Store all planet data globally
    } catch (error) {
        console.error('Error fetching planet data:', error);
    }
}

// Filter planet data by name from cache
function getPlanetDataByName(planetName) {
    const filteredPlanets = planetDataCache.filter(
        planet => planet.englishName.toLowerCase() === planetName.toLowerCase()
    );
    return filteredPlanets.length > 0 ? filteredPlanets[0] : null;
}

// Call this once during scene initialization
fetchPlanetData();
let focusedOnCanvas = false;

// Modify the onClick function to use the cached data
async function onClick(event) {
    if(event.target == renderer.domElement){
        focusedOnCanvas = true;
    }else {
        focusedOnCanvas = false;
    }
    raycaster.setFromCamera(mouse, camera);
    const objectsToCheck = [...planets.map(p => p.mesh), sun];
    const intersects = raycaster.intersectObjects(objectsToCheck);

    // Check if the click was on an input field or the save button
    const targetElement = event.target;

    if (targetElement.id === "save-button" || targetElement.matches("input")) {
        // If the click was on the save button or any input field, do not reset the camera
        return;
    }

    if (intersects.length > 0 && event.target == renderer.domElement) {
        isPlaying = true; // Toggle play state
        playButton.textContent = "❚❚"; // Change button to pause icon
        toggleAnimation(true); // Call your function to start or continue the animation

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
            console.log(planetData);
        } else {
            console.log(`Planet named "${planetName}" not found.`);
        }
    } else {
        
    }
}

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


// Get the play button
const playButton = document.getElementById("play-button");

// Variable to track play state
let isPlaying = true;

// Add event listener for the play button
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

// Function to control animation (replace with your actual implementation)
function toggleAnimation(play) {
    if (play) {
        isAnimating = true;
        animate();
        console.log("Animation started");
        // Your animation start logic here
    } else {
        // Pause the animation
        isAnimating = false;
        console.log("Animation paused");
        // Your animation pause logic here
    }
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
