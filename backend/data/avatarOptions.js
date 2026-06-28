// Datos extraidos directamente de la definicion oficial de DiceBear
// (@dicebear/styles/pixel-art.json, v10.2.0). No estan inventados a mano:
// reflejan exactamente lo que la API de DiceBear acepta para pixel-art.

// Variantes disponibles por componente (param HTTP: {componente}Variant)
export const VARIANTES = {
    accessories: ['variant01', 'variant02', 'variant03', 'variant04'],
    beard: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08'],
    clothes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17', 'variant18', 'variant19', 'variant20', 'variant21', 'variant22', 'variant23'],
    eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12'],
    glasses: ['dark01', 'dark02', 'dark03', 'dark04', 'dark05', 'dark06', 'dark07', 'light01', 'light02', 'light03', 'light04', 'light05', 'light06', 'light07'],
    hair: ['long01', 'long02', 'long03', 'long04', 'long05', 'long06', 'long07', 'long08', 'long09', 'long10', 'long11', 'long12', 'long13', 'long14', 'long15', 'long16', 'long17', 'long18', 'long19', 'long20', 'long21', 'short01', 'short02', 'short03', 'short04', 'short05', 'short06', 'short07', 'short08', 'short09', 'short10', 'short11', 'short12', 'short13', 'short14', 'short15', 'short16', 'short17', 'short18', 'short19', 'short20', 'short21', 'short22', 'short23', 'short24'],
    hat: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10'],
    mouth: ['happy01', 'happy02', 'happy03', 'happy04', 'happy05', 'happy06', 'happy07', 'happy08', 'happy09', 'happy10', 'happy11', 'happy12', 'happy13', 'sad01', 'sad02', 'sad03', 'sad04', 'sad05', 'sad06', 'sad07', 'sad08', 'sad09', 'sad10'],
};

// Paletas de color por grupo (param HTTP: {grupo}Color). "hair" tambien
// se usa para el color de la barba (mismo grupo de color en DiceBear).
export const COLORES = {
    accessories: ['#daa520', '#ffd700', '#fafad2', '#d3d3d3', '#a9a9a9'],
    clothing: ['#5bc0de', '#428bca', '#03396c', '#88d8b0', '#44c585', '#00b159', '#ff6f69', '#d11141', '#ae0001', '#ffeead', '#ffd969', '#ffc425'],
    eyes: ['#76778b', '#697b94', '#647b90', '#5b7c8b', '#588387', '#876658'],
    glasses: ['#4b4b4b', '#323232', '#191919', '#43677d', '#5f705c', '#a04b5d'],
    hair: ['#cab188', '#603a14', '#83623b', '#a78961', '#611c17', '#603015', '#612616', '#28150a', '#009bbd', '#bd1700', '#91cb15'],
    hat: ['#2e1e05', '#2663a3', '#989789', '#3d8a6b', '#cc6192', '#614f8a', '#a62116'],
    mouth: ['#d29985', '#c98276', '#e35d6a', '#de0f0d'],
};