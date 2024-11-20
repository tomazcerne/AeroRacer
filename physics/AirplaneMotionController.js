import { quat, vec3 } from 'glm';
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
        translationSpeed = 60, // m/s
    } = {}) {
        this.planeAndCamera = planeAndCamera;
        this.airplane = airplane;
        this.domElement = domElement;
        this.rotationSpeed = rotationSpeed;
        this.translationSpeed = translationSpeed;
        this.translationVector = [0, 0, -1];
        this.position = {
            pitch: 0,
            roll: 0,
            yaw: 0,
        };
    }

    getDirectionVector() {
        return this.translationVector;
    }
    getPosition() {
        return this.position;
    }

    calculateTranslationVector(rotation, t, dt) {
        //console.log(this.position.pitch);
        const distance = this.translationSpeed * dt;
        const vector = vec3.fromValues(0, 0, -1);
        vec3.transformQuat(vector, vector, rotation);
        vec3.normalize(vector, vector);
        vec3.scale(vector, vector, distance);
        return vector;
    }

    update(t, dt) {
        const transform = this.planeAndCamera.getComponentOfType(Transform);
        if (!transform) return;

        const rotCtrl = this.airplane.getComponentOfType(AirplaneRotationController);
        if (!rotCtrl) return;

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

        //TODO set position

        this.translationVector = this.calculateTranslationVector(rotation, t, dt);
        transform.translation = transform.translation.map((current, i) => {
            return current + this.translationVector[i];
        });
    }

}