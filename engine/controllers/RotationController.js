import { quat } from 'glm';
import { Transform } from '../core/Transform.js';

export class RotationController {

    constructor(node, domElement, {
        pitch = 0,
        yaw = 0,
        rotationSpeed = 1.0,  // Controls the rotation speed
        decay = 0.997,         // Decay factor for smoothing rotation speed
        acceleration = 2.0,    // How fast the rotation accelerates
        decay_velocity = 0.99, // Decay factor for smoothing velocity
        max_rotation_velocity = 0.2
    } = {}) {
        this.node = node;
        this.domElement = domElement;

        this.pitch = pitch;
        this.yaw = yaw;

        this.rotationSpeed = rotationSpeed;
        this.decay = decay;
        this.decay_velocity = decay_velocity;
        this.max_rotation_velocity = max_rotation_velocity;
        this.acceleration = acceleration;

        this.deltaPitchVelocity = 0;
        this.deltaYawVelocity = 0;

        this.keys = {};

        this.initHandlers();
    }

    // Handles keyboard input for rotation and applies acceleration
    update(t, dt) {
        const transform = this.node.getComponentOfType(Transform);
        if (!transform) return;

        // Calculate rotational acceleration based on key presses
        let deltaPitchAcceleration = 0;
        let deltaYawAcceleration = 0;

        if (this.keys['KeyS']) {
            deltaPitchAcceleration = -this.acceleration;  // Rotate up
        }
        if (this.keys['KeyW']) {
            deltaPitchAcceleration = this.acceleration;   // Rotate down
        }

        if (this.keys['KeyD']) {
            deltaYawAcceleration = this.acceleration;    // Rotate left (around Z-axis)
        }
        if (this.keys['KeyA']) {
            deltaYawAcceleration = -this.acceleration;   // Rotate right (around Z-axis)
        }

        // Apply acceleration to the velocity (deltaPitchVelocity and deltaYawVelocity)
        this.deltaPitchVelocity += deltaPitchAcceleration * dt;
        this.deltaYawVelocity += deltaYawAcceleration * dt;

        // Make sure the pitch/yaw velocity doesn't exceed the maximum speed
        if(this.deltaPitchVelocity > this.max_rotation_velocity) {
            this.deltaPitchVelocity = this.max_rotation_velocity;
        } else if (this.deltaPitchVelocity < -this.max_rotation_velocity) {
            this.deltaPitchVelocity = -this.max_rotation_velocity;
        } else if (this.deltaYawVelocity > this.max_rotation_velocity) {
            this.deltaYawVelocity = this.max_rotation_velocity;
        } else if (this.deltaYawVelocity < -this.max_rotation_velocity) {
            this.deltaYawVelocity = -this.max_rotation_velocity;
        }

        // Apply decay to the velocities when no keys are pressed
        if (!this.keys['KeyW'] && !this.keys['KeyS']) {
            this.deltaPitchVelocity *= this.decay_velocity;
        }
        if (!this.keys['KeyA'] && !this.keys['KeyD']) {
            this.deltaYawVelocity *= this.decay_velocity;
        }

        // Update the pitch and yaw based on the velocities
        this.pitch += this.deltaPitchVelocity * dt;
        this.yaw += this.deltaYawVelocity * dt;

        // Apply the decay when no keys are pressed, gradually returning to the default rotation
        if (!this.keys['KeyW'] && !this.keys['KeyS'] && !this.keys['KeyA'] && !this.keys['KeyD']) {
            this.pitch *= this.decay;  // Decay vertical rotation
            
            // ---- UNCOMMENT THIS LINE TO ENABLE DECAY FOR HORIZONTAL ROTATION ----
            //this.yaw *= this.decay;    // Decay horizontal rotation
        }

        // Apply rotational clamping
        const halfPi = Math.PI / 2;
        const twoPi = Math.PI * 2;

        this.pitch = Math.min(Math.max(this.pitch, -halfPi), halfPi);
        this.yaw = ((this.yaw % twoPi) + twoPi) % twoPi;

        // Apply the calculated rotation to the object
        const rotation = quat.create();
        // Y axis here
        quat.rotateY(rotation, rotation, Math.PI);  // Z axis is always 180 degrees
        quat.rotateZ(rotation, rotation, this.yaw);  // Apply yaw (Z-axis rotation)
        quat.rotateX(rotation, rotation, this.pitch);  // Apply pitch (X-axis rotation)
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
