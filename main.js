import { ResizeSystem } from "./engine/systems/ResizeSystem.js";
import { UpdateSystem } from "./engine/systems/UpdateSystem.js";

import { UnlitRenderer } from "./engine/renderers/UnlitRenderer.js";
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
import { LandscapeColisionDetector } from "./physics/LandscapeCollisionDetector.js";

// Load resources
const resources = await loadResources({
  mesh: new URL("./models/airplane/plane.obj", import.meta.url),
  image: new URL("./models/airplane/skin-01.jpg", import.meta.url),
  landscapeMesh: new URL("models/landscape/LANDSCAPE.obj", import.meta.url),
  landscapeImage: new URL(
    "models/landscape/Ground062S_1K-JPG_Color.jpg",
    import.meta.url
  ),
  loopMesh: new URL("models/loop/loop.obj", import.meta.url),
  loopImage: new URL("models/loop/yellowOrangeColor.jpg", import.meta.url),
  finalLoopImage: new URL("models/loop/blue.jpg", import.meta.url),
});

const canvas = document.querySelector("canvas");
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const resizeSystem = new ResizeSystem({ canvas, resize });
const updateSystem = new UpdateSystem({ update, render });

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
camera.addComponent(new Camera({ near: 1, far: 2000 }));
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
planeAndCamera.addComponent(
  new AirplaneMotionController(planeAndCamera, airplane, {})
);
planeAndCamera.addComponent(new LandscapeColisionDetector(planeAndCamera));

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

// Create the scene
const scene = new Node();
scene.addChild(planeAndCamera);
scene.addChild(landscape);

// Add n loops to the scene with some random variation
const loopPositions = [
  [100, 377, 1800, 80], // [x, y, z, rotation]
  [820, 297, 1060, 60],
  [1318, 240, 745, 50],
  [1855, 182, 400, 50],
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

function update(time, dt) {
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
startButton.addEventListener("click", () => {
  const startScreen = document.querySelector("#startScreen");
  const gameScreen = document.querySelector("#gameScreen");
  startScreen.style.display = "none";
  gameScreen.style.display = "block";
  new ResizeSystem({ canvas, resize }).start();
  new UpdateSystem({ update, render }).start();
});
