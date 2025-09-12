<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Space Game - Phaser + Telegram WebApp</title>
  <style>
    html,body { height:100%; margin:0; background:#000; color:#fff; font-family: monospace; }
    #game { width:100%; height:100vh; overflow:hidden; }
    /* piccolo stile per il canvas container quando embed in Telegram WebApp */
    .tg-container { width:100%; height:100vh; display:flex; align-items:center; justify-content:center; }
  </style>
</head>
<body>
  <div id="game" class="tg-container"></div>

  <!-- Phaser 3 CDN -->
  <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>

  <!-- Script del gioco (inseriscilo qui o come file separato .js) -->
  <script>
/* Phaser + Telegram WebApp - Gioco spaziale (inline) */

// Se sei in Telegram WebApp, window.Telegram.WebApp sarà disponibile.
// Lo script non richiede che Telegram esista — verifica con optional chaining.
const tg = window.Telegram?.WebApp;
tg?.ready?.();
tg?.expand?.();

// Config Phaser
const config = {
  type: Phaser.AUTO,
  parent: "game",
  physics: { default: "arcade" },
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: { preload, create, update }
};

new Phaser.Game(config);

// stato globale
let ship, cursors, bullets, enemies, lastShot = 0, score = 0, scoreText, lives = 5, livesText;
let shootSound, hitSound, missSound, gameOverSound, lastMissSound = 0;
let gameOver = false;
let paused = false, pauseText, pauseButton;
const ENEMY_SIZE_FACTOR = 3.0; // grandezza nemici

// Config difficoltà (modificabili)
const DIFFICULTY_STEP = 100;   // ogni quanti abbattimenti aumentare la difficoltà
const SPEED_MULTIPLIER = 1.2;  // fattore di incremento
let enemySpeedFactor = 1.0;

function sizes(scene){
  const w = scene.scale.width || window.innerWidth;
  const h = scene.scale.height || window.innerHeight;
  return { w, h, ship: w/8, enemy: (w/10) * ENEMY_SIZE_FACTOR, bullet: w/30, bottomPad: Math.max(48, h*0.08) };
}

function preload(){
  // Assicurati di avere questi file nella cartella assets/
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

  // nave (body arcade)
  ship = this.physics.add.image(S.w/2, S.h - S.bottomPad, "ship")
    .setCollideWorldBounds(true)
    .setDisplaySize(S.ship, S.ship);

  // input
  cursors = this.input.keyboard.createCursorKeys();

  // gruppi
  bullets = this.physics.add.group({
    classType: Phaser.Physics.Arcade.Image,
    maxSize: 80,
    createCallback: b => b.setDisplaySize(S.bullet, S.bullet).setTexture("bullet")
  });
  enemies = this.physics.add.group();

  // suoni
  shootSound = this.sound.add("shoot");
  hitSound   = this.sound.add("hit");
  missSound  = this.sound.add("miss");
  gameOverSound = this.sound.add("gameover");

  // spawn continuo nemici
  this.time.addEvent({
    delay: 700,
    loop: true,
    callback: () => {
      if (!gameOver && !paused) spawnEnemy(this);
    }
  });

  // overlap proiettili -> nemici
  this.physics.add.overlap(bullets, enemies, (b,e) => {
    if (!gameOver && !paused){
      b.disableBody(true,true);
      e.disableBody(true,true);
      score++;
      scoreText.setText("Score: " + score);
      hitSound.play();

      // aumento difficoltà a ogni step
      if (score % DIFFICULTY_STEP === 0){
        enemySpeedFactor *= SPEED_MULTIPLIER;
      }
    }
  });

  // HUD
  scoreText = this.add.text(8,8,"Score: 0",{ font:"16px monospace", fill:"#fff", align:"left" }).setDepth(10).setScrollFactor(0);
  livesText = this.add.text(8,28,"Lives: " + lives,{ font:"16px monospace", fill:"#fff", align:"left" }).setDepth(10).setScrollFactor(0);

  // Pause text
  pauseText = this.add.text(S.w/2, S.h/2, "PAUSE", { font: "32px monospace", fill: "#ffff00" })
    .setOrigin(0.5).setDepth(50).setVisible(false);

  // Bottone pausa touch in alto a destra con simbolo II
  pauseButton = this.add.text(S.w - 48, 10, "II", { font: "28px monospace", fill: "#fff" })
    .setInteractive().setScrollFactor(0).setDepth(15);
  pauseButton.on("pointerdown", () => togglePause(this));

  // Toggle con tasto P
  this.input.keyboard.on("keydown-P", () => togglePause(this));

  // resize handler
  this.scale.on("resize", () => {
    const S3 = sizes(this);
    this.physics.world.setBounds(0,0,S3.w,S3.h);
    ship.setDisplaySize(S3.ship, S3.ship);
    ship.y = S3.h - S3.bottomPad;
    ship.x = Phaser.Math.Clamp(ship.x, 16, S3.w - 16);
    pauseText.setPosition(S3.w/2, S3.h/2);
    pauseButton.setPosition(S3.w - 48, 10);
    enemies.children.iterate(e => { if(e?.active) e.setDisplaySize(S3.enemy, S3.enemy); });
    bullets.children.iterate(b => { if(b?.active) b.setDisplaySize(S3.bullet, S3.bullet); });
    scoreText.setFontSize(Math.max(14, S3.w/40)).setPosition(8,8);
    livesText.setFontSize(Math.max(14, S3.w/40)).setPosition(8,28);
  });

  // Telegram viewport event (se presente)
  tg?.onEvent?.("viewportChanged", () => this.scale.refresh());
}

function update(time){
  if (gameOver || paused) return;
  const S = sizes(this);

  ship.setVelocity(0);

  // Movimento tastiera
  if (cursors.left?.isDown) ship.setVelocityX(-200);
  else if (cursors.right?.isDown) ship.setVelocityX(200);
  if (cursors.up?.isDown) ship.setVelocityY(-200);
  else if (cursors.down?.isDown) ship.setVelocityY(200);

  // Movimento touch/mouse (sposta la nave)
  if (this.input.activePointer.isDown){
    ship.x = Phaser.Math.Clamp(this.input.activePointer.x, 16, S.w - 16);
    ship.y = Phaser.Math.Clamp(this.input.activePointer.y, 16, S.h - S.bottomPad);
  }

  // Sparo
  const fireInput = cursors.space?.isDown || (this.input.activePointer.isDown && !cursors.left?.isDown && !cursors.right?.isDown);
  if (fireInput && time > lastShot + 200){
    const b = bullets.get(ship.x, ship.y - 20);
    if (b){
      b.enableBody(true, ship.x, ship.y - 20, true, true)
        .setDisplaySize(sizes(this).bullet, sizes(this).bullet)
        .setVelocity(0, -300);
      lastShot = time;
      shootSound.play();
    }
  }

  // Cleanup proiettili
  bullets.children.iterate(b => {
    if (b?.active && (b.y < -32 || b.y > sizes(this).h + 32)){
      b.disableBody(true,true);
    }
  });

  // Nemici che passano sotto la nave -> perdita vita + suono miss + game over se arrivi a 0
  enemies.children.iterate(e => {
    if (e?.active && e.y > ship.y + (ship.displayHeight/2)){
      e.disableBody(true,true);
      if (time > lastMissSound + 300){
        missSound.play({ volume: 0.8 });
        lastMissSound = time;
      }
      lives--;
      livesText.setText("Lives: " + lives);
      if (lives <= 0){
        triggerGameOver(this);
      }
    }
  });
}

// spawn helper
function spawnEnemy(scene){
  const S = sizes(scene);
  const x = Phaser.Math.Between(20, S.w - 20);
  const e = enemies.create(x, -20, "enemy");
  e.setDisplaySize(S.enemy, S.enemy);
  e.setActive(true);
  e.setVisible(true);
  const baseSpeed = Phaser.Math.Between(80, 140);
  // applica fattore difficoltà
  const vy = Math.round(baseSpeed * enemySpeedFactor);
  if (e.body) e.body.setVelocity(0, vy);
  else e.setVelocity(0, vy);
}

// pause toggle
function togglePause(scene){
  if (gameOver) return;
  paused = !paused;
  pauseText.setVisible(paused);
  pauseButton.setText(paused ? "▶" : "II");
  if (paused){
    scene.physics.world.pause();
    // stop visuale velocità attive (opzionale, i corpi restano congelati)
    ship.setVelocity(0);
  } else {
    scene.physics.world.resume();
  }
}

// game over
function triggerGameOver(scene){
  gameOver = true;
  gameOverSound.play();
  scene.add.text(scene.scale.width/2, scene.scale.height/2, "GAME OVER\\nScore: " + score, {
    font: "24px monospace",
    fill: "#ff0000",
    align: "center"
  }).setOrigin(0.5).setDepth(20);
  // puoi estendere qui salvataggio punteggio / overlay come preferisci
}
  </script>
</body>
</html>
