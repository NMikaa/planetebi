import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light (the Sun)
const light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(0, 0, 0);
scene.add(light);

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Load Sun texture
const sunTexture = textureLoader.load('assets/sun.jpg'); // Path to your sun texture file

// Sun (center) with texture
const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planets
const planets = [];

const createPlanet = (radius, distance, texturePath) => {
  const planetGeometry = new THREE.SphereGeometry(radius, 32, 32);
  const planetTexture = textureLoader.load(texturePath);
  const material = new THREE.MeshStandardMaterial({ map: planetTexture });
  const planet = new THREE.Mesh(planetGeometry, material);
  planet.position.x = distance;
  scene.add(planet);
  return planet;
};

// Example planets with texture
planets.push(createPlanet(0.5, 10, 'path/to/mercury_texture.jpg'));
planets.push(createPlanet(0.7, 15, 'path/to/venus_texture.jpg'));
// Add more planets as needed...

// Orbiting animation
function animate() {
  requestAnimationFrame(animate);

  planets.forEach((planet, index) => {
    // Basic orbit movement (simplified)
    planet.position.x = Math.cos(Date.now() * 0.001 * (index + 1)) * (index + 10);
    planet.position.z = Math.sin(Date.now() * 0.001 * (index + 1)) * (index + 10);
  });

  renderer.render(scene, camera);
}

camera.position.z = 50;  // Adjust camera for proper view
animate();
