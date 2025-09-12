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
let shootSound, hitSound, missSound;
let ENEMY_SIZE_FACTOR = 3.0; // Modifica qui la grandezza dei nemici
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
  this.load.audio("miss",  ["assets/miss.mp3"]); // << AGGIUNTO
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
  shootSound = this.sound.add("shoot");
  hitSound   = this.sound.add("hit");
  missSound  = this.sound.add("miss"); // << AGGIUNTO
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
    hitSound.play();
  });
  scoreText = this.add.text(8,8,"0",{ font:"16px monospace", fill:"#fff" }).setDepth(10);
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
  if (cursors.left?.isDown) ship.setVelocityX(-200);
  else if (cursors.right?.isDown) ship.setVelocityX(200);
  if (cursors.up?.isDown) ship.setVelocityY(-200);
  else if (cursors.down?.isDown) ship.setVelocityY(200);
  if (this.input.activePointer.isDown) {
    ship.x = Phaser

