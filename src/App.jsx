import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

export default function App() {
  const gameRef = useRef(null);

  useEffect(() => {
    // CLASE 1: configuración
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 400,
      backgroundColor: '#87CEEB', // Cielo celeste
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 800 }, //gravedad
          debug: false // Cambia a true para ver las "hitboxes"
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

    // CLASE 2: Mundo
    function preload() {
      // CÁMBIALO A ESTO EN EL PRELOAD:
      this.load.spritesheet('idle', 'assets/animaciones/Main_Characters/Shuri/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet('walk', 'assets/animaciones/Main_Characters/Shuri/Run (32x32).png', { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet('jump', 'assets/animaciones/Main_Characters/Shuri/Jump (32x32).png', { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet('fall', 'assets/animaciones/Main_Characters/Shuri/Fall (32x32).png', { frameWidth: 32, frameHeight: 32 });
    }

      
    function create() {
      // Suelo
      const ground = this.add.rectangle(400, 380, 800, 40, 0x2ecc71);
      this.physics.add.existing(ground, true);

      // Personaje
      player = this.physics.add.sprite(100, 200, 'idle');
      player.setBounce(0.1);
      player.setCollideWorldBounds(true);

      this.physics.add.collider(player, ground);

      cursors = this.input.keyboard.createCursorKeys();

      // Animaciones corregidas utilizando generateFrameNumbers
      this.anims.create({ 
        key: 'idle', 
        frames: this.anims.generateFrameNumbers('idle'), 
        frameRate: 10, 
        repeat: -1 // -1 indica que se repetirá en bucle infinito
      });
      this.anims.create({ 
        key: 'walk', 
        frames: this.anims.generateFrameNumbers('walk'), 
        frameRate: 15, // Puedes ajustar la velocidad aquí si se ve muy lento/rápido
        repeat: -1 
      });
      this.anims.create({ 
        key: 'jump', 
        frames: this.anims.generateFrameNumbers('jump'), 
        frameRate: 10, 
        repeat: 0 // 0 indica que solo se reproduce una vez
      });
      this.anims.create({ 
        key: 'fall', 
        frames: this.anims.generateFrameNumbers('fall'), 
        frameRate: 10, 
        repeat: -1 
      });
    }


    // CLASE 3: Juego (Game Loop)
    // CLASE 3: Juego (Game Loop)
    function update() {
      // 1. Físicas: Movimiento horizontal puro
      if (cursors.left.isDown) {
        player.setVelocityX(-200);
        player.flipX = true; 
      } else if (cursors.right.isDown) {
        player.setVelocityX(200);
        player.flipX = false;
      } else {
        player.setVelocityX(0);
      }

      // 2. Físicas: Salto
      if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-450);
      }

      // 3. Animaciones: Condicionadas estrictamente por el estado físico
      if (!player.body.touching.down) {
        // Si está en el aire, evaluamos la velocidad vertical
        if (player.body.velocity.y < 0) {
          player.anims.play('jump', true);
        } else {
          player.anims.play('fall', true);
        }
      } else {
        // Si está en el suelo, evaluamos si existe desplazamiento horizontal
        if (player.body.velocity.x !== 0) {
          player.anims.play('walk', true);
        } else {
          player.anims.play('idle', true);
        }
      }
    }


    // Limpieza de React al desmontar
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