import React, { useEffect } from 'react';
import './StickHero.scss';

const StickHero: React.FC = () => {
  useEffect(() => {
    // El código original casi exacto, con mínimas adaptaciones para funcionar en React
    // Se ejecuta una única vez al montar el componente

    // Extend the base functionality of JavaScript
    Array.prototype.last = function () {
      return this[this.length - 1];
    };

    // A sinus function that accepts degrees instead of radians
    Math.sinus = function (degree: number) {
      return Math.sin((degree / 180) * Math.PI);
    };

    // Game data
    let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
    let lastTimestamp: number | undefined; // The timestamp of the previous requestAnimationFrame cycle

    let heroX: number; // Changes when moving forward
    let heroY: number; // Only changes when falling
    let sceneOffset: number; // Moves the whole game

    let platforms: { x: number; w: number }[] = [];
    let sticks: { x: number; length: number; rotation: number }[] = [];
    let trees: { x: number; color: string }[] = [];

    let score = 0;

    // Configuration
    const canvasWidth = 375;
    const canvasHeight = 375;
    const platformHeight = 100;
    const heroDistanceFromEdge = 10; // While waiting
    const paddingX = 100; // The waiting position of the hero in from the original canvas size
    const perfectAreaSize = 10;

    // The background moves slower than the hero
    const backgroundSpeedMultiplier = 0.2;

    const hill1BaseHeight = 100;
    const hill1Amplitude = 10;
    const hill1Stretch = 1;
    const hill2BaseHeight = 70;
    const hill2Amplitude = 20;
    const hill2Stretch = 0.5;

    const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
    const turningSpeed = 4; // Milliseconds it takes to turn a degree
    const walkingSpeed = 4;
    const transitioningSpeed = 2;
    const fallingSpeed = 2;

    const heroWidth = 17; // 24
    const heroHeight = 30; // 40

    const canvas = document.getElementById("game") as HTMLCanvasElement;
    if (!canvas) return;
    
    // Ajustar el canvas al contenedor pero manteniendo la proporción
    const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth;
    const containerHeight = canvas.parentElement?.clientHeight || window.innerHeight;
    
    // Establecer el ancho del canvas al 100% del contenedor
    canvas.width = containerWidth;
    // Mantener la altura proporcional pero sin exceder el contenedor
    canvas.height = Math.min(containerHeight, containerWidth);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const introductionElement = document.getElementById("introduction");
    const perfectElement = document.getElementById("perfect");
    const restartButton = document.getElementById("restart");
    const scoreElement = document.getElementById("score");

    if (!introductionElement || !perfectElement || !restartButton || !scoreElement) return;

    // Resets game variables and layouts but does not start the game (game starts on mousedown)
    function resetGame() {
      // Reset game progress
      phase = "waiting";
      lastTimestamp = undefined;
      sceneOffset = 0;
      score = 0;

      introductionElement.style.opacity = "1";
      perfectElement.style.opacity = "0";
      restartButton.style.display = "none";
      scoreElement.innerText = score.toString();

      // The first platform is always the same
      // x + w has to match paddingX
      platforms = [{ x: 50, w: 50 }];
      generatePlatform();
      generatePlatform();
      generatePlatform();
      generatePlatform();

      sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

      trees = [];
      generateTree();
      generateTree();
      generateTree();
      generateTree();
      generateTree();
      generateTree();
      generateTree();
      generateTree();
      generateTree();
      generateTree();

      heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
      heroY = 0;

      draw();
    }

    function generateTree() {
      const minimumGap = 30;
      const maximumGap = 150;

      // X coordinate of the right edge of the furthest tree
      const lastTree = trees[trees.length - 1];
      let furthestX = lastTree ? lastTree.x : 0;

      const x =
        furthestX +
        minimumGap +
        Math.floor(Math.random() * (maximumGap - minimumGap));

      const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
      const color = treeColors[Math.floor(Math.random() * 3)];

      trees.push({ x, color });
    }

    function generatePlatform() {
      const minimumGap = 40;
      const maximumGap = 200;
      const minimumWidth = 20;
      const maximumWidth = 100;

      // X coordinate of the right edge of the furthest platform
      const lastPlatform = platforms[platforms.length - 1];
      let furthestX = lastPlatform.x + lastPlatform.w;

      const x =
        furthestX +
        minimumGap +
        Math.floor(Math.random() * (maximumGap - minimumGap));
      const w =
        minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

      platforms.push({ x, w });
    }

    // Initialize layout
    resetGame();

    // If space was pressed restart the game
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === " ") {
        event.preventDefault();
        resetGame();
      }
    }

    function handleMouseDown() {
      if (phase === "waiting") {
        lastTimestamp = undefined;
        if (introductionElement) introductionElement.style.opacity = "0";
        phase = "stretching";
        window.requestAnimationFrame(animate);
      }
    }

    function handleMouseUp() {
      if (phase === "stretching") {
        phase = "turning";
      }
    }

    function handleResize() {
      const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth;
      const containerHeight = canvas.parentElement?.clientHeight || window.innerHeight;
      
      canvas.width = containerWidth;
      canvas.height = Math.min(containerHeight, containerWidth);
      draw();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleResize);
    
    // The main game loop
    function animate(timestamp: number) {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
        window.requestAnimationFrame(animate);
        return;
      }

      switch (phase) {
        case "waiting":
          return; // Stop the loop
        case "stretching": {
          sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
          break;
        }
        case "turning": {
          sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

          if (sticks.last().rotation > 90) {
            sticks.last().rotation = 90;

            const [nextPlatform, perfectHit] = thePlatformTheStickHits();
            if (nextPlatform) {
              // Increase score
              score += perfectHit ? 2 : 1;
              scoreElement.innerText = score.toString();

              if (perfectHit) {
                perfectElement.style.opacity = "1";
                setTimeout(() => (perfectElement.style.opacity = "0"), 1000);
              }

              generatePlatform();
              generateTree();
              generateTree();
            }

            phase = "walking";
          }
          break;
        }
        case "walking": {
          heroX += (timestamp - lastTimestamp) / walkingSpeed;

          const [nextPlatform] = thePlatformTheStickHits();
          if (nextPlatform) {
            // If hero will reach another platform then limit it's position at it's edge
            const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
            if (heroX > maxHeroX) {
              heroX = maxHeroX;
              phase = "transitioning";
            }
          } else {
            // If hero won't reach another platform then limit it's position at the end of the pole
            const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
            if (heroX > maxHeroX) {
              heroX = maxHeroX;
              phase = "falling";
            }
          }
          break;
        }
        case "transitioning": {
          sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

          const [nextPlatform] = thePlatformTheStickHits();
          if (nextPlatform && sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
            // Add the next step
            sticks.push({
              x: nextPlatform.x + nextPlatform.w,
              length: 0,
              rotation: 0
            });
            phase = "waiting";
          }
          break;
        }
        case "falling": {
          if (sticks.last().rotation < 180)
            sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

          heroY += (timestamp - lastTimestamp) / fallingSpeed;
          const maxHeroY =
            platformHeight + 100 + (canvas.height - canvasHeight) / 2;
          if (heroY > maxHeroY) {
            restartButton.style.display = "block";
            return;
          }
          break;
        }
        default:
          throw Error("Wrong phase");
      }

      draw();
      window.requestAnimationFrame(animate);

      lastTimestamp = timestamp;
    }

    // Returns the platform the stick hit (if it didn't hit any stick then return undefined)
    function thePlatformTheStickHits(): [{ x: number; w: number } | undefined, boolean] {
      if (sticks.last().rotation !== 90)
        throw Error(`Stick is ${sticks.last().rotation}°`);
      const stickFarX = sticks.last().x + sticks.last().length;

      const platformTheStickHits = platforms.find(
        (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
      );

      // If the stick hits the perfect area
      if (
        platformTheStickHits &&
        platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
          stickFarX &&
        stickFarX <
          platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
      )
        return [platformTheStickHits, true];

      return [platformTheStickHits, false];
    }

    restartButton.addEventListener("click", function (event) {
      event.preventDefault();
      resetGame();
      restartButton.style.display = "none";
    });

    function draw() {
      if (!ctx) return;
      
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBackground();

      // Center main canvas area to the middle of the screen
      ctx.translate(
        (canvas.width - canvasWidth) / 2 - sceneOffset,
        (canvas.height - canvasHeight) / 2
      );

      // Draw scene
      drawPlatforms();
      drawHero();
      drawSticks();

      // Restore transformation
      ctx.restore();
    }

    function drawPlatforms() {
      if (!ctx) return;
      
      platforms.forEach(({ x, w }) => {
        // Draw platform
        ctx.fillStyle = "black";
        ctx.fillRect(
          x,
          canvasHeight - platformHeight,
          w,
          platformHeight + (canvas.height - canvasHeight) / 2
        );

        // Draw perfect area only if hero did not yet reach the platform
        if (sticks.last().x < x) {
          ctx.fillStyle = "red";
          ctx.fillRect(
            x + w / 2 - perfectAreaSize / 2,
            canvasHeight - platformHeight,
            perfectAreaSize,
            perfectAreaSize
          );
        }
      });
    }

    function drawHero() {
      if (!ctx) return;
      
      ctx.save();
      ctx.fillStyle = "black";
      ctx.translate(
        heroX - heroWidth / 2,
        heroY + canvasHeight - platformHeight - heroHeight / 2
      );

      // Body
      drawRoundedRect(
        -heroWidth / 2,
        -heroHeight / 2,
        heroWidth,
        heroHeight - 4,
        5
      );

      // Legs
      const legDistance = 5;
      ctx.beginPath();
      ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
      ctx.fill();

      // Eye
      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
      ctx.fill();

      // Band
      ctx.fillStyle = "red";
      ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
      ctx.beginPath();
      ctx.moveTo(-9, -14.5);
      ctx.lineTo(-17, -18.5);
      ctx.lineTo(-14, -8.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, -10.5);
      ctx.lineTo(-15, -3.5);
      ctx.lineTo(-5, -7);
      ctx.fill();

      ctx.restore();
    }

    function drawRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
      if (!ctx) return;
      
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.lineTo(x, y + height - radius);
      ctx.arcTo(x, y + height, x + radius, y + height, radius);
      ctx.lineTo(x + width - radius, y + height);
      ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
      ctx.lineTo(x + width, y + radius);
      ctx.arcTo(x + width, y, x + width - radius, y, radius);
      ctx.lineTo(x + radius, y);
      ctx.arcTo(x, y, x, y + radius, radius);
      ctx.fill();
    }

    function drawSticks() {
      if (!ctx) return;
      
      sticks.forEach((stick) => {
        ctx.save();

        // Move the anchor point to the start of the stick and rotate
        ctx.translate(stick.x, canvasHeight - platformHeight);
        ctx.rotate((Math.PI / 180) * stick.rotation);

        // Draw stick
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stick.length);
        ctx.stroke();

        // Restore transformations
        ctx.restore();
      });
    }

    function drawBackground() {
      if (!ctx) return;
      
      // Draw sky
      var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#BBD691");
      gradient.addColorStop(1, "#FEF1E1");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw hills
      drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
      drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

      // Draw trees
      trees.forEach((tree) => drawTree(tree.x, tree.color));
    }

    // A hill is a shape under a stretched out sinus wave
    function drawHill(baseHeight: number, amplitude: number, stretch: number, color: string) {
      if (!ctx) return;
      
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
      for (let i = 0; i < canvas.width; i++) {
        ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function drawTree(x: number, color: string) {
      if (!ctx) return;
      
      ctx.save();
      ctx.translate(
        (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
        getTreeY(x, hill1BaseHeight, hill1Amplitude)
      );

      const treeTrunkHeight = 5;
      const treeTrunkWidth = 2;
      const treeCrownHeight = 25;
      const treeCrownWidth = 10;

      // Draw trunk
      ctx.fillStyle = "#7D833C";
      ctx.fillRect(
        -treeTrunkWidth / 2,
        -treeTrunkHeight,
        treeTrunkWidth,
        treeTrunkHeight
      );

      // Draw crown
      ctx.beginPath();
      ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
      ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
      ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.restore();
    }

    function getHillY(windowX: number, baseHeight: number, amplitude: number, stretch: number) {
      const sineBaseY = canvas.height - baseHeight;
      return (
        Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
          amplitude +
        sineBaseY
      );
    }

    function getTreeY(x: number, baseHeight: number, amplitude: number) {
      const sineBaseY = canvas.height - baseHeight;
      return Math.sinus(x) * amplitude + sineBaseY;
    }

    // Iniciar la animación
    window.requestAnimationFrame(animate);
    
    // Limpieza al desmontar
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);
      restartButton.removeEventListener("click", function (event) {
        event.preventDefault();
        resetGame();
        restartButton.style.display = "none";
      });
    };
  }, []);  // Solo se ejecuta al montar el componente

  return (
    <div className="container">
      <div id="score">0</div>
      <canvas id="game" width="375" height="375"></canvas>
      <div id="introduction">Pulsa el ratón para alargar el stick</div>
      <div id="perfect">¡PUNTAJE DOBLE!</div>
      <button id="restart">REINICIAR</button>
    </div>
  );
};

export default StickHero; 