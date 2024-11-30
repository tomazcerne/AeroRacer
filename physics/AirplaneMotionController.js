import { quat, vec3 } from "glm";
import { Transform } from "../engine/core/Transform.js";
import { AirplaneRotationController } from "./AirplaneRotationController.js";

const PI = Math.PI;

export class AirplaneMotionController {
  constructor(
    planeAndCamera,
    airplane,
    {
      rotationSpeed = {
        pitch: 1.5,
        roll: 2,
        yaw: 1.0,
      },
      airspeed = 60, // m/s
      rollImpactFactor = 1.5,
    } = {}
  ) {
    this.planeAndCamera = planeAndCamera;
    this.airplane = airplane;
    this.rotationSpeed = rotationSpeed;
    this.airspeed = airspeed;
    this.directionVectors = {
      axisX: [-1, 0, 0],
      axisY: [0, 1, 0],
      axisZ: [0, 0, -1],
    };
    this.position = {
      pitch: 0,
      roll: 0,
      yaw: 0,
    };
    this.rollImpact = 0;
    this.rollImpactFactor = rollImpactFactor;
  }

  getAirplaneDirection() {
    return this.directionVectors;
  }
  getPosition() {
    return this.position;
  }
  angleDegrees(angle) {
    angle *= 180 / PI;
    return Math.round(angle);
  }
  displayPosition() {
    const displayWindow = document.querySelector("#positionDisplay");
    const pitchData = displayWindow.querySelector("#pitch span");
    pitchData.innerText = this.angleDegrees(this.position.pitch);
    const rollData = displayWindow.querySelector("#roll span");
    rollData.innerText = this.angleDegrees(this.position.roll);
    const yawData = displayWindow.querySelector("#yaw span");
    yawData.innerText = this.angleDegrees(this.position.yaw);

    const translation =
      this.planeAndCamera.getComponentOfType(Transform).translation;
    const x = displayWindow.querySelector("#X span");
    x.innerText = Math.round(translation[0]);
    const y = displayWindow.querySelector("#Y span");
    y.innerText = Math.round(translation[1]);
    const z = displayWindow.querySelector("#Z span");
    z.innerText = Math.round(translation[2]);
  }

  updateDirectionVectors(rotation) {
    const vectors = {
      axisX: [-1, 0, 0],
      axisY: [0, 1, 0],
      axisZ: [0, 0, -1],
    };
    vec3.transformQuat(vectors.axisX, vectors.axisX, rotation);
    vec3.transformQuat(vectors.axisY, vectors.axisY, rotation);
    vec3.transformQuat(vectors.axisZ, vectors.axisZ, rotation);
    this.directionVectors = vectors;
  }

  calculateTranslationVector(t, dt) {
    const distance = this.airspeed * dt;
    const vector = this.directionVectors.axisZ;
    vec3.scale(vector, vector, distance);
    return vector;
  }

  angleBetweenVectorAndPlane([l, m, n], [A, B, C]) {
    let sinPhi = A * l + B * m + C * n;
    sinPhi /=
      Math.sqrt(A * A + B * B + C * C) * Math.sqrt(l * l + m * m + n * n);
    return Math.asin(sinPhi);
  }

  updatePosition() {
    const { axisX, axisY, axisZ } = this.directionVectors;
    const up = vec3.dot(axisY, [0, 1, 0]) >= 0;
    const front = vec3.dot(axisZ, [0, 0, -1]) >= 0;
    let pitch = this.angleBetweenVectorAndPlane(axisZ, [0, 1, 0]);
    let roll = this.angleBetweenVectorAndPlane(axisX, [0, 1, 0]);
    let yaw = this.angleBetweenVectorAndPlane(axisZ, [1, 0, 0]);
    let impact = roll;
    if (!up) {
      pitch = pitch > 0 ? PI - pitch : -PI - pitch;
      roll = roll > 0 ? PI - roll : -PI - roll;
    }

    if (roll > PI / 4 && roll < (3 * PI) / 4) {
      impact = PI / 2 - impact;
    } else if (roll < -PI / 4 && roll > (-3 * PI) / 4) {
      impact = -PI / 2 - impact;
    }
    impact *= -1;
    this.rollImpact = impact * this.rollImpactFactor;

    if (!front) {
      yaw = yaw > 0 ? PI - yaw : -PI - yaw;
    }
    if (yaw < 0) {
      yaw += 2 * PI;
    }

    this.position = { pitch, roll, yaw };
  }

  checkBounds(translation) {
    const [x, y, z] = translation;
    if (x < -2500 || x > 2500 || z < -2500 || z > 2500) {
      const gameScreen = document.querySelector("#gameScreen");
      const endScreen = document.querySelector("#endScreen");
      const message = endScreen.querySelector(".message");
      message.innerText = "You went out of bounds!";
      gameScreen.style.display = "none";
      endScreen.style.display = "block";
    }
  }

  update(t, dt) {
    const transform = this.planeAndCamera.getComponentOfType(Transform);
    if (!transform) return;

    const rotCtrl = this.airplane.getComponentOfType(
      AirplaneRotationController
    );
    if (!rotCtrl) return;

    const input = rotCtrl.getInputData();
    const rotate = {
      pitch: -input.pitch * dt * this.rotationSpeed.pitch,
      roll: -input.roll * dt * this.rotationSpeed.roll,
      yaw: input.yaw * dt * this.rotationSpeed.yaw,
    };
    // Apply the calculated rotation to the object
    const yawAdjustment = this.rollImpact * dt * 0.1;
    const rotation = transform.rotation;
    quat.rotateX(rotation, rotation, rotate.pitch); // Apply pitch (X-axis rotation)
    quat.rotateY(rotation, rotation, rotate.yaw + yawAdjustment); // Apply yaw (Y-axis rotation)
    quat.rotateZ(rotation, rotation, rotate.roll); // Apply roll (Z-axis rotation)
    this.updateDirectionVectors(rotation);
    transform.rotation = rotation;

    const translationVector = this.calculateTranslationVector(t, dt);
    transform.translation = transform.translation.map((current, i) => {
      return current + translationVector[i];
    });

    this.checkBounds(transform.translation);

    this.updatePosition();
    this.displayPosition();
  }
}
