import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import api from './api/axios';
import './App.css';
// ==============================================================================
// 1. SISTEMA DE PROGRESIÓN Y ESTADÍSTICAS
// ==============================================================================
class SistemaNiveles {
  constructor(nombrePersonaje) {
    this.nombre = nombrePersonaje;
    this.nivel = 0;              // Empieza en Nivel 0
    this.exp = 0;
    this.puntosDisponibles = 0;  // Empieza sin puntos regalados
    
    // Stats Base
    this.vidaBase = 100;
    this.danoBase = 25;
    
    // Contadores (Límites)
    this.mejorasVida = 0;       // Max 5
    this.mejorasDano = 0;       // Max 5
    this.mejorasMovilidad = 0;  // Max 3
    
    // Mecánicas desbloqueables de movilidad
    this.mecanicasMovilidad = {
      nivel1: false, // Salto en pared
      nivel2: false, // Tercer salto
      nivel3: false  // Dash
    };
  }

  get vidaMaxima() { return this.vidaBase + (this.mejorasVida * 20); }
  get danoActual() { return this.danoBase + (this.mejorasDano * 15); }

  ganarExperiencia(cantidad) {
    if (this.nivel >= 13) return; // Evita seguir ganando exp si ya es nivel máximo
    this.exp += parseInt(cantidad);
    let expNecesaria = (this.nivel + 1) * 100; 
    
    while (this.exp >= expNecesaria && this.nivel < 13) {
      this.exp -= expNecesaria;
      this.nivel++;
      this.puntosDisponibles++; // Ganan 1 punto por cada nivel subido
      
      if (this.nivel >= 13) {
        this.exp = 0; // Resetea la exp extra al llegar al máximo
        break;
      }
      expNecesaria = (this.nivel + 1) * 100;
    }
  }

  mejorarVida() {
    if (this.puntosDisponibles > 0 && this.mejorasVida < 5) {
      this.mejorasVida++;
      this.puntosDisponibles--;
      return true;
    }
    return false;
  }

  mejorarDano() {
    if (this.puntosDisponibles > 0 && this.mejorasDano < 5) {
      this.mejorasDano++;
      this.puntosDisponibles--;
      return true;
    }
    return false;
  }

  mejorarMovilidad() {
    if (this.puntosDisponibles > 0 && this.mejorasMovilidad < 3) {
      this.mejorasMovilidad++;
      this.puntosDisponibles--;
      if (this.mejorasMovilidad >= 1) this.mecanicasMovilidad.nivel1 = true;
      if (this.mejorasMovilidad >= 2) this.mecanicasMovilidad.nivel2 = true;
      if (this.mejorasMovilidad >= 3) this.mecanicasMovilidad.nivel3 = true;
      return true;
    }
    return false;
  }

  obtenerDatosParaGuardar() {
    return {
      nivel: this.nivel,
      exp: this.exp,
      puntosDisponibles: this.puntosDisponibles,
      mejorasVida: this.mejorasVida,
      mejorasDano: this.mejorasDano,
      mejorasMovilidad: this.mejorasMovilidad,
      mecanicasMovilidad: this.mecanicasMovilidad
    };
  }

  cargarDatosGuardados(datos) {
    if (!datos) return;
    this.nivel = datos.nivel || 0;
    this.exp = datos.exp || 0;
    this.puntosDisponibles = datos.puntosDisponibles || 0;
    this.mejorasVida = datos.mejorasVida || 0;
    this.mejorasDano = datos.mejorasDano || 0;
    this.mejorasMovilidad = datos.mejorasMovilidad || 0;
    this.mecanicasMovilidad = datos.mecanicasMovilidad || { nivel1: false, nivel2: false, nivel3: false };
  }
}

class GestorProgreso {
  constructor() {
    this.personajes = {
      Shuri: new SistemaNiveles('Shuri'),
      Frog: new SistemaNiveles('Frog'),
      Tyson: new SistemaNiveles('Tyson')
    };
    this.cargarProgreso();
  }
  obtenerEstadisticasDe(nombrePersonaje) {
    return this.personajes[nombrePersonaje];
  }
  guardarProgreso() {
    const datosJuego = {
      Shuri: this.personajes.Shuri.obtenerDatosParaGuardar(),
      Frog: this.personajes.Frog.obtenerDatosParaGuardar(),
      Tyson: this.personajes.Tyson.obtenerDatosParaGuardar()
    };
    localStorage.setItem('progreso_personajes_v3', JSON.stringify(datosJuego));
  }
  cargarProgreso() {
    const datosGuardados = localStorage.getItem('progreso_personajes_v3');
    if (datosGuardados) {
      const datosParseados = JSON.parse(datosGuardados);
      this.personajes.Shuri.cargarDatosGuardados(datosParseados.Shuri);
      this.personajes.Frog.cargarDatosGuardados(datosParseados.Frog);
      this.personajes.Tyson.cargarDatosGuardados(datosParseados.Tyson);
    }
  }
}

// ==============================================================================
// 2. SISTEMA DE CLASES DE PERSONAJES (OOP)
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
class Shuri extends PersonajeBase { constructor(scene, x, y) { super(scene, x, y, 'Shuri_idle'); } }
class Tyson extends PersonajeBase { constructor(scene, x, y) { super(scene, x, y, 'Tyson_idle'); } }
class Frog extends PersonajeBase { constructor(scene, x, y) { super(scene, x, y, 'Frog_idle'); } }

// ==============================================================================
// ESCENA 1: MENÚ PRINCIPAL
// ==============================================================================
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }
  preload() {
    this.load.image('tiles-terrain', 'assets/Terrain (16x16).png');
    this.load.tilemapTiledJSON('mapa-menu', 'assets/menu.tmj'); 
  }
  
  create() {
    if (!this.registry.has('gestorProgreso')) {
      this.registry.set('gestorProgreso', new GestorProgreso());
    }
    this.cameras.main.setBackgroundColor('#87CEEB'); 

    const map = this.make.tilemap({ key: 'mapa-menu' });
    const tileset = map.addTilesetImage('terrain', 'tiles-terrain');
    map.createLayer('Capa de patrones 1', tileset, 0, 0);
    map.createLayer('Capa de patrones 2', tileset, 0, 0);
    map.createLayer('Capa de patrones 3', tileset, 0, 0);

    const controlesGuardados = localStorage.getItem('controlesJuego');
    if (controlesGuardados) {
      this.registry.set('controles', JSON.parse(controlesGuardados));
    } else if (!this.registry.has('controles')) {
      const controlesPorDefecto = { ARRIBA: 'W', IZQUIERDA: 'A', ABAJO: 'S', DERECHA: 'D' };
      this.registry.set('controles', controlesPorDefecto);
      localStorage.setItem('controlesJuego', JSON.stringify(controlesPorDefecto));
    }

    const titleText = this.add.text(240, 70, "Berry Bad Luck", { fontSize: '48px', fill: '#ffcc00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    const btnPlay = this.add.text(240, 150, 'JUGAR', { fontSize: '40px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnPlay.on('pointerdown', () => { this.scene.start('MenuSeleccion'); });
    const btnOptions = this.add.text(240, 220, 'OPCIONES', { fontSize: '32px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    [btnPlay, btnOptions].forEach(btn => {
      btn.on('pointerover', () => btn.setScale(1.2));
      btn.on('pointerout', () => btn.setScale(1));
    });

    const overlayBg = this.add.rectangle(240, 160, 480, 320, 0x000000, 0.85).setInteractive(); 
    const subTitle = this.add.text(240, 35, 'CONFIGURAR CONTROLES', { fontSize: '22px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);
    const infoText = this.add.text(240, 65, 'Haz clic en una acción para cambiar su tecla', { fontSize: '12px', fill: '#aaaaaa' }).setOrigin(0.5);
    const ctrl = this.registry.get('controles');
    
    const btnArriba = this.add.text(240, 105, `Salto / Arriba: ${ctrl.ARRIBA}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const btnIzquierda = this.add.text(240, 145, `Izquierda: ${ctrl.IZQUIERDA}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const btnAbajo = this.add.text(240, 185, `Abajo: ${ctrl.ABAJO}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const btnDerecha = this.add.text(240, 225, `Derecha: ${ctrl.DERECHA}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const btnBack = this.add.text(240, 280, 'VOLVER', { fontSize: '24px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    const optionsContainer = this.add.container(0, 0, [ overlayBg, subTitle, infoText, btnArriba, btnIzquierda, btnAbajo, btnDerecha, btnBack ]);
    optionsContainer.setDepth(10).setVisible(false); 
    
    let esperandoTecla = false;
    const iniciarRebind = (btnComponent, campoControl, textoBase) => {
      if (esperandoTecla) return;
      esperandoTecla = true;
      btnComponent.setText(`${textoBase}: [ PRESIONA UNA TECLA... ]`).setFill('#ffcc00');
      this.input.keyboard.once('keydown', (event) => {
        let keyName = event.key.toUpperCase();
        if (keyName === 'ARROWUP') keyName = 'UP'; if (keyName === 'ARROWDOWN') keyName = 'DOWN';
        if (keyName === 'ARROWLEFT') keyName = 'LEFT'; if (keyName === 'ARROWRIGHT') keyName = 'RIGHT';
        if (keyName === ' ') keyName = 'SPACE';
        if (Phaser.Input.Keyboard.KeyCodes[keyName] !== undefined) {
          const controlesActuales = this.registry.get('controles');
          controlesActuales[campoControl] = keyName;
          this.registry.set('controles', controlesActuales);
          localStorage.setItem('controlesJuego', JSON.stringify(controlesActuales));
          btnComponent.setText(`${textoBase}: ${keyName}`);
        }
        btnComponent.setFill('#ffffff');
        esperandoTecla = false;
      });
    };

    btnArriba.on('pointerdown', () => iniciarRebind(btnArriba, 'ARRIBA', 'Salto / Arriba'));
    btnIzquierda.on('pointerdown', () => iniciarRebind(btnIzquierda, 'IZQUIERDA', 'Izquierda'));
    btnAbajo.on('pointerdown', () => iniciarRebind(btnAbajo, 'ABAJO', 'Abajo'));
    btnDerecha.on('pointerdown', () => iniciarRebind(btnDerecha, 'DERECHA', 'Derecha'));
    
    btnOptions.on('pointerdown', () => {
      if (esperandoTecla) return;
      titleText.setVisible(false); btnPlay.setVisible(false); btnOptions.setVisible(false);
      optionsContainer.setVisible(true);
    });
    btnBack.on('pointerdown', () => {
      if (esperandoTecla) return;
      optionsContainer.setVisible(false);
      titleText.setVisible(true); btnPlay.setVisible(true); btnOptions.setVisible(true);
    });
  }
}

// ==============================================================================
// ESCENA 2: PANTALLA DE SELECCIÓN
// ==============================================================================
class MenuSeleccion extends Phaser.Scene {
  constructor() { super({ key: 'MenuSeleccion' }); }
  preload() {
    this.load.spritesheet('Shuri_idle', 'assets/animaciones/Main_Characters/Shuri/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('Tyson_idle', 'assets/animaciones/Main_Characters/Tyson/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('Frog_idle', 'assets/animaciones/Main_Characters/Frog/Idle (32x32).png', { frameWidth: 32, frameHeight: 32 });
  }
  create() {
    this.cameras.main.setBackgroundColor('#87CEEB'); 
    const gestor = this.registry.get('gestorProgreso');
    this.add.text(240, 30, 'Elige tu personaje:', { fontSize: '24px', fill: '#ffff00', fontStyle:'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

    ['Shuri', 'Tyson', 'Frog'].forEach(char => {
      if (!this.anims.exists(`${char}_idle`)) {
        this.anims.create({ key: `${char}_idle`, frames: this.anims.generateFrameNumbers(`${char}_idle`), frameRate: 10, repeat: -1 });
      }
    });

    const chars = [
      { id: 'Shuri', x: 100 },
      { id: 'Tyson', x: 240 },
      { id: 'Frog', x: 380 }
    ];
    
    chars.forEach(char => {
      const stats = gestor.obtenerEstadisticasDe(char.id);
      
      this.add.sprite(char.x, 120, `${char.id}_idle`).play(`${char.id}_idle`).setScale(2);
      
      const textoNivel = stats.nivel >= 13 ? 'MAX' : stats.nivel;
      this.add.text(char.x, 170, `${char.id}\n(Nvl ${textoNivel})`, { fontSize: '18px', fill: '#ffffff', align:'center', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
      
      const btnJugar = this.add.text(char.x, 215, '▶ JUGAR', { 
        fontSize: '16px', fill: '#00ff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 
      }).setOrigin(0.5).setPadding(5).setInteractive({ useHandCursor: true });
      
      btnJugar.on('pointerdown', () => { this.scene.start('GameScene', { personaje: char.id }); });

      const btnMejorar = this.add.text(char.x, 250, '⭐ MEJORAS', { 
        fontSize: '14px', fill: '#ffff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 
      }).setOrigin(0.5).setPadding(5).setInteractive({ useHandCursor: true });
      
      if(stats.puntosDisponibles > 0) btnMejorar.setText(`⭐ MEJORAS (+${stats.puntosDisponibles})`);
      
      btnMejorar.on('pointerdown', () => { this.scene.start('MejorasScene', { personaje: char.id }); });

      [btnJugar, btnMejorar].forEach(btn => {
        btn.on('pointerover', () => btn.setScale(1.1));
        btn.on('pointerout', () => btn.setScale(1));
      });
    });
    
    const btnSalir = this.add.text(240, 295, 'Volver al Inicio', { fontSize: '16px', fill: '#ff0000', fontStyle:'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnSalir.on('pointerdown', () => { this.scene.start('MenuScene'); });
  }
}

// ==============================================================================
// ESCENA 3: MENÚ DE MEJORAS
// ==============================================================================
class MejorasScene extends Phaser.Scene {
  constructor() { super({ key: 'MejorasScene' }); }
  
  init(data) { this.personaje = data.personaje; }
  create() {
    const gestor = this.registry.get('gestorProgreso');
    const est = gestor.obtenerEstadisticasDe(this.personaje);
    
    this.cameras.main.setBackgroundColor('#87CEEB');
    this.add.rectangle(240, 160, 480, 320, 0x000000, 0.7);

    this.add.text(240, 30, `Mejoras: ${this.personaje}`, { fontSize: '28px', fill: '#ffcc00', fontStyle:'bold' }).setOrigin(0.5);
    const txtPuntos = this.add.text(240, 60, `Puntos Disponibles: ${est.puntosDisponibles}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5);

    const btnVida = this.add.text(240, 110, '', { fontSize: '18px', fill: '#ff8888', backgroundColor:'#330000' }).setOrigin(0.5).setPadding(5).setInteractive({ useHandCursor: true });
    const btnDano = this.add.text(240, 150, '', { fontSize: '18px', fill: '#88ff88', backgroundColor:'#003300' }).setOrigin(0.5).setPadding(5).setInteractive({ useHandCursor: true });
    const btnMovilidad = this.add.text(240, 190, '', { fontSize: '18px', fill: '#8888ff', backgroundColor:'#000033' }).setOrigin(0.5).setPadding(5).setInteractive({ useHandCursor: true });
    
    const actualizarTextos = () => {
      txtPuntos.setText(`Puntos Disponibles: ${est.puntosDisponibles}`);
      btnVida.setText(`[+] VIDA (${est.mejorasVida}/5): ${est.vidaMaxima} PV`);
      btnDano.setText(`[+] DAÑO (${est.mejorasDano}/5): ${est.danoActual} ATK`);
      
      let textoMovilidad = `[+] MOVILIDAD (${est.mejorasMovilidad}/3)`;
      if (est.mejorasMovilidad === 0) textoMovilidad += ": Salto en Pared";
      else if (est.mejorasMovilidad === 1) textoMovilidad += ": Tercer Salto";
      else if (est.mejorasMovilidad === 2) textoMovilidad += ": Dash (Shift)";
      else textoMovilidad += " (AL MÁXIMO)";
      
      btnMovilidad.setText(textoMovilidad);
    };

    btnVida.on('pointerdown', () => { if(est.mejorarVida()) { gestor.guardarProgreso(); actualizarTextos(); } });
    btnDano.on('pointerdown', () => { if(est.mejorarDano()) { gestor.guardarProgreso(); actualizarTextos(); } });
    btnMovilidad.on('pointerdown', () => { if(est.mejorarMovilidad()) { gestor.guardarProgreso(); actualizarTextos(); } });

    actualizarTextos();
    
    const btnVolver = this.add.text(240, 270, 'VOLVER', { fontSize: '20px', fill: '#ffffff', fontStyle:'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnVolver.on('pointerdown', () => { this.scene.start('MenuSeleccion'); });
  }
}

// ==============================================================================
// ESCENA 4: EL JUEGO PRINCIPAL (MAPA DEL JEFE FUSIONADO CON TUS ESTADÍSTICAS)
// ==============================================================================
class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

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
    this.load.spritesheet(`${char}_wall-jump`, `assets/animaciones/Main_Characters/${char}/Wall Jump (32x32).png`, { frameWidth: 32, frameHeight: 32 });

    // CARGAMOS EL MAPA DEL COMPAÑERO
    this.load.image('tiles-terrain', 'assets/Terrain (16x16).png');
    this.load.image('tiles-lava', 'assets/MAGAMA.png'); 
    this.load.tilemapTiledJSON('mapa-jefe', 'assets/mapa_jefe/mapa_jefe.tmj');
  }

  create() {
    this.gestor = this.registry.get('gestorProgreso');
    this.estadisticas = this.gestor.obtenerEstadisticasDe(this.personajeSeleccionado);

    this.cameras.main.setBackgroundColor('#87CEEB'); 
    
    // TEXTO DE ADVERTENCIA DEL JEFE
    this.warningText = this.add.text(240, 40, '', {
        fontSize: '18px', fill: '#ffffff', backgroundColor: 'rgba(0,0,0,0.8)',
        fontStyle: 'bold', align: 'center', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

    // CONSTRUCCIÓN DEL MAPA
    const map = this.make.tilemap({ key: 'mapa-jefe' });
    let tsTerreno, tsLava;
    try {
      tsTerreno = map.addTilesetImage('Terrain (16x16)', 'tiles-terrain');
      tsLava = map.addTilesetImage('MAGAMA', 'tiles-lava');
    } catch(e) {
      console.warn("Usando nombres alternativos para los tilesets:", e.message); 
      tsTerreno = map.addTilesetImage('terrain', 'tiles-terrain');
      tsLava = map.addTilesetImage('lava', 'tiles-lava');
    }
    
    const combinacionTiles = [tsTerreno, tsLava].filter(t => t);
    const capaLava = map.getLayer('lava') ? map.createLayer('lava', combinacionTiles, 0, 0).setVisible(true) : null;
    const capaTerreno = map.getLayer('terreno') ? map.createLayer('terreno', combinacionTiles, 0, 0).setVisible(true) : null;
    const capaPisoFalso1 = map.getLayer('piso_falso_1') ? map.createLayer('piso_falso_1', combinacionTiles, 0, 0).setVisible(true) : null;
    const capaPisoFalso2 = map.getLayer('piso_falso_2') ? map.createLayer('piso_falso_2', combinacionTiles, 0, 0).setVisible(true) : null;
    
    if(capaTerreno) capaTerreno.setCollisionByExclusion([-1]);
    if(capaPisoFalso1) capaPisoFalso1.setCollisionByExclusion([-1]);
    if(capaPisoFalso2) capaPisoFalso2.setCollisionByExclusion([-1]);
    if(capaLava) capaLava.setCollisionByExclusion([-1]);

    this.tarimas = [];
    this.colTarimas = [];
    for(let i = 1; i <= 5; i++) {
        if (map.getLayer(`tarima_${i}`)) {
            let capaTarima = map.createLayer(`tarima_${i}`, combinacionTiles, 0, 0);
            capaTarima.setVisible(false).setCollisionByExclusion([-1]);
            this.tarimas.push(capaTarima);
        }
    }
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // JUGADOR Y BARRA DE VIDA
    this.playerHealth = this.estadisticas.vidaMaxima;
    this.maxHealth = this.estadisticas.vidaMaxima;

    const barX = 10, barY = 10, barWidth = 150, barHeight = 15;
    this.healthBg = this.add.graphics().setScrollFactor(0);
    this.healthBg.fillStyle(0x000000, 0.6).fillRect(barX, barY, barWidth, barHeight);
    this.healthBg.lineStyle(1, 0xffffff, 1).strokeRect(barX, barY, barWidth, barHeight);
    this.healthBar = this.add.graphics().setScrollFactor(0);
    this.healthText = this.add.text(barX + barWidth / 2, barY + barHeight / 2, '', {
      fontSize: '11px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    this.updateHealthBar = () => {
      this.healthBar.clear();
      const currentWidth = Math.max(0, (this.playerHealth / this.maxHealth) * barWidth);
      this.healthBar.fillStyle(0xff0000, 1).fillRect(barX, barY, currentWidth, barHeight);
      const vidaMostrada = Math.max(0, this.playerHealth);
      this.healthText.setText(`♥ ${vidaMostrada} / ${this.maxHealth}`);
    };
    this.updateHealthBar();

    if (this.personajeSeleccionado === 'Shuri') this.player = new Shuri(this, 100, 50);
    else if (this.personajeSeleccionado === 'Tyson') this.player = new Tyson(this, 100, 50);
    else if (this.personajeSeleccionado === 'Frog') this.player = new Frog(this, 100, 50);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // COLISIONES DEL JUGADOR
    if(capaTerreno) this.physics.add.collider(this.player, capaTerreno);
    if(capaPisoFalso1) this.colPiso1 = this.physics.add.collider(this.player, capaPisoFalso1);
    if(capaPisoFalso2) this.colPiso2 = this.physics.add.collider(this.player, capaPisoFalso2);
    
    this.tarimas.forEach(tarima => {
        let col = this.physics.add.collider(this.player, tarima);
        col.active = false; 
        this.colTarimas.push(col);
    });

    // LÓGICA DE LA LAVA
    if(capaLava) {
        this.physics.add.collider(this.player, capaLava, () => {
            this.player.setPosition(100, 50);
            this.playerHealth -= 20; 
            this.updateHealthBar();
            this.player.setTint(0xffa500);
            this.time.delayedCall(300, () => this.player.clearTint());
            if (this.playerHealth <= 0) {
                setTimeout(() => alert("¡Te quemaste en la lava!"), 50);
                this.scene.start('MenuSeleccion'); 
            }
        });
    }

    // CONTROLES
    const configControles = this.registry.get('controles') || { ARRIBA: 'W', IZQUIERDA: 'A', ABAJO: 'S', DERECHA: 'D' };
    this.teclas = this.input.keyboard.addKeys({
      ARRIBA: Phaser.Input.Keyboard.KeyCodes[configControles.ARRIBA],
      IZQUIERDA: Phaser.Input.Keyboard.KeyCodes[configControles.IZQUIERDA],
      ABAJO: Phaser.Input.Keyboard.KeyCodes[configControles.ABAJO],
      DERECHA: Phaser.Input.Keyboard.KeyCodes[configControles.DERECHA],
      SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

    // ==========================================================
    // RECREACIÓN OBLIGATORIA DE ANIMACIONES
    // ==========================================================
    const char = this.personajeSeleccionado;
    
    // Borramos las animaciones previas para evitar falsos positivos en memoria caché
    const animaciones = ['idle', 'walk', 'jump', 'fall', 'double-jump', 'wall-jump'];
    animaciones.forEach(anim => {
        if (this.anims.exists(`${char}_${anim}`)) {
            this.anims.remove(`${char}_${anim}`);
        }
    });

    // Creamos las animaciones nuevamente forzando su conexión con las texturas recién cargadas
    this.anims.create({ key: `${char}_idle`, frames: this.anims.generateFrameNumbers(`${char}_idle`), frameRate: 10, repeat: -1 });
    this.anims.create({ key: `${char}_walk`, frames: this.anims.generateFrameNumbers(`${char}_walk`), frameRate: 15, repeat: -1 });
    this.anims.create({ key: `${char}_jump`, frames: this.anims.generateFrameNumbers(`${char}_jump`), frameRate: 10, repeat: 0 });
    this.anims.create({ key: `${char}_fall`, frames: this.anims.generateFrameNumbers(`${char}_fall`), frameRate: 10, repeat: -1 });
    this.anims.create({ key: `${char}_double-jump`, frames: this.anims.generateFrameNumbers(`${char}_double-jump`), frameRate: 15, repeat: 0 });
    this.anims.create({ key: `${char}_wall-jump`, frames: this.anims.generateFrameNumbers(`${char}_wall-jump`), frameRate: 15, repeat: -1 });
    
    this.isDashing = false;

    // DISPAROS JUGADOR
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
        bullet.setActive(true).setVisible(true);
        bullet.body.setAllowGravity(false);
        const mouseX = pointer.x + this.cameras.main.scrollX;
        const mouseY = pointer.y + this.cameras.main.scrollY;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, mouseX, mouseY);
        this.physics.velocityFromRotation(angle, 400, bullet.body.velocity);
      }
    });

    // ==========================================================
    // EL JEFE Y SUS FASES 
    // ==========================================================
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
      callback: () => {
        if (this.boss.active) this.boss.setVelocity(Phaser.Math.Between(-150, 150), Phaser.Math.Between(-150, 150));
      }, loop: true
    });

    this.bossBullets = this.physics.add.group({ defaultKey: 'balaTextura', maxSize: 80 });
    if(capaTerreno) this.physics.add.collider(this.bossBullets, capaTerreno, (b) => b.destroy());

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

    let indiceTarimaActual = 0;
    this.time.addEvent({
        delay: 4500, 
        callback: () => {
            if (this.bossPhase === 2 && this.tarimas.length > 0) {
                let nextIndex = (indiceTarimaActual + 1) % this.tarimas.length;
                this.tarimas[nextIndex].setVisible(true).setAlpha(0.3);
                this.colTarimas[nextIndex].active = true; 
                let blinkTween = this.tweens.add({
                    targets: this.tarimas[nextIndex], alpha: 0.9, duration: 200, yoyo: true, repeat: 5
                });
                this.time.delayedCall(1500, () => {
                    if (this.bossPhase !== 2) return; 
                    if(blinkTween) blinkTween.stop();
                    
                    this.tarimas[indiceTarimaActual].setVisible(false);
                    this.colTarimas[indiceTarimaActual].active = false;
                    this.tarimas[nextIndex].setAlpha(1);
                    indiceTarimaActual = nextIndex;
                });
            }
        }, loop: true
    });

    const iniciarFase1 = () => {
        this.bossPhase = 1; 
        this.cameras.main.setBackgroundColor('#87CEEB'); 
        this.warningText.setVisible(false); 
        this.bossShootTimer.delay = 150; 
        if(capaPisoFalso1) { capaPisoFalso1.setVisible(true); this.colPiso1.active = true; }
        if(capaPisoFalso2) { capaPisoFalso2.setVisible(true); this.colPiso2.active = true; }
        this.tarimas.forEach((t, idx) => { t.setVisible(false); this.colTarimas[idx].active = false; });
        this.time.delayedCall(12000, advertenciaFase2); 
    };

    const advertenciaFase2 = () => {
        this.warningText.setText("¡EL PISO COLAPSARÁ!\nBusca las tarimas.\n¡Controles invertidos!").setVisible(true);
        indiceTarimaActual = 0;
        if(this.tarimas.length > 0) {
            this.tarimas[0].setVisible(true).setAlpha(0.3); this.colTarimas[0].active = true;
            this.tweens.add({ targets: this.tarimas[0], alpha: 1, duration: 250, yoyo: true, repeat: 5 }); 
        }
        this.time.delayedCall(3000, iniciarFase2);
    };

    const iniciarFase2 = () => {
        this.bossPhase = 2; 
        this.cameras.main.setBackgroundColor('#ff4444'); 
        this.warningText.setVisible(false); 
        this.bossShootTimer.delay = 600; 
        if(capaPisoFalso1) { capaPisoFalso1.setVisible(false); this.colPiso1.active = false; }
        if(capaPisoFalso2) { capaPisoFalso2.setVisible(false); this.colPiso2.active = false; }
        if(this.tarimas.length > 0) this.tarimas[0].setAlpha(1); 
        this.time.delayedCall(20000, advertenciaFase3); 
    };

    const advertenciaFase3 = () => {
        this.warningText.setText("¡EL PISO REGRESA!\nControles normales.").setVisible(true);
        this.time.delayedCall(3000, iniciarFase3);
    };

    const iniciarFase3 = () => {
        this.bossPhase = 3; 
        this.cameras.main.setBackgroundColor('#87CEEB'); 
        this.warningText.setVisible(false); 
        this.bossShootTimer.delay = 300; 
        if(capaPisoFalso1) { capaPisoFalso1.setVisible(false); this.colPiso1.active = false; }
        if(capaPisoFalso2) { capaPisoFalso2.setVisible(true); this.colPiso2.active = true; }
        this.tarimas.forEach((t, idx) => { t.setVisible(false); this.colTarimas[idx].active = false; });
        this.time.delayedCall(12000, iniciarFase1); 
    };

    this.time.delayedCall(10000, advertenciaFase2); 

    // DAÑO AL JUGADOR
    this.physics.add.overlap(this.player, this.bossBullets, (player, bullet) => {
      bullet.destroy();
      this.playerHealth -= 10;
      this.updateHealthBar();
      player.setTint(0xff0000);
      this.time.delayedCall(200, () => player.clearTint());
      if (this.playerHealth <= 0) {
        setTimeout(() => alert("¡Te mató el jefe!"), 50);
        this.scene.start('MenuSeleccion'); 
      }
    });

    // DAÑO AL JEFE Y VICTORIA (Con tus Stats y Experiencia)
    this.physics.add.overlap(this.boss, this.bullets, (boss, bullet) => {
      bullet.destroy();
      this.bossHealth -= this.estadisticas.danoActual; // USA TU DAÑO
      
      boss.setTint(0xff0000);
      this.time.delayedCall(100, () => boss.clearTint());
      if (this.bossHealth <= 0) {
        boss.destroy();
        this.cameras.main.setBackgroundColor('#87CEEB'); 
        
        const expGanada = 150;
        this.estadisticas.ganarExperiencia(expGanada);
        this.gestor.guardarProgreso();
        
        setTimeout(() => alert(`¡Venciste al jefe! Has ganado ${expGanada} EXP.`), 50);
        this.scene.start('MenuSeleccion'); 
      }
    });

    // MENÚ DE PAUSA
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.pause(); 
      this.scene.launch('PauseScene', { sceneKey: 'GameScene' }); 
    });
  }

  // ==========================================================
  // UPDATE: TU LÓGICA DE MOVILIDAD EXACTAMENTE COMO LA TENÍAS
  // ==========================================================
  update() {
    if (this.isDashing) return;

    let moverIzquierda;
    let moverDerecha;
    let botonSalto;

    // INTEGRAMOS LOS CONTROLES INVERTIDOS RESPETANDO TU CONFIGURACIÓN PERSONALIZADA
    if (this.bossPhase === 2) {
      moverIzquierda = this.teclas.DERECHA.isDown; 
      moverDerecha = this.teclas.IZQUIERDA.isDown;   
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.ABAJO); 
    } else {
      moverIzquierda = this.teclas.IZQUIERDA.isDown;
      moverDerecha = this.teclas.DERECHA.isDown;
      botonSalto = Phaser.Input.Keyboard.JustDown(this.teclas.ARRIBA);
    }

    // TU DASH (Nivel 3)
    if (this.estadisticas.mecanicasMovilidad.nivel3 && Phaser.Input.Keyboard.JustDown(this.teclas.SHIFT)) {
      this.isDashing = true;
      const direccionDash = this.player.flipX ? -1 : 1;
      this.player.setVelocityX(direccionDash * 800);
      this.player.body.setAllowGravity(false);
      this.player.setVelocityY(0);
      this.time.delayedCall(200, () => {
        this.isDashing = false;
        this.player.body.setAllowGravity(true);
      });
      return;
    }

    let velXBase = this.player.velocidadX;
    if (moverIzquierda) {
      this.player.setVelocityX(-velXBase);
      this.player.flipX = true; 
    } else if (moverDerecha) {
      this.player.setVelocityX(velXBase);
      this.player.flipX = false;
    } else {
      this.player.setVelocityX(0);
    }

    const isGrounded = this.player.body.onFloor() || this.player.body.touching.down;
    const isTouchingWall = this.player.body.blocked.left || this.player.body.blocked.right;
    
    if (isGrounded && this.player.body.velocity.y >= 0) {
      this.player.jumpCount = 0;
    }

    // TUS SALTOS (Nivel 1 y Nivel 2)
    let maxJumps = 2; 
    if (this.estadisticas.mecanicasMovilidad.nivel2) maxJumps = 3;

    if (botonSalto) {
      if (this.player.jumpCount === 0) {
        this.player.setVelocityY(this.player.fuerzaSalto); 
        this.player.jumpCount = 1;
      } else if (this.estadisticas.mecanicasMovilidad.nivel1 && isTouchingWall) { // Salto en pared
        this.player.setVelocityY(this.player.fuerzaSalto); 
        this.player.jumpCount = 1; 
        const empuje = this.player.body.blocked.left ? 200 : -200;
        this.player.setVelocityX(empuje);
        this.player.flipX = this.player.body.blocked.left;
      } else if (this.player.jumpCount > 0 && this.player.jumpCount < maxJumps) { // Doble/Triple Salto
        this.player.setVelocityY(this.player.fuerzaDobleSalto); 
        this.player.jumpCount++;
      }
    }

    const char = this.personajeSeleccionado;
    
    if (!isGrounded) {
      if (this.estadisticas.mecanicasMovilidad.nivel1 && isTouchingWall && this.player.body.velocity.y > 0) {
        this.player.anims.play(`${char}_wall-jump`, true);
      } else if (this.player.body.velocity.y < 0) {
        if (this.player.jumpCount === 2) {
          this.player.anims.play(`${char}_double-jump`, true);
        } else if (this.player.jumpCount === 3) {
          this.player.anims.play(`${char}_jump`, true); 
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
// ESCENA 5: MENÚ DE PAUSA
// ==============================================================================
class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }
  
  init(data) {
    this.escenaAnterior = data.sceneKey || 'GameScene';
  }

  create() {
    this.add.rectangle(240, 160, 480, 320, 0x000000, 0.7);
    this.add.text(240, 80, 'PAUSA', { fontSize: '40px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    
    const btnContinuar = this.add.text(240, 150, 'Continuar', { fontSize: '24px', fill: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnContinuar.on('pointerdown', () => { 
      this.scene.resume(this.escenaAnterior); 
      this.scene.stop(); 
    });
    
    const btnVolver = this.add.text(240, 210, 'Volver al menú', { fontSize: '24px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnVolver.on('pointerdown', () => { 
      this.scene.stop(this.escenaAnterior); 
      this.scene.start('MenuSeleccion'); 
    });

    [btnContinuar, btnVolver].forEach(btn => { 
      btn.on('pointerover', () => btn.setScale(1.1)); 
      btn.on('pointerout', () => btn.setScale(1)); 
    });
    
    this.input.keyboard.on('keydown-ESC', () => { 
      this.scene.resume(this.escenaAnterior); 
      this.scene.stop(); 
    });
  }
}

// ==============================================================================
// COMPONENTE REACT PRINCIPAL
// ==============================================================================
export default function App() {
  const gameRef = useRef(null);
  const gameInstanceRef = useRef(null);

  // Estados de autenticación
  const [user, setUser] = useState(null); 
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  // Inicialización de Phaser
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
      scene: [MenuScene, MenuSeleccion, MejorasScene, GameScene, PauseScene] 
    };
    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;
    return () => { game.destroy(true); gameInstanceRef.current = null; };
  }, []);

  // Sincroniza la sesión al cargar la página: si la cookie sigue siendo
  // válida, recupera el usuario sin que tenga que loguearse de nuevo.
  // Si falla (sin cookie, cookie vencida, etc.), simplemente deja user en
  // null — el juego sigue siendo jugable igual, solo que sin sesión activa.
  useEffect(() => {
    api.get('/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => setUser(null));
  }, []);

  // Bloquea el teclado y el mouse del juego mientras un modal de autenticación esté abierto
  useEffect(() => {
    const game = gameInstanceRef.current;
    if (!game) return;
    const modalAbierto = showLogin || showRegister;

    if (modalAbierto) {
      game.input.enabled = false;
      if (game.input.keyboard) game.input.keyboard.enabled = false;
    } else {
      game.input.enabled = true;
      if (game.input.keyboard) game.input.keyboard.enabled = true;
    }
  }, [showLogin, showRegister]);

  // Manejo de formularios
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      alert('Registro completado. Procede a iniciar sesión.');
      setShowRegister(false);
      setShowLogin(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Fallo en el registro.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });
      setUser(response.data.user); 
      setShowLogin(false);
      setFormData({ username: '', email: '', password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch (err) {
      console.error('Error durante la desconexión', err);
      setUser(null);
    }
  };

  return (
    
      <div className="game-wrapper">
      {/* INTERFAZ DE AUTENTICACIÓN LATERAL */}
      <div className="auth-sidebar">
        
        {/* Círculo Central/Avatar (Fijo a la derecha) */}
        <div className="menu-circle">
          {user ? (
            <div className="user-initial">
              {user.username.charAt(0).toUpperCase()}
            </div>
          ) : (
            <svg className="avatar-silhouette" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z"/>
            </svg>
          )}
        </div>

        {/* Contenedor de Botones (Apilados a un costado) */}
        <div className="auth-buttons">
          {!user ? (
            <>
              <button className="menu-btn" onClick={() => setShowLogin(true)}>Iniciar sesión</button>
              <button className="menu-btn register-btn" onClick={() => setShowRegister(true)}>Registrarse</button>
            </>
          ) : (
            <>
              <span className="welcome-text">Jugador: {user.username}</span>
              <button className="menu-btn logout-btn" onClick={handleLogout}>Cerrar sesión</button>
            </>
          )}
        </div>

      </div>

      {/* CONTENEDOR DEL JUEGO PHASER */}
      <h2 style={{ marginTop: '20px' }}>Solemne 2 - Fusión Completa (Con Pausa)</h2>
      <div ref={gameRef} style={{ border: '4px solid #333', borderRadius: '8px', overflow: 'hidden' }}></div>
      <p style={{ marginTop: '10px' }}>Derrota al jefe para ganar EXP. Vuelve al menú para mejorar tus stats.</p>
      <p style={{ marginTop: '10px' }}>Presiona <strong>ESC</strong> para pausar el juego. Buena suerte.</p>

      {/* MODAL DE REGISTRO */}
      {showRegister && (
        <div className="modal-overlay">
          <div className="auth-modal">
            <h2>Crear Cuenta</h2>
            {error && <p className="error-msg">{error}</p>}
            <form onSubmit={handleRegister}>
              <input type="text" name="username" placeholder="Nombre de usuario" required onChange={handleChange} value={formData.username} />
              <input type="email" name="email" placeholder="Correo electrónico" required onChange={handleChange} value={formData.email} />
              <input type="password" name="password" placeholder="Contraseña" required onChange={handleChange} value={formData.password} />
              <div className="modal-actions">
                <button type="submit" className="submit-btn">Registrarse</button>
                <button type="button" className="close-btn" onClick={() => setShowRegister(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE LOGIN */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="auth-modal">
            <h2>Acceso</h2>
            {error && <p className="error-msg">{error}</p>}
            <form onSubmit={handleLogin}>
              <input type="email" name="email" placeholder="Correo electrónico" required onChange={handleChange} value={formData.email} />
              <input type="password" name="password" placeholder="Contraseña" required onChange={handleChange} value={formData.password} />
              <div className="modal-actions">
                <button type="submit" className="submit-btn">Entrar</button>
                <button type="button" className="close-btn" onClick={() => setShowLogin(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}