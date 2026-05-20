import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

export default function App() {
  const gameRef = useRef(null);

  useEffect(() => {
    // 1. Configuración del motor adaptada a las dimensiones de tu mapa (30x20 bloques de 16px)
    const config = {
      type: Phaser.AUTO,
      width: 480,  
      height: 320,
      pixelArt: true, 
      scale: {
        zoom: 1.5, // Amplía el lienzo de forma limpia (mantiene el Pixel Art nítido)
      },
      backgroundColor: '#87CEEB', // Cielo celeste
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 800 }, // Fuerza de gravedad
          debug: false // Cambiar a true para visualizar las cajas de colisión
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    };

    const game = new Phaser.Game(config);
    let player;
    let cursors;

    // 2. Carga de recursos (Assets)
    function preload() {
      // Spritesheets del personaje
      this.load.spritesheet('idle', 'assets/animaciones/Main_Characters/Shuri/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet('walk', 'assets/animaciones/Main_Characters/Shuri/Run (32x32).png', { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet('jump', 'assets/animaciones/Main_Characters/Shuri/Jump (32x32).png', { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet('fall', 'assets/animaciones/Main_Characters/Shuri/Fall (32x32).png', { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet('double-jump', 'assets/animaciones/Main_Characters/Shuri/Double Jump (32x32).png', { frameWidth: 32, frameHeight: 32 });

      // Elementos del mapa de Tiled
      this.load.image('tiles-terrain', 'assets/Terrain (16x16).png');
      this.load.tilemapTiledJSON('mapa-nivel1', 'assets/LevelTest.tmj');
    }

    // 3. Inicialización de los objetos del juego
    function create() {
      // Instanciar el mapa base
      const map = this.make.tilemap({ key: 'mapa-nivel1' });

      // Vincular el tileset de Tiled con la imagen cargada
      const tileset = map.addTilesetImage('terrain', 'tiles-terrain');

      // Crear las capas del escenario respetando el orden y nombres de Tiled
      const capaMarco = map.createLayer('marco', tileset, 0, 0);
      const capaTerreno = map.createLayer('terreno', tileset, 0, 0);

      // Habilitar colisiones en todas las celdas pintadas (excluyendo el fondo transparente -1)
      capaMarco.setCollisionByExclusion([-1]);
      capaTerreno.setCollisionByExclusion([-1]);

      // Instanciar el jugador en una zona despejada
      player = this.physics.add.sprite(50, 50, 'idle');
      player.setBounce(0.1);
      player.setCollideWorldBounds(true);

      // Declarar colisiones físicas recíprocas
      this.physics.add.collider(player, capaMarco);
      this.physics.add.collider(player, capaTerreno);

      // Configurar la cámara para que siga a Shuri y no renderice fuera de los límites del nivel
      this.cameras.main.startFollow(player, true, 0.1, 0.1);
      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

      // Capturar entradas del teclado
      cursors = this.input.keyboard.createCursorKeys();

      // Declaración e indexación de las hojas de animación
      this.anims.create({ 
        key: 'idle', 
        frames: this.anims.generateFrameNumbers('idle'), 
        frameRate: 10, 
        repeat: -1
      });
      this.anims.create({ 
        key: 'walk', 
        frames: this.anims.generateFrameNumbers('walk'), 
        frameRate: 15, 
        repeat: -1 
      });
      this.anims.create({ 
        key: 'jump', 
        frames: this.anims.generateFrameNumbers('jump'), 
        frameRate: 10, 
        repeat: 0 
      });
      this.anims.create({ 
        key: 'fall', 
        frames: this.anims.generateFrameNumbers('fall'), 
        frameRate: 10, 
        repeat: -1 
      });
      this.anims.create({ 
        key: 'double-jump', 
        frames: this.anims.generateFrameNumbers('double-jump'), 
        frameRate: 15, 
        repeat: 0 
      });

      // Inicializar contador de saltos
      player.jumpCount = 0;
    }

    // 4. Ciclo principal del juego (Game Loop)
    function update() {
      // Movimiento horizontal continuo
      if (cursors.left.isDown) {
        player.setVelocityX(-200);
        player.flipX = true; 
      } else if (cursors.right.isDown) {
        player.setVelocityX(200);
        player.flipX = false;
      } else {
        player.setVelocityX(0);
      }

      // Verificación combinada de contacto con suelo de Tiles u objetos físicos
      const isGrounded = player.body.onFloor() || player.body.touching.down;

      if (isGrounded) {
        player.jumpCount = 0;
      }

      // Mecánica de Salto y Doble Salto (solo se dispara una vez por pulsación)
      if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
        if (isGrounded || player.jumpCount === 0) {
          player.setVelocityY(-277); // Alcanza 48px
          player.jumpCount = 1;
        } else if (player.jumpCount === 1) {
          player.setVelocityY(-226); // Alcanza 32px adicionales
          player.jumpCount = 2;
          player.anims.play('double-jump', true);
        }
      }

      // Control preciso de la máquina de estados de animación
      if (!isGrounded) {
        // En el aire: evalúa ascenso, descenso libre o doble salto
        if (player.jumpCount === 2) {
          // Prioriza la animación de doble salto hasta que termine o toque el suelo
          if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'double-jump') {
            player.anims.play('double-jump', true);
          }
        } else if (player.body.velocity.y < 0) {
          player.anims.play('jump', true);
        } else {
          player.anims.play('fall', true);
        }
      } else {
        // En una superficie sólida: evalúa reposo o desplazamiento lateral
        if (player.body.velocity.x !== 0) {
          player.anims.play('walk', true);
        } else {
          player.anims.play('idle', true);
        }
      }
    }

    // Desmontar el canvas del juego si el componente React se destruye
    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', fontFamily: 'sans-serif' }}>
      <h2>Avance Semana 2: Físicas Base (Phaser + React)</h2>
      <div ref={gameRef} style={{ border: '4px solid #333', borderRadius: '8px', overflow: 'hidden' }}></div>
      <p style={{ marginTop: '10px' }}>Usa las <strong>flechas del teclado</strong> para mover al jugador.</p>
    </div>
  );
}