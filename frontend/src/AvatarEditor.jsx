import { useEffect, useState } from 'react';
import api from './api/axios';

// Genera un seed aleatorio corto para el botón "🎲 Aleatorio".
// No usa el username: permite variantes distintas sin cambiar de cuenta.
const generarSeedAleatorio = () => Math.random().toString(36).slice(2, 10);

const NOMBRES_CATEGORIA = {
    hair: 'Cabello',
    clothes: 'Ropa',
    eyes: 'Ojos',
    mouth: 'Boca',
    glasses: 'Gafas',
    hat: 'Sombrero',
    beard: 'Barba',
    accessories: 'Accesorios',
    skin: 'Tono de piel'
};

// Convierte un valor crudo de DiceBear (ej. "long05", "happy12") en un
// texto legible para el carrusel (ej. "Long 05", "Happy 12"). Solo es
// presentación: el valor que se guarda y se manda a la API sigue siendo
// el crudo. "none" es un valor especial nuestro ("no llevar esta parte"),
// no algo que venga de DiceBear.
const formatearNombreVariante = (valor) => {
    if (valor === 'none') return 'Ninguno';
    const match = valor.match(/^([a-z]+)(\d+)$/i);
    if (!match) return valor;
    const [, base, numero] = match;
    return `${base.charAt(0).toUpperCase()}${base.slice(1)} ${numero}`;
};

// Estado vacío para una categoría: "sin elegir nada" = DiceBear decide
// aleatoriamente según el seed, igual que antes de personalizar.
const CATEGORIA_VACIA = { variant: null, color: null };

const construirConfigInicial = () => ({
    seed: null,
    hair: { ...CATEGORIA_VACIA },
    clothes: { ...CATEGORIA_VACIA },
    eyes: { ...CATEGORIA_VACIA },
    mouth: { ...CATEGORIA_VACIA },
    glasses: { ...CATEGORIA_VACIA },
    hat: { ...CATEGORIA_VACIA },
    beard: { ...CATEGORIA_VACIA },
    accessories: { ...CATEGORIA_VACIA },
    skin: { ...CATEGORIA_VACIA }
});

export default function AvatarEditor({ username, onClose, onSaved }) {
    const [opciones, setOpciones] = useState(null);
    const [config, setConfig] = useState(construirConfigInicial);
    const [loadingOpciones, setLoadingOpciones] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Carga las categorías/variantes/colores disponibles desde el backend.
    // Vienen de la definición real de DiceBear, no hardcodeadas en React.
    useEffect(() => {
        api.get('/avatar/options')
            .then((res) => setOpciones(res.data.options))
            .catch(() => setError('No se pudieron cargar las opciones de personalización.'))
            .finally(() => setLoadingOpciones(false));
    }, []);

    // La vista previa se recalcula sola: cada cambio en `config` cambia la
    // URL (vía query string), y el navegador vuelve a pedir la imagen.
    const previewUrl = `http://localhost:3000/api/avatar/image/${encodeURIComponent(username)}?preview=${encodeURIComponent(JSON.stringify(config))}`;

    // Avanza/retrocede la variante seleccionada dentro de la lista de esa
    // categoría. Para categorías opcionales (barba, gafas, sombrero,
    // accesorios), "none" se agrega al frente: significa "no llevar esta
    // parte", a diferencia de null ("Aleatorio": DiceBear decide).
    const moverVariante = (categoria, direccion) => {
        const base = opciones?.[categoria]?.variants;
        if (!base || base.length === 0) return; // categorías sin variantes (p.ej. skin)

        const esOpcional = opciones[categoria].opcional;
        const lista = esOpcional ? ['none', ...base] : base;

        const actual = config[categoria].variant;
        const indiceActual = actual ? lista.indexOf(actual) : -1;
        let nuevoIndice = indiceActual + direccion;

        if (nuevoIndice < 0) nuevoIndice = lista.length - 1;
        if (nuevoIndice >= lista.length) nuevoIndice = 0;

        setConfig((prev) => ({
            ...prev,
            [categoria]: { ...prev[categoria], variant: lista[nuevoIndice] }
        }));
    };

    const elegirColor = (categoria, color) => {
        setConfig((prev) => ({
            ...prev,
            [categoria]: { ...prev[categoria], color: prev[categoria].color === color ? null : color }
        }));
    };

    const handleAleatorio = () => {
        setConfig((prev) => ({ ...prev, seed: generarSeedAleatorio() }));
    };

    const handleGuardar = async () => {
        setSaving(true);
        setError('');
        try {
            const { data } = await api.put('/avatar/config', config);
            onSaved(data.avatarConfig);
        } catch {
            setError('No se pudo guardar la personalización. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="avatar-editor-modal">
                <h2>Personalizar avatar</h2>

                {/* Zona fija: el avatar y el botón aleatorio siempre quedan
                    visibles, sin importar cuánto se haga scroll abajo. */}
                <div className="avatar-editor-fixed">
                    <div className="avatar-editor-preview">
                        <img src={previewUrl} alt="Vista previa del avatar" />
                    </div>

                    <button type="button" className="avatar-random-btn" onClick={handleAleatorio}>
                        🎲 Aleatorio
                    </button>

                    {error && <p className="error-msg">{error}</p>}
                </div>

                {/* Zona con scroll propio: la lista de categorías */}
                <div className="avatar-editor-scrollable">
                    {loadingOpciones && <p>Cargando opciones...</p>}

                    {opciones && Object.entries(opciones).map(([categoria, { variants, colors }]) => {
                        const valorActual = config[categoria].variant;
                        const colorActual = config[categoria].color;
                        return (
                            <div key={categoria} className="avatar-editor-category">
                                <p className="avatar-editor-category-label">{NOMBRES_CATEGORIA[categoria] || categoria}</p>

                                {variants && variants.length > 0 && (
                                    <div className="avatar-carousel">
                                        <button type="button" className="avatar-carousel-arrow" onClick={() => moverVariante(categoria, -1)}>‹</button>
                                        <span className="avatar-carousel-value">
                                            {valorActual ? formatearNombreVariante(valorActual) : 'Aleatorio'}
                                        </span>
                                        <button type="button" className="avatar-carousel-arrow" onClick={() => moverVariante(categoria, 1)}>›</button>
                                    </div>
                                )}

                                {colors && (
                                    <div className="avatar-editor-swatches">
                                        {colors.map((color) => (
                                            <button
                                                type="button"
                                                key={color}
                                                className={`avatar-swatch avatar-swatch-color ${colorActual === color ? 'avatar-swatch-selected' : ''}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => elegirColor(categoria, color)}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="modal-actions">
                    <button type="button" className="submit-btn" onClick={handleGuardar} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" className="close-btn" onClick={onClose}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}
