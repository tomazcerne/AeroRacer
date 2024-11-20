import { quat } from 'glm';
import { Transform } from '../engine/core/Transform.js';
import { AirplaneRotationController } from './AirplaneRotationController.js';

const PI = Math.PI;

export class AirplaneMotionController {

    constructor(planeAndCamera, airplane, domElement, {
        rotationSpeed = {
            pitch: 0.8,
            roll: 0.8,
            yaw: 0.8,
        },
    } = {}) {
        this.planeAndCamera = planeAndCamera;
        this.airplane = airplane;
        this.domElement = domElement;
        this.rotationSpeed = rotationSpeed;
    }

    update(t, dt) {
        const transform = this.planeAndCamera.getComponentOfType(Transform);
        if (!transform) return;

        const rotCtrl = this.airplane.getComponentOfType(AirplaneRotationController)
        const input = rotCtrl.getInputData();
        const rotate = {
            pitch: -input.pitch * dt * this.rotationSpeed.pitch,
            roll: -input.roll * dt * this.rotationSpeed.roll,
            yaw: input.yaw * dt * this.rotationSpeed.yaw,
        };
        // Apply the calculated rotation to the object
        const rotation = transform.rotation;
        quat.rotateX(rotation, rotation, rotate.pitch);  // Apply pitch (X-axis rotation)   
        quat.rotateY(rotation, rotation, rotate.yaw);  // Apply yaw (Y-axis rotation)
        quat.rotateZ(rotation, rotation, rotate.roll);  // Apply roll (Z-axis rotation)
        transform.rotation = rotation;  
    }

}