const W = 360, H = 640;
let ship, cursors, bullets, enemies, lastShot = 0;
let score = 0, scoreText;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: W, height: H,
  physics: {
    default: "arcade",
    arcade: { debug: false }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() {
  console.log("Preload inizio");
  this.load.image("ship", "assets/ship.png");
  this.load.image("bullet", "assets/bullet.png");
  this.load.image("enemy", "assets/enemy.png");
  this.load.on('complete', () => {
    console.log("Assets caricati");
  });
}

function create() {
  console.log("Create inizio");
  ship = this.physics.add.image(W / 2, H - 80, "ship").setCollideWorldBounds(true);
  cursors = this.input.keyboard.createCursorKeys();

  bullets = this.physics.add.group({
    classType: Phaser.Physics.Arcade.Image,
    maxSize: 40
  });

  enemies = this.physics.add.group();

  // spawn loop nemici
  this.time.addEvent({
    delay: 700,
    loop: true,
    callback: () => {
      const x = Phaser.Math.Between(20, W - 20);
      const e = enemies.create(x, -20, "enemy");
      e.setVelocity(0, Phaser.Math.Between(80, 140));
      console.log("Nemico spawnato in x=" + x);
    }
  });

  // collisione proiettili nemici
  this.physics.add.overlap(bullets, enemies, (b, e) => {
    b.disableBody(true, true);
    e.disableBody(true, true);
    score++;
    console.log("Nemico colpito! Punteggio: " + score);
  });

  scoreText = this.add.text(8, 8, "0", { font: "16px monospace", fill: "#fff" }).setDepth(10);

  console.log("Create finito");
}

function update(time, delta) {
  ship.setVelocity(0);

  if (cursors.left.isDown) ship.setVelocityX(-200);
  else if (cursors.right.isDown) ship.setVelocityX(200);

  if (this.input.activePointer.isDown) {
    ship.x = Phaser.Math.Clamp(this.input.activePointer.x, 16, W - 16);
  }

  if ((cursors.space?.isDown || this.input.activePointer.isDown) && time > lastShot + 200) {
    const b = bullets.get();
    if (b) {
      b.enableBody(true, ship.x, ship.y - 20, true, true).setTexture("bullet");
      b.setVelocity(0, -300);
      lastShot = time;
      console.log("Sparo eseguito");
    }
  }

  bullets.children.iterate(b => {
    if (b && b.y < -10) b.disableBody(true, true);
  });

  scoreText.setText(String(score));
}
