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

// Stato
let ship, cursors, bullets, enemies, lastShot = 0, score = 0, scoreText;
let shootSound, hitSound;

// Utility dimensioni
function sizes(scene) {
  const w = scene.scale.width, h = scene.scale.height;
  return { w, h, ship: w / 8, enemy: w / 10, bullet: w / 30, bottomPad: Math.max(48, h * 0.08) };
}

function preload() {
  this.load.image("ship", "assets/ship.png");
  this.load.image("bullet", "assets/bullet.png");
  this.load.image("enemy", "assets/enemy.png");
  // Carica i suoni
  this.load.audio("shoot", ["assets/shoot.mp3"]);
  this.load.audio("hit", ["assets/hit.mp3"]);
}

function create() {
  const S = sizes(this);
  this.physics.world.setBounds(0, 0, S.w, S.h);

  ship = this.physics.add.image(S.w / 2, S.h - S.bottomPad, "ship")
    .setCollideWorldBounds(true)
    .setDisplaySize(S.ship, S.ship);
  ship.refreshBody();

  cursors = this.input.keyboard.createCursorKeys();

  bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 80 });
  enemies = this.physics.add.group();

  // Crea i suoni, pronti all'uso
  shootSound = this.sound.add("shoot");
  hitSound = this.sound.add("hit");

  this.time.addEvent({
    delay: 700, loop: true, callback: () => {
      const S2 = sizes(this);
      const x = Phaser.Math.Between(20, S2.w - 20);
      const e = enemies.create(x, -20, "enemy").setDisplaySize(S2.enemy, S2.enemy);
      e.setVelocity(0, Phaser.Math.Between(80, 140));
      e.refreshBody();
    }
  });

  this.physics.add.overlap(bullets, enemies, (b, e) => {
    b.disableBody(true, true);
    e.disableBody(true, true);
    score++;
    scoreText.setText(String(score));
    // Suono del colpo
    hitSound.play();
  });

  scoreText = this.add.text(8, 8, "0", { font: "16px monospace", fill: "#fff" }).setDepth(10);

  // Gestione resize
  this.scale.on("resize", () => {
    const S3 = sizes(this);
    ship.setDisplaySize(S3.ship, S3.ship);
    ship.refreshBody();
    ship.y = S3.h - S3.bottomPad;
    ship.x = Phaser.Math.Clamp(ship.x, 16, S3.w - 16);
    enemies.children.iterate(e => {
      if (e?.active) { e.setDisplaySize(S3.enemy, S3.enemy); e.refreshBody(); }
    });
    bullets.children.iterate(b => {
      if (b?.active) { b.setDisplaySize(S3.bullet, S3.bullet); b.refreshBody(); }
    });
    scoreText.setPosition(8, 8);
  });

  tg?.onEvent?.("viewportChanged", () => this.scale.refresh());
}

function update(time) {
  const S = sizes(this);
  ship.setVelocity(0);

  if (cursors.left?.isDown) ship.setVelocityX(-200);
  if (cursors.right?.isDown) ship.setVelocityX(200);
  if (this.input.activePointer.isDown)
    ship.x = Phaser.Math.Clamp(this.input.activePointer.x, 16, S.w - 16);

  // Sparo con suono
  if ((cursors.space?.isDown || this.input.activePointer.isDown) && time > lastShot + 200) {
    const b = bullets.get();
    if (b) {
      b.enableBody(true, ship.x, ship.y - 20, true, true)
        .setTexture("bullet")
        .setDisplaySize(S.bullet, S.bullet);
      b.refreshBody();
      b.setVelocity(0, -300);
      lastShot = time;
      // Suono sparo
      shootSound.play();
    }
  }

  // Pulizia proiettili
  bullets.children.iterate(b => {
    if (b?.active && (b.y < -32 || b.y > S.h + 32)) b.disableBody(true, true);
  });
}
