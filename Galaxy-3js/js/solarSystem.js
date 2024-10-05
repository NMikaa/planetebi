// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
const distances = [10, 15, 20, 25, 80, 60, 35, 45]; // Orbital distances

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
createPlanet(0.222, 10, 'assets/mercury.jpg', 'Mercury', 0.04); 
createPlanet(0.564, 15, 'assets/venus.jpg', 'Venus', 0.02);  
createPlanet(0.6, 20, 'assets/earth.jpg', 'Earth', 0.01);  
createPlanet(0.294, 25, 'assets/mars.jpg', 'Mars', 0.008);  
createPlanet(5.1, 80, 'assets/jupiter.jpg', 'Jupiter', 0.002); 
createPlanet(4.98, 60, 'assets/saturn.jpg', 'Saturn', 0.003);  
createPlanet(2.16, 35, 'assets/uranus.jpg', 'Uranus', 0.005);  
createPlanet(2.1, 45, 'assets/neptune.jpg', 'Neptune', 0.004);  

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

function onClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (intersects.length > 0) {
        alert(`You clicked on: ${intersects[0].object.name}`);
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