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

import { RotationController } from './engine/controllers/RotationController.js';

const resources = await loadResources({
    'mesh': new URL('models/airplane/plane.obj', import.meta.url),
    'image': new URL('models/airplane/tempTexture.png', import.meta.url),
});

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const airplane = new Node();
// load airplane object and texture
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
// initial position: scale and rotate
airplane.addComponent(new Transform({
    rotation: quat.fromEuler(quat.create(), 0, 180, 0),
    scale: [5, 5, 5]
}));

// pitch, roll, yaw controls (rotations in all directions)
airplane.addComponent(new RotationController(airplane, canvas, {
    pitch: 0,
    roll: 0,
    yaw: 0,
    rotationSpeed: 0.25,
})); 

// initialize camera
const camera = new Node();
camera.addComponent(new Camera());
camera.addComponent(new Transform({
    translation: [0, 5, 30]
}));

// airplane + camera scene
const scene = new Node();
scene.addChild(airplane);
scene.addChild(camera);

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