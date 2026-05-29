import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// ==============================================================================
// 1. SISTEMA DE PROGRESIÓN Y ESTADÍSTICAS (De Mathias)
// ==============================================================================
class SistemaNiveles {
  constructor(nombrePersonaje) {
    this.nombre = nombrePersonaje;
    this.nivel = 0;
    this.exp = 0;
    this.puntosDisponibles = 0;
    this.vidaBase = 100;
    this.danoBase = 25;
    this.mejorasVida = 0;       
    this.mejorasDano = 0;       
    this.mejorasMovilidad = 0;  
    this.mecanicasMovilidad = { nivel1: false, nivel2: false, nivel3: false };
  }

  get vidaMaxima() { return this.vidaBase + (this.mejorasVida * 20); }
  get danoActual() { return this.danoBase + (this.mejorasDano * 15); }

  ganarExperiencia(cantidad) {
    if (this.nivel >= 13) return; 
    this.exp += parseInt(cantidad);
    let expNecesaria = (this.nivel + 1) * 100; 
    while (this.exp >= expNecesaria && this.nivel < 13) {
      this.exp -= expNecesaria;
      this.nivel++;
      this.puntosDisponibles++;
      if (this.nivel >= 13) { this.exp = 0; break; }
      expNecesaria = (this.nivel + 1) * 100;
    }
  }

  mejorarVida() { if (this.puntosDisponibles > 0 && this.mejorasVida < 5) { this.mejorasVida++; this.puntosDisponibles--; return true; } return false; }
  mejorarDano() { if (this.puntosDisponibles > 0 && this.mejorasDano < 5) { this.mejorasDano++; this.puntosDisponibles--; return true; } return false; }
  mejorarMovilidad() {
    if (this.puntosDisponibles > 0 && this.mejorasMovilidad < 3) {
      this.mejorasMovilidad++; this.puntosDisponibles--;
      if (this.mejorasMovilidad >= 1) this.mecanicasMovilidad.nivel1 = true;
      if (this.mejorasMovilidad >= 2) this.mecanicasMovilidad.nivel2 = true;
      if (this.mejorasMovilidad >= 3) this.mecanicasMovilidad.nivel3 = true;
      return true;
    } return false;
  }

  obtenerDatosParaGuardar() {
    return { nivel: this.nivel, exp: this.exp, puntosDisponibles: this.puntosDisponibles, mejorasVida: this.mejorasVida, mejorasDano: this.mejorasDano, mejorasMovilidad: this.mejorasMovilidad, mecanicasMovilidad: this.mecanicasMovilidad };
  }

  cargarDatosGuardados(datos) {
    if (!datos) return;
    this.nivel = datos.nivel || 0; this.exp = datos.exp || 0; this.puntosDisponibles = datos.puntosDisponibles || 0;
    this.mejorasVida = datos.mejorasVida || 0; this.mejorasDano = datos.mejorasDano || 0; this.mejorasMovilidad = datos.mejorasMovilidad || 0;
    this.mecanicasMovilidad = datos.mecanicasMovilidad || { nivel1: false, nivel2: false, nivel3: false };
  }
}

class GestorProgreso {
  constructor() {
    this.personajes = { Shuri: new SistemaNiveles('Shuri'), Frog: new SistemaNiveles('Frog'), Tyson: new SistemaNiveles('Tyson') };
    this.cargarProgreso();
  }
  obtenerEstadisticasDe(nombrePersonaje) { return this.personajes[nombrePersonaje]; }
  guardarProgreso() {
    localStorage.setItem('progreso_personajes_v3', JSON.stringify({ Shuri: this.personajes.Shuri.obtenerDatosParaGuardar(), Frog: this.personajes.Frog.obtenerDatosParaGuardar(), Tyson: this.personajes.Tyson.obtenerDatosParaGuardar() }));
  }
  cargarProgreso() {
    const datosGuardados = localStorage.getItem('progreso_personajes_v3');
    if (datosGuardados) {
      const dp = JSON.parse(datosGuardados);
      this.personajes.Shuri.cargarDatosGuardados(dp.Shuri); this.personajes.Frog.cargarDatosGuardados(dp.Frog); this.personajes.Tyson.cargarDatosGuardados(dp.Tyson);
    }
  }
}

// ==============================================================================
// 2. CLASES DE PERSONAJES (TU CÓDIGO)
// ==============================================================================
class PersonajeBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textura) {
    super(scene, x, y, textura);
    scene.add.existing(this); scene.physics.add.existing(this);
    this.setBounce(0); this.setCollideWorldBounds(true); this.jumpCount = 0;
    this.velocidadX = 200; this.fuerzaSalto = -300; this.fuerzaDobleSalto = -250;
  }
}
class Shuri extends PersonajeBase { constructor(scene, x, y) { super(scene, x, y, 'Shuri_idle'); } }
class Tyson extends PersonajeBase { constructor(scene, x, y) { super(scene, x, y, 'Tyson_idle'); } }
class Frog extends PersonajeBase { constructor(scene, x, y) { super(scene, x, y, 'Frog_idle'); } }

// ==============================================================================
// MENÚ PRINCIPAL Y SELECCIÓN (De Mathias)
// ==============================================================================
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }
  
  preload() {
    // FONDO DEL MENÚ AÑADIDO AQUÍ
    this.load.image('fondo-menu', 'assets/mapa_jefe/fondo.png');
  }

  create() {
    if (!this.registry.has('gestorProgreso')) this.registry.set('gestorProgreso', new GestorProgreso());
    this.cameras.main.setBackgroundColor('#87CEEB');

    // DIBUJAR FONDO DEL MENÚ
    this.add.image(240, 160, 'fondo-menu');

    const controlesPorDefecto = { ARRIBA: 'W', IZQUIERDA: 'A', ABAJO: 'S', DERECHA: 'D' };
    if (!localStorage.getItem('controlesJuego')) localStorage.setItem('controlesJuego', JSON.stringify(controlesPorDefecto));
    this.registry.set('controles', JSON.parse(localStorage.getItem('controlesJuego')));

    this.add.text(240, 90, "Berry Bad Luck", { fontSize: '48px', fill: '#ffcc00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    const btnPlay = this.add.text(240, 150, 'JUGAR', { fontSize: '40px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnPlay.on('pointerdown', () => { this.scene.start('MenuSeleccion'); });
    btnPlay.on('pointerover', () => btnPlay.setScale(1.2)); btnPlay.on('pointerout', () => btnPlay.setScale(1));
  }
}

class MenuSeleccion extends Phaser.Scene {
  constructor() { super({ key: 'MenuSeleccion' }); }
  preload() {
    this.load.spritesheet('Shuri_idle', 'assets/animaciones/Main_Characters/Shuri/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('Tyson_idle', 'assets/animaciones/Main_Characters/Tyson/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('Frog_idle', 'assets/animaciones/Main_Characters/Frog/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
  }
  create() {
    const gestor = this.registry.get('gestorProgreso');
    this.cameras.main.setBackgroundColor('#87CEEB');
    this.add.text(240, 30, 'Elige tu personaje:', { fontSize: '24px', fill: '#ffff00', fontStyle:'bold' }).setOrigin(0.5);

    ['Shuri', 'Tyson', 'Frog'].forEach(char => {
      if (!this.anims.exists(`${char}_idle`)) this.anims.create({ key: `${char}_idle`, frames: this.anims.generateFrameNumbers(`${char}_idle`), frameRate: 10, repeat: -1 });
    });

    [{ id: 'Shuri', x: 100 }, { id: 'Tyson', x: 240 }, { id: 'Frog', x: 380 }].forEach(char => {
      const stats = gestor.obtenerEstadisticasDe(char.id);
      this.add.sprite(char.x, 120, `${char.id}_idle`).play(`${char.id}_idle`).setScale(2);
      this.add.text(char.x, 170, `${char.id}\n(Nvl ${stats.nivel >= 13 ? 'MAX' : stats.nivel})`, { fontSize: '18px', fill: '#ffffff', align:'center' }).setOrigin(0.5);
      
      const btnJugar = this.add.text(char.x, 215, '▶ JUGAR', { fontSize: '16px', fill: '#00ff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setPadding(5).setInteractive({ useHandCursor: true });
      btnJugar.on('pointerdown', () => { this.scene.start('GameScene', { personaje: char.id }); });

      const btnMejorar = this.add.text(char.x, 250, '⭐ MEJORAS', { fontSize: '14px', fill: '#ffff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setPadding(5).setInteractive({ useHandCursor: true });
      if(stats.puntosDisponibles > 0) btnMejorar.setText(`⭐ MEJORAS (+${stats.puntosDisponibles})`);
      btnMejorar.on('pointerdown', () => { this.scene.start('MejorasScene', { personaje: char.id }); });

      [btnJugar, btnMejorar].forEach(btn => { btn.on('pointerover', () => btn.setScale(1.1)); btn.on('pointerout', () => btn.setScale(1)); });
    });
    this.add.text(240, 295, 'Volver al Inicio', { fontSize: '16px', fill: '#ff0000', fontStyle:'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.scene.start('MenuScene'); });
  }
}

class MejorasScene extends Phaser.Scene {
  constructor() { super({ key: 'MejorasScene' }); }
  init(data) { this.personaje = data.personaje; }
  create() {
    const gestor = this.registry.get('gestorProgreso'); const est = gestor.obtenerEstadisticasDe(this.personaje);
    this.add.rectangle(240, 160, 480, 320, 0x111111, 1);
    this.add.text(240, 30, `Mejoras: ${this.personaje}`, { fontSize: '28px', fill: '#ffcc00', fontStyle:'bold' }).setOrigin(0.5);
    const txtPuntos = this.add.text(240, 60, `Puntos Disponibles: ${est.puntosDisponibles}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5);

    const btnVida = this.add.text(240, 120, '', { fontSize: '18px', fill: '#ff8888', backgroundColor:'#330000' }).setOrigin(0.5).setPadding(5).setInteractive({ useHandCursor: true });
    const btnDano = this.add.text(240, 160, '', { fontSize: '18px', fill: '#88ff88', backgroundColor:'#003300' }).setOrigin(0.5).setPadding(5).setInteractive({ useHandCursor: true });
    
    const actualizarTextos = () => {
      txtPuntos.setText(`Puntos Disponibles: ${est.puntosDisponibles}`);
      btnVida.setText(`[+] VIDA (${est.mejorasVida}/5): ${est.vidaMaxima} PV`);
      btnDano.setText(`[+] DAÑO (${est.mejorasDano}/5): ${est.danoActual} ATK`);
    };

    btnVida.on('pointerdown', () => { if(est.mejorarVida()) { gestor.guardarProgreso(); actualizarTextos(); } });
    btnDano.on('pointerdown', () => { if(est.mejorarDano()) { gestor.guardarProgreso(); actualizarTextos(); } });

    actualizarTextos();
    this.add.text(240, 270, 'VOLVER', { fontSize: '20px', fill: '#ffffff', fontStyle:'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.scene.start('MenuSeleccion'); });
  }
}

// ==============================================================================
// ESCENA 4: EL MAPA DEL JEFE FINAL CON TARIMAS PARPADEANTES
// ==============================================================================
class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) { this.personajeSeleccionado = data.personaje || 'Shuri'; }

  preload() {
    const char = this.personajeSeleccionado;
    this.load.spritesheet(`${char}_idle`, `assets/animaciones/Main_Characters/${char}/Idle (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_walk`, `assets/animaciones/Main_Characters/${char}/Run (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_jump`, `assets/animaciones/Main_Characters/${char}/Jump (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_fall`, `assets/animaciones/Main_Characters/${char}/Fall (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_double-jump`, `assets/animaciones/Main_Characters/${char}/Double Jump (32x32).png`, { frameWidth: 32, frameHeight: 32 });

    this.load.image('tiles-terrain', 'assets/Terrain (16x16).png');
    this.load.image('tiles-lava', 'assets/MAGAMA.png'); 

    // FONDO DEL JEFE AÑADIDO AQUÍ
    this.load.image('fondo-jefe', 'assets/mapa_jefe/fondo_jefe_480x320.png'); 

    this.load.tilemapTiledJSON('mapa-jefe', 'assets/mapa_jefe/mapa_jefe.tmj');
  }

  create() {
    // ESTADÍSTICAS DEL PERSONAJE
    this.gestor = this.registry.get('gestorProgreso');
    this.estadisticas = this.gestor.obtenerEstadisticasDe(this.personajeSeleccionado);

    // DIBUJAR FONDO DEL JEFE PRIMERO QUE TODO
    this.add.image(240, 160, 'fondo-jefe').setScrollFactor(0);

    // 1. UI DE ADVERTENCIA
    this.warningText = this.add.text(240, 40, '', {
        fontSize: '18px', fill: '#ff0000', backgroundColor: 'rgba(0,0,0,0.8)',
        fontStyle: 'bold', align: 'center', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

    // 2. CONSTRUCCIÓN DEL MAPA (FORZANDO VISIBILIDAD)
    const map = this.make.tilemap({ key: 'mapa-jefe' });
    const tsTerreno = map.addTilesetImage('Terrain (16x16)', 'tiles-terrain');
    const tsLava = map.addTilesetImage('MAGAMA', 'tiles-lava');
    const combinacionTiles = [tsTerreno, tsLava];

    const capaLava = map.createLayer('lava', combinacionTiles, 0, 0);
    if(capaLava) capaLava.setVisible(true).setCollisionByExclusion([-1]);

    const capaTerreno = map.createLayer('terreno', combinacionTiles, 0, 0);
    if(capaTerreno) capaTerreno.setVisible(true).setCollisionByExclusion([-1]);

    const capaPisoFalso1 = map.createLayer('piso_falso_1', combinacionTiles, 0, 0);
    if(capaPisoFalso1) capaPisoFalso1.setVisible(true).setCollisionByExclusion([-1]);

    const capaPisoFalso2 = map.createLayer('piso_falso_2', combinacionTiles, 0, 0);
    if(capaPisoFalso2) capaPisoFalso2.setVisible(true).setCollisionByExclusion([-1]);

    // OBTENEMOS LAS TARIMAS
    this.tarimas = [];
    this.colTarimas = [];
    for(let i = 1; i <= 5; i++) {
        if (map.getLayer(`tarima_${i}`)) {
            let capaTarima = map.createLayer(`tarima_${i}`, combinacionTiles, 0, 0);
            capaTarima.setVisible(false); 
            capaTarima.setCollisionByExclusion([-1]);
            this.tarimas.push(capaTarima);
        }
    }

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBackgroundColor('#2e2e2e'); 

    // 3. JUGADOR Y BARRA DE VIDA NUEVA
    this.playerHealth = this.estadisticas.vidaMaxima;
    this.maxHealth = this.estadisticas.vidaMaxima;

    const barX = 10, barY = 10, barWidth = 150, barHeight = 15;
    this.healthBg = this.add.graphics().setScrollFactor(0).fillStyle(0x000000, 0.6).fillRect(barX, barY, barWidth, barHeight).lineStyle(1, 0xffffff, 1).strokeRect(barX, barY, barWidth, barHeight);
    this.healthBar = this.add.graphics().setScrollFactor(0);
    this.healthText = this.add.text(barX + barWidth / 2, barY + barHeight / 2, '', { fontSize: '11px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
    
    this.updateHealthBar = () => {
      this.healthBar.clear();
      const currentWidth = Math.max(0, (this.playerHealth / this.maxHealth) * barWidth);
      this.healthBar.fillStyle(0xff0000, 1).fillRect(barX, barY, currentWidth, barHeight);
      this.healthText.setText(`♥ ${Math.max(0, this.playerHealth)} / ${this.maxHealth}`);
    };
    this.updateHealthBar();

    if (this.personajeSeleccionado === 'Shuri') this.player = new Shuri(this, 100, 50);
    else if (this.personajeSeleccionado === 'Tyson') this.player = new Tyson(this, 100, 50);
    else if (this.personajeSeleccionado === 'Frog') this.player = new Frog(this, 100, 50);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 4. COLISIONES
    if(capaTerreno) this.physics.add.collider(this.player, capaTerreno);
    if(capaPisoFalso1) this.colPiso1 = this.physics.add.collider(this.player, capaPisoFalso1);
    if(capaPisoFalso2) this.colPiso2 = this.physics.add.collider(this.player, capaPisoFalso2);

    // Guardamos los colliders de las tarimas y los apagamos
    this.tarimas.forEach(tarima => {
        let col = this.physics.add.collider(this.player, tarima);
        col.active = false;
        this.colTarimas.push(col);
    });

    if(capaLava) {
        this.physics.add.collider(this.player, capaLava, () => {
            alert("¡Te quemaste en la lava!");
            this.scene.start('MenuSeleccion'); 
        });
    }

    // 5. CONTROLES Y ANIMACIONES
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

    // 6. DISPAROS JUGADOR
    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1).fillCircle(4, 4, 4);
    graphics.fillStyle(0xff0000, 1).fillCircle(4, 4, 2);
    graphics.generateTexture('balaTextura', 8, 8);
    graphics.destroy(); 

    this.bullets = this.physics.add.group({ defaultKey: 'balaTextura', maxSize: 20 });
    if(capaTerreno) this.physics.add.collider(this.bullets, capaTerreno, (bala) => bala.destroy());

    this.input.on('pointerdown', (pointer) => {
      const bullet = this.bullets.get(this.player.x, this.player.y);
      if (bullet) {
        bullet.setActive(true).setVisible(true).body.setAllowGravity(false);
        const mouseX = pointer.x + this.cameras.main.scrollX;
        const mouseY = pointer.y + this.cameras.main.scrollY;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, mouseX, mouseY);
        this.physics.velocityFromRotation(angle, 400, bullet.body.velocity);
      }
    });

    // 7. EL JEFE
    const bossGrafico = this.add.graphics();
    bossGrafico.fillStyle(0x800080, 1).fillRect(0, 0, 40, 40);
    bossGrafico.generateTexture('bossTextura', 40, 40);
    bossGrafico.destroy();

    this.boss = this.physics.add.sprite(240, 80, 'bossTextura');
    this.boss.body.setAllowGravity(false);
    this.boss.setCollideWorldBounds(true);
    this.boss.setBounce(1); 
    
    this.bossHealth = 6000; 
    this.bossPhase = 1;     
    if(capaTerreno) this.physics.add.collider(this.boss, capaTerreno);

    this.time.addEvent({
      delay: 2000, 
      callback: () => { if (this.boss.active) this.boss.setVelocity(Phaser.Math.Between(-150, 150), Phaser.Math.Between(-150, 150)); }, 
      loop: true
    });

    this.bossBullets = this.physics.add.group({ defaultKey: 'balaTextura', maxSize: 80 });
    if(capaTerreno) this.physics.add.collider(this.bossBullets, capaTerreno, (b) => b.destroy());

    this.bossShootTimer = this.time.addEvent({
      delay: 150, 
      callback: () => {
        if (this.boss && this.boss.active) {
          const bullet = this.bossBullets.get(this.boss.x, this.boss.y);
          if (bullet) {
            bullet.setActive(true).setVisible(true).body.setAllowGravity(false);
            const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.physics.velocityFromRotation(randomAngle, 250, bullet.body.velocity);
          }
        }
      }, loop: true
    });

    // ==========================================================
    // 8. CICLO DE FASES Y SECUENCIA DE TARIMAS (Palpitación Previa)
    // ==========================================================
    let indiceTarimaActual = 0;

    // Timer que rota las tarimas
    this.time.addEvent({
        delay: 4500, // Tiempo total que dura una tarima antes de que empiece a avisar la siguiente
        callback: () => {
            if (this.bossPhase === 2 && this.tarimas.length > 0) {
                let nextIndex = (indiceTarimaActual + 1) % this.tarimas.length;

                // PASO 1: La NUEVA tarima aparece transparente y palpita
                this.tarimas[nextIndex].setVisible(true).setAlpha(0.3);
                this.colTarimas[nextIndex].active = true; // Ya se puede pisar

                let blinkTween = this.tweens.add({
                    targets: this.tarimas[nextIndex],
                    alpha: 0.9,
                    duration: 200,
                    yoyo: true,
                    repeat: 5 // Esto dura aprox 1.5 segundos
                });

                // PASO 2: Pasado ese tiempo de alerta, la tarima vieja cae
                this.time.delayedCall(1500, () => {
                    if (this.bossPhase !== 2) return; 

                    blinkTween.stop();
                    this.tarimas[nextIndex].setAlpha(1); // Fija la nueva
                    
                    // Destruye la vieja bajo tus pies
                    this.tarimas[indiceTarimaActual].setVisible(false);
                    this.colTarimas[indiceTarimaActual].active = false;

                    indiceTarimaActual = nextIndex;
                });
            }
        },
        loop: true
    });

    // Secuencias de las Fases del Jefe
    const iniciarFase1 = () => {
        this.bossPhase = 1;
        this.warningText.setVisible(false);
        this.bossShootTimer.delay = 150; 
        
        if(capaPisoFalso1) { capaPisoFalso1.setVisible(true); this.colPiso1.active = true; }
        if(capaPisoFalso2) { capaPisoFalso2.setVisible(true); this.colPiso2.active = true; }

        this.tarimas.forEach((t, idx) => { t.setVisible(false); this.colTarimas[idx].active = false; });

        this.time.delayedCall(12000, advertenciaFase2); 
    };

    const advertenciaFase2 = () => {
        this.warningText.setText("¡EL PISO COLAPSARÁ!\nBusca las tarimas.\n¡Controles invertidos!").setVisible(true);
        
        // Aparece la primera tarima palpitando para que sepas a dónde ir
        indiceTarimaActual = 0;
        this.tarimas[0].setVisible(true).setAlpha(0.3);
        this.colTarimas[0].active = true;
        this.tweens.add({ targets: this.tarimas[0], alpha: 1, duration: 250, yoyo: true, repeat: 5 }); 

        this.time.delayedCall(3000, iniciarFase2);
    };

    const iniciarFase2 = () => {
        this.bossPhase = 2; // Invierte controles
        this.warningText.setVisible(false);
        this.bossShootTimer.delay = 600; 
        
        // Quita el piso principal
        if(capaPisoFalso1) { capaPisoFalso1.setVisible(false); this.colPiso1.active = false; }
        if(capaPisoFalso2) { capaPisoFalso2.setVisible(false); this.colPiso2.active = false; }
        
        this.tarimas[0].setAlpha(1); // Fija la primera tarima
        this.time.delayedCall(20000, advertenciaFase3); 
    };

    const advertenciaFase3 = () => {
        this.warningText.setText("¡EL PISO REGRESA!\nControles normales.").setVisible(true);
        this.time.delayedCall(3000, iniciarFase3);
    };

    const iniciarFase3 = () => {
        this.bossPhase = 3; 
        this.warningText.setVisible(false);
        this.bossShootTimer.delay = 300; 

        if(capaPisoFalso1) { capaPisoFalso1.setVisible(false); this.colPiso1.active = false; }
        if(capaPisoFalso2) { capaPisoFalso2.setVisible(true); this.colPiso2.active = true; }

        this.tarimas.forEach((t, idx) => { t.setVisible(false); this.colTarimas[idx].active = false; });
        this.time.delayedCall(12000, iniciarFase1); 
    };

    this.time.delayedCall(10000, advertenciaFase2); 

    // DAÑO Y VICTORIA
    this.physics.add.overlap(this.player, this.bossBullets, (player, bullet) => {
      bullet.destroy();
      this.playerHealth -= 10;
      this.updateHealthBar();
      player.setTint(0xff0000);
      this.time.delayedCall(200, () => player.clearTint());

      if (this.playerHealth <= 0) {
        alert("¡Te mató el jefe!");
        this.scene.start('MenuSeleccion'); 
      }
    });

    this.physics.add.overlap(this.boss, this.bullets, (boss, bullet) => {
      bullet.destroy();
      this.bossHealth -= this.estadisticas.danoActual; // Usa el daño de las mejoras de Mathias
      boss.setTint(0xff0000);
      this.time.delayedCall(100, () => boss.clearTint());

      if (this.bossHealth <= 0) {
        boss.destroy();
        const expGanada = 150;
        this.estadisticas.ganarExperiencia(expGanada);
        this.gestor.guardarProgreso();
        alert(`¡Venciste al jefe! Has ganado ${expGanada} EXP.`);
        this.scene.start('MenuScene'); 
      }
    });
  }

  update() {
    let moverIzquierda;
    let moverDerecha;
    let botonSalto;

    if (this.bossPhase === 2) {
      moverIzquierda = this.teclas.D.isDown; 
      moverDerecha = this.teclas.A.isDown;   
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.S); 
    } else {
      moverIzquierda = this.teclas.A.isDown;
      moverDerecha = this.teclas.D.isDown;
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.W);
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
    if (isGrounded && this.player.body.velocity.y >= 0) this.player.jumpCount = 0;
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
        if (this.player.jumpCount === 2) this.player.anims.play(`${char}_double-jump`, true);
        else this.player.anims.play(`${char}_jump`, true);
      } else this.player.anims.play(`${char}_fall`, true);
    } else {
      if (this.player.body.velocity.x !== 0) this.player.anims.play(`${char}_walk`, true);
      else this.player.anims.play(`${char}_idle`, true);
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
      type: Phaser.AUTO, width: 480, height: 320, pixelArt: true, scale: { zoom: 1.5 },
      backgroundColor: '#000000', parent: gameRef.current,
      physics: { default: 'arcade', arcade: { gravity: { y: 800 }, debug: false } },
      scene: [MenuScene, MenuSeleccion, MejorasScene, GameScene]
    };
    const game = new Phaser.Game(config);
    return () => { game.destroy(true); };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', fontFamily: 'sans-serif' }}>
      <h2>Solemne 2 - Jefe Final con Fondos</h2>
      <div ref={gameRef} style={{ border: '4px solid #333', borderRadius: '8px', overflow: 'hidden' }}></div>
      <p style={{ marginTop: '10px' }}>Usa <strong>WASD</strong>. ¡La siguiente tarima palpitará antes de aparecer!</p>
    </div>
  );
}