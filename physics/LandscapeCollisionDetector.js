import { Transform } from "../engine/core/Transform.js";

export class LandscapeColisionDetector {
  constructor(airplaneAndCamera, heightCorrectionFactor) {
    this.airplaneAndCamera = airplaneAndCamera;
    this.heightMap = [];
    this.heightCorrectionFactor = 1.75; // Correction factor for detected height
    const canvas = document.querySelector("#heightMapCanvas");
    const image = document.querySelector("#heightMapImage");
    image.src = "heights.png";
    const ctx = canvas.getContext("2d");

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const pixels = [];
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const pixelIndex = (y * canvas.width + x) * 4;
          const p = data[pixelIndex];
          pixels.push(p);
        }
      }
      this.heightMap = pixels;
    };
  }

  update(t, dt) {
    const airplane = this.airplaneAndCamera;
    const transform = airplane.getComponentOfType(Transform);
    const translation = transform.translation;

    // Map airplane position to heightmap indices
    let x = Math.round((translation[0] + 2500) / 2);
    let z = Math.round((translation[2] + 2500) / 2);

    // Get the raw heightmap value
    let landscapeHeight = this.heightMap[z * 2500 + x];

    // Apply height correction factor
    landscapeHeight *= this.heightCorrectionFactor;

    // Calculate height difference
    let planeHeight = translation[1];
    const height = planeHeight - landscapeHeight;

    // Update altitude display
    const altitudeData = document.querySelector("#ground span");
    altitudeData.innerText = Math.round(height);
  }
}
