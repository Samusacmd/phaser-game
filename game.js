// Phaser + Telegram WebApp - Gioco spaziale completo con pausa
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

// stato
let ship, cursors, bullets, enemies, lastShot = 0, score = 0, scoreText, lives = 5, livesText;
let shootSound, hitSound, missSound, gameOverSound, lastMissSound = 0;
let gameOver = false;
let gameOverElements = []; // per pulire overlay al restart
let isPaused = false; // nuovo stato pausa
let pauseText;

const ENEMY_SIZE_FACTOR = 3.0; // grandezza nemici

function sizes(scene){
  const w = scene.scale.width || window.innerWidth;
  const h = scene.scale.height || window.innerHeight;
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

  // nave (corpo arcade)
  ship = this.physics.add.image(S.w/2, S.h - S.bottomPad, "ship")
    .setCollideWorldBounds(true)
    .setDisplaySize(S.ship, S.ship);

  // input
  cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.on('keydown-P', () => togglePause(this)); // tasto P per pausa

  // gruppi
  bullets = this.physics.add.group({
    classType: Phaser.Physics.Arcade.Image,
    maxSize: 80,
    runChildUpdate: false,
    createCallback: (b) => {
      b.setActive(false);
      b.setVisible(false);
      b.setDisplaySize(S.bullet, S.bullet);
      b.setTexture('bullet');
    }
  });
  enemies = this.physics.add.group();

  // suoni
  shootSound = this.sound.add("shoot");
  hitSound   = this.sound.add("hit");
  missSound  = this.sound.add("miss");
  gameOverSound = this.sound.add("gameover");

  // spawn nemici
  this.time.addEvent({
    delay: 700,
    loop: true,
    callback: () => {
      if (!gameOver && !isPaused){
        spawnEnemy(this);
      }
    }
  });

  // collisione proiettili -> nemici
  this.physics.add.overlap(bullets, enemies, (b,e) => {
    if (!gameOver && !isPaused){
      b.disableBody(true,true);
      e.disableBody(true,true);
      score++;
      scoreText.setText("Score: " + score);
      hitSound.play();
    }
  });

  // HUD
  scoreText = this.add.text(8,8,"Score: 0",{ font:"16px monospace", fill:"#fff", align:"left" }).setDepth(10).setScrollFactor(0);
  livesText = this.add.text(8,28,"Lives: " + lives,{ font:"16px monospace", fill:"#fff", align:"left" }).setDepth(10).setScrollFactor(0);

  pauseText = this.add.text(S.w/2, S.h/2, 'PAUSE', { font: '32px monospace', fill: '#ffff00' }).setOrigin(0.5).setDepth(50);
  pauseText.setVisible(false);

  // resize
  this.scale.on("resize", () => {
    const S3 = sizes(this);
    this.physics.world.setBounds(0,0,S3.w,S3.h);
    ship.setDisplaySize(S3.ship, S3.ship);
    ship.y = S3.h - S3.bottomPad;
    ship.x = Phaser.Math.Clamp(ship.x, 16, S3.w - 16);
    enemies.children.iterate(e => { if(e?.active) e.setDisplaySize(S3.enemy, S3.enemy); });
    bullets.children.iterate(b => { if(b?.active) b.setDisplaySize(S3.bullet, S3.bullet); });
    scoreText.setFontSize(Math.max(14, S3.w/40)).setPosition(8,8);
    livesText.setFontSize(Math.max(14, S3.w/40)).setPosition(8,28);
    pauseText.setPosition(S3.w/2, S3.h/2);
  });

  tg?.onEvent?.("viewportChanged", () => this.scale.refresh());
}

function update(time){
  if (gameOver || isPaused) return;
  const S = sizes(this);

  ship.setVelocity(0);

  if (cursors.left?.isDown) ship.setVelocityX(-200);
  else if (cursors.right?.isDown) ship.setVelocityX(200);
  if (cursors.up?.isDown) ship.setVelocityY(-200);
  else if (cursors.down?.isDown) ship.setVelocityY(200);

  if (this.input.activePointer.isDown) {
    ship.x = Phaser.Math.Clamp(this.input.activePointer.x, 16, S.w - 16);
    ship.y = Phaser.Math.Clamp(this.input.activePointer.y, 16, S.h - S.bottomPad);
  }

  const fireInput = cursors.space?.isDown || (this.input.activePointer.isDown && !cursors.left?.isDown && !cursors.right?.isDown);
  if (fireInput && time > lastShot + 200){
    const b = bullets.get();
    if (b){
      b.enableBody(true, ship.x, ship.y - (ship.displayHeight/2) - 8, true, true);
      b.setActive(true).setVisible(true).setTexture('bullet').setDisplaySize(S.bullet, S.bullet);
      b.setVelocity(0, -300);
      lastShot = time;
      shootSound.play();
    }
  }

  bullets.children.iterate(b => {
    if(b?.active && (b.y < -32 || b.y > S.h + 32)){
      b.disableBody(true,true);
    }
  });

  enemies.children.iterate(e => {
    if(e?.active && e.y > ship.y + (ship.displayHeight/2)){
      e.disableBody(true,true);
      if(time > lastMissSound + 300){
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

function spawnEnemy(scene){
  const S = sizes(scene);
  const x = Phaser.Math.Between(20, S.w - 20);
  const e = enemies.create(x, -20, "enemy");
  e.setDisplaySize(S.enemy, S.enemy);
  e.setActive(true);
  e.setVisible(true);
  const vy = Phaser.Math.Between(80, 140);
  e.body?.setVelocity(0, vy) || e.setVelocity(0, vy);
}

function saveScoreToLocal(score){
  try{
    const KEY = 'phaser_telegram_highscores';
    const raw = localStorage.getItem(KEY) || '[]';
    const list = JSON.parse(raw);
    list.push({ score, date: new Date().toISOString() });
    list.sort((a,b)=>b.score - a.score);
    const top = list.slice(0,10);
    localStorage.setItem(KEY, JSON.stringify(top));
    return top;
  }catch(e){ return []; }
}

function displayHighScores(scene, highscores){
  const w = scene.scale.width, h = scene.scale.height;
  const boxW = Math.min(600, w*0.8), boxH = Math.min(400, h*0.6);
  const boxX = w/2, boxY = h/2 + 40;

  const bg = scene.add.rectangle(boxX, boxY, boxW, boxH, 0x000000, 0.75).setDepth(25);
  gameOverElements.push(bg);

  const title = scene.add.text(boxX, boxY - boxH/2 + 24, 'High Scores', { font: '18px monospace', fill: '#fff' }).setOrigin(0.5).setDepth(26);
  gameOverElements.push(title);

  highscores.forEach((row, i) => {
    const y = boxY - boxH/2 + 56 + i*28;
    const txt = scene.add.text(boxX - boxW/2 + 24, y, `${i+1}. ${row.score}    ${new Date(row.date).toLocaleString()}`, { font: '14px monospace', fill: '#fff' }).setDepth(26);
    gameOverElements.push(txt);
  });
}

function triggerGameOver(scene){
  if (gameOver) return;
  gameOver = true;

  const highs = saveScoreToLocal(score);
  try{ if (tg?.sendData) tg.sendData(JSON.stringify({ type: 'game_over', score })); }catch(e){}

  gameOverSound.play();

  const centerX = scene.scale.width/2, centerY = scene.scale.height/2;
  const overlayBg = scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x000000, 0.5).setDepth(20);
  gameOverElements.push(overlayBg);
  const goText = scene.add.text(centerX, centerY - 60, 'GAME OVER', { font: '32px monospace', fill: '#ff4444' }).setOrigin(0.5).setDepth(21);
  gameOverElements.push(goText);
  const scoreTextGO = scene.add.text(centerX, centerY - 16, 'Score: ' + score, { font: '20px monospace', fill: '#ffffff' }).setOrigin(0.5).setDepth(21);
  gameOverElements.push(scoreTextGO);

  displayHighScores(scene, highs);

  const restart = scene.add.text(centerX, centerY + 120, 'Restart', { font: '20px monospace', fill: '#00ff00', backgroundColor: '#003300', padding: { x: 12, y: 8 } }).setOrigin(0.5).setDepth(30).setInteractive({ useHandCursor: true });
  restart.on('pointerdown', () => restartGame(scene));
  gameOverElements.push(restart);
}

function restartGame(scene){
  gameOverElements.forEach(g => g.destroy());
  gameOverElements.length = 0;

  lives = 5;
  score = 0;
  scoreText.setText('Score: ' + score);
  livesText.setText('Lives: ' + lives);
  gameOver = false;
  isPaused = false;
  pauseText.setVisible(false);

  enemies.clear(true, true);
  bullets.clear(true, true);

  const S = sizes(scene);
  ship.setPosition(S.w/2, S.h - S.bottomPad);
}

function togglePause(scene){
  if (gameOver) return;
  isPaused = !isPaused;
  pauseText.setVisible(isPaused);
  if (isPaused){
    ship.setVelocity(0);
    enemies.children.iterate(e => e?.setVelocity(0,0));
    bullets.children.iterate(b => b?.setVelocity(0,0));
  }
}
