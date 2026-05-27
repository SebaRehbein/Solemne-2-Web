import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// ==============================================================================
// ESCENA 1: EL MENÚ PRINCIPAL (Con imagen)
// ==============================================================================
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // 1. Cargamos tu imagen (Asegúrate de que el nombre y extensión coincidan)
    this.load.image('fondoMenu', 'assets/MENU_3.jpg');
  }

  create() {
    // 2. Ponemos la imagen en el centro exacto de la pantalla (240x, 160y)
    const bg = this.add.image(240, 160, 'fondoMenu');
    
    // Obligamos a la imagen a encajar perfectamente en los 480x320 de tu juego
    bg.setDisplaySize(480, 320);

    // 3. CREAMOS ZONAS INVISIBLES SOBRE LOS HUESOS
    // El formato de zone es: (X, Y, Ancho, Alto)

    // ZONA INVISIBLE PARA "PLAY"
    // (Ajusta la posición Y si el clic queda muy arriba o muy abajo del hueso)
    const zonaPlay = this.add.zone(240, 140, 200, 45).setInteractive({ useHandCursor: true });
    
    zonaPlay.on('pointerdown', () => { 
      this.scene.start('GameScene'); 
    });

    // ZONA INVISIBLE PARA "EXIT"
    const zonaExit = this.add.zone(240, 255, 200, 45).setInteractive({ useHandCursor: true });
    
    zonaExit.on('pointerdown', () => { 
      alert('Saliendo de la partida...'); 
    });

    // (Opcional) Zona para OPTIONS si la llegas a necesitar después
    const zonaOptions = this.add.zone(240, 198, 200, 45).setInteractive({ useHandCursor: true });
    zonaOptions.on('pointerdown', () => { 
      console.log('Opciones en construcción...'); 
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
  // PRELOAD: Carga de imágenes y mapas
  // ----------------------------------------------------------------------------
  preload() {
    this.load.spritesheet('idle', 'assets/animaciones/Main_Characters/Shuri/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk', 'assets/animaciones/Main_Characters/Shuri/Run (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('jump', 'assets/animaciones/Main_Characters/Shuri/Jump (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('fall', 'assets/animaciones/Main_Characters/Shuri/Fall (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('double-jump', 'assets/animaciones/Main_Characters/Shuri/Double Jump (32x32).png', { frameWidth: 32, frameHeight: 32 });

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

    this.cameras.main.setBackgroundColor('#87CEEB'); // Inicia Celeste (Fase 1)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // === 2. JUGADOR (SHURI) ===
    this.playerHealth = 100;
    this.healthText = this.add.text(10, 10, 'Vida: 100', { fontSize: '20px', fill: '#ffffff', backgroundColor: '#000' }).setScrollFactor(0);

    this.player = this.physics.add.sprite(50, 50, 'idle');
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.jumpCount = 0;
    this.physics.add.collider(this.player, capaMarco);
    this.physics.add.collider(this.player, capaTerreno);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // === 3. CONTROLES Y ANIMACIONES ===
    this.teclas = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W, A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S, D: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('idle'), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('walk'), frameRate: 15, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('jump'), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('fall'), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'double-jump', frames: this.anims.generateFrameNumbers('double-jump'), frameRate: 15, repeat: 0 });

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
    
    this.bossHealth = 2500; // Vida del jefe
    this.bossPhase = 1;     // Fase inicial
    this.physics.add.collider(this.boss, capaMarco);
    this.physics.add.collider(this.boss, capaTerreno);

    // IA Movimiento Jefe
    this.time.addEvent({
      delay: 2000, 
      callback: () => {
        if (this.boss.active) {
          this.boss.setVelocity(Phaser.Math.Between(-150, 150), Phaser.Math.Between(-150, 150));
        }
      }, loop: true
    });

    // Arma del Jefe
    this.bossBullets = this.physics.add.group({ defaultKey: 'balaTextura', maxSize: 80 });
    this.physics.add.collider(this.bossBullets, capaMarco, (b) => b.destroy());
    this.physics.add.collider(this.bossBullets, capaTerreno, (b) => b.destroy());

    this.bossShootTimer = this.time.addEvent({
      delay: 150, // Velocidad inicial (Fase 1)
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

    // Lógica de cambio de Fases (1 y 2)
    const cambiarFase = () => {
      if (!this.boss || !this.boss.active) return; // Si el jefe murió, no hacemos nada
  
      if (this.bossPhase === 1) {
        this.bossPhase = 2;
        this.cameras.main.setBackgroundColor('#ffb6c1'); // Rosa
        this.bossShootTimer.delay = 600; // Disparo lento
        this.time.delayedCall(10000, cambiarFase); // En 10 seg vuelve a Fase 1
      } else {
        this.bossPhase = 1;
        this.cameras.main.setBackgroundColor('#87CEEB'); // Celeste
        this.bossShootTimer.delay = 150; // Disparo rápido
        this.time.delayedCall(20000, cambiarFase); // En 20 seg vuelve a Fase 2
      }
    };
    this.time.delayedCall(20000, cambiarFase); // Arranca el ciclo

    // === 6. SISTEMA DE DAÑO (Colisiones) ===
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
  // UPDATE: Lógica que se ejecuta en cada frame (Movimiento y físicas)
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
      moverIzquierda = this.teclas.D.isDown; // Invertido
      moverDerecha = this.teclas.A.isDown;   // Invertido
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.S); // Invertido
    }

    // Aplicar movimiento horizontal
    if (moverIzquierda) {
      this.player.setVelocityX(-200);
      this.player.flipX = true; 
    } else if (moverDerecha) {
      this.player.setVelocityX(200);
      this.player.flipX = false;
    } else {
      this.player.setVelocityX(0);
    }

    const isGrounded = this.player.body.onFloor() || this.player.body.touching.down;
    if (isGrounded) this.player.jumpCount = 0;

    // Aplicar salto
    if (botonSalto) {
      if (isGrounded || this.player.jumpCount === 0) {
        this.player.setVelocityY(-277); 
        this.player.jumpCount = 1;
      } else if (this.player.jumpCount === 1) {
        this.player.setVelocityY(-226); 
        this.player.jumpCount = 2;
        this.player.anims.play('double-jump', true);
      }
    }

    // Animaciones
    if (!isGrounded) {
      if (this.player.jumpCount === 2) {
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'double-jump') {
          this.player.anims.play('double-jump', true);
        }
      } else if (this.player.body.velocity.y < 0) {
        this.player.anims.play('jump', true);
      } else {
        this.player.anims.play('fall', true);
      }
    } else {
      if (this.player.body.velocity.x !== 0) {
        this.player.anims.play('walk', true);
      } else {
        this.player.anims.play('idle', true);
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