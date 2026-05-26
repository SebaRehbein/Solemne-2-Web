import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// ==============================================================================
// SISTEMA DE CLASES DE PERSONAJES (OOP)
// ==============================================================================
// Clase Padre que contiene la física y propiedades comunes
class PersonajeBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textura) {
    super(scene, x, y, textura);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setBounce(0.1);
    this.setCollideWorldBounds(true);
    this.jumpCount = 0;
    
    // Propiedades base: iguales para todos por ahora. 
    // Luego podrás sobreescribirlas en cada clase (ej: Tanque más lento).
    this.velocidadX = 200;
    this.fuerzaSalto = -277;
    this.fuerzaDobleSalto = -226;
  }
}

// Clases Hijas para cada personaje
class Shuri extends PersonajeBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'Shuri_idle');
  }
}

class Tyson extends PersonajeBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'Tyson_idle');
  }
}

class Frog extends PersonajeBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'Frog_idle');
  }
}

// ==============================================================================
// ESCENA 1: EL MENÚ PRINCIPAL
// ==============================================================================
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    this.add.text(240, 40, 'SOLEMNE 2', { fontSize: '32px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    this.add.text(240, 90, 'Elige tu personaje:', { fontSize: '20px', fill: '#ffff00' }).setOrigin(0.5);

    const btnShuri = this.add.text(240, 130, 'Jugar con Shuri', { fontSize: '24px', fill: '#00ff00' }).setOrigin(0.5).setInteractive();
    btnShuri.on('pointerdown', () => { this.scene.start('GameScene', { personaje: 'Shuri' }); });

    const btnTyson = this.add.text(240, 170, 'Jugar con Tyson', { fontSize: '24px', fill: '#00ff00' }).setOrigin(0.5).setInteractive();
    btnTyson.on('pointerdown', () => { this.scene.start('GameScene', { personaje: 'Tyson' }); });

    const btnFrog = this.add.text(240, 210, 'Jugar con Frog', { fontSize: '24px', fill: '#00ff00' }).setOrigin(0.5).setInteractive();
    btnFrog.on('pointerdown', () => { this.scene.start('GameScene', { personaje: 'Frog' }); });

    const btnCrear = this.add.text(240, 260, 'Crear Usuario', { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5).setInteractive();
    btnCrear.on('pointerdown', () => { alert('Sección de Crear Usuario en construcción'); });

    const btnSalir = this.add.text(240, 290, 'Salir', { fontSize: '20px', fill: '#ff0000' }).setOrigin(0.5).setInteractive();
    btnSalir.on('pointerdown', () => { alert('Saliendo de la partida...'); });

    [btnShuri, btnTyson, btnFrog, btnCrear, btnSalir].forEach(btn => {
      btn.on('pointerover', () => btn.setScale(1.2));
      btn.on('pointerout', () => btn.setScale(1));
    });
  }
}

// ==============================================================================
// ESCENA 2: EL JUEGO PRINCIPAL
// ==============================================================================
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ----------------------------------------------------------------------------
  // INIT: Recibe la información del menú
  // ----------------------------------------------------------------------------
  init(data) {
    this.personajeSeleccionado = data.personaje || 'Shuri';
  }

  // ----------------------------------------------------------------------------
  // PRELOAD: Carga de imágenes dinámicamente según la clase
  // ----------------------------------------------------------------------------
  preload() {
    const char = this.personajeSeleccionado;
    
    // Carga exclusiva de los assets correspondientes a la carpeta de la clase
    this.load.spritesheet(`${char}_idle`, `assets/animaciones/Main_Characters/${char}/Idle (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_walk`, `assets/animaciones/Main_Characters/${char}/Run (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_jump`, `assets/animaciones/Main_Characters/${char}/Jump (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_fall`, `assets/animaciones/Main_Characters/${char}/Fall (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_double-jump`, `assets/animaciones/Main_Characters/${char}/Double Jump (32x32).png`, { frameWidth: 32, frameHeight: 32 });

    this.load.image('tiles-terrain', 'assets/Terrain (16x16).png');
    this.load.tilemapTiledJSON('mapa-nivel1', 'assets/LevelTest.tmj');
  }

  // ----------------------------------------------------------------------------
  // CREATE: Construcción del nivel, jugador, armas y jefe
  // ----------------------------------------------------------------------------
  create() {
    // === 1. MAPA Y CÁMARA ===
    const map = this.make.tilemap({ key: 'mapa-nivel1' });
    const tileset = map.addTilesetImage('terrain', 'tiles-terrain');
    const capaMarco = map.createLayer('marco', tileset, 0, 0);
    const capaTerreno = map.createLayer('terreno', tileset, 0, 0);
    capaMarco.setCollisionByExclusion([-1]);
    capaTerreno.setCollisionByExclusion([-1]);

    this.cameras.main.setBackgroundColor('#87CEEB'); 
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // === 2. JUGADOR (SISTEMA DE CLASES) ===
    this.playerHealth = 100;
    this.healthText = this.add.text(10, 10, 'Vida: 100', { fontSize: '20px', fill: '#ffffff', backgroundColor: '#000' }).setScrollFactor(0);

    // Instanciación del objeto según la selección del usuario
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

    // === 3. CONTROLES Y ANIMACIONES ===
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

    // === 4. ARMA DEL JUGADOR ===
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

    // === 5. EL JEFE CUADRADO ===
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

    // === 6. SISTEMA DE DAÑO ===
    this.physics.add.overlap(this.player, this.bossBullets, (player, bullet) => {
      bullet.destroy();
      this.playerHealth -= 10;
      this.healthText.setText('Vida: ' + this.playerHealth);
      player.setTint(0xff0000);
      this.time.delayedCall(200, () => player.clearTint());

      if (this.playerHealth <= 0) {
        alert("¡Te mató el jefe!");
        this.scene.restart();
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

  // ----------------------------------------------------------------------------
  // UPDATE: Lógica que se ejecuta en cada frame
  // ----------------------------------------------------------------------------
  update() {
    let moverIzquierda;
    let moverDerecha;
    let botonSalto;

    // === LÓGICA DE CONTROLES POR FASE ===
    if (this.bossPhase === 1) {
      moverIzquierda = this.teclas.A.isDown;
      moverDerecha = this.teclas.D.isDown;
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.W);
    } else {
      moverIzquierda = this.teclas.D.isDown; 
      moverDerecha = this.teclas.A.isDown;   
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.S); 
    }

    // Extracción de las capacidades de movimiento de la clase instanciada
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
    if (isGrounded) this.player.jumpCount = 0;

    const char = this.personajeSeleccionado;

    // Ejecución de salto basándose en las fuerzas de la clase
    if (botonSalto) {
      if (isGrounded || this.player.jumpCount === 0) {
        this.player.setVelocityY(this.player.fuerzaSalto); 
        this.player.jumpCount = 1;
      } else if (this.player.jumpCount === 1) {
        this.player.setVelocityY(this.player.fuerzaDobleSalto); 
        this.player.jumpCount = 2;
        this.player.anims.play(`${char}_double-jump`, true);
      }
    }

    // Animaciones referenciadas dinámicamente
    if (!isGrounded) {
      if (this.player.jumpCount === 2) {
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== `${char}_double-jump`) {
          this.player.anims.play(`${char}_double-jump`, true);
        }
      } else if (this.player.body.velocity.y < 0) {
        this.player.anims.play(`${char}_jump`, true);
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
      scene: [MenuScene, GameScene]
    };

    const game = new Phaser.Game(config);
    return () => { game.destroy(true); };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', fontFamily: 'sans-serif' }}>
      <h2>Avance Semana 3: Fase del Jefe</h2>
      <div ref={gameRef} style={{ border: '4px solid #333', borderRadius: '8px', overflow: 'hidden' }}></div>
      <p style={{ marginTop: '10px' }}>Usa <strong>WASD</strong> para moverte y el <strong>Mouse (Clic)</strong> para apuntar y disparar.</p>
    </div>
  );
}