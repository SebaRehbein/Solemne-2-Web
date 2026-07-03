import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import api from './api/axios';
import AvatarEditor from './AvatarEditor';
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

// Replica en el cliente la misma fórmula que backend/utils/calcularPuntaje.js,
// para poder mostrar el puntaje en la pantalla de "Fin de la partida" al
// instante, sin esperar la respuesta del servidor y también cuando se juega
// sin sesión iniciada (caso en el que el puntaje nunca llega a enviarse).
const PUNTOS_POR_NIVEL = 1000;
const PENALIZACION_POR_SEGUNDO = 2;
const PENALIZACION_POR_DANO = 5;
function calcularPuntajeCliente({ nivelAlcanzado, tiempoSegundos, danoRecibido }) {
  const puntos = nivelAlcanzado * PUNTOS_POR_NIVEL - tiempoSegundos * PENALIZACION_POR_SEGUNDO - danoRecibido * PENALIZACION_POR_DANO;
  return Math.max(Math.round(puntos), 0);
}


// ==============================================================================
// ==============================================================================
// ESCENA 1: NIVEL INICIAL (mapa_1.tmj)
// Mismas funcionalidades que GameScene: estadísticas, barra de vida,
// 6 animaciones, disparo, dash, wall-jump, triple salto, pausa ESC,
// envío de puntaje. Zona de salida por chequeo manual (confiable).
// ==============================================================================
// ==============================================================================
// NivelUnoScene: mapa_1.tmj
// Flujo: → NivelDosScene
// ==============================================================================
class NivelUnoScene extends Phaser.Scene {
  constructor() { super({ key: 'NivelUnoScene' }); }
  init(data) { this.personajeSeleccionado = data.personaje || 'Shuri'; }

  preload() {
    const char = this.personajeSeleccionado;
    this.load.tilemapTiledJSON('mapa_nivel1', 'assets/mapa_inicial/mapa_1.tmj');
    this.load.image('tiles_terreno_n1', 'assets/Terrain (16x16).png');
    this.load.image('tiles_magma_n1',   'assets/MAGAMA.png');
    this.load.image('tiles_pinchoAr_n1','assets/pinchoAr.png');
    this.load.image('tiles_pinchoAb_n1','assets/pinchoAb.png');
    this.load.spritesheet(`${char}_idle`,        `assets/animaciones/Main_Characters/${char}/Idle (32x32).png`,        { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_walk`,        `assets/animaciones/Main_Characters/${char}/Run (32x32).png`,         { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_jump`,        `assets/animaciones/Main_Characters/${char}/Jump (32x32).png`,        { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_fall`,        `assets/animaciones/Main_Characters/${char}/Fall (32x32).png`,        { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_double-jump`, `assets/animaciones/Main_Characters/${char}/Double Jump (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_wall-jump`,   `assets/animaciones/Main_Characters/${char}/Wall Jump (32x32).png`,   { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    try { this._crearEscena(); }
    catch (e) {
      console.error('[NivelUnoScene] ERROR:', e);
      this.add.text(240, 160, `ERROR:
${e.message}`, { fontSize:'14px', fill:'#ff0000', backgroundColor:'#000', align:'center' }).setOrigin(0.5).setDepth(999);
    }
  }

  _crearEscena() {
    this.gestor       = this.registry.get('gestorProgreso');
    this.estadisticas = this.gestor.obtenerEstadisticasDe(this.personajeSeleccionado);
    this.tiempoInicio      = this.time.now;
    this.danoRecibidoTotal = 0;

    const map = this.make.tilemap({ key: 'mapa_nivel1' });

    // Transparencia blanca de pinchos
    ['tiles_pinchoAr_n1', 'tiles_pinchoAb_n1'].forEach(k => {
      this.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
      this._aplicarColorKeyBlanco(k);
    });

    const tsTerreno  = map.addTilesetImage('terreno',  'tiles_terreno_n1');
    const tsLava     = map.addTilesetImage('lava',     'tiles_magma_n1');
    const tsPinchoAr = map.addTilesetImage('pincho arriba', 'tiles_pinchoAr_n1');
    const tsPinchoAb = map.addTilesetImage('pincho abajo', 'tiles_pinchoAb_n1');
    const tilesets   = [tsTerreno, tsLava, tsPinchoAr, tsPinchoAb].filter(Boolean);

    const capaTerreno = map.createLayer('terreno', tilesets, 0, 0);
    capaTerreno.setCollisionByExclusion([-1]);
    const capaTrampas = map.createLayer('trampas', tilesets, 0, 0);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Spawn y zona de salida
    const capaEntidades = map.getObjectLayer('entidades');
    const puntoSpawn    = capaEntidades?.objects.find(o => o.name === 'spawn_jugador');
    const spawnX = puntoSpawn ? puntoSpawn.x : 50;
    const spawnY = puntoSpawn ? puntoSpawn.y : 50;
    const zonaSalidaObj = capaEntidades?.objects.find(o => o.name === 'zona_salida');
    this.zonaSalidaRect = zonaSalidaObj ? {
      left: zonaSalidaObj.x - 8, right: zonaSalidaObj.x + zonaSalidaObj.width + 8,
      top:  zonaSalidaObj.y - 8, bottom: zonaSalidaObj.y + zonaSalidaObj.height + 8
    } : null;

    // Barra de vida
    this.playerHealth = this.estadisticas.vidaMaxima;
    this.maxHealth    = this.estadisticas.vidaMaxima;
    const barX = 10, barY = 10, barWidth = 150, barHeight = 15;
    this.healthBg = this.add.graphics().setScrollFactor(0).setDepth(50);
    this.healthBg.fillStyle(0x000000, 0.6).fillRect(barX, barY, barWidth, barHeight);
    this.healthBg.lineStyle(1, 0xffffff, 1).strokeRect(barX, barY, barWidth, barHeight);
    this.healthBar  = this.add.graphics().setScrollFactor(0).setDepth(50);
    this.healthText = this.add.text(barX + barWidth/2, barY + barHeight/2, '', {
      fontSize: '11px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.updateHealthBar = () => {
      this.healthBar.clear();
      const w = Math.max(0, (this.playerHealth / this.maxHealth) * barWidth);
      this.healthBar.fillStyle(0xff0000, 1).fillRect(barX, barY, w, barHeight);
      this.healthText.setText(`♥ ${Math.max(0, this.playerHealth)} / ${this.maxHealth}`);
    };
    this.updateHealthBar();

    // Animaciones
    const char = this.personajeSeleccionado;
    ['idle','walk','jump','fall','double-jump','wall-jump'].forEach(a => {
      if (this.anims.exists(`${char}_${a}`)) this.anims.remove(`${char}_${a}`);
    });
    this.anims.create({ key:`${char}_idle`,        frames:this.anims.generateFrameNumbers(`${char}_idle`),        frameRate:10, repeat:-1 });
    this.anims.create({ key:`${char}_walk`,        frames:this.anims.generateFrameNumbers(`${char}_walk`),        frameRate:15, repeat:-1 });
    this.anims.create({ key:`${char}_jump`,        frames:this.anims.generateFrameNumbers(`${char}_jump`),        frameRate:10, repeat: 0 });
    this.anims.create({ key:`${char}_fall`,        frames:this.anims.generateFrameNumbers(`${char}_fall`),        frameRate:10, repeat:-1 });
    this.anims.create({ key:`${char}_double-jump`, frames:this.anims.generateFrameNumbers(`${char}_double-jump`), frameRate:15, repeat: 0 });
    this.anims.create({ key:`${char}_wall-jump`,   frames:this.anims.generateFrameNumbers(`${char}_wall-jump`),   frameRate:15, repeat:-1 });

    // Jugador
    if      (char==='Shuri') this.player = new Shuri(this, spawnX, spawnY);
    else if (char==='Tyson') this.player = new Tyson(this, spawnX, spawnY);
    else                     this.player = new Frog (this, spawnX, spawnY);
    this.player.anims.play(`${char}_idle`);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.physics.add.collider(this.player, capaTerreno);
    this.isDashing = false;
    this.spawnX = spawnX; this.spawnY = spawnY;

    // Disparos
    if (!this.textures.exists('balaTextura')) {
      const g = this.add.graphics();
      g.fillStyle(0x000000,1).fillCircle(4,4,4);
      g.fillStyle(0xff0000,1).fillCircle(4,4,2);
      g.generateTexture('balaTextura',8,8); g.destroy();
    }
    this.bullets = this.physics.add.group({ defaultKey:'balaTextura', maxSize:20 });
    this.physics.add.collider(this.bullets, capaTerreno, b => b.destroy());
    this.input.on('pointerdown', pointer => {
      const bullet = this.bullets.get(this.player.x, this.player.y);
      if (bullet) {
        bullet.setActive(true).setVisible(true);
        bullet.body.setAllowGravity(false);
        const angle = Phaser.Math.Angle.Between(
          this.player.x, this.player.y,
          pointer.x + this.cameras.main.scrollX,
          pointer.y + this.cameras.main.scrollY
        );
        this.physics.velocityFromRotation(angle, 400, bullet.body.velocity);
      }
    });

    // Daño
    this.tiempoUltimoDano = -99999;
    this.DURACION_INV     = 600;
    this.GIDS_PINCHO      = [244, 245];
    this.GIDS_LAVA        = [243];
    this.capaTrampasRef   = capaTrampas;

    // Controles
    const cfg = this.registry.get('controles') || { ARRIBA:'W', IZQUIERDA:'A', ABAJO:'S', DERECHA:'D' };
    const k   = (n,d) => Phaser.Input.Keyboard.KeyCodes[n] ?? Phaser.Input.Keyboard.KeyCodes[d];
    this.teclas = this.input.keyboard.addKeys({
      ARRIBA:    k(cfg.ARRIBA,'W'), IZQUIERDA: k(cfg.IZQUIERDA,'A'),
      ABAJO:     k(cfg.ABAJO,'S'),  DERECHA:    k(cfg.DERECHA,'D'),
      SHIFT:     Phaser.Input.Keyboard.KeyCodes.SHIFT
    });
    this.teclasFlechas = this.input.keyboard.createCursorKeys();
    this.player.jumpCount = 0;
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'NivelUnoScene' });
    });
  }

  _aplicarColorKeyBlanco(claveTextura) {
    const tex = this.textures.get(claveTextura);
    const src = tex.getSourceImage();
    const cv  = document.createElement('canvas');
    cv.width = src.width; cv.height = src.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const id = ctx.getImageData(0,0,cv.width,cv.height);
    const d  = id.data;
    for (let i=0; i<d.length; i+=4) { if(d[i]>240&&d[i+1]>240&&d[i+2]>240) d[i+3]=0; }
    ctx.putImageData(id,0,0);
    this.textures.remove(claveTextura);
    this.textures.addCanvas(claveTextura, cv);
  }

  enviarPuntaje(nivelAlcanzado) {
    const tiempoSegundos = Math.round((this.time.now - this.tiempoInicio) / 1000);
    const puntos = calcularPuntajeCliente({ nivelAlcanzado, tiempoSegundos, danoRecibido: this.danoRecibidoTotal });
    if (this.registry.get('usuarioActual')) {
      api.post('/scores', { nivelAlcanzado, tiempoSegundos, danoRecibido: this.danoRecibidoTotal })
         .catch(e => console.error('No se pudo guardar el puntaje:', e));
    }
    return puntos;
  }

  update() {
    if (this.isDashing) return;
    const char = this.personajeSeleccionado;

    if (this.player.tintTopLeft !== 0xffffff && this.time.now - this.tiempoUltimoDano > 200) {
      this.player.clearTint();
    }

    // Pinchos y lava
    {
      const b = this.player.body, ahora = this.time.now;
      if (ahora - this.tiempoUltimoDano >= this.DURACION_INV) {
        const puntos = [
          [b.left+5,b.top+5],[b.right-5,b.top+5],
          [b.left+5,b.bottom-5],[b.right-5,b.bottom-5],
          [b.center.x,b.center.y]
        ];
        for (const [px,py] of puntos) {
          const tile = this.capaTrampasRef.getTileAtWorldXY(px, py, true);
          if (!tile) continue;
          if (this.GIDS_LAVA.includes(tile.index)) {
            this.tiempoUltimoDano = ahora;
            this.danoRecibidoTotal += this.playerHealth;
            this.playerHealth = 0;
            this.updateHealthBar();
            this.scene.start('GameOverScene', { puntos: this.enviarPuntaje(0) });
            return;
          }
          if (this.GIDS_PINCHO.includes(tile.index)) {
            this.tiempoUltimoDano = ahora;
            this.playerHealth -= 20;
            this.danoRecibidoTotal += 20;
            this.updateHealthBar();
            this.player.setPosition(this.spawnX, this.spawnY);
            this.player.setVelocity(0, 0);
            this.player.setTint(0xff0000);
            if (this.playerHealth <= 0) {
              this.scene.start('GameOverScene', { puntos: this.enviarPuntaje(0) });
              return;
            }
            break;
          }
        }
      }
    }

    // Zona de salida
    if (this.zonaSalidaRect) {
      const b = this.player.body, z = this.zonaSalidaRect;
      if (b.right > z.left && b.left < z.right && b.bottom > z.top && b.top < z.bottom) {
        this.scene.start('NivelDosScene', { personaje: this.personajeSeleccionado });
        return;
      }
    }

    // Dash
    if (this.estadisticas.mecanicasMovilidad.nivel3 && Phaser.Input.Keyboard.JustDown(this.teclas.SHIFT)) {
      this.isDashing = true;
      const dir = this.player.flipX ? -1 : 1;
      this.player.setVelocityX(dir*800);
      this.player.body.setAllowGravity(false);
      this.player.setVelocityY(0);
      this.time.delayedCall(200, () => { this.isDashing=false; this.player.body.setAllowGravity(true); });
      return;
    }

    const moverIzq = this.teclas.IZQUIERDA.isDown || this.teclasFlechas.left.isDown;
    const moverDer = this.teclas.DERECHA.isDown   || this.teclasFlechas.right.isDown;
    const salto    = Phaser.Input.Keyboard.JustDown(this.teclas.ARRIBA) ||
                     Phaser.Input.Keyboard.JustDown(this.teclasFlechas.up);

    if      (moverIzq) { this.player.setVelocityX(-this.player.velocidadX); this.player.flipX=true;  }
    else if (moverDer) { this.player.setVelocityX( this.player.velocidadX); this.player.flipX=false; }
    else               { this.player.setVelocityX(0); }

    const enSuelo = this.player.body.onFloor() || this.player.body.touching.down;
    const enPared = this.player.body.blocked.left || this.player.body.blocked.right;
    if (enSuelo && this.player.body.velocity.y >= 0) this.player.jumpCount = 0;

    let maxSaltos = 2;
    if (this.estadisticas.mecanicasMovilidad.nivel2) maxSaltos = 3;
    if (salto) {
      if (this.player.jumpCount === 0) {
        this.player.setVelocityY(this.player.fuerzaSalto); this.player.jumpCount=1;
      } else if (this.estadisticas.mecanicasMovilidad.nivel1 && enPared) {
        this.player.setVelocityY(this.player.fuerzaSalto); this.player.jumpCount=1;
        const empuje = this.player.body.blocked.left ? 200 : -200;
        this.player.setVelocityX(empuje); this.player.flipX = this.player.body.blocked.left;
      } else if (this.player.jumpCount > 0 && this.player.jumpCount < maxSaltos) {
        this.player.setVelocityY(this.player.fuerzaDobleSalto); this.player.jumpCount++;
      }
    }

    if (!enSuelo) {
      if (this.estadisticas.mecanicasMovilidad.nivel1 && enPared && this.player.body.velocity.y>0) {
        this.player.anims.play(`${char}_wall-jump`, true);
      } else if (this.player.body.velocity.y < 0) {
        this.player.anims.play(this.player.jumpCount>=2 ? `${char}_double-jump` : `${char}_jump`, true);
      } else {
        this.player.anims.play(`${char}_fall`, true);
      }
    } else if (this.player.body.velocity.x !== 0) {
      this.player.anims.play(`${char}_walk`, true);
    } else {
      this.player.anims.play(`${char}_idle`, true);
    }
  }
}


// ==============================================================================
// NivelDosScene: mapa_0.tmj
// Flujo: → NivelTresScene
// ==============================================================================
class NivelDosScene extends Phaser.Scene {
  constructor() { super({ key: 'NivelDosScene' }); }
  init(data) { this.personajeSeleccionado = data.personaje || 'Shuri'; }

  preload() {
    const char = this.personajeSeleccionado;
    this.load.tilemapTiledJSON('mapa_nivel0', 'assets/mapa_inicial/mapa_0.tmj');
    this.load.image('tiles_terreno_n2', 'assets/Terrain (16x16).png');
    this.load.image('tiles_magma_n2',   'assets/MAGAMA.png');
    this.load.image('tiles_pinchoAr_n2','assets/pinchoAr.png');
    this.load.image('tiles_pinchoAb_n2','assets/pinchoAb.png');
    this.load.spritesheet(`${char}_idle`,        `assets/animaciones/Main_Characters/${char}/Idle (32x32).png`,        { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_walk`,        `assets/animaciones/Main_Characters/${char}/Run (32x32).png`,         { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_jump`,        `assets/animaciones/Main_Characters/${char}/Jump (32x32).png`,        { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_fall`,        `assets/animaciones/Main_Characters/${char}/Fall (32x32).png`,        { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_double-jump`, `assets/animaciones/Main_Characters/${char}/Double Jump (32x32).png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(`${char}_wall-jump`,   `assets/animaciones/Main_Characters/${char}/Wall Jump (32x32).png`,   { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    try { this._crearEscena(); }
    catch (e) {
      console.error('[NivelDosScene] ERROR:', e);
      this.add.text(240, 160, `ERROR:
${e.message}`, { fontSize:'14px', fill:'#ff0000', backgroundColor:'#000', align:'center' }).setOrigin(0.5).setDepth(999);
    }
  }

  _crearEscena() {
    this.gestor       = this.registry.get('gestorProgreso');
    this.estadisticas = this.gestor.obtenerEstadisticasDe(this.personajeSeleccionado);
    this.tiempoInicio      = this.time.now;
    this.danoRecibidoTotal = 0;

    const map = this.make.tilemap({ key: 'mapa_nivel0' });

    // Transparencia blanca de pinchos
    ['tiles_pinchoAr_n2', 'tiles_pinchoAb_n2'].forEach(k => {
      this.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
      this._aplicarColorKeyBlanco(k);
    });

    const tsTerreno  = map.addTilesetImage('terreno',  'tiles_terreno_n2');
    const tsLava     = map.addTilesetImage('lava',     'tiles_magma_n2');
    const tsPinchoAr = map.addTilesetImage('pincho arriba', 'tiles_pinchoAr_n2');
    const tsPinchoAb = map.addTilesetImage('pincho abajo', 'tiles_pinchoAb_n2');
    const tilesets   = [tsTerreno, tsLava, tsPinchoAr, tsPinchoAb].filter(Boolean);

    const capaTerreno = map.createLayer('terreno', tilesets, 0, 0);
    capaTerreno.setCollisionByExclusion([-1]);
    const capaTrampas = map.createLayer('trampas', tilesets, 0, 0);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Spawn y zona de salida
    const capaEntidades = map.getObjectLayer('entidades');
    const puntoSpawn    = capaEntidades?.objects.find(o => o.name === 'spawn_jugador');
    const spawnX = puntoSpawn ? puntoSpawn.x : 50;
    const spawnY = puntoSpawn ? puntoSpawn.y : 50;
    const zonaSalidaObj = capaEntidades?.objects.find(o => o.name === 'zona_salida');
    this.zonaSalidaRect = zonaSalidaObj ? {
      left: zonaSalidaObj.x - 8, right: zonaSalidaObj.x + zonaSalidaObj.width + 8,
      top:  zonaSalidaObj.y - 8, bottom: zonaSalidaObj.y + zonaSalidaObj.height + 8
    } : null;

    // Barra de vida
    this.playerHealth = this.estadisticas.vidaMaxima;
    this.maxHealth    = this.estadisticas.vidaMaxima;
    const barX = 10, barY = 10, barWidth = 150, barHeight = 15;
    this.healthBg = this.add.graphics().setScrollFactor(0).setDepth(50);
    this.healthBg.fillStyle(0x000000, 0.6).fillRect(barX, barY, barWidth, barHeight);
    this.healthBg.lineStyle(1, 0xffffff, 1).strokeRect(barX, barY, barWidth, barHeight);
    this.healthBar  = this.add.graphics().setScrollFactor(0).setDepth(50);
    this.healthText = this.add.text(barX + barWidth/2, barY + barHeight/2, '', {
      fontSize: '11px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.updateHealthBar = () => {
      this.healthBar.clear();
      const w = Math.max(0, (this.playerHealth / this.maxHealth) * barWidth);
      this.healthBar.fillStyle(0xff0000, 1).fillRect(barX, barY, w, barHeight);
      this.healthText.setText(`♥ ${Math.max(0, this.playerHealth)} / ${this.maxHealth}`);
    };
    this.updateHealthBar();

    // Animaciones
    const char = this.personajeSeleccionado;
    ['idle','walk','jump','fall','double-jump','wall-jump'].forEach(a => {
      if (this.anims.exists(`${char}_${a}`)) this.anims.remove(`${char}_${a}`);
    });
    this.anims.create({ key:`${char}_idle`,        frames:this.anims.generateFrameNumbers(`${char}_idle`),        frameRate:10, repeat:-1 });
    this.anims.create({ key:`${char}_walk`,        frames:this.anims.generateFrameNumbers(`${char}_walk`),        frameRate:15, repeat:-1 });
    this.anims.create({ key:`${char}_jump`,        frames:this.anims.generateFrameNumbers(`${char}_jump`),        frameRate:10, repeat: 0 });
    this.anims.create({ key:`${char}_fall`,        frames:this.anims.generateFrameNumbers(`${char}_fall`),        frameRate:10, repeat:-1 });
    this.anims.create({ key:`${char}_double-jump`, frames:this.anims.generateFrameNumbers(`${char}_double-jump`), frameRate:15, repeat: 0 });
    this.anims.create({ key:`${char}_wall-jump`,   frames:this.anims.generateFrameNumbers(`${char}_wall-jump`),   frameRate:15, repeat:-1 });

    // Jugador
    if      (char==='Shuri') this.player = new Shuri(this, spawnX, spawnY);
    else if (char==='Tyson') this.player = new Tyson(this, spawnX, spawnY);
    else                     this.player = new Frog (this, spawnX, spawnY);
    this.player.anims.play(`${char}_idle`);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.physics.add.collider(this.player, capaTerreno);
    this.isDashing = false;
    this.spawnX = spawnX; this.spawnY = spawnY;

    // Disparos
    if (!this.textures.exists('balaTextura')) {
      const g = this.add.graphics();
      g.fillStyle(0x000000,1).fillCircle(4,4,4);
      g.fillStyle(0xff0000,1).fillCircle(4,4,2);
      g.generateTexture('balaTextura',8,8); g.destroy();
    }
    this.bullets = this.physics.add.group({ defaultKey:'balaTextura', maxSize:20 });
    this.physics.add.collider(this.bullets, capaTerreno, b => b.destroy());
    this.input.on('pointerdown', pointer => {
      const bullet = this.bullets.get(this.player.x, this.player.y);
      if (bullet) {
        bullet.setActive(true).setVisible(true);
        bullet.body.setAllowGravity(false);
        const angle = Phaser.Math.Angle.Between(
          this.player.x, this.player.y,
          pointer.x + this.cameras.main.scrollX,
          pointer.y + this.cameras.main.scrollY
        );
        this.physics.velocityFromRotation(angle, 400, bullet.body.velocity);
      }
    });

    // Daño
    this.tiempoUltimoDano = -99999;
    this.DURACION_INV     = 600;
    this.GIDS_PINCHO      = [244, 245];
    this.GIDS_LAVA        = [243];
    this.capaTrampasRef   = capaTrampas;

    // Controles
    const cfg = this.registry.get('controles') || { ARRIBA:'W', IZQUIERDA:'A', ABAJO:'S', DERECHA:'D' };
    const k   = (n,d) => Phaser.Input.Keyboard.KeyCodes[n] ?? Phaser.Input.Keyboard.KeyCodes[d];
    this.teclas = this.input.keyboard.addKeys({
      ARRIBA:    k(cfg.ARRIBA,'W'), IZQUIERDA: k(cfg.IZQUIERDA,'A'),
      ABAJO:     k(cfg.ABAJO,'S'),  DERECHA:    k(cfg.DERECHA,'D'),
      SHIFT:     Phaser.Input.Keyboard.KeyCodes.SHIFT
    });
    this.teclasFlechas = this.input.keyboard.createCursorKeys();
    this.player.jumpCount = 0;
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'NivelDosScene' });
    });
  }

  _aplicarColorKeyBlanco(claveTextura) {
    const tex = this.textures.get(claveTextura);
    const src = tex.getSourceImage();
    const cv  = document.createElement('canvas');
    cv.width = src.width; cv.height = src.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const id = ctx.getImageData(0,0,cv.width,cv.height);
    const d  = id.data;
    for (let i=0; i<d.length; i+=4) { if(d[i]>240&&d[i+1]>240&&d[i+2]>240) d[i+3]=0; }
    ctx.putImageData(id,0,0);
    this.textures.remove(claveTextura);
    this.textures.addCanvas(claveTextura, cv);
  }

  enviarPuntaje(nivelAlcanzado) {
    const tiempoSegundos = Math.round((this.time.now - this.tiempoInicio) / 1000);
    const puntos = calcularPuntajeCliente({ nivelAlcanzado, tiempoSegundos, danoRecibido: this.danoRecibidoTotal });
    if (this.registry.get('usuarioActual')) {
      api.post('/scores', { nivelAlcanzado, tiempoSegundos, danoRecibido: this.danoRecibidoTotal })
         .catch(e => console.error('No se pudo guardar el puntaje:', e));
    }
    return puntos;
  }

  update() {
    if (this.isDashing) return;
    const char = this.personajeSeleccionado;

    if (this.player.tintTopLeft !== 0xffffff && this.time.now - this.tiempoUltimoDano > 200) {
      this.player.clearTint();
    }

    // Pinchos y lava
    {
      const b = this.player.body, ahora = this.time.now;
      if (ahora - this.tiempoUltimoDano >= this.DURACION_INV) {
        const puntos = [
          [b.left+5,b.top+5],[b.right-5,b.top+5],
          [b.left+5,b.bottom-5],[b.right-5,b.bottom-5],
          [b.center.x,b.center.y]
        ];
        for (const [px,py] of puntos) {
          const tile = this.capaTrampasRef.getTileAtWorldXY(px, py, true);
          if (!tile) continue;
          if (this.GIDS_LAVA.includes(tile.index)) {
            this.tiempoUltimoDano = ahora;
            this.danoRecibidoTotal += this.playerHealth;
            this.playerHealth = 0;
            this.updateHealthBar();
            this.scene.start('GameOverScene', { puntos: this.enviarPuntaje(0) });
            return;
          }
          if (this.GIDS_PINCHO.includes(tile.index)) {
            this.tiempoUltimoDano = ahora;
            this.playerHealth -= 20;
            this.danoRecibidoTotal += 20;
            this.updateHealthBar();
            this.player.setPosition(this.spawnX, this.spawnY);
            this.player.setVelocity(0, 0);
            this.player.setTint(0xff0000);
            if (this.playerHealth <= 0) {
              this.scene.start('GameOverScene', { puntos: this.enviarPuntaje(0) });
              return;
            }
            break;
          }
        }
      }
    }

    // Zona de salida
    if (this.zonaSalidaRect) {
      const b = this.player.body, z = this.zonaSalidaRect;
      if (b.right > z.left && b.left < z.right && b.bottom > z.top && b.top < z.bottom) {
        this.scene.start('GameScene', { personaje: this.personajeSeleccionado });
        return;
      }
    }

    // Dash
    if (this.estadisticas.mecanicasMovilidad.nivel3 && Phaser.Input.Keyboard.JustDown(this.teclas.SHIFT)) {
      this.isDashing = true;
      const dir = this.player.flipX ? -1 : 1;
      this.player.setVelocityX(dir*800);
      this.player.body.setAllowGravity(false);
      this.player.setVelocityY(0);
      this.time.delayedCall(200, () => { this.isDashing=false; this.player.body.setAllowGravity(true); });
      return;
    }

    const moverIzq = this.teclas.IZQUIERDA.isDown || this.teclasFlechas.left.isDown;
    const moverDer = this.teclas.DERECHA.isDown   || this.teclasFlechas.right.isDown;
    const salto    = Phaser.Input.Keyboard.JustDown(this.teclas.ARRIBA) ||
                     Phaser.Input.Keyboard.JustDown(this.teclasFlechas.up);

    if      (moverIzq) { this.player.setVelocityX(-this.player.velocidadX); this.player.flipX=true;  }
    else if (moverDer) { this.player.setVelocityX( this.player.velocidadX); this.player.flipX=false; }
    else               { this.player.setVelocityX(0); }

    const enSuelo = this.player.body.onFloor() || this.player.body.touching.down;
    const enPared = this.player.body.blocked.left || this.player.body.blocked.right;
    if (enSuelo && this.player.body.velocity.y >= 0) this.player.jumpCount = 0;

    let maxSaltos = 2;
    if (this.estadisticas.mecanicasMovilidad.nivel2) maxSaltos = 3;
    if (salto) {
      if (this.player.jumpCount === 0) {
        this.player.setVelocityY(this.player.fuerzaSalto); this.player.jumpCount=1;
      } else if (this.estadisticas.mecanicasMovilidad.nivel1 && enPared) {
        this.player.setVelocityY(this.player.fuerzaSalto); this.player.jumpCount=1;
        const empuje = this.player.body.blocked.left ? 200 : -200;
        this.player.setVelocityX(empuje); this.player.flipX = this.player.body.blocked.left;
      } else if (this.player.jumpCount > 0 && this.player.jumpCount < maxSaltos) {
        this.player.setVelocityY(this.player.fuerzaDobleSalto); this.player.jumpCount++;
      }
    }

    if (!enSuelo) {
      if (this.estadisticas.mecanicasMovilidad.nivel1 && enPared && this.player.body.velocity.y>0) {
        this.player.anims.play(`${char}_wall-jump`, true);
      } else if (this.player.body.velocity.y < 0) {
        this.player.anims.play(this.player.jumpCount>=2 ? `${char}_double-jump` : `${char}_jump`, true);
      } else {
        this.player.anims.play(`${char}_fall`, true);
      }
    } else if (this.player.body.velocity.x !== 0) {
      this.player.anims.play(`${char}_walk`, true);
    } else {
      this.player.anims.play(`${char}_idle`, true);
    }
  }
}


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

    const titleText = this.add.text(240, 70, "Berry Bad Luck", { fontSize: '48px', fill: '#ffcc00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setDepth(20);
    const btnPlay = this.add.text(240, 150, 'JUGAR', { fontSize: '40px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnPlay.on('pointerdown', () => { this.scene.start('MenuSeleccion'); });
    const btnOptions = this.add.text(240, 220, 'OPCIONES', { fontSize: '32px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const btnClasificatoria = this.add.text(240, 270, 'CLASIFICATORIA', { fontSize: '28px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    [btnPlay, btnOptions, btnClasificatoria].forEach(btn => {
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
      titleText.setVisible(false); btnPlay.setVisible(false); btnOptions.setVisible(false); btnClasificatoria.setVisible(false);
      optionsContainer.setVisible(true);
    });
    btnBack.on('pointerdown', () => {
      if (esperandoTecla) return;
      optionsContainer.setVisible(false);
      titleText.setVisible(true); btnPlay.setVisible(true); btnOptions.setVisible(true); btnClasificatoria.setVisible(true);
    });

    // ==========================================================
    // PANTALLA DE CLASIFICATORIA (top 10 + posición personal)
    // Mismo patrón que optionsContainer: una capa que se muestra
    // encima del mismo fondo del menú, sin cambiar de escena.
    // ==========================================================
    // El overlay deja libre una franja arriba (y=0 a y≈40) para que
    // titleText ("Berry Bad Luck"), ya encogido y movido a y=18, siga visible.
    const clasifTitulo = this.add.text(240, 48, 'CLASIFICATORIA', { fontSize: '20px', fill: '#ffff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
    const clasifHeader = this.add.text(252, 70, 'PUESTO   NOMBRE          PUNTAJE', { fontSize: '13px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
    const clasifLoading = this.add.text(240, 170, 'Cargando...', { fontSize: '16px', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);

    // 10 líneas reutilizables para el top 10 (se les cambia el texto al cargar los datos).
    // El texto se corre 12px a la derecha (x=252) para dejarle espacio al avatar (x=185).
    const clasifFilas = [];
    const clasifAvatares = [];
    for (let i = 0; i < 10; i++) {
      const fila = this.add.text(252, 88 + i * 18, '', { fontSize: '13px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
      const avatarImg = this.add.image(185, 88 + i * 18, '__DEFAULT').setVisible(false).setDisplaySize(16, 16);
      clasifFilas.push(fila);
      clasifAvatares.push(avatarImg);
    }

    const clasifSeparador = this.add.text(240, 272, '··········································', { fontSize: '10px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);
    const clasifMiFila = this.add.text(252, 286, '', { fontSize: '13px', fill: '#ffcc00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
    const clasifMiAvatar = this.add.image(185, 286, '__DEFAULT').setVisible(false).setDisplaySize(16, 16);

    const btnBackClasif = this.add.text(240, 305, 'ATRÁS', { fontSize: '22px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const clasifContainer = this.add.container(0, 0, [
      clasifTitulo, clasifHeader, clasifLoading,
      ...clasifFilas, ...clasifAvatares, clasifSeparador, clasifMiFila, clasifMiAvatar, btnBackClasif
    ]);
    clasifContainer.setDepth(10).setVisible(false);

    // Formatea una fila de la tabla con columnas alineadas (estilo monoespaciado)
    const formatearFila = (puesto, nombre, puntos) => {
      const puestoTxt = `#${puesto}`.padEnd(8, ' ');
      const nombreTxt = (nombre.length > 12 ? nombre.slice(0, 12) : nombre).padEnd(15, ' ');
      return `${puestoTxt}${nombreTxt}${puntos}`;
    };

    // Carga dinámicamente las imágenes de avatar como texturas de Phaser.
    // Las URLs ya apuntan a nuestro propio backend (no a DiceBear
    // directamente), así que no hay restricciones de CORS al cargarlas.
    //
    // La clave de textura se deriva de la URL completa (no solo del
    // username): la URL incluye ?t=<timestamp real de MongoDB>, así que
    // si el jugador personaliza su avatar, la URL cambia y se carga una
    // textura nueva — en vez de reutilizar para siempre la primera
    // textura que Phaser cacheó con esa clave en la sesión actual.
    const mostrarAvatares = (entradas) => {
      const conClave = entradas.map((e) => ({ ...e, claveTextura: `avatar_${e.url}` }));
      const pendientes = conClave.filter(({ claveTextura }) => !this.textures.exists(claveTextura));

      if (pendientes.length > 0) {
        pendientes.forEach(({ claveTextura, url }) => {
          this.load.image(claveTextura, url);
        });
        this.load.once('complete', () => {
          conClave.forEach(({ claveTextura, imagen }) => {
            if (this.textures.exists(claveTextura)) {
              imagen.setTexture(claveTextura).setDisplaySize(16, 16).setVisible(true);
            }
          });
        });
        this.load.start();
      } else {
        conClave.forEach(({ claveTextura, imagen }) => {
          imagen.setTexture(claveTextura).setDisplaySize(16, 16).setVisible(true);
        });
      }
    };

    const cargarClasificatoria = async () => {
      clasifLoading.setVisible(true).setText('Cargando...');
      clasifFilas.forEach(f => f.setText(''));
      clasifAvatares.forEach(a => a.setVisible(false));
      clasifMiFila.setText('');
      clasifMiAvatar.setVisible(false);

      let top10 = [];
      try {
        const { data } = await api.get('/scores/leaderboard');
        top10 = data.leaderboard || [];

        if (top10.length === 0) {
          clasifLoading.setText('Aún no hay puntajes registrados.');
        } else {
          clasifLoading.setVisible(false);
          top10.forEach((entry, idx) => {
            clasifFilas[idx].setText(formatearFila(idx + 1, entry.username, entry.puntos));
          });
        }
      } catch (error) {
        console.error('No se pudo cargar el leaderboard:', error);
        clasifLoading.setText('No se pudo cargar la clasificatoria.');
      }

      // Fila de "tu posición": solo si hay sesión iniciada
      const usuarioActual = this.registry.get('usuarioActual');
      let miEntrada = null;

      if (!usuarioActual) {
        clasifMiFila.setText('Inicia sesión para ver tu posición').setFill('#aaaaaa');
      } else {
        try {
          const { data } = await api.get('/scores/me');
          if (data.posicion === null) {
            clasifMiFila.setText('Aún no tienes un puntaje registrado, juega una partida').setFill('#aaaaaa');
          } else {
            clasifMiFila.setText(formatearFila(data.posicion, data.username, data.puntos)).setFill('#ffcc00');
            miEntrada = { username: data.username };
          }
        } catch (error) {
          console.error('No se pudo cargar tu progreso:', error);
          clasifMiFila.setText('No se pudo cargar tu posición.').setFill('#aaaaaa');
        }
      }

      // Pide al backend, en una sola petición, las URLs de avatar de todos
      // los jugadores visibles en la tabla (top10 + el propio si aplica).
      const usernamesUnicos = [...new Set([
        ...top10.map((e) => e.username),
        ...(miEntrada ? [miEntrada.username] : [])
      ])];

      if (usernamesUnicos.length === 0) return;

      try {
        const { data } = await api.get(`/avatar/urls?usernames=${encodeURIComponent(usernamesUnicos.join(','))}`);

        const entradas = top10.map((entry, idx) => ({
          username: entry.username,
          url: data.avatars[entry.username],
          imagen: clasifAvatares[idx]
        }));

        if (miEntrada && data.avatars[miEntrada.username]) {
          entradas.push({ username: miEntrada.username, url: data.avatars[miEntrada.username], imagen: clasifMiAvatar });
        }

        mostrarAvatares(entradas.filter((e) => e.url));
      } catch (error) {
        console.error('No se pudieron cargar los avatares:', error);
      }
    };

    btnClasificatoria.on('pointerdown', () => {
      if (esperandoTecla) return;
      btnPlay.setVisible(false); btnOptions.setVisible(false); btnClasificatoria.setVisible(false);
      // El título se encoge y sube (escala, no fontSize: Phaser no anima fontSize directamente)
      this.tweens.add({ targets: titleText, scale: 0.45, y: 18, duration: 250, ease: 'Power1' });
      clasifContainer.setVisible(true);
      cargarClasificatoria();
    });

    btnBackClasif.on('pointerdown', () => {
      clasifContainer.setVisible(false);
      this.tweens.add({ targets: titleText, scale: 1, y: 70, duration: 250, ease: 'Power1' });
      btnPlay.setVisible(true); btnOptions.setVisible(true); btnClasificatoria.setVisible(true);
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
      
      btnJugar.on('pointerdown', () => { this.scene.start('NivelUnoScene', { personaje: char.id }); });

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

    // Sprites del jefe (Flying Demon) — frameWidth:81, frameHeight:71
    this.load.spritesheet('boss_idle',   'assets/animaciones/Boss/IDLE.png',   { frameWidth: 81, frameHeight: 71 });
    this.load.spritesheet('boss_flying', 'assets/animaciones/Boss/FLYING.png', { frameWidth: 81, frameHeight: 71 });
    this.load.spritesheet('boss_attack', 'assets/animaciones/Boss/ATTACK.png', { frameWidth: 81, frameHeight: 71 });
    this.load.spritesheet('boss_hurt',   'assets/animaciones/Boss/HURT.png',   { frameWidth: 81, frameHeight: 71 });
    this.load.spritesheet('boss_death',  'assets/animaciones/Boss/DEATH.png',  { frameWidth: 81, frameHeight: 71 });

    // CARGAMOS EL MAPA DEL COMPAÑERO
    this.load.image('tiles-terrain', 'assets/Terrain (16x16).png');
    this.load.image('tiles-lava', 'assets/MAGAMA.png'); 
    this.load.tilemapTiledJSON('mapa-jefe', 'assets/mapa_jefe/mapa_jefe.tmj');
  }

  create() {
    this.gestor = this.registry.get('gestorProgreso');
    this.estadisticas = this.gestor.obtenerEstadisticasDe(this.personajeSeleccionado);

    // Tracking para el sistema de puntaje (POST /api/scores al terminar la partida).
    // this.time.now es el reloj interno de Phaser: se congela automáticamente
    // cuando this.scene.pause() está activo (menú de pausa), a diferencia de
    // Date.now() que nunca se detiene.
    this.tiempoInicio = this.time.now;
    this.danoRecibidoTotal = 0;

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
            this.danoRecibidoTotal += 20;
            this.updateHealthBar();
            this.player.setTint(0xffa500);
            this.time.delayedCall(300, () => this.player.clearTint());
            if (this.playerHealth <= 0) {
                this.scene.start('GameOverScene', { puntos: this.enviarPuntaje(0) }); 
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
    // EL JEFE — Flying Demon (sprite animado)
    // ==========================================================

    // Animaciones del demonio
    if (!this.anims.exists('boss_idle'))   this.anims.create({ key: 'boss_idle',   frames: this.anims.generateFrameNumbers('boss_idle',   { start: 0, end: 3 }), frameRate: 8,  repeat: -1 });
    if (!this.anims.exists('boss_flying')) this.anims.create({ key: 'boss_flying', frames: this.anims.generateFrameNumbers('boss_flying', { start: 0, end: 3 }), frameRate: 8,  repeat: -1 });
    if (!this.anims.exists('boss_attack')) this.anims.create({ key: 'boss_attack', frames: this.anims.generateFrameNumbers('boss_attack', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    if (!this.anims.exists('boss_hurt'))   this.anims.create({ key: 'boss_hurt',   frames: this.anims.generateFrameNumbers('boss_hurt',   { start: 0, end: 3 }), frameRate: 10, repeat:  0 });
    if (!this.anims.exists('boss_death'))  this.anims.create({ key: 'boss_death',  frames: this.anims.generateFrameNumbers('boss_death',  { start: 0, end: 6 }), frameRate: 8,  repeat:  0 });

    this.boss = this.physics.add.sprite(240, 80, 'boss_idle');
    this.boss.setScale(1.5);                     // lo hacemos un poco más grande en pantalla
    this.boss.body.setAllowGravity(false);
    this.boss.setCollideWorldBounds(true);
    this.boss.setBounce(1);
    // Ajustamos hitbox al cuerpo real del demonio (el frame tiene bastante padding)
    this.boss.body.setSize(50, 55);
    this.boss.body.setOffset(15, 10);
    this.boss.anims.play('boss_flying');

    this.bossHealth  = 300;
    this.bossPhase   = 1;
    this.bossIsDying = false;   // flag para bloquear más daño durante la animación de muerte
    if(capaTerreno) this.physics.add.collider(this.boss, capaTerreno);

    // Movimiento aleatorio del jefe cada 2s
    this.time.addEvent({
      delay: 2000,
      callback: () => {
        if (this.boss.active && !this.bossIsDying) {
          const vx = Phaser.Math.Between(-150, 150);
          const vy = Phaser.Math.Between(-150, 150);
          this.boss.setVelocity(vx, vy);
          // Voltear sprite según dirección horizontal
          this.boss.flipX = vx < 0;
          // En fase 2 el jefe ataca mientras vuela
          if (this.bossPhase === 2) {
            this.boss.anims.play('boss_attack', true);
          } else {
            this.boss.anims.play('boss_flying', true);
          }
        }
      }, loop: true
    });

    this.bossBullets = this.physics.add.group({ defaultKey: 'balaTextura', maxSize: 80 });
    if(capaTerreno) this.physics.add.collider(this.bossBullets, capaTerreno, (b) => b.destroy());

    this.bossShootTimer = this.time.addEvent({
      delay: 150, 
      callback: () => {
        if (this.boss && this.boss.active && !this.bossIsDying) {
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
      this.danoRecibidoTotal += 10;
      this.updateHealthBar();
      player.setTint(0xff0000);
      this.time.delayedCall(200, () => player.clearTint());
      if (this.playerHealth <= 0) {
        this.scene.start('GameOverScene', { puntos: this.enviarPuntaje(0) }); 
      }
    });

    // DAÑO AL JEFE Y VICTORIA
    this.physics.add.overlap(this.boss, this.bullets, (boss, bullet) => {
      if (this.bossIsDying) return;   // ignorar balas durante la muerte
      bullet.destroy();
      this.bossHealth -= this.estadisticas.danoActual;

      // Animación de daño (hurt) — vuelve a flying cuando termina
      boss.anims.play('boss_hurt', true);
      boss.once('animationcomplete-boss_hurt', () => {
        if (!this.bossIsDying) boss.anims.play('boss_flying', true);
      });

      if (this.bossHealth <= 0) {
        // ---- Muerte del jefe ----
        this.bossIsDying = true;
        this.bossShootTimer.paused = true;
        boss.setVelocity(0, 0);
        boss.body.setAllowGravity(false);

        boss.anims.play('boss_death', true);
        boss.once('animationcomplete-boss_death', () => {
          boss.destroy();
          this.cameras.main.setBackgroundColor('#87CEEB');
          const expGanada = 150;
          this.estadisticas.ganarExperiencia(expGanada);
          this.gestor.guardarProgreso();
          this.scene.start('GameOverScene', { puntos: this.enviarPuntaje(1) });
        });
      }
    });

    // MENÚ DE PAUSA
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.pause(); 
      this.scene.launch('PauseScene', { sceneKey: 'GameScene' }); 
    });
  }

  // ==========================================================
  // ENVÍO DE PUNTAJE AL BACKEND (POST /api/scores)
  // ==========================================================
  // nivelAlcanzado es, por ahora, simbólico: 1 = venció al jefe, 0 = murió.
  // Cuando se implemente el nivel principal antes del jefe, este número
  // pasará a ser un contador real de pantallas superadas.
  // Solo se envía si hay un usuario logueado (user !== null); si juega
  // sin cuenta, el progreso simplemente no se guarda en el backend.
  enviarPuntaje(nivelAlcanzado) {
    const tiempoSegundos = Math.round((this.time.now - this.tiempoInicio) / 1000);
    const puntos = calcularPuntajeCliente({ nivelAlcanzado, tiempoSegundos, danoRecibido: this.danoRecibidoTotal });

    if (this.registry.get('usuarioActual')) {
      api.post('/scores', {
        nivelAlcanzado,
        tiempoSegundos,
        danoRecibido: this.danoRecibidoTotal
      }).catch((error) => {
        console.error('No se pudo guardar el puntaje:', error);
      });
    }

    return puntos;
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
// ESCENA 6: FIN DE LA PARTIDA (reemplaza los alert() de muerte y victoria)
// ==============================================================================
class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.puntos = data.puntos ?? 0;
    this.esVictoria = (data.puntos ?? 0) > 0;
  }

  crearTexturaCalavera() {
    const clave = 'calaveraPixel';
    if (this.textures.exists(clave)) return clave;
    const patron = [
      [0,0,0,0,1,1,1,1,1,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,2,2,1,1,1,1,1,2,2,1,1],
      [1,1,2,2,1,1,1,1,1,2,2,1,1],
      [1,1,1,1,1,2,1,2,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,2,1,2,1,2,1,2,1,2,1,0],
      [0,0,1,1,1,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,1,0,0,0]
    ];
    const cell = 6;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    patron.forEach((fila, y) => fila.forEach((v, x) => { if (v === 1) g.fillRect(x*cell, y*cell, cell, cell); }));
    g.generateTexture(clave, patron[0].length * cell, patron.length * cell);
    g.destroy();
    return clave;
  }

  create() {
    this.add.rectangle(240, 160, 480, 320, 0x000000, 0.92);

    if (this.esVictoria) {
      this.add.text(240, 50, '¡VICTORIA!', {
        fontSize: '34px', fill: '#ffcc00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5
      }).setOrigin(0.5);
      this.add.text(240, 120, '👹', { fontSize: '52px' }).setOrigin(0.5);
    } else {
      this.add.text(240, 50, 'FIN DE LA PARTIDA', {
        fontSize: '26px', fill: '#ff2222', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5
      }).setOrigin(0.5);
      this.add.image(240, 120, this.crearTexturaCalavera()).setScale(1.2);
    }

    this.add.text(240, 195, 'Puntuación:', {
      fontSize: '18px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(240, 222, `${this.puntos}`, {
      fontSize: '28px', fill: '#ffcc00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    const btnVolver = this.add.text(240, 272, 'Volver al menú', {
      fontSize: '22px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnVolver.on('pointerover', () => btnVolver.setScale(1.1));
    btnVolver.on('pointerout',  () => btnVolver.setScale(1));
    btnVolver.on('pointerdown', () => this.scene.start('MenuSeleccion'));
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
const CONTROLES_POR_DEFECTO = { ARRIBA: 'W', IZQUIERDA: 'A', ABAJO: 'S', DERECHA: 'D' };

// Escenas donde se muestra el botón de pantalla completa
const ESCENAS_CON_BOTON_FULLSCREEN = ['MenuScene', 'MenuSeleccion', 'MejorasScene', 'PauseScene', 'GameOverScene'];

export default function App() {
  const gameRef        = useRef(null);
  const gameInstanceRef = useRef(null);
  const gameScreenRef  = useRef(null);

  // Estados de autenticación
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [hoverAvatar, setHoverAvatar] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenBtn, setShowFullscreenBtn] = useState(true);
  const [controles, setControles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('controlesJuego')) || CONTROLES_POR_DEFECTO;
    } catch {
      return CONTROLES_POR_DEFECTO;
    }
  });
  const [avatarRefreshTrigger, setAvatarRefreshTrigger] = useState(0);
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
      scene: [MenuScene, MenuSeleccion, MejorasScene, NivelUnoScene, NivelDosScene, GameScene, PauseScene, GameOverScene] 
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

  // Pide al backend la URL del avatar del usuario actual, vía la misma
  // ruta /avatar/urls que usa el leaderboard. El backend incluye en la
  // URL el timestamp real de la última personalización guardada
  // (avatarConfig.actualizadoEn, en MongoDB), así que el cache del
  // navegador se invalida justo cuando cambia algo — sin importar si la
  // página se recargó entre medio, a diferencia de un contador en memoria.
  useEffect(() => {
    if (!user) return; // sin sesión no hay avatar que pedir; avatarUrl ya empieza en null

    let cancelado = false;

    api.get(`/avatar/urls?usernames=${encodeURIComponent(user.username)}`)
      .then((response) => {
        if (!cancelado) setAvatarUrl(response.data.avatars[user.username] || null);
      })
      .catch(() => {
        if (!cancelado) setAvatarUrl(null);
      });

    return () => { cancelado = true; };
  }, [user, avatarRefreshTrigger]);

  // Refleja el usuario actual dentro del registry de Phaser. GameScene lo
  // usa para decidir si manda el puntaje al backend (POST /api/scores) al
  // terminar la partida: si no hay sesión, el juego sigue siendo jugable
  // pero el progreso no se guarda en el servidor.
  useEffect(() => {
    const game = gameInstanceRef.current;
    if (!game) return;
    game.registry.set('usuarioActual', user);
  }, [user]);

  // Bloquea el teclado y el mouse del juego mientras cualquier modal
  // (login, registro, o el editor de avatar) esté abierto encima.
  useEffect(() => {
    const game = gameInstanceRef.current;
    if (!game) return;
    const modalAbierto = showLogin || showRegister || showAvatarEditor;

    if (modalAbierto) {
      game.input.enabled = false;
      if (game.input.keyboard) game.input.keyboard.enabled = false;
    } else {
      game.input.enabled = true;
      if (game.input.keyboard) game.input.keyboard.enabled = true;
    }
  }, [showLogin, showRegister, showAvatarEditor]);

  // Sondea cada 250ms qué escenas de Phaser están corriendo para mostrar/ocultar
  // el botón fullscreen, y mantiene el panel de controles sincronizado.
  useEffect(() => {
    const intervalo = setInterval(() => {
      const game = gameInstanceRef.current;
      if (!game) return;
      const escenasActivas = game.scene.getScenes(true).map((s) => s.scene.key);
      setShowFullscreenBtn(escenasActivas.some((key) => ESCENAS_CON_BOTON_FULLSCREEN.includes(key)));
      try {
        const guardados = JSON.parse(localStorage.getItem('controlesJuego'));
        if (guardados) setControles(guardados);
      } catch {
        // localStorage corrupto: se conserva el último valor válido
      }
    }, 250);
    return () => clearInterval(intervalo);
  }, []);

  // Sincroniza el ícono del botón con el estado real de pantalla completa
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameScreenRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

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
      {/* PANEL DE CONTROLES (fijo a la esquina superior izquierda) */}
      <div className="controls-sidebar">
        <h3 className="controls-title">Controles</h3>
        <ul className="controls-list">
          <li><span className="key">{controles.IZQUIERDA}</span><span className="key">{controles.DERECHA}</span> Moverse</li>
          <li><span className="key">{controles.ARRIBA}</span> Saltar</li>
          <li><span className="key">Clic</span> Disparar</li>
        </ul>
      </div>

      {/* INTERFAZ DE AUTENTICACIÓN LATERAL */}
      <div className="auth-sidebar">
        
        {/* Círculo Central/Avatar (Fijo a la derecha) */}
        <div
          className="menu-circle"
          onMouseEnter={() => user && setHoverAvatar(true)}
          onMouseLeave={() => setHoverAvatar(false)}
          onClick={() => user && setShowAvatarEditor(true)}
          style={user ? { cursor: 'pointer' } : undefined}
        >
          {user ? (
            avatarUrl ? (
              <img src={avatarUrl} alt={user.username} className="user-avatar-img" />
            ) : (
              <div className="user-initial">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )
          ) : (
            <svg className="avatar-silhouette" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z"/>
            </svg>
          )}

          {/* Overlay de "editar avatar": solo visible con sesión activa y mouse encima.
              Sin funcionalidad real todavía (se conectará al editor en un próximo avance). */}
          {user && hoverAvatar && (
            <div className="avatar-edit-overlay">
              <svg className="avatar-edit-pencil" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </div>
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
      <h2 style={{ marginTop: '20px' }}>Berry Bad Luck</h2>
      <div ref={gameScreenRef} className="game-screen-wrapper">
        <div ref={gameRef} className="game-canvas-container" style={{ border: '4px solid #333', borderRadius: '8px', overflow: 'hidden' }}></div>
        {showFullscreenBtn && (
          <button
            type="button"
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? '⤢' : '⛶'}
          </button>
        )}
      </div>
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

      {showAvatarEditor && user && (
        <AvatarEditor
          username={user.username}
          onClose={() => setShowAvatarEditor(false)}
          onSaved={() => {
            setAvatarRefreshTrigger((t) => t + 1);
            setShowAvatarEditor(false);
          }}
        />
      )}

    </div>
  );
}