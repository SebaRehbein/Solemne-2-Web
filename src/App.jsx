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
// ESCENA 1: EL MENÚ PRINCIPAL GRÁFICO (CON REGISTRO Y LOCALSTORAGE)
// ==============================================================================
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    this.load.image('tiles-terrain', 'assets/Terrain (16x16).png');
    this.load.tilemapTiledJSON('mapa-menu', 'assets/menu.tmj'); 
  }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB');

    const map = this.make.tilemap({ key: 'mapa-menu' });
    const tileset = map.addTilesetImage('terrain', 'tiles-terrain');

    map.createLayer('Capa de patrones 1', tileset, 0, 0);
    map.createLayer('Capa de patrones 2', tileset, 0, 0);
    map.createLayer('Capa de patrones 3', tileset, 0, 0);

    // --- CARGAR CONTROLES DESDE LOCALSTORAGE O POR DEFECTO ---
    const controlesGuardados = localStorage.getItem('controlesJuego');
    if (controlesGuardados) {
      this.registry.set('controles', JSON.parse(controlesGuardados));
    } else if (!this.registry.has('controles')) {
      const controlesPorDefecto = { ARRIBA: 'W', IZQUIERDA: 'A', ABAJO: 'S', DERECHA: 'D' };
      this.registry.set('controles', controlesPorDefecto);
      localStorage.setItem('controlesJuego', JSON.stringify(controlesPorDefecto));
    }

    // Elementos del menú principal
    const titleText = this.add.text(240, 70, "Berry Bad Luck", {
      fontSize: '48px',
      fill: '#ffcc00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const btnPlay = this.add.text(240, 150, 'JUGAR', { 
      fontSize: '40px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4 
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnPlay.on('pointerdown', () => { 
      this.scene.start('MenuSeleccion'); 
    });

    const btnOptions = this.add.text(240, 220, 'OPCIONES', { 
      fontSize: '32px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4 
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    [btnPlay, btnOptions].forEach(btn => {
      btn.on('pointerover', () => btn.setScale(1.2));
      btn.on('pointerout', () => btn.setScale(1));
    });

    // ========================================================================
    // OVERLAY DE OPCIONES (CONFIGURACIÓN DINÁMICA)
    // ========================================================================
    const overlayBg = this.add.rectangle(240, 160, 480, 320, 0x000000, 0.85);
    overlayBg.setInteractive(); 

    const subTitle = this.add.text(240, 35, 'CONFIGURAR CONTROLES', {
      fontSize: '22px',
      fill: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const infoText = this.add.text(240, 65, 'Haz clic en una acción para cambiar su tecla', {
      fontSize: '12px',
      fill: '#aaaaaa'
    }).setOrigin(0.5);

    const ctrl = this.registry.get('controles');

    const btnArriba = this.add.text(240, 105, `Salto / Arriba: ${ctrl.ARRIBA}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const btnIzquierda = this.add.text(240, 145, `Izquierda: ${ctrl.IZQUIERDA}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const btnAbajo = this.add.text(240, 185, `Abajo: ${ctrl.ABAJO}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const btnDerecha = this.add.text(240, 225, `Derecha: ${ctrl.DERECHA}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const btnBack = this.add.text(240, 280, 'VOLVER', {
      fontSize: '24px',
      fill: '#ff0000', 
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const optionsContainer = this.add.container(0, 0, [
      overlayBg, subTitle, infoText, btnArriba, btnIzquierda, btnAbajo, btnDerecha, btnBack
    ]);
    optionsContainer.setDepth(10).setVisible(false); 

    [btnArriba, btnIzquierda, btnAbajo, btnDerecha, btnBack].forEach(btn => {
      btn.on('pointerover', () => btn.setScale(1.1));
      btn.on('pointerout', () => btn.setScale(1));
    });

    let esperandoTecla = false;

    // Función de remapeo interactivo
    const iniciarRebind = (btnComponent, campoControl, textoBase) => {
      if (esperandoTecla) return;
      esperandoTecla = true;

      btnComponent.setText(`${textoBase}: [ PRESIONA UNA TECLA... ]`);
      btnComponent.setFill('#ffcc00');

      this.input.keyboard.once('keydown', (event) => {
        let keyName = event.key.toUpperCase();

        if (keyName === 'ARROWUP') keyName = 'UP';
        if (keyName === 'ARROWDOWN') keyName = 'DOWN';
        if (keyName === 'ARROWLEFT') keyName = 'LEFT';
        if (keyName === 'ARROWRIGHT') keyName = 'RIGHT';
        if (keyName === ' ') keyName = 'SPACE';

        if (Phaser.Input.Keyboard.KeyCodes[keyName] !== undefined) {
          const controlesActuales = this.registry.get('controles');
          controlesActuales[campoControl] = keyName;
          
          // Guardar en RAM de Phaser y persistir en el Navegador
          this.registry.set('controles', controlesActuales);
          localStorage.setItem('controlesJuego', JSON.stringify(controlesActuales));
          
          btnComponent.setText(`${textoBase}: ${keyName}`);
        } else {
          const controlesActuales = this.registry.get('controles');
          btnComponent.setText(`${textoBase}: ${controlesActuales[campoControl]}`);
        }

        btnComponent.setFill('#ffffff');
        esperandoTecla = false;
      });
    };

    btnArriba.on('pointerdown', () => iniciarRebind(btnArriba, 'ARRIBA', 'Salto / Arriba'));
    btnIzquierda.on('pointerdown', () => iniciarRebind(btnIzquierda, 'IZQUIERDA', 'Izquierda'));
    btnAbajo.on('pointerdown', () => iniciarRebind(btnAbajo, 'ABAJO', 'Abajo (Fase 2)'));
    btnDerecha.on('pointerdown', () => iniciarRebind(btnDerecha, 'DERECHA', 'Derecha'));

    // Flujo de ocultación recíproco
    btnOptions.on('pointerdown', () => {
      if (esperandoTecla) return;
      titleText.setVisible(false);
      btnPlay.setVisible(false);
      btnOptions.setVisible(false);

      const c = this.registry.get('controles');
      btnArriba.setText(`Salto / Arriba: ${c.ARRIBA}`);
      btnIzquierda.setText(`Izquierda: ${c.IZQUIERDA}`);
      btnAbajo.setText(`Abajo (Fase 2): ${c.ABAJO}`);
      btnDerecha.setText(`Derecha: ${c.DERECHA}`);

      optionsContainer.setVisible(true);
    });

    btnBack.on('pointerdown', () => {
      if (esperandoTecla) return;
      optionsContainer.setVisible(false);
      titleText.setVisible(true);
      btnPlay.setVisible(true);
      btnOptions.setVisible(true);
    });
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
    this.load.spritesheet('Shuri_idle', 'assets/animaciones/Main_Characters/Shuri/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('Tyson_idle', 'assets/animaciones/Main_Characters/Tyson/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('Frog_idle', 'assets/animaciones/Main_Characters/Frog/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB');
    this.add.text(240, 50, 'Elige tu personaje:', { fontSize: '20px', fill: '#ffff00' }).setOrigin(0.5);

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

    const posX = { shuri: 100, tyson: 240, frog: 380 };
    const posYAnim = 140;
    const posYText = 190;

    this.add.sprite(posX.shuri, posYAnim, 'Shuri_idle').play('Shuri_idle').setScale(2);
    const btnShuri = this.add.text(posX.shuri, posYText, 'Shuri', { fontSize: '22px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnShuri.on('pointerdown', () => { this.scene.start('GameScene', { personaje: 'Shuri' }); });

    this.add.sprite(posX.tyson, posYAnim, 'Tyson_idle').play('Tyson_idle').setScale(2);
    const btnTyson = this.add.text(posX.tyson, posYText, 'Tyson', { fontSize: '22px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnTyson.on('pointerdown', () => { this.scene.start('GameScene', { personaje: 'Tyson' }); });

    this.add.sprite(posX.frog, posYAnim, 'Frog_idle').play('Frog_idle').setScale(2);
    const btnFrog = this.add.text(posX.frog, posYText, 'Frog', { fontSize: '22px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnFrog.on('pointerdown', () => { this.scene.start('GameScene', { personaje: 'Frog' }); });

    const btnSalir = this.add.text(240, 260, 'Volver al Inicio', { fontSize: '20px', fill: '#ff0000' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnSalir.on('pointerdown', () => { this.scene.start('MenuScene'); });

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

    // --- LEER MAPEO DINÁMICO DE CONTROLES ---
    const configControles = this.registry.get('controles') || { ARRIBA: 'W', IZQUIERDA: 'A', ABAJO: 'S', DERECHA: 'D' };
    this.teclas = this.input.keyboard.addKeys({
      ARRIBA: Phaser.Input.Keyboard.KeyCodes[configControles.ARRIBA],
      IZQUIERDA: Phaser.Input.Keyboard.KeyCodes[configControles.IZQUIERDA],
      ABAJO: Phaser.Input.Keyboard.KeyCodes[configControles.ABAJO],
      DERECHA: Phaser.Input.Keyboard.KeyCodes[configControles.DERECHA]
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

    // Evaluamos las condiciones según la fase del jefe usando los alias lógicos asignados
    if (this.bossPhase === 1) {
      moverIzquierda = this.teclas.IZQUIERDA.isDown;
      moverDerecha = this.teclas.DERECHA.isDown;
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.ARRIBA);
    } else {
      moverIzquierda = this.teclas.DERECHA.isDown; 
      moverDerecha = this.teclas.IZQUIERDA.isDown;   
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.ABAJO); 
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
      <p style={{ marginTop: '10px' }}>Usa tus teclas configuradas para moverte y el <strong>Mouse (Clic)</strong> para apuntar y disparar.</p>
    </div>
  );
}