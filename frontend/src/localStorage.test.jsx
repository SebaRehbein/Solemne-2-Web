import { describe, it, expect, beforeEach } from 'vitest';

describe('Pruebas de la API localStorage', () => {

    // Se ejecuta antes de CADA prueba para asegurar que el entorno esté limpio
    beforeEach(() => {
        localStorage.clear();
    });

    it('Debería guardar y recuperar un valor de texto simple', () => {
        // Act (Actuar)
        localStorage.setItem('testKey', 'testValue');
        const value = localStorage.getItem('testKey');

        // Assert (Afirmar)
        expect(value).toBe('testValue');
    });

    it('Debería devolver null al intentar obtener una clave que no existe', () => {
        const value = localStorage.getItem('claveInexistente');
        expect(value).toBeNull();
    });

    it('Debería eliminar un elemento específico usando removeItem', () => {
        // Arrange (Preparar)
        localStorage.setItem('key1', 'value1');
        localStorage.setItem('key2', 'value2');

        // Act (Actuar)
        localStorage.removeItem('key1');

        // Assert (Afirmar)
        expect(localStorage.getItem('key1')).toBeNull(); // Verificamos que se borró
        expect(localStorage.getItem('key2')).toBe('value2'); // Verificamos que lo demás sigue intacto
    });

    it('Debería limpiar todo el almacenamiento usando clear', () => {
        localStorage.setItem('itemA', '123');
        localStorage.setItem('itemB', '456');

        localStorage.clear();

        expect(localStorage.getItem('itemA')).toBeNull();
        expect(localStorage.getItem('itemB')).toBeNull();
        expect(localStorage.length).toBe(0);
    });

    it('Debería manejar correctamente objetos complejos (JSON)', () => {
        const testUser = { id: 1, name: 'Solemne', isStudent: true };
        
        // Guardar el objeto serializándolo a string
        localStorage.setItem('user', JSON.stringify(testUser));

        // Recuperar y parsear el string de vuelta a objeto
        const retrievedUser = JSON.parse(localStorage.getItem('user'));

        // Usamos toEqual en vez de toBe porque estamos comparando propiedades de objetos, no la referencia exacta en memoria
        expect(retrievedUser).toEqual(testUser); 
    });
});