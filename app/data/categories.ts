export type Item = { name: string }
export type Subcategory = { name: string; items?: Item[] }
export type Category = { name: string; subcategories?: Subcategory[] }
export type Group = { name: string; categories: Category[] }

export const initialMenuData: Group[] = [
  {
    name: 'AUTOMOTRIZ',
    categories: [
      {
        name: 'Herramientas para motores',
        subcategories: [
          {
            name: 'Puestas a punto',
            items: [
              { name: 'Alfa Romeo' },
              { name: 'BMW-Audi' },
              { name: 'Chery-Nissan' },
              { name: 'Chevrolet' },
              { name: 'Fiat' },
              { name: 'Ford' },
              { name: 'Jeep-Mercedes Benz' },
              { name: 'Peugeot-Citroën' },
              { name: 'Renault' },
              { name: 'Volkswagen' },
            ],
          },
          { name: 'Llaves para tensores de distribución' },
          { name: 'Herramientas para tapas de cilindro' },
          { name: 'Instrumentos para medición y afinación' },
          { name: 'Varios' },
        ],
      },
      {
        name: 'Inyección electrónica',
        subcategories: [
          { name: 'Todos' },
          { name: 'Bancos de prueba y limpieza de inyectores' },
          { name: 'Batas de ultrasonido' },
          { name: 'Manómetro de presión combustible' },
          { name: 'Probadores - Generadores - Simuladores' },
          { name: 'Puntas lógicas' },
          { name: 'Varios' },
        ],
      },
      { name: 'Inyección diesel' },
      { name: 'Scanners y diagnóstico' },
      { name: 'Tren delantero y suspensión' },
      { name: 'Frenos y embragues' },
      {
        name: 'Chapa y pintura',
        subcategories: [
          { name: 'Martillos' },
          { name: 'Aguantadores' },
          { name: 'Sacabollos y accesorios' },
          { name: 'Palancas y barretas' },
          { name: 'Pistolas y sopletes para pintar' },
          { name: 'Lijadoras y pulidoras' },
          { name: 'Soldadoras' },
          { name: 'Tubos para gases y reguladores' },
          { name: 'Pistolas de calor' },
          { name: 'Pinzas de presión' },
          { name: 'Expansores' },
          { name: 'Compresores' },
          { name: 'Consumibles - Lijas y otros' },
        ],
      },
      { name: 'Lubricentro' },
      { name: 'Gomería' },
      { name: 'Herramientas para motos' },
      { name: 'Elevadores' },
    ],
  },
  {
    name: 'HERRAMIENTAS ELÉCTRICAS',
    categories: [
      {
        name: 'Máquinas y herramientas eléctricas',
        subcategories: [
          { name: 'Kits de herramientas' },
          {
            name: 'Llaves de impacto',
            items: [
              { name: 'Todas' },
              { name: 'A batería' },
              { name: 'Eléctricas 220V' },
              { name: 'Neumáticas' },
            ],
          },
          {
            name: 'Llaves crique eléctricas',
            items: [
              { name: 'Todas' },
              { name: 'A batería' },
              { name: 'Neumáticas' },
            ],
          },
          {
            name: 'Atornilladores / Percutores / Taladros',
            items: [
              { name: 'Todos' },
              { name: 'Atornilladores a batería' },
              { name: 'Taladros eléctricos 220V' },
              { name: 'Percutores encastre SDS' },
            ],
          },
          {
            name: 'Amoladoras',
            items: [
              { name: 'Todas' },
              { name: 'A batería' },
              { name: 'Eléctricas 220V' },
            ],
          },
          {
            name: 'Minitorno / Amoladoras rectas',
            items: [
              { name: 'Todas' },
              { name: 'Eléctrico 220V' },
              { name: 'Neumático' },
              { name: 'A batería' },
            ],
          },
          {
            name: 'Herramientas multifunción',
            items: [
              { name: 'Todas' },
              { name: 'A batería' },
              { name: 'Eléctricas 220V' },
            ],
          },
          { name: 'Compresores de aire' },
          { name: 'Cargadores de baterías' },
          {
            name: 'Soldadoras',
            items: [
              { name: 'Todas' },
              { name: 'MMA Inverter (electrodo)' },
              { name: 'MIG' },
              { name: 'TIG' },
              { name: 'TIG-MIG' },
              { name: 'Estaño y otros' },
              { name: 'Tubos de gases y consumibles' },
              { name: 'Accesorios para soldadores' },
            ],
          },
          { name: 'Lijadoras / Pulidoras' },
          { name: 'Hidrolavadoras' },
          { name: 'Sierras circulares' },
          { name: 'Caladoras y sierras sable' },
          { name: 'Equipos de pintura' },
          { name: 'Generadores y grupos electrógenos' },
          { name: 'Tornos' },
          { name: 'Otras máquinas y herramientas' },
        ],
      },
      { name: 'Herramientas neumáticas' },
      {
        name: 'Herramientas hidráulicas',
        subcategories: [
          { name: 'Todas' },
          { name: 'Criques' },
          { name: 'Prensas' },
          { name: 'Varios' },
        ],
      },
    ],
  },
  {
    name: 'HERRAMIENTAS DE MANO',
    categories: [
      {
        name: 'Herramientas de mano',
        subcategories: [
          { name: 'Cajas, kits de tubos y puntas' },
          {
            name: 'Tubos por unidad',
            items: [
              { name: 'Encastre 1/4 cortos' },
              { name: 'Encastre 1/4 largos' },
              { name: 'Encastre 1/4 Torx' },
              { name: 'Encastre 1/2 estriados' },
              { name: 'Encastre 1/2 hexagonal' },
              { name: 'Encastre 1/2 en pulgadas (SAE)' },
              { name: 'Encastre 1/2 largos' },
              { name: 'Encastre 1/2 Torx' },
              { name: 'Encastre 1/2 multiestría' },
              { name: 'Encastre 1/2 Allen' },
              { name: 'Encastre 1/2 alto impacto' },
              { name: 'Encastre 3/8' },
              { name: 'Encastre 3/4 estriados' },
              { name: 'Encastre 3/4 hexagonal' },
              { name: 'Sacabujías' },
              { name: 'Movimientos universales' },
              { name: 'Prolongaciones / Alargues' },
              { name: 'Adaptadores' },
            ],
          },
          {
            name: 'Puntas (Torx, Allen, Multi, Ribe)',
            items: [
              { name: 'Puntas Torx, Allen, Multi, Ribe' },
              { name: 'Puntas para atornillador' },
            ],
          },
          { name: 'Juegos de llaves' },
          {
            name: 'Llaves sueltas',
            items: [
              { name: 'Combinadas milimétricas' },
              { name: 'Combinadas en pulgadas (SAE)' },
              { name: 'Combinadas con crique' },
              { name: 'Llaves cortas' },
              { name: 'Llaves para Poly-V (planas largas)' },
              { name: 'Llaves "T" cortas' },
              { name: 'Llaves "T" largas' },
              { name: 'Llaves Allen' },
              { name: 'Llaves Torx' },
              { name: 'Llaves francesas' },
              { name: 'Llaves de caño (Stilson)' },
              { name: 'Llaves especiales' },
            ],
          },
          {
            name: 'Pinzas y alicates',
            items: [
              { name: 'Pinzas' },
              { name: 'Alicates' },
              { name: 'Picos de loro' },
              { name: 'Pinzas Seger' },
              { name: 'Pinzas especiales' },
            ],
          },
          {
            name: 'Destornilladores',
            items: [
              { name: 'Juegos de destornilladores' },
              { name: 'Destornilladores por unidad' },
              { name: 'Destornilladores especiales' },
            ],
          },
          {
            name: 'Mazas y martillos',
            items: [
              { name: 'Mazas y martillos' },
              { name: 'Martillos para chapistas' },
            ],
          },
          {
            name: 'Llaves crique',
            items: [
              { name: 'Encastre 1/4' },
              { name: 'Encastre 3/8' },
              { name: 'Encastre 1/2' },
              { name: 'Encastre 3/4' },
            ],
          },
          {
            name: 'Palancas de fuerza',
            items: [
              { name: 'Encastre 1/4' },
              { name: 'Encastre 3/8' },
              { name: 'Encastre 1/2' },
              { name: 'Encastre 3/4' },
              { name: 'Encastre 1"' },
            ],
          },
          { name: 'Extractores' },
          { name: 'Tubos especiales' },
          { name: 'Varios' },
        ],
      },
      {
        name: 'Herramientas de precisión y medición',
        subcategories: [
          {
            name: 'Para la mecánica',
            items: [
              { name: 'Sondas' },
              { name: 'Calibres' },
              { name: 'Telescopines' },
              { name: 'Micrómetros' },
              { name: 'Alesómetros' },
              { name: 'Goniómetros' },
              { name: 'Lámparas de puesta a punto' },
              { name: 'Medidores de temperatura' },
              { name: 'Multímetros-testers' },
              { name: 'Reglas de planitud' },
              { name: 'Pinzas amperométricas' },
            ],
          },
          {
            name: 'Para la construcción',
            items: [
              { name: 'Cintas métricas' },
              { name: 'Niveles laser' },
              { name: 'Medidor de distancia laser' },
              { name: 'Multímetros-testers' },
              { name: 'Emperímetros' },
              { name: 'Provadores de voltajes' },
              { name: 'Metros plegables' },
              { name: 'Escuadras' },
              { name: 'Reglas' },
              { name: 'Detectores de temperatura' },
              { name: 'Detector de materiales' },
            ],
          },
        ],
      },
      {
        name: 'Insertos',
        subcategories: [
          { name: 'Todos' },
          { name: 'Insertos en kit (con mecha y macho)' },
          { name: 'Insertos solo rosca (sin mecha y macho)' },
        ],
      },
    ],
  },
  {
    name: 'TALLER Y EQUIPAMIENTO',
    categories: [
      {
        name: 'Mobiliario para talleres',
        subcategories: [
          { name: 'Todos' },
          { name: 'Tableros' },
          { name: 'Bancos de trabajo' },
          { name: 'Cajoneras / Mesas rodantes' },
          { name: 'Organizadores - Armarios - Cajas - Alacenas' },
          { name: 'Iluminación' },
          { name: 'Recolectoras de líquidos y fluidos' },
          { name: 'Morsas' },
          { name: 'Caballetes' },
          { name: 'Otros' },
        ],
      },
      { name: 'Libros y softwares para taller' },
      { name: 'Detailing (estética vehicular)' },
    ],
  },
  {
    name: 'CONSUMIBLES',
    categories: [
      {
        name: 'Consumibles para la industria',
        subcategories: [
          { name: 'Formajuntas y pegamentos' },
          { name: 'Siliconas' },
          { name: 'Aerosoles lubricantes y otros' },
          { name: 'Grasas y aceites' },
          { name: 'Artículos para la limpieza' },
          { name: 'Guantes' },
          { name: 'Lijas' },
          { name: 'Discos de corte' },
          {
            name: 'Mechas',
            items: [
              { name: 'Juegos de mechas' },
              { name: 'Mechas individuales para acero' },
              { name: 'Mechas individuales para mampostería' },
              { name: 'Mechas individuales para madera' },
              { name: 'Mechas copa y adaptadores' },
              { name: 'Mechas escalonadas' },
            ],
          },
          {
            name: 'Cepillos para amoladora y taladro',
            items: [
              { name: 'Todos' },
              { name: 'Cepillos de mano' },
              { name: 'Cepillos para amoladoras' },
              { name: 'Cepillos para taladros' },
            ],
          },
        ],
      },
      { name: 'Artículos para el hogar y jardín' },
      { name: 'Herramientas para la construcción' },
      { name: 'Herramientas y accesorios universales' },
      { name: 'Termos y mates' },
    ],
  },
]
