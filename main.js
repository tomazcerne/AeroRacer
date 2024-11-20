import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { mat4, quat } from 'glm';

import {
    Camera,
    Material,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from 'engine/core.js';

import { loadResources } from 'engine/loaders/resources.js';

import { AirplaneRotationController} from './physics/AirplaneRotationController.js';
import { AirplaneMotionController } from './physics/AirplaneMotionController.js';

// Load resources
const resources = await loadResources({
    'mesh': new URL('models/airplane/plane.obj', import.meta.url),
    'image': new URL('models/airplane/skin-01.jpg', import.meta.url),
    'landscapeMesh': new URL('models/airplane/LANDSCAPE.obj', import.meta.url),
    'landscapeImage': new URL('models/airplane/Ground062S_1K-JPG_Color.jpg', import.meta.url),
});

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

// Create airplane
const airplane = new Node();
airplane.addComponent(new Model({
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
}));
airplane.addComponent(new Transform({
    rotation: quat.fromEuler(quat.create(), 0, 180, 0),
    scale: [5, 5, 5],
}));
airplane.addComponent(new AirplaneRotationController(airplane, canvas, {
    
}));

// Initialize camera
const camera = new Node();
camera.addComponent(new Camera({near: 1, far: 2000,}));
camera.addComponent(new Transform({
    translation: [0, 5, 25],
}));

const planeAndCamera = new Node()
planeAndCamera.addChild(airplane)
planeAndCamera.addChild(camera)
planeAndCamera.addComponent(new Transform({
    rotation: quat.fromEuler(quat.create(), 0, 0, 0),
}));
planeAndCamera.addComponent(new AirplaneMotionController(planeAndCamera, airplane, canvas, {
    
}));

// Create landscape with adjusted texture scaling
const landscape = new Node();
landscape.addComponent(new Model({
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
}));
landscape.addComponent(new Transform({
    translation: [0, -150
        , 0], // Position the landscape below the airplane
    scale: [1000, 1000, 500],
}));

// Create the scene
const scene = new Node();
scene.addChild(planeAndCamera);
scene.addChild(landscape);

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();
