'use client'

import { useState } from 'react'

type Subcategory = { name: string }
type Category = { name: string; subcategories?: Subcategory[] }
type Group = { name: string; categories: Category[] }

const menuData: Group[] = [
  {
    name: 'AUTOMOTRIZ',
    categories: [
      {
        name: 'Herramientas para motores',
        subcategories: [
          { name: 'Puestas a punto' },
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
          { name: 'Llaves de impacto' },
          { name: 'Llaves crique eléctricas' },
          { name: 'Atornilladores / Percutores / Taladros' },
          { name: 'Amoladoras' },
          { name: 'Minitorno / Amoladoras rectas' },
          { name: 'Herramientas multifunción' },
          { name: 'Compresores de aire' },
          { name: 'Cargadores de baterías' },
          { name: 'Soldadoras' },
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
          { name: 'Tubos por unidad' },
          { name: 'Puntas (Torx, Allen, Multi, Ribe)' },
          { name: 'Juegos de llaves' },
          { name: 'Llaves sueltas' },
          { name: 'Pinzas y alicates' },
          { name: 'Destornilladores' },
          { name: 'Mazas y martillos' },
          { name: 'Llaves crique' },
          { name: 'Palancas de fuerza' },
          { name: 'Extractores' },
          { name: 'Tubos especiales' },
          { name: 'Varios' },
        ],
      },
      {
        name: 'Herramientas de precisión y medición',
        subcategories: [
          { name: 'Para la mecánica' },
          { name: 'Para la construcción' },
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
          { name: 'Mechas' },
          { name: 'Cepillos para amoladora y taladro' },
        ],
      },
      { name: 'Artículos para el hogar y jardín' },
      { name: 'Herramientas para la construcción' },
      { name: 'Herramientas y accesorios universales' },
      { name: 'Termos y mates' },
    ],
  },
]

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [depth, setDepth] = useState(0)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  function openGroup(group: Group) {
    setSelectedGroup(group)
    setSelectedCategory(null)
    setDepth(1)
  }

  function openCategory(category: Category) {
    setSelectedCategory(category)
    setDepth(2)
  }

  function goBack() {
    if (depth === 2) {
      setSelectedCategory(null)
      setDepth(1)
    } else {
      setSelectedGroup(null)
      setDepth(0)
    }
  }

  function close() {
    setIsOpen(false)
    setDepth(0)
    setSelectedGroup(null)
    setSelectedCategory(null)
  }

  const headerTitle =
    depth === 0
      ? 'MENÚ'
      : depth === 1
        ? (selectedGroup?.name ?? '')
        : (selectedCategory?.name ?? '')

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-primary-container p-2 rounded-none"
        aria-label="Abrir menú"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={close}
      />

      <nav
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 h-full w-[min(390px,90vw)] bg-surface-container-lowest z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 px-4 h-14 bg-primary-container border-b-2 border-accent-red flex-shrink-0">
          <button
            onClick={depth > 0 ? goBack : close}
            className="text-on-primary flex-shrink-0"
            aria-label={depth > 0 ? 'Volver' : 'Cerrar menú'}
          >
            <span className="material-symbols-outlined">
              {depth > 0 ? 'arrow_back' : 'close'}
            </span>
          </button>
          <span className="font-black text-sm text-on-primary uppercase tracking-widest truncate">
            {headerTitle}
          </span>
        </div>

        {depth === 2 && selectedGroup && selectedCategory && (
          <div className="px-4 py-1.5 bg-surface-container border-b border-outline-variant flex-shrink-0">
            <span className="text-xs text-on-surface-variant uppercase tracking-wide">
              {selectedGroup.name} › {selectedCategory.name}
            </span>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">

          <div
            className={`absolute inset-0 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out bg-surface-container-lowest ${depth === 0 ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="sticky top-0 bg-surface-container-lowest px-4 py-3 border-b border-outline-variant z-10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  search
                </span>
                <input
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container text-sm text-on-surface rounded-search focus:outline-none focus:ring-2 focus:ring-accent-red border border-outline-variant"
                  placeholder="Buscá un producto..."
                  type="text"
                />
              </div>
            </div>
            {[
              { label: 'Inicio', icon: 'home' },
              { label: 'Nosotros', icon: 'info' },
              { label: 'Contacto', icon: 'mail' },
            ].map(({ label, icon }) => (
              <a
                key={label}
                href="#"
                className="flex items-center gap-3 px-4 py-4 border-b border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-colors duration-150"
              >
                <span className="material-symbols-outlined text-xl text-outline">{icon}</span>
                {label}
              </a>
            ))}
            <div className="px-4 py-2 bg-surface-container border-b border-outline-variant">
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                Categorías
              </span>
            </div>
            <ul>
              {menuData.map((group) => (
                <li key={group.name}>
                  <button
                    onClick={() => openGroup(group)}
                    className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-outline-variant hover:bg-surface-container active:bg-surface-container transition-colors duration-150"
                  >
                    <span className="font-bold text-sm uppercase text-on-surface tracking-wide">
                      {group.name}
                    </span>
                    <span className="material-symbols-outlined text-accent-red flex-shrink-0">
                      chevron_right
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`absolute inset-0 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out bg-surface-container-lowest ${depth < 1 ? 'translate-x-full' : depth === 1 ? 'translate-x-0' : '-translate-x-full'}`}
          >
            {selectedGroup && (
              <ul>
                <li>
                  <a
                    href="#"
                    className="flex items-center px-4 py-4 border-b-2 border-accent-red text-on-surface font-bold text-sm uppercase hover:bg-surface-container transition-colors duration-150"
                  >
                    Ver todo en {selectedGroup.name}
                  </a>
                </li>
                {selectedGroup.categories.map((cat) => (
                  <li key={cat.name}>
                    {cat.subcategories?.length ? (
                      <button
                        onClick={() => openCategory(cat)}
                        className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-outline-variant hover:bg-surface-container active:bg-surface-container transition-colors duration-150"
                      >
                        <span className="text-sm text-on-surface">{cat.name}</span>
                        <span className="material-symbols-outlined text-outline flex-shrink-0">
                          chevron_right
                        </span>
                      </button>
                    ) : (
                      <a
                        href="#"
                        className="flex items-center justify-between px-4 py-4 border-b border-outline-variant hover:bg-surface-container transition-colors duration-150"
                      >
                        <span className="text-sm text-on-surface">{cat.name}</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={`absolute inset-0 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out bg-surface-container-lowest ${depth === 2 ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {selectedCategory && (
              <ul>
                <li>
                  <a
                    href="#"
                    className="flex items-center px-4 py-4 border-b-2 border-accent-red text-on-surface font-bold text-sm uppercase hover:bg-surface-container transition-colors duration-150"
                  >
                    Ver todo en {selectedCategory.name}
                  </a>
                </li>
                {selectedCategory.subcategories?.map((sub) => (
                  <li key={sub.name}>
                    <a
                      href="#"
                      className="flex items-center px-4 py-4 border-b border-outline-variant text-sm text-on-surface hover:bg-surface-container transition-colors duration-150"
                    >
                      {sub.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </nav>
    </>
  )
}
