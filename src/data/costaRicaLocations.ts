// Datos geográficos de Costa Rica
export interface Distrito {
  id: string;
  nombre: string;
}

export interface Canton {
  id: string;
  nombre: string;
  distritos: Distrito[];
}

export interface Provincia {
  id: string;
  nombre: string;
  cantones: Canton[];
}

export const costaRicaLocations: Provincia[] = [
  {
    id: "1",
    nombre: "San José",
    cantones: [
      {
        id: "1-1",
        nombre: "San José",
        distritos: [
          { id: "1-1-1", nombre: "Carmen" },
          { id: "1-1-2", nombre: "Merced" },
          { id: "1-1-3", nombre: "Hospital" },
          { id: "1-1-4", nombre: "Catedral" },
          { id: "1-1-5", nombre: "Zapote" },
          { id: "1-1-6", nombre: "San Francisco de Dos Ríos" },
          { id: "1-1-7", nombre: "Uruca" },
          { id: "1-1-8", nombre: "Mata Redonda" },
          { id: "1-1-9", nombre: "Pavas" },
          { id: "1-1-10", nombre: "Hatillo" },
          { id: "1-1-11", nombre: "San Sebastián" },
          { id: "1-1-12", nombre: "Paso Ancho" },
          { id: "1-1-13", nombre: "Jardines" },
          { id: "1-1-14", nombre: "Sabana" }
        ]
      },
      {
        id: "1-2",
        nombre: "Escazú",
        distritos: [
          { id: "1-2-1", nombre: "Escazú" },
          { id: "1-2-2", nombre: "San Antonio" },
          { id: "1-2-3", nombre: "San Rafael" },
          { id: "1-2-4", nombre: "Bebedero" },
          { id: "1-2-5", nombre: "San Miguel" },
          { id: "1-2-6", nombre: "Guachipelín" }
        ]
      },
      {
        id: "1-3",
        nombre: "Desamparados",
        distritos: [
          { id: "1-3-1", nombre: "Desamparados" },
          { id: "1-3-2", nombre: "San Miguel" },
          { id: "1-3-3", nombre: "San Juan de Dios" },
          { id: "1-3-4", nombre: "San Rafael Arriba" },
          { id: "1-3-5", nombre: "San Antonio" },
          { id: "1-3-6", nombre: "Frailes" },
          { id: "1-3-7", nombre: "Patarrá" },
          { id: "1-3-8", nombre: "San Cristóbal" },
          { id: "1-3-9", nombre: "Rosario" },
          { id: "1-3-10", nombre: "Damas" },
          { id: "1-3-11", nombre: "San Rafael Abajo" },
          { id: "1-3-12", nombre: "Gravilias" },
          { id: "1-3-13", nombre: "Los Guido" }
        ]
      },
      {
        id: "1-4",
        nombre: "Puriscal",
        distritos: [
          { id: "1-4-1", nombre: "Santiago" },
          { id: "1-4-2", nombre: "Mercedes Sur" },
          { id: "1-4-3", nombre: "Barbacoas" },
          { id: "1-4-4", nombre: "Grifo Alto" },
          { id: "1-4-5", nombre: "San Rafael" },
          { id: "1-4-6", nombre: "Candelarita" },
          { id: "1-4-7", nombre: "Desamparaditos" },
          { id: "1-4-8", nombre: "San Antonio" },
          { id: "1-4-9", nombre: "Chires" },
          { id: "1-4-10", nombre: "San Gabriel" },
          { id: "1-4-11", nombre: "Turrubares" }
        ]
      },
      {
        id: "1-5",
        nombre: "Tarrazú",
        distritos: [
          { id: "1-5-1", nombre: "San Marcos" },
          { id: "1-5-2", nombre: "San Lorenzo" },
          { id: "1-5-3", nombre: "San Carlos" }
        ]
      },
      {
        id: "1-6",
        nombre: "Aserrí",
        distritos: [
          { id: "1-6-1", nombre: "Aserrí" },
          { id: "1-6-2", nombre: "Tarbaca" },
          { id: "1-6-3", nombre: "Vuelta de Jorco" },
          { id: "1-6-4", nombre: "San Gabriel" },
          { id: "1-6-5", nombre: "Legua" },
          { id: "1-6-6", nombre: "Monterrey" },
          { id: "1-6-7", nombre: "Salitrillos" },
          { id: "1-6-8", nombre: "Salitral" }
        ]
      },
      {
        id: "1-7",
        nombre: "Mora",
        distritos: [
          { id: "1-7-1", nombre: "Colón" },
          { id: "1-7-2", nombre: "Guayabo" },
          { id: "1-7-3", nombre: "Tabarcia" },
          { id: "1-7-4", nombre: "Piedras Negras" },
          { id: "1-7-5", nombre: "Picagres" },
          { id: "1-7-6", nombre: "Jaris" },
          { id: "1-7-7", nombre: "Quitirrisí" }
        ]
      },
      {
        id: "1-8",
        nombre: "Goicoechea",
        distritos: [
          { id: "1-8-1", nombre: "Guadalupe" },
          { id: "1-8-2", nombre: "San Francisco" },
          { id: "1-8-3", nombre: "Calle Blancos" },
          { id: "1-8-4", nombre: "Mata de Plátano" },
          { id: "1-8-5", nombre: "Ipís" },
          { id: "1-8-6", nombre: "Rancho Redondo" },
          { id: "1-8-7", nombre: "Purral" },
          { id: "1-8-8", nombre: "San Isidro" }
        ]
      },
      {
        id: "1-9",
        nombre: "Santa Ana",
        distritos: [
          { id: "1-9-1", nombre: "Santa Ana" },
          { id: "1-9-2", nombre: "Salitral" },
          { id: "1-9-3", nombre: "Pozos" },
          { id: "1-9-4", nombre: "Uruca" },
          { id: "1-9-5", nombre: "Piedades" },
          { id: "1-9-6", nombre: "Brasil" },
          { id: "1-9-7", nombre: "San Isidro" }
        ]
      },
      {
        id: "1-10",
        nombre: "Alajuelita",
        distritos: [
          { id: "1-10-1", nombre: "Alajuelita" },
          { id: "1-10-2", nombre: "San Josecito" },
          { id: "1-10-3", nombre: "San Antonio" },
          { id: "1-10-4", nombre: "Concepción" },
          { id: "1-10-5", nombre: "San Felipe" }
        ]
      },
      {
        id: "1-11",
        nombre: "Vázquez de Coronado",
        distritos: [
          { id: "1-11-1", nombre: "San Isidro" },
          { id: "1-11-2", nombre: "San Rafael" },
          { id: "1-11-3", nombre: "Dulce Nombre de Jesús" },
          { id: "1-11-4", nombre: "Patalillo" },
          { id: "1-11-5", nombre: "Cascajal" },
          { id: "1-11-6", nombre: "Jesús" }
        ]
      },
      {
        id: "1-12",
        nombre: "Acosta",
        distritos: [
          { id: "1-12-1", nombre: "San Ignacio" },
          { id: "1-12-2", nombre: "Guaitil" },
          { id: "1-12-3", nombre: "Palmichal" },
          { id: "1-12-4", nombre: "Cangrejal" },
          { id: "1-12-5", nombre: "Sabanillas" },
          { id: "1-12-6", nombre: "San Andrés" }
        ]
      },
      {
        id: "1-13",
        nombre: "Tibás",
        distritos: [
          { id: "1-13-1", nombre: "San Juan" },
          { id: "1-13-2", nombre: "Cinco Esquinas" },
          { id: "1-13-3", nombre: "Anselmo Llorente" },
          { id: "1-13-4", nombre: "León XIII" },
          { id: "1-13-5", nombre: "Colima" }
        ]
      },
      {
        id: "1-14",
        nombre: "Moravia",
        distritos: [
          { id: "1-14-1", nombre: "San Vicente" },
          { id: "1-14-2", nombre: "San Jerónimo" },
          { id: "1-14-3", nombre: "La Trinidad" }
        ]
      },
      {
        id: "1-15",
        nombre: "Montes de Oca",
        distritos: [
          { id: "1-15-1", nombre: "San Pedro" },
          { id: "1-15-2", nombre: "Sabanilla" },
          { id: "1-15-3", nombre: "Mercedes" },
          { id: "1-15-4", nombre: "San Rafael" }
        ]
      },
      {
        id: "1-16",
        nombre: "Turrubares",
        distritos: [
          { id: "1-16-1", nombre: "San Pablo" },
          { id: "1-16-2", nombre: "San Pedro" },
          { id: "1-16-3", nombre: "San Juan de Mata" },
          { id: "1-16-4", nombre: "San Luis" },
          { id: "1-16-5", nombre: "Carara" }
        ]
      },
      {
        id: "1-17",
        nombre: "Dota",
        distritos: [
          { id: "1-17-1", nombre: "Santa María" },
          { id: "1-17-2", nombre: "Jardín" },
          { id: "1-17-3", nombre: "Copey" }
        ]
      },
      {
        id: "1-18",
        nombre: "Curridabat",
        distritos: [
          { id: "1-18-1", nombre: "Curridabat" },
          { id: "1-18-2", nombre: "Granadilla" },
          { id: "1-18-3", nombre: "Sánchez" },
          { id: "1-18-4", nombre: "Tirrases" },
          { id: "1-18-5", nombre: "La Colina" }
        ]
      },
      {
        id: "1-19",
        nombre: "Pérez Zeledón",
        distritos: [
          { id: "1-19-1", nombre: "San Isidro de El General" },
          { id: "1-19-2", nombre: "El General" },
          { id: "1-19-3", nombre: "Daniel Flores" },
          { id: "1-19-4", nombre: "Rivas" },
          { id: "1-19-5", nombre: "San Pedro" },
          { id: "1-19-6", nombre: "Platanares" },
          { id: "1-19-7", nombre: "Pejibaye" },
          { id: "1-19-8", nombre: "Cajón" },
          { id: "1-19-9", nombre: "Barú" },
          { id: "1-19-10", nombre: "Río Nuevo" },
          { id: "1-19-11", nombre: "Páramo" },
          { id: "1-19-12", nombre: "La Amistad" },
          { id: "1-19-13", nombre: "San Martín" },
          { id: "1-19-14", nombre: "Chirripó" },
          { id: "1-19-15", nombre: "La Amistad Caribe" }
        ]
      },
      {
        id: "1-20",
        nombre: "León Cortés Castro",
        distritos: [
          { id: "1-20-1", nombre: "San Pablo" },
          { id: "1-20-2", nombre: "San Andrés" },
          { id: "1-20-3", nombre: "Llano Bonito" },
          { id: "1-20-4", nombre: "San Isidro" },
          { id: "1-20-5", nombre: "Santa Cruz" },
          { id: "1-20-6", nombre: "San Antonio" }
        ]
      }
    ]
  },
  {
    id: "2",
    nombre: "Alajuela",
    cantones: [
      {
        id: "2-1",
        nombre: "Alajuela",
        distritos: [
          { id: "2-1-1", nombre: "Alajuela" },
          { id: "2-1-2", nombre: "San José" },
          { id: "2-1-3", nombre: "Carrizal" },
          { id: "2-1-4", nombre: "San Antonio" },
          { id: "2-1-5", nombre: "Guácima" },
          { id: "2-1-6", nombre: "San Isidro" },
          { id: "2-1-7", nombre: "Sabanilla" },
          { id: "2-1-8", nombre: "San Rafael" },
          { id: "2-1-9", nombre: "Río Segundo" },
          { id: "2-1-10", nombre: "Desamparados" },
          { id: "2-1-11", nombre: "Turrúcares" },
          { id: "2-1-12", nombre: "Tambor" },
          { id: "2-1-13", nombre: "Garita" },
          { id: "2-1-14", nombre: "La Guácima" },
          { id: "2-1-15", nombre: "San Rafael Abajo" }
        ]
      },
      {
        id: "2-2",
        nombre: "San Ramón",
        distritos: [
          { id: "2-2-1", nombre: "San Ramón" },
          { id: "2-2-2", nombre: "Santiago" },
          { id: "2-2-3", nombre: "San Juan" },
          { id: "2-2-4", nombre: "Piedades Norte" },
          { id: "2-2-5", nombre: "Piedades Sur" },
          { id: "2-2-6", nombre: "San Rafael" },
          { id: "2-2-7", nombre: "San Isidro" },
          { id: "2-2-8", nombre: "Ángeles" },
          { id: "2-2-9", nombre: "Alfaro" },
          { id: "2-2-10", nombre: "Volio" },
          { id: "2-2-11", nombre: "Concepción" },
          { id: "2-2-12", nombre: "Zapotal" },
          { id: "2-2-13", nombre: "Peñas Blancas" },
          { id: "2-2-14", nombre: "San Lorenzo" },
          { id: "2-2-15", nombre: "Balsa" }
        ]
      },
      {
        id: "2-3",
        nombre: "Grecia",
        distritos: [
          { id: "2-3-1", nombre: "Grecia" },
          { id: "2-3-2", nombre: "San Isidro" },
          { id: "2-3-3", nombre: "San José" },
          { id: "2-3-4", nombre: "San Roque" },
          { id: "2-3-5", nombre: "Tacares" },
          { id: "2-3-6", nombre: "Río Cuarto" },
          { id: "2-3-7", nombre: "Puente de Piedra" },
          { id: "2-3-8", nombre: "Bolívar" },
          { id: "2-3-9", nombre: "Rincón de Salas" },
          { id: "2-3-10", nombre: "San Roque Norte" }
        ]
      },
      {
        id: "2-4",
        nombre: "San Mateo",
        distritos: [
          { id: "2-4-1", nombre: "San Mateo" },
          { id: "2-4-2", nombre: "Desmonte" },
          { id: "2-4-3", nombre: "Jesús María" },
          { id: "2-4-4", nombre: "Labrador" }
        ]
      },
      {
        id: "2-5",
        nombre: "Atenas",
        distritos: [
          { id: "2-5-1", nombre: "Atenas" },
          { id: "2-5-2", nombre: "Jesús" },
          { id: "2-5-3", nombre: "Mercedes" },
          { id: "2-5-4", nombre: "San Isidro" },
          { id: "2-5-5", nombre: "Concepción" },
          { id: "2-5-6", nombre: "San José" },
          { id: "2-5-7", nombre: "Santa Eulalia" },
          { id: "2-5-8", nombre: "Escobal" },
          { id: "2-5-9", nombre: "Río Grande" }
        ]
      },
      {
        id: "2-6",
        nombre: "Naranjo",
        distritos: [
          { id: "2-6-1", nombre: "Naranjo" },
          { id: "2-6-2", nombre: "San Miguel" },
          { id: "2-6-3", nombre: "San José" },
          { id: "2-6-4", nombre: "Cirrí Sur" },
          { id: "2-6-5", nombre: "San Jerónimo" },
          { id: "2-6-6", nombre: "San Juan" },
          { id: "2-6-7", nombre: "El Rosario" },
          { id: "2-6-8", nombre: "Palmitos" }
        ]
      },
      {
        id: "2-7",
        nombre: "Palmares",
        distritos: [
          { id: "2-7-1", nombre: "Palmares" },
          { id: "2-7-2", nombre: "Zaragoza" },
          { id: "2-7-3", nombre: "Buenos Aires" },
          { id: "2-7-4", nombre: "Santiago" },
          { id: "2-7-5", nombre: "Candelaria" },
          { id: "2-7-6", nombre: "Esquipulas" },
          { id: "2-7-7", nombre: "La Granja" },
          { id: "2-7-8", nombre: "La Trinidad" }
        ]
      },
      {
        id: "2-8",
        nombre: "Poás",
        distritos: [
          { id: "2-8-1", nombre: "San Pedro" },
          { id: "2-8-2", nombre: "San Juan" },
          { id: "2-8-3", nombre: "San Rafael" },
          { id: "2-8-4", nombre: "Carrillos" },
          { id: "2-8-5", nombre: "Sabana Redonda" }
        ]
      },
      {
        id: "2-9",
        nombre: "Orotina",
        distritos: [
          { id: "2-9-1", nombre: "Orotina" },
          { id: "2-9-2", nombre: "El Mastate" },
          { id: "2-9-3", nombre: "Hacienda Vieja" },
          { id: "2-9-4", nombre: "Coyolar" },
          { id: "2-9-5", nombre: "La Ceiba" },
          { id: "2-9-6", nombre: "Cerritos" },
          { id: "2-9-7", nombre: "Mastate" }
        ]
      },
      {
        id: "2-10",
        nombre: "San Carlos",
        distritos: [
          { id: "2-10-1", nombre: "Quesada" },
          { id: "2-10-2", nombre: "Florencia" },
          { id: "2-10-3", nombre: "Buenavista" },
          { id: "2-10-4", nombre: "Aguas Zarcas" },
          { id: "2-10-5", nombre: "Venecia" },
          { id: "2-10-6", nombre: "Pital" },
          { id: "2-10-7", nombre: "La Fortuna" },
          { id: "2-10-8", nombre: "La Tigra" },
          { id: "2-10-9", nombre: "La Palmera" },
          { id: "2-10-10", nombre: "Venado" },
          { id: "2-10-11", nombre: "Cutris" },
          { id: "2-10-12", nombre: "Monterrey" },
          { id: "2-10-13", nombre: "Pocosol" },
          { id: "2-10-14", nombre: "Palmera" }
        ]
      },
      {
        id: "2-11",
        nombre: "Zarcero",
        distritos: [
          { id: "2-11-1", nombre: "Zarcero" },
          { id: "2-11-2", nombre: "Laguna" },
          { id: "2-11-3", nombre: "Tapesco" },
          { id: "2-11-4", nombre: "Guadalupe" },
          { id: "2-11-5", nombre: "Palmira" },
          { id: "2-11-6", nombre: "Zapote" },
          { id: "2-11-7", nombre: "Brisas" },
          { id: "2-11-8", nombre: "Volio" }
        ]
      },
      {
        id: "2-12",
        nombre: "Sarchí",
        distritos: [
          { id: "2-12-1", nombre: "Sarchí Norte" },
          { id: "2-12-2", nombre: "Sarchí Sur" },
          { id: "2-12-3", nombre: "Toro Amarillo" },
          { id: "2-12-4", nombre: "San Pedro" },
          { id: "2-12-5", nombre: "Rodríguez" },
          { id: "2-12-6", nombre: "San Martín" }
        ]
      },
      {
        id: "2-13",
        nombre: "Upala",
        distritos: [
          { id: "2-13-1", nombre: "Upala" },
          { id: "2-13-2", nombre: "Aguas Claras" },
          { id: "2-13-3", nombre: "San José" },
          { id: "2-13-4", nombre: "Bijagua" },
          { id: "2-13-5", nombre: "Delicias" },
          { id: "2-13-6", nombre: "Dos Ríos" },
          { id: "2-13-7", nombre: "Yolillal" },
          { id: "2-13-8", nombre: "Canalete" }
        ]
      },
      {
        id: "2-14",
        nombre: "Los Chiles",
        distritos: [
          { id: "2-14-1", nombre: "Los Chiles" },
          { id: "2-14-2", nombre: "Caño Negro" },
          { id: "2-14-3", nombre: "El Amparo" },
          { id: "2-14-4", nombre: "San Jorge" },
          { id: "2-14-5", nombre: "San Antonio" }
        ]
      },
      {
        id: "2-15",
        nombre: "Guatuso",
        distritos: [
          { id: "2-15-1", nombre: "San Rafael" },
          { id: "2-15-2", nombre: "Buenavista" },
          { id: "2-15-3", nombre: "Cote" },
          { id: "2-15-4", nombre: "Katira" }
        ]
      },
      {
        id: "2-16",
        nombre: "Río Cuarto",
        distritos: [
          { id: "2-16-1", nombre: "Río Cuarto" },
          { id: "2-16-2", nombre: "Santa Rita" },
          { id: "2-16-3", nombre: "Santa Isabel" }
        ]
      }
    ]
  },
  {
    id: "3",
    nombre: "Cartago",
    cantones: [
      {
        id: "3-1",
        nombre: "Cartago",
        distritos: [
          { id: "3-1-1", nombre: "Oriental" },
          { id: "3-1-2", nombre: "Occidental" },
          { id: "3-1-3", nombre: "Carmen" },
          { id: "3-1-4", nombre: "San Nicolás" },
          { id: "3-1-5", nombre: "Aguacaliente o San Francisco" },
          { id: "3-1-6", nombre: "Guadalupe" },
          { id: "3-1-7", nombre: "Corralillo" },
          { id: "3-1-8", nombre: "Tierra Blanca" },
          { id: "3-1-9", nombre: "Dulce Nombre" },
          { id: "3-1-10", nombre: "Llano Grande" },
          { id: "3-1-11", nombre: "Quebradilla" },
          { id: "3-1-12", nombre: "San Isidro" },
          { id: "3-1-13", nombre: "Tobosi" }
        ]
      },
      {
        id: "3-2",
        nombre: "Paraíso",
        distritos: [
          { id: "3-2-1", nombre: "Paraíso" },
          { id: "3-2-2", nombre: "Santiago" },
          { id: "3-2-3", nombre: "Orosi" },
          { id: "3-2-4", nombre: "Cachí" },
          { id: "3-2-5", nombre: "Llanos de Santa Lucía" },
          { id: "3-2-6", nombre: "Birris" }
        ]
      },
      {
        id: "3-3",
        nombre: "La Unión",
        distritos: [
          { id: "3-3-1", nombre: "Tres Ríos" },
          { id: "3-3-2", nombre: "San Diego" },
          { id: "3-3-3", nombre: "San Juan" },
          { id: "3-3-4", nombre: "San Rafael" },
          { id: "3-3-5", nombre: "Concepción" },
          { id: "3-3-6", nombre: "Dulce Nombre" },
          { id: "3-3-7", nombre: "San Ramón" },
          { id: "3-3-8", nombre: "Río Azul" }
        ]
      },
      {
        id: "3-4",
        nombre: "Jiménez",
        distritos: [
          { id: "3-4-1", nombre: "Juan Viñas" },
          { id: "3-4-2", nombre: "Tucurrique" },
          { id: "3-4-3", nombre: "Pejibaye" },
          { id: "3-4-4", nombre: "La Isabel" }
        ]
      },
      {
        id: "3-5",
        nombre: "Turrialba",
        distritos: [
          { id: "3-5-1", nombre: "Turrialba" },
          { id: "3-5-2", nombre: "La Suiza" },
          { id: "3-5-3", nombre: "Peralta" },
          { id: "3-5-4", nombre: "Santa Cruz" },
          { id: "3-5-5", nombre: "Santa Teresita" },
          { id: "3-5-6", nombre: "Pavones" },
          { id: "3-5-7", nombre: "Tuis" },
          { id: "3-5-8", nombre: "Tayutic" },
          { id: "3-5-9", nombre: "Santa Rosa" },
          { id: "3-5-10", nombre: "Tres Equis" },
          { id: "3-5-11", nombre: "Chirripó" }
        ]
      },
      {
        id: "3-6",
        nombre: "Alvarado",
        distritos: [
          { id: "3-6-1", nombre: "Pacayas" },
          { id: "3-6-2", nombre: "Cervantes" },
          { id: "3-6-3", nombre: "Capellades" }
        ]
      },
      {
        id: "3-7",
        nombre: "Oreamuno",
        distritos: [
          { id: "3-7-1", nombre: "San Rafael" },
          { id: "3-7-2", nombre: "Cot" },
          { id: "3-7-3", nombre: "Potrero Cerrado" },
          { id: "3-7-4", nombre: "Cipreses" },
          { id: "3-7-5", nombre: "Santa Rosa" },
          { id: "3-7-6", nombre: "Santa Gertrudis" }
        ]
      },
      {
        id: "3-8",
        nombre: "El Guarco",
        distritos: [
          { id: "3-8-1", nombre: "El Tejar" },
          { id: "3-8-2", nombre: "San Isidro" },
          { id: "3-8-3", nombre: "Tobosi" },
          { id: "3-8-4", nombre: "Patio de Agua" }
        ]
      }
    ]
  },
  {
    id: "4",
    nombre: "Heredia",
    cantones: [
      {
        id: "4-1",
        nombre: "Heredia",
        distritos: [
          { id: "4-1-1", nombre: "Heredia" },
          { id: "4-1-2", nombre: "Mercedes" },
          { id: "4-1-3", nombre: "San Francisco" },
          { id: "4-1-4", nombre: "Ulloa" },
          { id: "4-1-5", nombre: "Varablanca" }
        ]
      },
      {
        id: "4-2",
        nombre: "Barva",
        distritos: [
          { id: "4-2-1", nombre: "Barva" },
          { id: "4-2-2", nombre: "San Pedro" },
          { id: "4-2-3", nombre: "San Pablo" },
          { id: "4-2-4", nombre: "San Roque" },
          { id: "4-2-5", nombre: "Santa Lucía" },
          { id: "4-2-6", nombre: "San José de la Montaña" },
          { id: "4-2-7", nombre: "Los Ángeles" }
        ]
      },
      {
        id: "4-3",
        nombre: "Santo Domingo",
        distritos: [
          { id: "4-3-1", nombre: "Santo Domingo" },
          { id: "4-3-2", nombre: "San Vicente" },
          { id: "4-3-3", nombre: "San Miguel" },
          { id: "4-3-4", nombre: "Paracito" },
          { id: "4-3-5", nombre: "Santo Tomás" },
          { id: "4-3-6", nombre: "Santa Rosa" },
          { id: "4-3-7", nombre: "Tures" },
          { id: "4-3-8", nombre: "Pará" }
        ]
      },
      {
        id: "4-4",
        nombre: "Santa Bárbara",
        distritos: [
          { id: "4-4-1", nombre: "Santa Bárbara" },
          { id: "4-4-2", nombre: "San Pedro" },
          { id: "4-4-3", nombre: "San Juan" },
          { id: "4-4-4", nombre: "Jesús" },
          { id: "4-4-5", nombre: "Santo Domingo" },
          { id: "4-4-6", nombre: "Purabá" }
        ]
      },
      {
        id: "4-5",
        nombre: "San Rafael",
        distritos: [
          { id: "4-5-1", nombre: "San Rafael" },
          { id: "4-5-2", nombre: "San Josecito" },
          { id: "4-5-3", nombre: "Santiago" },
          { id: "4-5-4", nombre: "Ángeles" },
          { id: "4-5-5", nombre: "Concepción" }
        ]
      },
      {
        id: "4-6",
        nombre: "San Isidro",
        distritos: [
          { id: "4-6-1", nombre: "San Isidro" },
          { id: "4-6-2", nombre: "San José" },
          { id: "4-6-3", nombre: "Concepción" },
          { id: "4-6-4", nombre: "San Francisco" }
        ]
      },
      {
        id: "4-7",
        nombre: "Belén",
        distritos: [
          { id: "4-7-1", nombre: "San Antonio" },
          { id: "4-7-2", nombre: "La Ribera" },
          { id: "4-7-3", nombre: "La Asunción" }
        ]
      },
      {
        id: "4-8",
        nombre: "Flores",
        distritos: [
          { id: "4-8-1", nombre: "San Joaquín" },
          { id: "4-8-2", nombre: "Barrantes" },
          { id: "4-8-3", nombre: "Llorente" }
        ]
      },
      {
        id: "4-9",
        nombre: "San Pablo",
        distritos: [
          { id: "4-9-1", nombre: "San Pablo" },
          { id: "4-9-2", nombre: "Rincón de Sabanilla" }
        ]
      },
      {
        id: "4-10",
        nombre: "Sarapiquí",
        distritos: [
          { id: "4-10-1", nombre: "Puerto Viejo" },
          { id: "4-10-2", nombre: "La Virgen" },
          { id: "4-10-3", nombre: "Las Horquetas" },
          { id: "4-10-4", nombre: "Llanuras del Gaspar" },
          { id: "4-10-5", nombre: "Cureña" }
        ]
      }
    ]
  },
  {
    id: "5",
    nombre: "Guanacaste",
    cantones: [
      {
        id: "5-1",
        nombre: "Liberia",
        distritos: [
          { id: "5-1-1", nombre: "Liberia" },
          { id: "5-1-2", nombre: "Cañas Dulces" },
          { id: "5-1-3", nombre: "Mayorga" },
          { id: "5-1-4", nombre: "Nacascolo" }
        ]
      },
      {
        id: "5-2",
        nombre: "Nicoya",
        distritos: [
          { id: "5-2-1", nombre: "Nicoya" },
          { id: "5-2-2", nombre: "Mansión" },
          { id: "5-2-3", nombre: "San Antonio" },
          { id: "5-2-4", nombre: "Quebrada Honda" },
          { id: "5-2-5", nombre: "Sámara" },
          { id: "5-2-6", nombre: "Nosara" },
          { id: "5-2-7", nombre: "Belén de Nosarita" }
        ]
      },
      {
        id: "5-3",
        nombre: "Santa Cruz",
        distritos: [
          { id: "5-3-1", nombre: "Santa Cruz" },
          { id: "5-3-2", nombre: "Bolsón" },
          { id: "5-3-3", nombre: "Veintisiete de Abril" },
          { id: "5-3-4", nombre: "Tempate" },
          { id: "5-3-5", nombre: "Cartagena" },
          { id: "5-3-6", nombre: "Cuajiniquil" },
          { id: "5-3-7", nombre: "Diriá" },
          { id: "5-3-8", nombre: "Cabo Velas" },
          { id: "5-3-9", nombre: "Tamarindo" }
        ]
      },
      {
        id: "5-4",
        nombre: "Bagaces",
        distritos: [
          { id: "5-4-1", nombre: "Bagaces" },
          { id: "5-4-2", nombre: "La Fortuna" },
          { id: "5-4-3", nombre: "Mogote" },
          { id: "5-4-4", nombre: "Río Naranjo" },
          { id: "5-4-5", nombre: "Las Salinas" }
        ]
      },
      {
        id: "5-5",
        nombre: "Carrillo",
        distritos: [
          { id: "5-5-1", nombre: "Filadelfia" },
          { id: "5-5-2", nombre: "Palmira" },
          { id: "5-5-3", nombre: "Sardinal" },
          { id: "5-5-4", nombre: "Belén" },
          { id: "5-5-5", nombre: "Artola" }
        ]
      },
      {
        id: "5-6",
        nombre: "Cañas",
        distritos: [
          { id: "5-6-1", nombre: "Cañas" },
          { id: "5-6-2", nombre: "Palmira" },
          { id: "5-6-3", nombre: "San Miguel" },
          { id: "5-6-4", nombre: "Bebedero" },
          { id: "5-6-5", nombre: "Porozal" },
          { id: "5-6-6", nombre: "Las Palmas" }
        ]
      },
      {
        id: "5-7",
        nombre: "Abangares",
        distritos: [
          { id: "5-7-1", nombre: "Las Juntas" },
          { id: "5-7-2", nombre: "Sierra" },
          { id: "5-7-3", nombre: "San Juan" },
          { id: "5-7-4", nombre: "Colorado" },
          { id: "5-7-5", nombre: "San Jorge" }
        ]
      },
      {
        id: "5-8",
        nombre: "Tilarán",
        distritos: [
          { id: "5-8-1", nombre: "Tilarán" },
          { id: "5-8-2", nombre: "Quebrada Grande" },
          { id: "5-8-3", nombre: "Tronadora" },
          { id: "5-8-4", nombre: "Santa Rosa" },
          { id: "5-8-5", nombre: "Líbano" },
          { id: "5-8-6", nombre: "Tierras Morenas" },
          { id: "5-8-7", nombre: "Arenal" }
        ]
      },
      {
        id: "5-9",
        nombre: "Nandayure",
        distritos: [
          { id: "5-9-1", nombre: "Carmona" },
          { id: "5-9-2", nombre: "Santa Rita" },
          { id: "5-9-3", nombre: "Zapotal" },
          { id: "5-9-4", nombre: "San Pablo" },
          { id: "5-9-5", nombre: "Porvenir" },
          { id: "5-9-6", nombre: "Bejuco" }
        ]
      },
      {
        id: "5-10",
        nombre: "La Cruz",
        distritos: [
          { id: "5-10-1", nombre: "La Cruz" },
          { id: "5-10-2", nombre: "Santa Cecilia" },
          { id: "5-10-3", nombre: "La Garita" },
          { id: "5-10-4", nombre: "Santa Elena" }
        ]
      },
      {
        id: "5-11",
        nombre: "Hojancha",
        distritos: [
          { id: "5-11-1", nombre: "Hojancha" },
          { id: "5-11-2", nombre: "Monte Romo" },
          { id: "5-11-3", nombre: "Puerto Carrillo" },
          { id: "5-11-4", nombre: "Huacas" },
          { id: "5-11-5", nombre: "Matambú" }
        ]
      }
    ]
  },
  {
    id: "6",
    nombre: "Puntarenas",
    cantones: [
      {
        id: "6-1",
        nombre: "Puntarenas",
        distritos: [
          { id: "6-1-1", nombre: "Puntarenas" },
          { id: "6-1-2", nombre: "Pitahaya" },
          { id: "6-1-3", nombre: "Chomes" },
          { id: "6-1-4", nombre: "Lepanto" },
          { id: "6-1-5", nombre: "Paquera" },
          { id: "6-1-6", nombre: "Manzanillo" },
          { id: "6-1-7", nombre: "Guacimal" },
          { id: "6-1-8", nombre: "Barranca" },
          { id: "6-1-9", nombre: "Monte Verde" },
          { id: "6-1-10", nombre: "Isla del Coco" },
          { id: "6-1-11", nombre: "Cóbano" },
          { id: "6-1-12", nombre: "Chacarita" },
          { id: "6-1-13", nombre: "Chira" },
          { id: "6-1-14", nombre: "Acapulco" },
          { id: "6-1-15", nombre: "El Roble" },
          { id: "6-1-16", nombre: "Arancibia" }
        ]
      },
      {
        id: "6-2",
        nombre: "Esparza",
        distritos: [
          { id: "6-2-1", nombre: "Espíritu Santo" },
          { id: "6-2-2", nombre: "San Juan Grande" },
          { id: "6-2-3", nombre: "Macacona" },
          { id: "6-2-4", nombre: "San Rafael" },
          { id: "6-2-5", nombre: "San Jerónimo" }
        ]
      },
      {
        id: "6-3",
        nombre: "Buenos Aires",
        distritos: [
          { id: "6-3-1", nombre: "Buenos Aires" },
          { id: "6-3-2", nombre: "Volcán" },
          { id: "6-3-3", nombre: "Potrero Grande" },
          { id: "6-3-4", nombre: "Boruca" },
          { id: "6-3-5", nombre: "Pilas" },
          { id: "6-3-6", nombre: "Colinas" },
          { id: "6-3-7", nombre: "Chánguena" },
          { id: "6-3-8", nombre: "Biolley" },
          { id: "6-3-9", nombre: "Brunka" },
          { id: "6-3-10", nombre: "Cérrere" }
        ]
      },
      {
        id: "6-4",
        nombre: "Montes de Oro",
        distritos: [
          { id: "6-4-1", nombre: "Miramar" },
          { id: "6-4-2", nombre: "La Unión" },
          { id: "6-4-3", nombre: "San Isidro" },
          { id: "6-4-4", nombre: "Jardín" }
        ]
      },
      {
        id: "6-5",
        nombre: "Osa",
        distritos: [
          { id: "6-5-1", nombre: "Puerto Cortés" },
          { id: "6-5-2", nombre: "Palmar" },
          { id: "6-5-3", nombre: "Sierpe" },
          { id: "6-5-4", nombre: "Bahía Ballena" },
          { id: "6-5-5", nombre: "Piedras Blancas" },
          { id: "6-5-6", nombre: "Bahía Drake" },
          { id: "6-5-7", nombre: "Bahía Uvita" }
        ]
      },
      {
        id: "6-6",
        nombre: "Quepos",
        distritos: [
          { id: "6-6-1", nombre: "Quepos" },
          { id: "6-6-2", nombre: "Savegre" },
          { id: "6-6-3", nombre: "Naranjito" }
        ]
      },
      {
        id: "6-7",
        nombre: "Golfito",
        distritos: [
          { id: "6-7-1", nombre: "Golfito" },
          { id: "6-7-2", nombre: "Puerto Jiménez" },
          { id: "6-7-3", nombre: "Guaycará" },
          { id: "6-7-4", nombre: "Pavón" }
        ]
      },
      {
        id: "6-8",
        nombre: "Coto Brus",
        distritos: [
          { id: "6-8-1", nombre: "San Vito" },
          { id: "6-8-2", nombre: "Sabalito" },
          { id: "6-8-3", nombre: "Aguabuena" },
          { id: "6-8-4", nombre: "Limoncito" },
          { id: "6-8-5", nombre: "Pittier" },
          { id: "6-8-6", nombre: "Gutiérrez Braun" }
        ]
      },
      {
        id: "6-9",
        nombre: "Parrita",
        distritos: [
          { id: "6-9-1", nombre: "Parrita" }
        ]
      },
      {
        id: "6-10",
        nombre: "Corredores",
        distritos: [
          { id: "6-10-1", nombre: "Corredor" },
          { id: "6-10-2", nombre: "La Cuesta" },
          { id: "6-10-3", nombre: "Canoas" },
          { id: "6-10-4", nombre: "Laurel" }
        ]
      },
      {
        id: "6-11",
        nombre: "Garabito",
        distritos: [
          { id: "6-11-1", nombre: "Jacó" },
          { id: "6-11-2", nombre: "Tárcoles" }
        ]
      }
    ]
  },
  {
    id: "7",
    nombre: "Limón",
    cantones: [
      {
        id: "7-1",
        nombre: "Limón",
        distritos: [
          { id: "7-1-1", nombre: "Limón" },
          { id: "7-1-2", nombre: "Valle La Estrella" },
          { id: "7-1-3", nombre: "Río Blanco" },
          { id: "7-1-4", nombre: "Matama" },
          { id: "7-1-5", nombre: "Juárez" }
        ]
      },
      {
        id: "7-2",
        nombre: "Pococí",
        distritos: [
          { id: "7-2-1", nombre: "Guápiles" },
          { id: "7-2-2", nombre: "Jiménez" },
          { id: "7-2-3", nombre: "Rita" },
          { id: "7-2-4", nombre: "Roxana" },
          { id: "7-2-5", nombre: "Cariari" },
          { id: "7-2-6", nombre: "Colorado" },
          { id: "7-2-7", nombre: "La Colonia" }
        ]
      },
      {
        id: "7-3",
        nombre: "Siquirres",
        distritos: [
          { id: "7-3-1", nombre: "Siquirres" },
          { id: "7-3-2", nombre: "Pacuarito" },
          { id: "7-3-3", nombre: "Florida" },
          { id: "7-3-4", nombre: "Germania" },
          { id: "7-3-5", nombre: "Cairo" },
          { id: "7-3-6", nombre: "Alegría" }
        ]
      },
      {
        id: "7-4",
        nombre: "Talamanca",
        distritos: [
          { id: "7-4-1", nombre: "Bratsi" },
          { id: "7-4-2", nombre: "Sixaola" },
          { id: "7-4-3", nombre: "Cahuita" },
          { id: "7-4-4", nombre: "Telire" }
        ]
      },
      {
        id: "7-5",
        nombre: "Matina",
        distritos: [
          { id: "7-5-1", nombre: "Matina" },
          { id: "7-5-2", nombre: "Batán" },
          { id: "7-5-3", nombre: "Carrandi" }
        ]
      },
      {
        id: "7-6",
        nombre: "Guácimo",
        distritos: [
          { id: "7-6-1", nombre: "Guácimo" },
          { id: "7-6-2", nombre: "Mercedes" },
          { id: "7-6-3", nombre: "Pocora" },
          { id: "7-6-4", nombre: "Río Jiménez" },
          { id: "7-6-5", nombre: "Duacarí" }
        ]
      }
    ]
  }
];
