export class DirectionalLight {
  constructor({
    color = [255, 255, 255],
    intensity = 1,
    direction = [0, -1, 0],
  } = {}) {
    this.color = color;
    this.intensity = intensity;
    this.direction = direction;
  }
}
