const tg = window.Telegram?.WebApp;
tg?.ready?.();
tg?.expand?.();

const config = {
  type: Phaser.AUTO,
  parent: "game",
  physics: { default: "arcade" },
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: { preload, create, update }
};

new Phaser.Game(config);

// stato\ nlet ship, cursors, bullets, enemies, lastShot = 0, score = 0, scoreText, lives = 5, livesText;
let shootSound, hitSound, missSound, gameOverSound, lastMissSound = 0;
let gameOver = false;
let paused = false, pauseText, pauseButton;
const ENEMY_SIZE_FACTOR = 3.0; // grandezza nemici

// Config difficoltà
const DIFFICULTY_STEP = 100;   // ogni quanti abbattimenti aumentare
const SPEED_MULTIPLIER = 1.2;  // fattore di incremento
let enemySpeedFactor = 1.0;

function sizes(scene){
  const w = scene.scale.width, h = scene.scale.height;
  return { w, h, ship: w/8, enemy: w/10 * ENEMY_SIZE_FACTOR, bullet: w/30, bottomPad: Math.max(48, h*0.08) };
}

function preload(){
  this.load.image("ship","assets/ship.png");
  this.load.image("bullet","assets/bullet.png");
  this.load.image("enemy","assets/enemy.png");
  this.load.audio("shoot", ["assets/shoot.mp3"]);
  this.load.audio("hit",   ["assets/hit.mp3"]);
  this.load.audio("miss",  ["assets/miss.mp3"]);
  this.load.audio("gameover", ["assets/gameover.mp3"]);
}

function create(){
  const S = sizes(this);
  this.physics.world.setBounds(0,0,S.w,S.h);

  ship = this.physics.add.image(S.w/2, S.h - S.bottomPad, "ship")
    .setCollideWorldBounds(true)
    .setDisplaySize(S.ship, S.ship);

  cursors = this.input.keyboard.createCursorKeys();
  bullets = this.physics.add.group({
    classType: Phaser.Physics.Arcade.Image,
    maxSize: 80,
    createCallback: b => b.setDisplaySize(S.bullet, S.bullet).setTexture("bullet")
  });
  enemies = this.physics.add.group();

  shootSound = this.sound.add("shoot");
  hitSound   = this.sound.add("hit");
  missSound  = this.sound.add("miss");
  gameOverSound = this.sound.add("gameover");

  this.time.addEvent({
    delay: 700, loop: true, callback: () => {
      if (!gameOver && !paused) {
        const S2 = sizes(this);
        const x = Phaser.Math.Between(20, S2.w - 20);
        const e = enemies.create(x, -20, "enemy").setDisplaySize(S2.enemy, S2.enemy);
        const baseSpeed = Phaser.Math.Between(80, 140);
        e.setVelocity(0, baseSpeed * enemySpeedFactor);
      }
    }
  });

  this.physics.add.overlap(bullets, enemies, (b,e) => {
    if (!gameOver && !paused) {
      b.disableBody(true,true);
      e.disableBody(true,true);
      score++;
      scoreText.setText("Score: " + score);
      hitSound.play();

      // aumento difficoltà
      if (score % DIFFICULTY_STEP === 0){
        enemySpeedFactor *= SPEED_MULTIPLIER;
      }
    }
  });

  scoreText = this.add.text(8,8,"Score: 0",{
    font:"16px monospace",
    fill:"#fff",
    align:"left"
  }).setDepth(10).setScrollFactor(0);

  livesText = this.add.text(8,28,"Lives: " + lives,{
    font:"16px monospace",
    fill:"#fff",
    align:"left"
  }).setDepth(10).setScrollFactor(0);

  pauseText = this.add.text(S.w/2, S.h/2, "PAUSE", {
    font: "32px monospace",
    fill: "#ffff00",
    align: "center"
  }).setOrigin(0.5).setDepth(20).setVisible(false);

  // bottone pausa (touch)
  pauseButton = this.add.text(S.w - 30, 10, "II", {
    font: "28px monospace",
    fill: "#fff"
  }).setInteractive().setScrollFactor(0).setDepth(15);

  pauseButton.on("pointerdown", () => togglePause(this));

  // toggle con tasto P
  this.input.keyboard.on("keydown-P", () => togglePause(this));

  this.scale.on("resize", () => {
    const S3 = sizes(this);
    ship.setDisplaySize(S3.ship, S3.ship);
    ship.y = S3.h - S3.bottomPad;
    ship.x = Phaser.Math.Clamp(ship.x, 16, S3.w - 16);
    pauseText.setPosition(S3.w/2, S3.h/2);
    pauseButton.setPosition(S3.w - 30, 10);
    enemies.children.iterate(e => {
      if(e?.active){ e.setDisplaySize(S3.enemy, S3.enemy); }
    });
    bullets.children.iterate(b => {
      if(b?.active){ b.setDisplaySize(S3.bullet, S3.bullet); }
    });
    scoreText.setFontSize(Math.max(14, S3.w/40)).setPosition(8,8);
    livesText.setFontSize(Math.max(14, S3.w/40)).setPosition(8,28);
  });

  tg?.onEvent?.("viewportChanged", () => this.scale.refresh());
}

function update(time){
  if (gameOver || paused) return;

  const S = sizes(this);
  ship.setVelocity(0);

  // Movimento con tastiera
  if (cursors.left?.isDown) ship.setVelocityX(-200);
  else if (cursors.right?.isDown) ship.setVelocityX(200);

  if (cursors.up?.isDown) ship.setVelocityY(-200);
  else if (cursors.down?.isDown) ship.setVelocityY(200);

  // Movimento con touch/mouse
  if (this.input.activePointer.isDown) {
    ship.x = Phaser.Math.Clamp(this.input.activePointer.x, 16, S.w - 16);
    ship.y = Phaser.Math.Clamp(this.input.activePointer.y, 16, S.h - S.bottomPad);
  }

  // Sparo
  const fireInput = cursors.space?.isDown || (this.input.activePointer.isDown && !cursors.left?.isDown && !cursors.right?.isDown);
  if (fireInput && time > lastShot + 200){
    const b = bullets.get(ship.x, ship.y - 20);
    if (b){
      b.enableBody(true, ship.x, ship.y - 20, true, true)
        .setDisplaySize(S.bullet, S.bullet)
        .setVelocity(0, -300);
      lastShot = time;
      shootSound.play();
    }
  }

  // Pulizia proiettili
  bullets.children.iterate(b => {
    if(b?.active && (b.y < -32 || b.y > S.h + 32)){
      b.disableBody(true,true);
    }
  });

  // Controllo nemici che oltrepassano la nave → vita -1 e suono miss
  enemies.children.iterate(e => {
    if(e?.active && e.y > ship.y + 20){
      e.disableBody(true,true);
      if(time > lastMissSound + 300){
        missSound.play({ volume: 0.8 });
        lastMissSound = time;
      }
      lives--;
      livesText.setText("Lives: " + lives);
      if(lives <= 0){
        triggerGameOver(this);
      }
    }
  });
}

function togglePause(scene){
  paused = !paused;
  pauseText.setVisible(paused);
  if (paused){
    scene.physics.world.pause();
  } else {
    scene.physics.world.resume();
  }
}

function triggerGameOver(scene){
  gameOver = true;
  gameOverSound.play();
  scene.add.text(scene.scale.width/2, scene.scale.height/2, "GAME OVER\nScore: " + score, {
    font: "24px monospace",
    fill: "#ff0000",
    align: "center"
  }).setOrigin(0.5).setDepth(20);
}
