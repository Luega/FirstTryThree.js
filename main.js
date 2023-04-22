import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat.gui";
import gsap from "gsap";

// GUI
const gui = new dat.GUI();

gui.close();

const world = {
  plane: {
    width: 800,
    height: 800,
    widthSegments: 100,
    heightSegments: 100,
    red: 0.1,
    green: 0.19,
    blue: 0.4,
    redForHover: 0.1,
    greenForHover: 0.5,
    blueForHover: 1,
  },
};

gui.add(world.plane, "width", 1, 1000).onChange(generatePlane);
gui.add(world.plane, "height", 1, 1000).onChange(generatePlane);
gui.add(world.plane, "widthSegments", 1, 200).onChange(generatePlane);
gui.add(world.plane, "heightSegments", 1, 200).onChange(generatePlane);
gui.add(world.plane, "red", 0, 1).onChange(generatePlane);
gui.add(world.plane, "green", 0, 1).onChange(generatePlane);
gui.add(world.plane, "blue", 0, 1).onChange(generatePlane);
gui.add(world.plane, "redForHover", 0, 1).onChange(generatePlane);
gui.add(world.plane, "greenForHover", 0, 1).onChange(generatePlane);
gui.add(world.plane, "blueForHover", 0, 1).onChange(generatePlane);

function generatePlane() {
  planeMesh.geometry.dispose();

  planeMesh.geometry = new THREE.PlaneGeometry(
    world.plane.width,
    world.plane.height,
    world.plane.widthSegments,
    world.plane.heightSegments
  );

  const randomValues = [];
  planeMesh.geometry.attributes.position.originalPosition =
    planeMesh.geometry.attributes.position.array;
  planeMesh.geometry.attributes.position.randomValues = randomValues;

  const { array } = planeMesh.geometry.attributes.position;
  for (let i = 0; i < array.length; i++) {
    if (i % 3 === 0) {
      const x = array[i];
      const y = array[i + 1];
      const z = array[i + 2];

      array[i] = x + Math.random() - 0.5;
      array[i + 1] = y + (Math.random() - 0.5) * 3;
      array[i + 2] = z + (Math.random() - 0.5) * 3;
    }

    randomValues.push(Math.random() * Math.PI * 2);
  }

  const colors = [];
  for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
    colors.push(world.plane.red, world.plane.green, world.plane.blue);
  }
  planeMesh.geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(colors), 3)
  );
}

// SCENE - CAMERA - RENDERER
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

new OrbitControls(camera, renderer.domElement);

// MESHES
// plane
const planeGeometry = new THREE.PlaneGeometry(
  world.plane.width,
  world.plane.height,
  world.plane.widthSegments,
  world.plane.heightSegments
);
const planeMaterial = new THREE.MeshPhongMaterial({
  side: THREE.DoubleSide,
  flatShading: true,
  vertexColors: true,
});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(planeMesh);
generatePlane();

// stars
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
});
const starVertices = [];
for (let i = 0; i < 3000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 1000;
  starVertices.push(x, y, z);
}
starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starVertices, 3)
);
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// LIGHT
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 1);
scene.add(light);
const backlight = new THREE.DirectionalLight(0xffffff, 1);
backlight.position.set(0, -1, -1);
scene.add(backlight);

// RAYCASTER
const raycaster = new THREE.Raycaster();

const mouse = {
  x: undefined,
  y: undefined,
};
addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / innerHeight) * 2 + 1;
});

let frame = 0;

// ANIMATE
function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);

  frame += 0.01;

  const { array, originalPosition, randomValues } =
    planeMesh.geometry.attributes.position;
  for (let i = 0; i < array.length; i += 3) {
    array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.005;
    array[i + 1] =
      originalPosition[i + 1] + Math.sin(frame + randomValues[i + 1]) * 0.005;
  }
  planeMesh.geometry.attributes.position.needsUpdate = true;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(planeMesh);
  if (intersects.length > 0) {
    const initialColor = {
      r: world.plane.red,
      g: world.plane.green,
      b: world.plane.blue,
    };
    const hoverColor = {
      r: world.plane.redForHover,
      g: world.plane.greenForHover,
      b: world.plane.blueForHover,
    };
    gsap.to(hoverColor, {
      r: initialColor.r,
      g: initialColor.g,
      b: initialColor.b,
      onUpdate: () => {
        const { color } = intersects[0].object.geometry.attributes;
        // v-1
        color.setX(intersects[0].face.a, hoverColor.r);
        color.setY(intersects[0].face.a, hoverColor.g);
        color.setZ(intersects[0].face.a, hoverColor.b);
        // v-2
        color.setX(intersects[0].face.b, hoverColor.r);
        color.setY(intersects[0].face.b, hoverColor.g);
        color.setZ(intersects[0].face.b, hoverColor.b);
        // v-3
        color.setX(intersects[0].face.c, hoverColor.r);
        color.setY(intersects[0].face.c, hoverColor.g);
        color.setZ(intersects[0].face.c, hoverColor.b);

        color.needsUpdate = true;
      },
    });
  }

  stars.rotation.x += 0.0003;
}

animate();

// animation for text
gsap.to(".my_animation", {
  y: 0,
  opacity: 1,
  duration: 1.5,
  ease: "expo",
  stagger: 0.6,
});

// animation for Link
document.querySelector("#githubLink").addEventListener("click", (e) => {
  e.preventDefault();
  const lunch = gsap.timeline();
  lunch
    .to("#container", { opacity: 0 })
    .to(camera.position, {
      z: 25,
      ease: "power3.in",
      duration: 3,
    })
    .to(
      camera.rotation,
      {
        x: 1.57,
        ease: "power3.in",
        duration: 3,
      },
      "<"
    )
    .to(
      camera.position,
      {
        y: 1000,
        ease: "power3.in",
        duration: 1.5,
      },
      "-=0.8"
    )
    .add(() => {
      window.location.href = "https://github.com/Luega";
    }, "-=0.7");
});

addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix;
});
