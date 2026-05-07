import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

export default function App() {
  const gameRef = useRef(null);

  useEffect(() => {
    // CLASE 1: La Configuración
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 400,
      backgroundColor: '#87CEEB', // Cielo celeste
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 800 }, // Fuerza de gravedad
          debug: false // Cambia a true para ver las "hitboxes"
        }
      },
      scene: {
        create: create,
        update: update
      }
    };

    const game = new Phaser.Game(config);
    let player;
    let cursors;

    // CLASE 2: Creación del Mundo
    function create() {
      // 1. El Suelo (Cuerpo Estático)
      const ground = this.add.rectangle(400, 380, 800, 40, 0x2ecc71); // Verde
      this.physics.add.existing(ground, true); // true = estático

      // 2. El Personaje (Cuerpo Dinámico)
      player = this.add.rectangle(100, 200, 40, 40, 0xe74c3c); // Cuadrado Rojo
      this.physics.add.existing(player);
      
      // Propiedades del personaje
      player.body.setBounce(0.1); 
      player.body.setCollideWorldBounds(true); 

      // 3. Reglas de Colisión
      this.physics.add.collider(player, ground);

      // 4. Controles
      cursors = this.input.keyboard.createCursorKeys();
    }

    // CLASE 3: El Ciclo de Juego (Game Loop)
    function update() {
      // Movimiento Horizontal
      if (cursors.left.isDown) {
        player.body.setVelocityX(-300);
      } else if (cursors.right.isDown) {
        player.body.setVelocityX(300);
      } else {
        player.body.setVelocityX(0); // Frena si no tocas nada
      }

      // Salto (Solo si está tocando el suelo)
      if (cursors.up.isDown && player.body.touching.down) {
        player.body.setVelocityY(-450);
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