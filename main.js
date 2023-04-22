import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat.gui";
import gsap from "gsap";

// GUI
const gui = new dat.GUI();

const world = {
  plane: {
    width: 400,
    height: 400,
    widthSegments: 50,
    heightSegments: 50,
    red: 0.1,
    green: 0.19,
    blue: 0.4,
    redForHoover: 0.1,
    greenForHoover: 0.5,
    blueForHoover: 1,
  },
};

gui.add(world.plane, "width", 1, 500).onChange(generatePlane);
gui.add(world.plane, "height", 1, 500).onChange(generatePlane);
gui.add(world.plane, "widthSegments", 1, 100).onChange(generatePlane);
gui.add(world.plane, "heightSegments", 1, 100).onChange(generatePlane);
gui.add(world.plane, "red", 0, 1).onChange(generatePlane);
gui.add(world.plane, "green", 0, 1).onChange(generatePlane);
gui.add(world.plane, "blue", 0, 1).onChange(generatePlane);
gui.add(world.plane, "redForHoover", 0, 1).onChange(generatePlane);
gui.add(world.plane, "greenForHoover", 0, 1).onChange(generatePlane);
gui.add(world.plane, "blueForHoover", 0, 1).onChange(generatePlane);

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

// MESH
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
      r: world.plane.redForHoover,
      g: world.plane.greenForHoover,
      b: world.plane.blueForHoover,
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
}

animate();
