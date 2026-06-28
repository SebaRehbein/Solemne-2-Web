import express from 'express';
import User from '../models/User.js';
import { verifyPlayer } from '../middlewares/authMiddleware.js';
import { VARIANTES, COLORES } from '../data/avatarOptions.js';

const router = express.Router();

const DICEBEAR_BASE_URL = 'https://api.dicebear.com/10.x/pixel-art/png';

// Mapea cada categoría que el editor del frontend muestra al param HTTP
// real que espera DiceBear, y a la paleta de color que le corresponde.
// "beard" usa la paleta "hair": en DiceBear la barba comparte color con
// el cabello, no tiene paleta propia.
// "opcional: true" marca las categorías que pueden "no llevarse" (barba,
// gafas, sombrero, accesorios): el editor les agrega un valor "none" al
// frente del carrusel, que se traduce en {categoria}Probability=0.
// "skin" no es un componente con variantes (no tiene partes intercambiables,
// es el color base del cuerpo/cara), así que no tiene variantParam.
const CATEGORIAS = {
    hair: { variantParam: 'hairVariant', colorParam: 'hairColor', colorGroup: 'hair' },
    clothes: { variantParam: 'clothesVariant', colorParam: 'clothingColor', colorGroup: 'clothing' },
    eyes: { variantParam: 'eyesVariant', colorParam: 'eyesColor', colorGroup: 'eyes' },
    mouth: { variantParam: 'mouthVariant', colorParam: 'mouthColor', colorGroup: 'mouth' },
    glasses: { variantParam: 'glassesVariant', colorParam: 'glassesColor', colorGroup: 'glasses', opcional: true },
    hat: { variantParam: 'hatVariant', colorParam: 'hatColor', colorGroup: 'hat', opcional: true },
    beard: { variantParam: 'beardVariant', colorParam: 'hairColor', colorGroup: 'hair', opcional: true },
    accessories: { variantParam: 'accessoriesVariant', colorParam: 'accessoriesColor', colorGroup: 'accessories', opcional: true },
    skin: { colorParam: 'skinColor', colorGroup: 'skin' }
};

// Construye la URL completa de DiceBear a partir de un username y,
// opcionalmente, una configuración de personalización guardada.
// Si avatarConfig es null o no tiene campos definidos, el resultado es
// idéntico al comportamiento original: solo seed = username (sin
// personalización), y DiceBear elige todo aleatoriamente según el seed.
const construirUrlDicebear = (username, avatarConfig) => {
    const seed = encodeURIComponent(avatarConfig?.seed || username);
    const params = new URLSearchParams({ seed, size: '128' });

    for (const [categoria, { variantParam, colorParam, opcional }] of Object.entries(CATEGORIAS)) {
        const variantValue = avatarConfig?.[categoria]?.variant;
        const colorValue = avatarConfig?.[categoria]?.color;

        if (variantParam) {
            const probParam = `${variantParam.replace('Variant', '')}Probability`;

            if (opcional && variantValue === 'none') {
                // El jugador eligió explícitamente "no llevar esta parte".
                params.set(probParam, '0');
            } else if (variantValue) {
                params.set(variantParam, variantValue);
                // Probabilidad 100%: si el jugador elige explícitamente una
                // variante, queremos que SIEMPRE aparezca, no que DiceBear
                // decida al azar si la incluye o no.
                params.set(probParam, '100');
            }
        }

        if (colorValue) {
            params.set(colorParam, colorValue);
        }
    }

    return `${DICEBEAR_BASE_URL}?${params.toString()}`;
};

// ==========================================
// GET /api/avatar/options
// Devuelve las categorías, variantes y colores disponibles para
// personalizar el avatar. Los valores vienen de data/avatarOptions.js,
// extraídos directamente de la definición oficial de DiceBear (no
// inventados), así que el frontend siempre construye el editor sobre
// datos reales sin tener que conocer la librería de DiceBear.
// Ruta pública: no depende de sesión, son solo opciones de diseño.
// ==========================================
router.get('/options', (req, res) => {
    const options = Object.entries(CATEGORIAS).reduce((acc, [categoria, { colorGroup, opcional, variantParam }]) => {
        acc[categoria] = {
            variants: variantParam ? (VARIANTES[categoria] || []) : null,
            colors: COLORES[colorGroup] || null,
            opcional: !!opcional
        };
        return acc;
    }, {});

    return res.status(200).json({ options });
});

// ==========================================
// PUT /api/avatar/config
// Guarda la personalización elegida por el jugador autenticado.
// Protegida con verifyPlayer: solo se puede editar el propio avatar.
// Espera: { seed, hair: {variant, color}, clothes: {...}, eyes: {...},
//           mouth: {...}, glasses: {...}, hat: {...}, beard: {...},
//           accessories: {...} } — cualquier campo omitido se guarda
// como null (DiceBear decide esa parte aleatoriamente según el seed).
// ==========================================
router.put('/config', verifyPlayer, async (req, res) => {
    try {
        const { seed, ...categorias } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'El usuario ya no existe en el sistema.' });
        }

        const nuevaConfig = { seed: seed || user.avatarConfig?.seed || null };

        for (const categoria of Object.keys(CATEGORIAS)) {
            const valor = categorias[categoria];
            nuevaConfig[categoria] = {
                variant: valor?.variant ?? null,
                color: valor?.color ?? null
            };
        }

        user.avatarConfig = nuevaConfig;
        await user.save();

        return res.status(200).json({ avatarConfig: user.avatarConfig });

    } catch (error) {
        console.error('Error crítico en PUT /api/avatar/config:', error);
        return res.status(500).json({ message: 'Error interno del servidor al guardar la personalización.' });
    }
});

// ==========================================
// GET /api/avatar/image/:username
// Descarga el PNG de DiceBear (API externa) y lo reenvía como propio.
// Si el usuario tiene una personalización guardada (avatarConfig), se
// usa esa configuración; si no, el avatar se genera solo a partir del
// username, igual que antes de que existiera el editor.
// El navegador (o Phaser) nunca habla directo con api.dicebear.com:
// siempre pide la imagen a nuestro propio backend (mismo origen, sin CORS).
// ==========================================
router.get('/image/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { preview } = req.query;

        // Modo vista previa: el editor manda la config que el jugador está
        // probando (sin guardar todavía) en el query string. Si no viene,
        // se usa la configuración guardada en MongoDB (comportamiento normal).
        let avatarConfig;
        if (preview) {
            try {
                avatarConfig = JSON.parse(preview);
            } catch {
                return res.status(400).json({ message: 'El parámetro preview no es JSON válido.' });
            }
        } else {
            const user = await User.findOne({ username }).select('avatarConfig');
            avatarConfig = user?.avatarConfig;
        }

        const dicebearUrl = construirUrlDicebear(username, avatarConfig);

        const respuestaExterna = await fetch(dicebearUrl);

        if (!respuestaExterna.ok) {
            return res.status(502).json({ message: 'No se pudo obtener el avatar desde el servicio externo.' });
        }

        const imagenBuffer = Buffer.from(await respuestaExterna.arrayBuffer());

        res.set('Content-Type', 'image/png');
        // Las vistas previas no se cachean (cambian en cada edición); el
        // avatar "real" guardado sí, por 5 minutos.
        res.set('Cache-Control', preview ? 'no-store' : 'public, max-age=300');
        return res.status(200).send(imagenBuffer);

    } catch (error) {
        console.error('Error crítico en GET /api/avatar/image/:username:', error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener el avatar.' });
    }
});

// ==========================================
// GET /api/avatar/urls?usernames=a,b,c
// Devuelve, para cada username, la URL (de nuestro propio backend) que
// el frontend debe usar como src de <img> o como textura en Phaser.
// Ruta pública: no expone datos sensibles, solo construye URLs.
// ==========================================
router.get('/urls', (req, res) => {
    const { usernames } = req.query;

    if (!usernames) {
        return res.status(400).json({ message: 'Falta el parámetro usernames.' });
    }

    const lista = usernames.split(',').filter(Boolean);

    if (lista.length === 0) {
        return res.status(400).json({ message: 'usernames no puede estar vacío.' });
    }

    const avatars = lista.reduce((acc, username) => {
        // URL absoluta: Phaser (this.load.image) resuelve URLs relativas
        // contra el origen del frontend, no del backend, así que aquí
        // construimos la ruta completa apuntando a nuestro propio servidor.
        const host = `${req.protocol}://${req.get('host')}`;
        acc[username] = `${host}/api/avatar/image/${encodeURIComponent(username)}`;
        return acc;
    }, {});

    return res.status(200).json({ avatars });
});

export default router;