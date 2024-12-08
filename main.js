import { ResizeSystem } from "./engine/systems/ResizeSystem.js";
import { UpdateSystem } from "./engine/systems/UpdateSystem.js";

import { mat4, quat } from "glm";

import {
  Camera,
  Material,
  Model,
  Node,
  Primitive,
  Sampler,
  Texture,
  Transform,
} from "engine/core.js";

import { loadResources } from "engine/loaders/resources.js";

import { AirplaneRotationController } from "./physics/AirplaneRotationController.js";
import { AirplaneMotionController } from "./physics/AirplaneMotionController.js";
import { ColisionDetector } from "./physics/CollisionDetector.js";
import { DirLitRenderer } from "./lights/DirLitRenderer.js";
import { DirectionalLight } from "./lights/DirectionalLight.js";

var gameRunning = { value: false };

// Load resources
const resources = await loadResources({
  mesh: new URL("./models/airplane/plane.obj", import.meta.url),
  image: new URL("./models/airplane/skin-01.jpg", import.meta.url),
  landscapeMesh: new URL("models/landscape/LANDSCAPE.obj", import.meta.url),
  landscapeImage: new URL(
    "models/landscape/Ground062S_1K-JPG_Color.jpg",
    import.meta.url
  ),
  skyMesh: new URL("models/landscape/skyDome.obj", import.meta.url),
  skyImage: new URL(
    "models/landscape/Ground062S_1K-JPG_Color.jpg",
    import.meta.url
  ),
  loopMesh: new URL("models/loop/loop.obj", import.meta.url),
  loopImage: new URL("models/loop/yellowOrangeColor.jpg", import.meta.url),
  finalLoopImage: new URL("models/loop/blue.jpg", import.meta.url),
});

const canvas = document.querySelector("canvas");
const renderer = new DirLitRenderer(canvas);
await renderer.initialize();

// Create airplane
const airplane = new Node();
airplane.addComponent(
  new Model({
    primitives: [
      new Primitive({
        mesh: resources.mesh,
        material: new Material({
          baseTexture: new Texture({
            image: resources.image,
            sampler: new Sampler(),
          }),
          diffuse: 0.6,
          specular: 0.7,
          shininess: 0.5,
        }),
      }),
    ],
  })
);
airplane.addComponent(
  new Transform({
    rotation: quat.fromEuler(quat.create(), 0, 180, 0),
  })
);
airplane.addComponent(new AirplaneRotationController(airplane, canvas, {}));

// Initialize camera
const camera = new Node();
camera.addComponent(new Camera({ near: 2, far: 3000 }));
camera.addComponent(
  new Transform({
    translation: [0, 0.7, 5],
  })
);

const planeAndCamera = new Node();
planeAndCamera.addChild(airplane);
planeAndCamera.addChild(camera);
planeAndCamera.addComponent(
  new Transform({
    translation: [0, 400, 2500],
  })
);

// Create landscape with adjusted texture scaling
const landscape = new Node();
landscape.addComponent(
  new Model({
    primitives: [
      new Primitive({
        mesh: resources.landscapeMesh,
        material: new Material({
          baseTexture: new Texture({
            image: resources.landscapeImage,
            sampler: new Sampler(),
          }),
          baseFactor: [1.0, 1.0, 1.0, 1.0], // White base factor
          uvScale: [0.005, 0.005], // Adjust to make the texture larger
          diffuse: 0.5,
          specular: 0.05,
          shininess: 0.1,
          lightingMode: "phong",
        }),
      }),
    ],
  })
);
landscape.addComponent(
  new Transform({
    /* translation: [0, -150
        , 0], // Position the landscape below the airplane */
    // plane and camera position is translated instead
    scale: [1000, 1000, 1000],
  })
);

const sky = new Node();
sky.addComponent(
  new Model({
    primitives: [
      new Primitive({
        mesh: resources.skyMesh,
        material: new Material({
          baseTexture: new Texture({
            image: resources.skyImage,
            sampler: new Sampler(),
          }),
          baseFactor: [1.0, 1.0, 1.0, 1.0], // Black base factor
          uvScale: [0.005, 0.005], // Adjust to make the texture larger
          lightingMode: "unlit",
        }),
      }),
    ],
  })
);
sky.addComponent(
  new Transform({
    scale: [750, 750, 750],
  })
);

// Create the scene
const scene = new Node();
scene.addChild(planeAndCamera);
scene.addChild(landscape);
scene.addChild(sky);

// Create loops
const loopPositions = [
  [100, 377, 1800, 80], // [x, y, z, rotation]
  [820, 297, 1060, 60],
  [1318, 240, 745, 60],
  [1855, 182, 400, 55],
  [2090, 265, 105, 80],
  [2238, 263, -935, 95],
  [1979, 228, -1557, 130],
  [780, 113, -1858, 190],
  [60, 91, -1485, 190],
  [-1040, 122, -565, 245],
  [-921, 155, 202, 340],
];
var loops = [];
for (let i = 0; i < loopPositions.length; i++) {
  const loop = new Node();
  if (i == loopPositions.length - 1) {
    loop.addComponent(
      new Model({
        primitives: [
          new Primitive({
            mesh: resources.loopMesh,
            material: new Material({
              baseTexture: new Texture({
                image: resources.finalLoopImage,
                sampler: new Sampler(),
              }),
              diffuse: 0.6,
              specular: 0.9,
              shininess: 1.0,
            }),
          }),
        ],
      })
    );
  } else {
    loop.addComponent(
      new Model({
        primitives: [
          new Primitive({
            mesh: resources.loopMesh,
            material: new Material({
              baseTexture: new Texture({
                image: resources.loopImage,
                sampler: new Sampler(),
              }),
              diffuse: 0.6,
              specular: 0.9,
              shininess: 1.0,
            }),
          }),
        ],
      })
    );
  }
  // loops from the array
  let x = loopPositions[i][0];
  let y = loopPositions[i][1];
  let z = loopPositions[i][2];
  loop.addComponent(
    new Transform({
      translation: [x, y, z],
      rotation: quat.fromEuler(quat.create(), 0, loopPositions[i][3], 0),
      scale: [20, 20, 20],
    })
  );
  scene.addChild(loop);
  loops.push(loop);
}

planeAndCamera.addComponent(
  new AirplaneMotionController(planeAndCamera, airplane, sky, gameRunning, {})
);
planeAndCamera.addComponent(
  new ColisionDetector(planeAndCamera, loopPositions, gameRunning)
);

const light = new Node();
light.addComponent(
  new DirectionalLight({
    color: [255, 244, 214],
    intensity: 1.0,
    direction: [0.5, -1, 0],
  })
);
scene.addChild(light);

function update(time, dt) {
  if (!gameRunning.value) {
    return;
  }
  scene.traverse((node) => {
    for (const component of node.components) {
      component.update?.(time, dt);
    }
  });
}

function render() {
  renderer.render(scene, camera);
}

function resize({ displaySize: { width, height } }) {
  camera.getComponentOfType(Camera).aspect = width / height;
}

const startButton = document.querySelector("#startButton");

const doStart = () => {
  gameRunning.value = true;
  document.removeEventListener("keydown", handleKeydown);
  const startScreen = document.querySelector("#startScreen");
  const gameScreen = document.querySelector("#gameScreen");
  startScreen.style.display = "none";
  gameScreen.style.display = "block";
  new ResizeSystem({ canvas, resize }).start();
  new UpdateSystem({ update, render }).start();
};

function handleKeydown(event) {
  if (event.code === "Space") {
    doStart();
  }
}

startButton.addEventListener("click", () => {
  doStart();
});
document.addEventListener("keydown", handleKeydown);
