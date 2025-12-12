// board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// bird
let birdWidth = 34; // width/height ratio = 408/288 = 17/12
let birdHeight = 24;
let birdX = boardWidth/8;
let birdY = boardHeight/2;

// let birdImg;
let birdImgs = [];
let birdImgsIndex = 0;

let bird = {
    x : birdX,
    y : birdY,
    width : birdWidth,
    height : birdHeight
}

// pipes
let pipeArray = [];
let pipeWidth = 64; // width/height = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

// physics
let velocityX = -2; // pipe moving left speed
let velocityY = 0; // bird jump speed
let gravity = 0.15;
let gameOver = true;
let gameStarted = false;
let score = 0;

// game over requirements
let animationFrameId;
let birdIntervalId;
let pipeIntervalId;

let bgm = new Audio("sounds/bgm_mario.mp3");
bgm.loop = true;
let wingSound = new Audio("sounds/sfx_wing.wav");
let hitSound = new Audio("sounds/sfx_hit.wav");
let dieSound = new Audio("sounds/sfx_die.wav");

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); // used for drawing on the board

    // fixed font properties
    context.textBaseline = "middle";
    context.textAlign = "center";

    context.fillStyle = "white";
    context.shadowColor = "black";

    // buttons
    const playButton = document.getElementById("play-button");
    const restartButton = document.getElementById("restart-button");

    // draw flappy bird
    // context.fillStyle = "green";
    // context.fillRect(bird.x, bird.y, bird.width, bird.height);

    // load bird image

    // birdImg = new Image();
    // birdImg.src = "assets/flappybird.png";
    // birdImg.onload = function() {
    //     context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    // }

    for(let i=0; i<4; i++) {
        let birdImg = new Image();
        birdImg.src = `assets/flappybird${i}.png`;
        birdImgs.push(birdImg);
    }

    // load pipes images
    topPipeImg = new Image();
    topPipeImg.src = "assets/toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "assets/bottompipe.png";

    // button event listeners
    playButton.addEventListener("click", () => {
        startGame();
        playButton.style.display = "none";
    });

    restartButton.addEventListener("click", () => {
        startGame();
        restartButton.style.display = "none";
    });

    // start screen
    update();
}

function startGame() {
    // reset game state
    bird.y = birdY;
    velocityY = 0;
    pipeArray = [];
    score = 0;
    gameOver = false;
    gameStarted = true;

    // cleanup
    cancelAnimationFrame(animationFrameId);
    clearInterval(birdIntervalId);
    clearInterval(pipeIntervalId);

    // add gameplay
    document.addEventListener("keydown", moveBird);

    // start game loop and intervals
    animationFrameId = requestAnimationFrame(update);
    birdIntervalId = setInterval(animateBird, 100); // generate a new bird frame every 0.1 seconds
    pipeIntervalId = setInterval(placePipes, 1500); // generate a pipe every 1.5 seconds
}

function endGame() {
    gameOver = true;

    // remove gameplay
    document.removeEventListener("keydown", moveBird);

    // stop game loop and intervals
    cancelAnimationFrame(animationFrameId);
    clearInterval(birdIntervalId);
    clearInterval(pipeIntervalId);

    bgm.pause();
    bgm.currentTime = 0;

    // show RESTART button
    document.getElementById("restart-button").style.display = "block";

    // game over screen
    update();
}

// board update
function update() {
    // start screen
    if(gameOver && !gameStarted) {
        context.clearRect(0, 0, board.width, board.height);

        // apply shadow
        context.save();
        context.shadowColor = "black";
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;

        // "FLAPPY BIRD" title
        context.font = "50px 'Pixelify Sans', sans-serif";
        context.fillText("FLAPPY BIRD", boardWidth/2, boardHeight/4);

        // "Press SPACE to Flap" subtitle
        context.font = "30px 'Pixelify Sans', sans-serif";
        context.fillText("Press SPACE to Flap", boardWidth/2, 400);

        // reset shadow state
        context.restore();

        return
    }

    // game over screen
    if(gameOver) {
        context.clearRect(0, 0, board.width, board.height);

        // maintain final frame
        context.drawImage(birdImgs[birdImgsIndex], bird.x, bird.y, bird.width, bird.height);
        for(let i=0; i<pipeArray.length; i++) {
            let pipe = pipeArray[i];
            context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
        }

        // apply shadow
        context.save();
        context.shadowColor = "black";
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;

        // "GAME OVER" title
        context.font = "50px 'Pixelify Sans', sans-serif";
        context.fillText("GAME OVER", boardWidth/2, boardHeight/4);

        // score (final)
        context.font = "30px 'Pixelify Sans', sans-serif";
        context.fillText(`Score: ${score}`, boardWidth/2, 240);

        // reset shadow state
        context.restore();

        return;
    }

    // gameplay
    animationFrameId = requestAnimationFrame(update);

    context.clearRect(0, 0, board.width, board.height);

    // redraw bird
    velocityY += gravity;
    // bird.y += velocityY;
    bird.y = Math.max(bird.y + velocityY, 0); // apply gravity to current bird.y, limit bird.y to top of canvas
    // context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    context.drawImage(birdImgs[birdImgsIndex], bird.x, bird.y, bird.width, bird.height);
    // birdImgsIndex++; // increment to next frame
    // birdImgsIndex %= birdImgs.length; // circle back with modulus, max frames is 4
    // 0 1 2 3 0 1 2 3 0 1 2 3 ...

    if(bird.y > board.height) {
        dieSound.play();
        endGame();
        return;
    }

    // regenerate pipes
    for(let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if(!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5; // there are 2 pipes -> 0.5 * 2 = 1
            pipe.passed = true;
        }

        if(detectCollision(bird, pipe)) {
            hitSound.play();
            endGame();
            return;
        }
    }

    // clear pipes
    while(pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift(); // removes first element from the array
    }

    // apply shadow
        context.save();
        context.shadowColor = "black";
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;

    // score (in-game)
    context.textBaseline = "top";
    context.textAlign = "left";
    context.font = "50px 'Pixelify Sans', sans-serif";
    context.fillText(score, 10, 6);

    // reset shadow state
    context.restore();
}

// bird frame generation
function animateBird() {
    birdImgsIndex++; // increment to next frame
    birdImgsIndex %= birdImgs.length; // circle back with modulus, max frames is 4
}

// pipe generate
function placePipes() {
    if(gameOver) {
        return;
    }

    // (0-1) * pipeHeight/2
    // 0 -> -128 (pipeHeight/4) = -1/4 pipeHeight
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
    let randomPipeY = pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2);
    let openingSpace = board.height/4;

    let topPipe = {
        img : topPipeImg,
        x : pipeX,
        y : randomPipeY,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
        img : bottomPipeImg,
        x : pipeX,
        y : randomPipeY + pipeHeight + openingSpace,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(bottomPipe);
}

// bird movement
function moveBird(e) {
    if(e.code == "Space") {
        if(bgm.paused) {
            bgm.play();
        }
        wingSound.play();

        // jump
        velocityY = -5;
    }  
}

// collision detection between two rectangles
function detectCollision(b, p) {
    return b.x < p.x + p.width &&
           b.x + b.width > p.x &&
           b.y < p.y + p.height &&
           b.y + b.height > p.y;
}