import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// ==============================================================================
// SISTEMA DE CLASES DE PERSONAJES (OOP)
// ==============================================================================
class PersonajeBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textura) {
    super(scene, x, y, textura);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setBounce(0);
    this.setCollideWorldBounds(true);
    this.jumpCount = 0;
    
    this.velocidadX = 200;
    this.fuerzaSalto = -300;
    this.fuerzaDobleSalto = -250;
  }
}

class Shuri extends PersonajeBase {
  constructor(scene, x, y) { super(scene, x, y, 'Shuri_idle'); }
}

class Tyson extends PersonajeBase {
  constructor(scene, x, y) { super(scene, x, y, 'Tyson_idle'); }
}

class Frog extends PersonajeBase {
  constructor(scene, x, y) { super(scene, x, y, 'Frog_idle'); }
}

// ==============================================================================
// ESCENA 1: EL MENÚ PRINCIPAL GRÁFICO (CON NIVEL TILED COMO FONDO)
// ==============================================================================
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // Cargamos el tileset de terreno y el archivo JSON de tu mapa de menú
    this.load.image('tiles-terrain', 'assets/Terrain (16x16).png');
    this.load.tilemapTiledJSON('mapa-menu', 'assets/menu.tmj'); 
  }

  create() {
    // Color de fondo por si el mapa no cubre totalmente el canvas
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Inicializamos el mapa de Tiled
    const map = this.make.tilemap({ key: 'mapa-menu' });
    const tileset = map.addTilesetImage('terrain', 'tiles-terrain');

    // Dibujamos las capas utilizando los nombres exactos de tu archivo .tmj
    // Al omitir las físicas y colisiones, funciona únicamente como fondo visual
    map.createLayer('Capa de patrones 1', tileset, 0, 0);
    map.createLayer('Capa de patrones 2', tileset, 0, 0);
    map.createLayer('Capa de patrones 3', tileset, 0, 0);

    this.add.text(240, 90, "Berry Bad Luck", {
      fontSize: '48px',
      fill: '#ffcc00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Añadimos textos interactivos estilizados para que resalten sobre el mapa
    const btnPlay = this.add.text(240, 180, 'PLAY', { 
      fontSize: '40px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4 
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Lógica de transición de escenas y eventos
    btnPlay.on('pointerdown', () => { 
      this.scene.start('MenuSeleccion'); 
    });

    // Pequeño efecto visual de escala al pasar el cursor sobre los botones
    btnPlay.on('pointerover', () => btnPlay.setScale(1.2));
    btnPlay.on('pointerout', () => btnPlay.setScale(1));
  }
}

// ==============================================================================
// ESCENA 2: PANTALLA DE SELECCIÓN
// ==============================================================================
class MenuSeleccion extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuSeleccion' });
  }

  preload() {
    // Precarga de los spritesheets de animación 'idle' para el menú
    this.load.spritesheet('Shuri_idle', 'assets/animaciones/Main_Characters/Shuri/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('Tyson_idle', 'assets/animaciones/Main_Characters/Tyson/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('Frog_idle', 'assets/animaciones/Main_Characters/Frog/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB');
    
    // Título superior centrado
    this.add.text(240, 50, 'Elige tu personaje:', { fontSize: '20px', fill: '#ffff00' }).setOrigin(0.5);

    // Verificación y creación de animaciones globales
    ['Shuri', 'Tyson', 'Frog'].forEach(char => {
      if (!this.anims.exists(`${char}_idle`)) {
        this.anims.create({
          key: `${char}_idle`,
          frames: this.anims.generateFrameNumbers(`${char}_idle`),
          frameRate: 10,
          repeat: -1
        });
      }
    });

    // Definición de coordenadas para alineación horizontal
    const posX = { shuri: 100, tyson: 240, frog: 380 };
    const posYAnim = 140;
    const posYText = 190;

    // --- Personaje 1: Shuri ---
    this.add.sprite(posX.shuri, posYAnim, 'Shuri_idle').play('Shuri_idle').setScale(2);
    const btnShuri = this.add.text(posX.shuri, posYText, 'Shuri', { fontSize: '22px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnShuri.on('pointerdown', () => { this.scene.start('GameScene', { personaje: 'Shuri' }); });

    // --- Personaje 2: Tyson ---
    this.add.sprite(posX.tyson, posYAnim, 'Tyson_idle').play('Tyson_idle').setScale(2);
    const btnTyson = this.add.text(posX.tyson, posYText, 'Tyson', { fontSize: '22px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnTyson.on('pointerdown', () => { this.scene.start('GameScene', { personaje: 'Tyson' }); });

    // --- Personaje 3: Frog ---
    this.add.sprite(posX.frog, posYAnim, 'Frog_idle').play('Frog_idle').setScale(2);
    const btnFrog = this.add.text(posX.frog, posYText, 'Frog', { fontSize: '22px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnFrog.on('pointerdown', () => { this.scene.start('GameScene', { personaje: 'Frog' }); });

    // Botón de retorno
    const btnSalir = this.add.text(240, 260, 'Volver al Inicio', { fontSize: '20px', fill: '#ff0000' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnSalir.on('pointerdown', () => { this.scene.start('MenuScene'); });

    // Efecto visual interactivo
    [btnShuri, btnTyson, btnFrog, btnSalir].forEach(btn => {
      btn.on('pointerover', () => btn.setScale(1.2));
      btn.on('pointerout', () => btn.setScale(1));
    });
  }
}

// ==============================================================================
// ESCENA 3: EL JUEGO PRINCIPAL
// ==============================================================================
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.personajeSeleccionado = data.personaje || 'Shuri';
  }

  preload() {
    const char = this.personajeSeleccionado;
    this.load.spritesheet(`${char}_idle`, `assets/animaciones/Main_Characters/${char}/Idle (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_walk`, `assets/animaciones/Main_Characters/${char}/Run (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_jump`, `assets/animaciones/Main_Characters/${char}/Jump (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_fall`, `assets/animaciones/Main_Characters/${char}/Fall (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_double-jump`, `assets/animaciones/Main_Characters/${char}/Double Jump (32x32).png`, { frameWidth: 32, frameHeight: 32 });

    this.load.image('tiles-terrain', 'assets/Terrain (16x16).png');
    this.load.tilemapTiledJSON('mapa-nivel1', 'assets/LevelTest.tmj');
  }

  create() {
    const map = this.make.tilemap({ key: 'mapa-nivel1' });
    const tileset = map.addTilesetImage('terrain', 'tiles-terrain');
    const capaMarco = map.createLayer('marco', tileset, 0, 0);
    const capaTerreno = map.createLayer('terreno', tileset, 0, 0);
    capaMarco.setCollisionByExclusion([-1]);
    capaTerreno.setCollisionByExclusion([-1]);

    this.cameras.main.setBackgroundColor('#87CEEB'); 
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.playerHealth = 100;
    this.healthText = this.add.text(10, 10, 'Vida: 100', { fontSize: '20px', fill: '#ffffff', backgroundColor: '#000' }).setScrollFactor(0);

    if (this.personajeSeleccionado === 'Shuri') {
      this.player = new Shuri(this, 50, 50);
    } else if (this.personajeSeleccionado === 'Tyson') {
      this.player = new Tyson(this, 50, 50);
    } else if (this.personajeSeleccionado === 'Frog') {
      this.player = new Frog(this, 50, 50);
    }

    this.physics.add.collider(this.player, capaMarco);
    this.physics.add.collider(this.player, capaTerreno);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.teclas = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W, A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S, D: Phaser.Input.Keyboard.KeyCodes.D
    });

    const char = this.personajeSeleccionado;
    this.anims.create({ key: `${char}_idle`, frames: this.anims.generateFrameNumbers(`${char}_idle`), frameRate: 10, repeat: -1 });
    this.anims.create({ key: `${char}_walk`, frames: this.anims.generateFrameNumbers(`${char}_walk`), frameRate: 15, repeat: -1 });
    this.anims.create({ key: `${char}_jump`, frames: this.anims.generateFrameNumbers(`${char}_jump`), frameRate: 10, repeat: 0 });
    this.anims.create({ key: `${char}_fall`, frames: this.anims.generateFrameNumbers(`${char}_fall`), frameRate: 10, repeat: -1 });
    this.anims.create({ key: `${char}_double-jump`, frames: this.anims.generateFrameNumbers(`${char}_double-jump`), frameRate: 15, repeat: 0 });

    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1).fillCircle(4, 4, 4);
    graphics.fillStyle(0xff0000, 1).fillCircle(4, 4, 2);
    graphics.generateTexture('balaTextura', 8, 8);
    graphics.destroy(); 

    this.bullets = this.physics.add.group({ defaultKey: 'balaTextura', maxSize: 20 });
    this.physics.add.collider(this.bullets, capaMarco, (bala) => bala.destroy());
    this.physics.add.collider(this.bullets, capaTerreno, (bala) => bala.destroy());

    this.input.on('pointerdown', (pointer) => {
      const bullet = this.bullets.get(this.player.x, this.player.y);
      if (bullet) {
        bullet.setActive(true).setVisible(true);
        bullet.body.setAllowGravity(false);
        const mouseX = pointer.x + this.cameras.main.scrollX;
        const mouseY = pointer.y + this.cameras.main.scrollY;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, mouseX, mouseY);
        this.physics.velocityFromRotation(angle, 400, bullet.body.velocity);
      }
    });

    const bossGrafico = this.add.graphics();
    bossGrafico.fillStyle(0x800080, 1).fillRect(0, 0, 40, 40);
    bossGrafico.generateTexture('bossTextura', 40, 40);
    bossGrafico.destroy();

    this.boss = this.physics.add.sprite(200, 100, 'bossTextura');
    this.boss.body.setAllowGravity(false);
    this.boss.setCollideWorldBounds(true);
    this.boss.setBounce(1); 
    
    this.bossHealth = 2500; 
    this.bossPhase = 1;     
    this.physics.add.collider(this.boss, capaMarco);
    this.physics.add.collider(this.boss, capaTerreno);

    this.time.addEvent({
      delay: 2000, 
      callback: () => {
        if (this.boss.active) {
          this.boss.setVelocity(Phaser.Math.Between(-150, 150), Phaser.Math.Between(-150, 150));
        }
      }, loop: true
    });

    this.bossBullets = this.physics.add.group({ defaultKey: 'balaTextura', maxSize: 80 });
    this.physics.add.collider(this.bossBullets, capaMarco, (b) => b.destroy());
    this.physics.add.collider(this.bossBullets, capaTerreno, (b) => b.destroy());

    this.bossShootTimer = this.time.addEvent({
      delay: 150, 
      callback: () => {
        if (this.boss && this.boss.active) {
          const bullet = this.bossBullets.get(this.boss.x, this.boss.y);
          if (bullet) {
            bullet.setActive(true).setVisible(true);
            bullet.body.setAllowGravity(false);
            const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.physics.velocityFromRotation(randomAngle, 250, bullet.body.velocity);
          }
        }
      }, loop: true
    });

    const cambiarFase = () => {
      if (!this.boss || !this.boss.active) return; 
  
      if (this.bossPhase === 1) {
        this.bossPhase = 2;
        this.cameras.main.setBackgroundColor('#ffb6c1'); 
        this.bossShootTimer.delay = 600; 
        this.time.delayedCall(10000, cambiarFase); 
      } else {
        this.bossPhase = 1;
        this.cameras.main.setBackgroundColor('#87CEEB'); 
        this.bossShootTimer.delay = 150; 
        this.time.delayedCall(20000, cambiarFase); 
      }
    };
    this.time.delayedCall(20000, cambiarFase); 

    this.physics.add.overlap(this.player, this.bossBullets, (player, bullet) => {
      bullet.destroy();
      this.playerHealth -= 10;
      this.healthText.setText('Vida: ' + this.playerHealth);
      player.setTint(0xff0000);
      this.time.delayedCall(200, () => player.clearTint());

      if (this.playerHealth <= 0) {
        alert("¡Te mató el jefe!");
        this.scene.start('MenuSeleccion'); 
      }
    });

    this.physics.add.overlap(this.boss, this.bullets, (boss, bullet) => {
      bullet.destroy();
      this.bossHealth -= 25;
      boss.setTint(0xff0000);
      this.time.delayedCall(100, () => boss.clearTint());

      if (this.bossHealth <= 0) {
        boss.destroy();
        alert("¡Venciste al jefe!");
        this.cameras.main.setBackgroundColor('#87CEEB'); 
      }
    });
  }

  update() {
    let moverIzquierda;
    let moverDerecha;
    let botonSalto;

    if (this.bossPhase === 1) {
      moverIzquierda = this.teclas.A.isDown;
      moverDerecha = this.teclas.D.isDown;
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.W);
    } else {
      moverIzquierda = this.teclas.D.isDown; 
      moverDerecha = this.teclas.A.isDown;   
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.S); 
    }

    if (moverIzquierda) {
      this.player.setVelocityX(-this.player.velocidadX);
      this.player.flipX = true; 
    } else if (moverDerecha) {
      this.player.setVelocityX(this.player.velocidadX);
      this.player.flipX = false;
    } else {
      this.player.setVelocityX(0);
    }

    const isGrounded = this.player.body.onFloor() || this.player.body.touching.down;
    
    if (isGrounded && this.player.body.velocity.y >= 0) {
      this.player.jumpCount = 0;
    }

    const char = this.personajeSeleccionado;

    if (botonSalto) {
      if (this.player.jumpCount === 0) {
        this.player.setVelocityY(this.player.fuerzaSalto); 
        this.player.jumpCount = 1;
      } else if (this.player.jumpCount === 1) {
        this.player.setVelocityY(this.player.fuerzaDobleSalto); 
        this.player.jumpCount = 2;
      }
    }

    if (!isGrounded || this.player.body.velocity.y < 0) {
      if (this.player.body.velocity.y < 0) {
        if (this.player.jumpCount === 2) {
          this.player.anims.play(`${char}_double-jump`, true);
        } else {
          this.player.anims.play(`${char}_jump`, true);
        }
      } else {
        this.player.anims.play(`${char}_fall`, true);
      }
    } else {
      if (this.player.body.velocity.x !== 0) {
        this.player.anims.play(`${char}_walk`, true);
      } else {
        this.player.anims.play(`${char}_idle`, true);
      }
    }
  }
}

// ==============================================================================
// COMPONENTE REACT PRINCIPAL
// ==============================================================================
export default function App() {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 480,  
      height: 320,
      pixelArt: true, 
      scale: { zoom: 1.5 },
      backgroundColor: '#000000', 
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 800 }, debug: false }
      },
      scene: [MenuScene, MenuSeleccion, GameScene]
    };

    const game = new Phaser.Game(config);
    return () => { game.destroy(true); };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', fontFamily: 'sans-serif' }}>
      <h2>Solemne 2 - Flujo Completo</h2>
      <div ref={gameRef} style={{ border: '4px solid #333', borderRadius: '8px', overflow: 'hidden' }}></div>
      <p style={{ marginTop: '10px' }}>Usa <strong>WASD</strong> para moverte y el <strong>Mouse (Clic)</strong> para apuntar y disparar.</p>
    </div>
  );
}