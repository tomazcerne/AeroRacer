import { Transform } from "../engine/core/Transform.js";

export class ColisionDetector {
  constructor(airplaneAndCamera, loops) {
    this.airplaneAndCamera = airplaneAndCamera;
    this.heightMap = [];
    this.heightCorrectionFactor = 1.75; // Correction factor for detected height
    const canvas = document.querySelector("#heightMapCanvas");
    const image = document.querySelector("#heightMapImage");
    image.src = "./physics/heights.png";
    const ctx = canvas.getContext("2d");

    this.loops = loops;
    this.completed = [loops.length];
    for (let i = 0; i < loops.length; i++) {
      this.completed[i] = 0; // 0: not completed, 1: sucsess, 2: failed
    }
    this.nextLoop = 0;
    this.currentErr = Number.MAX_VALUE
    this.positionPrev = this.airplaneAndCamera.getComponentOfType(Transform).translation;
    this.positionNow = this.airplaneAndCamera.getComponentOfType(Transform).translation;

    this.hit = new Howl({
      src: ['./sounds/hit.mp3'],
      loop: false
    });
    this.miss = new Howl({
      src: ['./sounds/miss.mp3'],
      loop: false,
      volume: 1.6
    });
    this.crashed = false;
    this.crash = new Howl({
      src: ['./sounds/crash.mp3'],
      loop: false,
      volume: 0.85
    });
    this.backgroundMusic = new Howl({
      src: ['./sounds/background.mp3'],
      loop: true,
      volume: 0.4
    });
    this.playing = false;

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
    if (!this.playing) {
      this.playing = true;
      this.backgroundMusic.play();
    }
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

    // Check for collision
    if (height < 0) {
      if(!this.crashed) {
        this.crash.play();
        this.backgroundMusic.stop();
        this.crashed = true;
      }
      const gameScreen = document.querySelector("#gameScreen");
      const endScreen = document.querySelector("#endScreen");
      const message = endScreen.querySelector(".message");
      message.innerText = "You crashed into the ground!";
      gameScreen.style.display = "none";
      endScreen.style.display = "block";
    }

    // ---------------------------------------------------

    // LOOP COLLISION DETECTION
    // Utility function to convert degrees to radians
    function toRadians(degrees) {
      degrees = 180 - (degrees % 180);
      return (degrees * Math.PI) / 180;
    }

    // Function to check if the airplane crosses a vertical plane
    function hasCrossedPlane(prevPos, currPos, loop) {
      const [x, y, z, rotation] = loop;
      
      // Normal vector of the plane based on rotation (in XY plane)
      const normalX = Math.cos(toRadians(rotation));
      const normalZ = Math.sin(toRadians(rotation));
      
      // Plane equation: (normalX * (Px - x)) + (normalZ * (Pz - z)) = 0
      const prevDot = normalX * (prevPos[0] - x) + normalZ * (prevPos[2] - z);
      const currDot = normalX * (currPos[0] - x) + normalZ * (currPos[2] - z);

      // Check if the signs of the dot products are different, indicating crossing
      return prevDot * currDot <= 0;
    }

    // Function to check if the airplane is within the hoop's radius
    function isWithinHoop(currPos, loop, radius = 27) {
      const [x, y, z, angle] = loop;
      
      const distSquared = 
        (currPos[0] - x) ** 2 +
        (currPos[1] - y) ** 2 +
        (currPos[2] - z) ** 2;
      
      return distSquared <= radius ** 2;
    }

    // Main function to check the loop
    const checkHoopCrossing = function (prevPos, currPos, loop) {
      if (this.nextLoop >= this.loops.length) {
        return;
      }
      if (hasCrossedPlane(prevPos, currPos, loop)) {
        if (isWithinHoop(currPos, loop)) {
          this.hit.play();
          console.log("Crossed and passed through the hoop at", loop);
          this.completed[this.nextLoop] = 1;
          console.log(this.completed)
          this.nextLoop += 1;
          console.log(this.nextLoop)
        } else {
          this.miss.play();
          console.log("Crossed but missed the hoop at", loop);
          this.completed[this.nextLoop] = -1;
          console.log(this.completed)
          this.nextLoop += 1;
          console.log(this.nextLoop)
        }
      }
    }.bind(this);

    this.positionPrev = this.positionNow
    this.positionNow = translation
    checkHoopCrossing(this.positionPrev, this.positionNow, this.loops[this.nextLoop]);

    // Update Scoreboard
    const updateScoreboard = () => {
      const scoreboardCanvas = document.querySelector("#scoreboardCanvas");
      const scoreboardCtx = scoreboardCanvas.getContext("2d");
    
      // Dynamically set canvas resolution
      const width = scoreboardCanvas.offsetWidth;
      const height = scoreboardCanvas.offsetHeight;
    
      scoreboardCanvas.width = width;
      scoreboardCanvas.height = height;
    
      // Clear previous drawings
      scoreboardCtx.clearRect(0, 0, scoreboardCanvas.width, scoreboardCanvas.height);
    
      // Calculate rectangle sizes based on loop count and canvas width
      const totalLoops = this.loops.length;
      const padding = 8; // Space between rectangles
      const rectWidth = (scoreboardCanvas.width - (totalLoops - 1) * padding) / totalLoops;
      const rectHeight = scoreboardCanvas.height * 0.7; // 70% of canvas height
      const offsetY = (scoreboardCanvas.height - rectHeight) / 2; // Center vertically
    
      this.completed.forEach((status, index) => {
        const x = index * (rectWidth + padding);
    
        // Fill the inside of the box based on status
        if (this.nextLoop >= this.loops.length && status === 1) {
          scoreboardCtx.fillStyle = "#0000ff"; // Blue for success in the last loop
        } else if (status === 1) {
          scoreboardCtx.fillStyle = "#e8b923"; // Yellow for success
        } else if (status === -1) {
          scoreboardCtx.fillStyle = "#ff3f34"; // Red for failure
        } else {
          scoreboardCtx.fillStyle = "rgba(255, 255, 255, 0)"; // Transparent for uncompleted
        }
    
        // Draw filled rectangle
        scoreboardCtx.fillRect(x, offsetY, rectWidth, rectHeight);
    
        // Draw solid border around each rectangle
        scoreboardCtx.strokeStyle = "rgba(0, 0, 0, 1)"; // Solid white border
        scoreboardCtx.lineWidth = 3;
        scoreboardCtx.strokeRect(x, offsetY, rectWidth, rectHeight);
      });
    };
    updateScoreboard();
  }
}
