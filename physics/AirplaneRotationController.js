import { quat } from 'glm';
import { Transform } from '../engine/core/Transform.js';

const PI = Math.PI;

export class AirplaneRotationController {
    constructor(airplane, domElement, {
        input = {
            pitch: 0,
            roll: 0,
            yaw: 0,
        },
        decay = { // Decay factor for smoothing rotation speed
            pitch: 0.995,
            roll: 0.995,
            yaw: 0.995,
        },        
        acceleration = { // How fast the rotation accelerates
            pitch: 0.7,
            roll: 0.7,
            yaw: 0.7,
        },    
        decay_velocity = { // Decay factor for smoothing velocity
            pitch: 0.99,
            roll: 0.99,
            yaw: 0.99,
        }, 
        max_velocity = {
            pitch: 0.2,
            roll: 0.2,
            yaw: 0.15,
        },
    } = {}) {
        this.airplane = airplane;
        this.domElement = domElement;

        this.input = input;
        this.decay = decay;
        this.decay_velocity = decay_velocity;
        this.max_velocity = max_velocity;
        this.acceleration = acceleration;
        this.deltaVelocity = {
            pitch: 0,
            roll: 0,
            yaw: 0,
        };

        this.keys = {};
        this.initHandlers();
    }

    calculatePitchRollYaw(t, dt) {
        // Calculate rotational acceleration based on key presses
        let deltaAcceleration = {
            pitch: 0,
            roll: 0,
            yaw: 0,
        };

        if (this.keys['KeyS']) {
            deltaAcceleration.pitch = -this.acceleration.pitch;  // pitch up
        }
        if (this.keys['KeyW']) {
            deltaAcceleration.pitch = this.acceleration.pitch;   // pitch down
        }

        if (this.keys['KeyD']) {
            deltaAcceleration.roll = this.acceleration.roll;    // roll left 
        }
        if (this.keys['KeyA']) {
            deltaAcceleration.roll = -this.acceleration.roll;   // roll right 
        }

        if (this.keys['KeyQ']) {
            deltaAcceleration.yaw = this.acceleration.yaw;    // yaw left 
        }
        if (this.keys['KeyE']) {
            deltaAcceleration.yaw = -this.acceleration.yaw;   // yaw right 
        }

        // Apply acceleration to the velocity (deltaPitchVelocity, deltaRollVelocity, deltaYawVelocity)
        this.deltaVelocity.pitch += deltaAcceleration.pitch * dt;
        this.deltaVelocity.roll += deltaAcceleration.roll * dt;
        this.deltaVelocity.yaw += deltaAcceleration.yaw * dt;

        // Make sure the pitch/roll/yaw velocity doesn't exceed the maximum speed
        if(this.deltaVelocity.pitch > this.max_velocity.pitch) {
            this.deltaVelocity.pitch = this.max_velocity.pitch;
        } else if (this.deltaVelocity.pitch < -this.max_velocity.pitch) {
            this.deltaVelocity.pitch = -this.max_velocity.pitch;
        } 
        if (this.deltaVelocity.roll > this.max_velocity.roll) {
            this.deltaVelocity.roll = this.max_velocity.roll;
        } else if (this.deltaVelocity.roll < -this.max_velocity.roll) {
            this.deltaVelocity.roll = -this.max_velocity.roll;
        }
        if (this.deltaVelocity.yaw > this.max_velocity.yaw) {
            this.deltaVelocity.yaw = this.max_velocity.yaw;
        } else if (this.deltaVelocity.yaw < -this.max_velocity.yaw) {
            this.deltaVelocity.yaw = -this.max_velocity.yaw;
        }

        // Apply decay to the velocities when no keys are pressed
        if (!this.keys['KeyW'] && !this.keys['KeyS']) {
            this.deltaVelocity.pitch *= this.decay_velocity.pitch;
        }
        if (!this.keys['KeyA'] && !this.keys['KeyD']) {
            this.deltaVelocity.roll *= this.decay_velocity.roll;
        }
        if (!this.keys['KeyQ'] && !this.keys['KeyE']) {
            this.deltaVelocity.yaw *= this.decay_velocity.yaw;
        }

        // Update the pitch, roll, yaw based on the velocities
        this.input.pitch += this.deltaVelocity.pitch * dt;
        this.input.roll += this.deltaVelocity.roll * dt;
        this.input.yaw += this.deltaVelocity.yaw * dt;

        // Apply the decay when no keys are pressed, gradually returning to the default rotation
        if (!this.keys['KeyW'] && !this.keys['KeyS']) {
            this.input.pitch *= this.decay.pitch; // Decay pitch rotation
        }
        if (!this.keys['KeyA'] && !this.keys['KeyD']) { 
            this.input.roll *= this.decay.roll;    // Decay roll rotation
        }
        if (!this.keys['KeyQ'] && !this.keys['KeyE']) {
            this.input.yaw *= this.decay.yaw;  // Decay yaw rotation
        }

        // Apply rotational clamping
        this.input.pitch = Math.min(Math.max(this.input.pitch, -PI/12), PI/12);
        this.input.roll = Math.min(Math.max(this.input.roll, -PI/2), PI/2);
        this.input.yaw = Math.min(Math.max(this.input.yaw, -PI/12), PI/12); 
    }

    getInputData() {
        return this.input
    }

    // Handles keyboard input for rotation and applies acceleration
    update(t, dt) {
        const transform = this.airplane.getComponentOfType(Transform);
        if (!transform) return;

        this.calculatePitchRollYaw(t, dt)

        // Apply the calculated rotation to the object
        const rotation = quat.create();
        // Y axis here
        quat.rotateY(rotation, rotation, Math.PI); // Z axis start input is 180 degrees

        quat.rotateX(rotation, rotation, this.input.pitch);  // Apply pitch (X-axis rotation)   
        quat.rotateY(rotation, rotation, this.input.yaw);  // Apply yaw (Y-axis rotation)
        quat.rotateZ(rotation, rotation, this.input.roll);  // Apply roll (Z-axis rotation)
        transform.rotation = rotation;  
    }

    // Handle key press (keydown)
    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    // Handle key release (keyup)
    keyupHandler(e) {
        this.keys[e.code] = false;
    }

    // Initialize event handlers for key presses and releases
    initHandlers() {
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        // Add event listeners for keydown and keyup events
        const element = this.domElement;
        const doc = element.ownerDocument;

        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);
    }
}
