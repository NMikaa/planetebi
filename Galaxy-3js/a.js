const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);  // Black background for space

// Create the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 100;  // Set initial zoom to see both galaxies

// Create the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Galaxy 1 (with 3 planets)
const galaxy1 = new THREE.Group();
const star1Geometry = new THREE.SphereGeometry(5, 100, 100);  // Star (Sun) in Galaxy 1
const star1Material = new THREE.MeshBasicMaterial({ color: 0xffff00 });  // Yellow color
const star1 = new THREE.Mesh(star1Geometry, star1Material);
galaxy1.add(star1);

// Create planets for galaxy 1
const planets1 = [];
const planetData1 = [
  { radius: 10, speed: 0.01, color: 0x0000ff }, // Blue planet
  { radius: 15, speed: 0.008, color: 0x00ff00 }, // Green planet
  { radius: 20, speed: 0.005, color: 0xff0000 }  // Red planet
];
planetData1.forEach(data => {
  const planetGeometry = new THREE.SphereGeometry(2, 32, 32);  // Planet size
  const planetMaterial = new THREE.MeshBasicMaterial({ color: data.color });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  planet.userData = { angle: 0, speed: data.speed, orbitRadius: data.radius };  // Orbit data
  galaxy1.add(planet);
  planets1.push(planet);
});
scene.add(galaxy1);

// Galaxy 2 (with 5 stars and a fixed sun)
const galaxy2 = new THREE.Group();
galaxy2.position.set(100, 0, 0);  // Position the second galaxy far from the first

// Fixed sun in Galaxy 2
const star2Geometry = new THREE.SphereGeometry(10, 100, 100);  // Fixed star (Sun)
const star2Material = new THREE.MeshBasicMaterial({ color: 0xffcc00 });  // Yellow color
const star2 = new THREE.Mesh(star2Geometry, star2Material);
galaxy2.add(star2);  // Add fixed star to Galaxy 2

// Create stars for Galaxy 2
const starData2 = [
  { orbitRadius: 3, speed: 0.008, color: 0xffaa00 },  // Orange star
  { orbitRadius: 9, speed: 0.006, color: 0x00aaff },  // Cyan star
  { orbitRadius: 11, speed: 0.004, color: 0xff00ff },  // Magenta star
  { orbitRadius: 25, speed: 0.003, color: 0xff0000 },  // Red star
  { orbitRadius: 30, speed: 0.002, color: 0x00ff00 }   // Green star
];

// Create stars for Galaxy 2
const stars2 = [];
starData2.forEach(data => {
  const starGeometry = new THREE.SphereGeometry(3, 32, 32);  // Star size
  const starMaterial = new THREE.MeshBasicMaterial({ color: data.color });
  const star = new THREE.Mesh(starGeometry, starMaterial);
  star.userData = { angle: 0, speed: data.speed, orbitRadius: data.orbitRadius };  // Orbit data
  galaxy2.add(star);
  stars2.push(star);
});
scene.add(galaxy2);

// Create star field (background)
const starCount = 3000;  // Number of stars
const starsGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);  // x, y, z for each star
const starSizes = new Float32Array(starCount);  // Size for each star

for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 500;  // Random x position
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 500;  // Random y position
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 500;  // Random z position
  starSizes[i] = Math.random() * 0.5;  // Random size for twinkling effect
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starsGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

// Create points material for stars
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, sizeAttenuation: true, size: 1 });
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040); // Soft light
scene.add(ambientLight);

// Drag effect variables
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Handle mouse down
window.addEventListener('mousedown', (event) => {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
});

// Handle mouse move
window.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y,
    };

    camera.position.x -= deltaMove.x * 0.1;  // Adjust sensitivity as needed
    camera.position.y += deltaMove.y * 0.1;  // Adjust sensitivity as needed
    previousMousePosition = { x: event.clientX, y: event.clientY };
  }
});

// Handle mouse up
window.addEventListener('mouseup', () => {
  isDragging = false;
});

// Handle zoom with mouse scroll
window.addEventListener('wheel', (event) => {
  if (event.deltaY > 0) {
    camera.position.z += 2;  // Zoom out
  } else {
    camera.position.z -= 2;  // Zoom in
  }
});

// Render the scene
function animate() {
  requestAnimationFrame(animate);

  // Update planet positions for Galaxy 1
  planets1.forEach(planet => {
    planet.userData.angle += planet.userData.speed;  // Increment angle for rotation
    planet.position.x = planet.userData.orbitRadius * Math.cos(planet.userData.angle);
    planet.position.z = planet.userData.orbitRadius * Math.sin(planet.userData.angle);
  });

  // Update star positions for Galaxy 2
  stars2.forEach(star => {
    star.userData.angle += star.userData.speed;  // Increment angle for rotation
    star.position.x = star.userData.orbitRadius * Math.cos(star.userData.angle);
    star.position.z = star.userData.orbitRadius * Math.sin(star.userData.angle);
  });

  // Optional: Update sizes to create a twinkling effect
  for (let i = 0; i < starCount; i++) {
    stars.geometry.attributes.size.setX(i, Math.random() * 0.5);
  }
  stars.geometry.attributes.size.needsUpdate = true;  // Update attribute in GPU

  renderer.render(scene, camera);
}


function gaussianRandom(mean, stdDev) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v); // Box-Muller transform
    return num * stdDev + mean;
  }
  
animate();

// Handle window resizing
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
