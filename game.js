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
let ship, cursors, bullets, enemies, lastShot = 0, score = 0, scoreText;

// Configura la grandezza dei nemici qui
let ENEMY_SIZE_FACTOR = 2.0; // Metti 1.0 per normale, 2.0 per doppio, ecc

// utility dimensioni
function sizes(scene){
  const w = scene.scale.width, h = scene.scale.height;
  return { w, h, ship: w/8, enemy: w/10 * ENEMY_SIZE_FACTOR, bullet: w/30, bottomPad: Math.max(48, h*0.08) };
}

function preload(){
  this.load.image("ship","assets/ship.png");
  this.load.image("bullet","assets/bullet.png");
  this.load.image("enemy","assets/enemy.png");
}

function create(){
  const S = sizes(this);
  this.physics.world.setBounds(0,0,S.w,S.h);

  ship = this.physics.add.image(S.w/2, S.h - S.bottomPad, "ship")
    .setCollideWorldBounds(true)
    .setDisplaySize(S.ship, S.ship);
  ship.refreshBody();

  cursors = this.input.keyboard.createCursorKeys();
  bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 80 });
  enemies = this.physics.add.group();

  this.time.addEvent({
    delay: 700, loop: true, callback: () => {
      const S2 = sizes(this);
      const x = Phaser.Math.Between(20, S2.w - 20);
      const e = enemies.create(x, -20, "enemy").setDisplaySize(S2.enemy, S2.enemy);
      e.setVelocity(0, Phaser.Math.Between(80, 140));
      e.refreshBody();
    }
  });

  this.physics.add.overlap(bullets, enemies, (b,e) => {
    b.disableBody(true,true);
    e.disableBody(true,true);
    score++;
    scoreText.setText(String(score));
  });

  scoreText = this.add.text(8,8,"0",{ font:"16px monospace", fill:"#fff" }).setDepth(10);

  // resize: scala sprite e riallinea collider
  this.scale.on("resize", () => {
    const S3 = sizes(this);
    ship.setDisplaySize(S3.ship, S3.ship);
    ship.refreshBody();
    ship.y = S3.h - S3.bottomPad;
    ship.x = Phaser.Math.Clamp(ship.x, 16, S3.w - 16);
    enemies.children.iterate(e => {
      if(e?.active){ e.setDisplaySize(S3.enemy, S3.enemy); e.refreshBody(); }
    });
    bullets.children.iterate(b => {
      if(b?.active){ b.setDisplaySize(S3.bullet, S3.bullet); b.refreshBody(); }
    });
    scoreText.setPosition(8,8);
  });

  tg?.onEvent?.("viewportChanged", () => this.scale.refresh());
}

function update(time){
  const S = sizes(this);

  ship.setVelocity(0);

  // Movimenti orizzontali
  if (cursors.left?.isDown) ship.setVelocityX(-200);
  else if (cursors.right?.isDown) ship.setVelocityX(200);

  // Movimenti verticali
  if (cursors.up?.isDown) ship.setVelocityY(-200);
  else if (cursors.down?.isDown) ship.setVelocityY(200);

  // Touch/pointer: muove nave liberamente (2D)
  if (this.input.activePointer.isDown) {
    ship.x = Phaser.Math.Clamp(this.input.activePointer.x, 16, S.w - 16);
    ship.y = Phaser.Math.Clamp(this.input.activePointer.y, 16, S.h - S.bottomPad);
  }

  // spara
  if ((cursors.space?.isDown || this.input.activePointer.isDown) && time > lastShot + 200){
    const b = bullets.get();
    if (b){
      b.enableBody(true, ship.x, ship.y - 20, true, true)
        .setTexture("bullet")
        .setDisplaySize(S.bullet, S.bullet);
      b.refreshBody();
      b.setVelocity(0, -300);
      lastShot = time;
    }
  }

  // pulizia proiettili
  bullets.children.iterate(b => {
    if(b?.active && (b.y < -32 || b.y > S.h + 32)) b.disableBody(true,true);
  });
}
