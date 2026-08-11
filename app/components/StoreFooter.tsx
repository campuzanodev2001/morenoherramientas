import Link from 'next/link'
import FooterCategories from './FooterCategories'
import {
  business,
  socials,
  resolved,
  whatsappUrl,
  addressLine,
  CONSUMER_DEFENSE_URL,
} from '@/lib/store/business'

/**
 * Footer del storefront. Server Component: el único pedazo cliente es
 * `FooterCategories`, que lee el contexto de categorías.
 *
 * Además de navegación, cumple obligaciones legales de venta online en
 * Argentina, y por eso NO se puede recortar sin mirar qué se saca:
 *
 * - Botón de arrepentimiento (Res. 424/2020 SCI): tiene que estar visible y
 *   accesible desde la home. Va destacado, no escondido entre los links.
 * - Link a Defensa de las y los Consumidores (Res. 1033/2021 SCI).
 * - Razón social, CUIT y domicilio del titular (Ley 24.240, art. 4).
 * - Data Fiscal de ARCA (ex AFIP), formulario 960/D.
 *
 * Los datos del negocio salen de `lib/store/business.ts`. Los que todavía son
 * placeholders NO se renderizan (`resolved()` devuelve null): es preferible un
 * hueco a publicar un CUIT inventado.
 */

const helpLinks = [
  { href: '/como-comprar', label: 'Cómo comprar' },
  { href: '/envios', label: 'Envíos y entregas' },
  { href: '/devoluciones', label: 'Cambios y devoluciones' },
  { href: '/contacto', label: 'Contacto' },
  { href: '/cuenta/ordenes', label: 'Seguir mi pedido' },
]

const legalLinks = [
  { href: '/terminos', label: 'Términos y condiciones' },
  { href: '/privacidad', label: 'Política de privacidad' },
]

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-black uppercase tracking-widest text-on-primary mb-4">{children}</h3>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-on-primary/70 hover:text-on-primary transition-colors"
      >
        {label}
      </Link>
    </li>
  )
}

export default function StoreFooter() {
  const wa = whatsappUrl('Hola, necesito asesoramiento sobre una herramienta.')
  const email = resolved(business.email)
  const phone = resolved(business.phone)
  const address = addressLine()
  const hours = resolved(business.hours)
  const legalName = resolved(business.legalName)
  const cuit = resolved(business.cuit)
  const dataFiscal = resolved(business.dataFiscalUrl)
  const activeSocials = socials.filter((s) => resolved(s.url) !== null)

  return (
    <footer className="bg-primary-container w-full mt-8 md:mt-12 border-t-4 border-accent-red">
      <div className="max-w-[1280px] mx-auto px-4 md:px-16 py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {/* Marca y contacto */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <h2 className="text-xl font-black text-on-primary uppercase tracking-tighter leading-none">
              Moreno
              <br />
              Herramientas
            </h2>
            <p className="text-sm text-on-primary/70 leading-relaxed">
              Herramientas de mecánica y taller. Puesta a punto, bocallaves, extractores y
              mechas.
            </p>

            <ul className="flex flex-col gap-2 mt-1">
              {wa && (
                <li>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-on-primary/70 hover:text-on-primary transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>
                    WhatsApp
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="text-sm text-on-primary/70 hover:text-on-primary transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">call</span>
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-on-primary/70 hover:text-on-primary transition-colors flex items-center gap-2 break-all"
                  >
                    <span className="material-symbols-outlined text-lg shrink-0">mail</span>
                    {email}
                  </a>
                </li>
              )}
              {hours && (
                <li className="text-sm text-on-primary/70 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  {hours}
                </li>
              )}
            </ul>

            {activeSocials.length > 0 && (
              <div className="flex gap-3 mt-1">
                {activeSocials.map((s) => (
                  <a
                    key={s.key}
                    href={resolved(s.url) ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 border-2 border-white/20 flex items-center justify-center text-on-primary/70 hover:border-accent-red hover:text-on-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">{s.icon}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Categorías */}
          <div>
            <ColumnTitle>Categorías</ColumnTitle>
            <ul className="flex flex-col gap-2.5">
              <FooterCategories />
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <ColumnTitle>Ayuda</ColumnTitle>
            <ul className="flex flex-col gap-2.5">
              {helpLinks.map((l) => (
                <FooterLink key={l.href} {...l} />
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <ColumnTitle>Institucional</ColumnTitle>
            <ul className="flex flex-col gap-2.5">
              {legalLinks.map((l) => (
                <FooterLink key={l.href} {...l} />
              ))}
              <li>
                <a
                  href={CONSUMER_DEFENSE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-on-primary/70 hover:text-on-primary transition-colors inline-flex items-center gap-1"
                >
                  Defensa del Consumidor
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Medios de pago y envío */}
        <div className="mt-10 pt-8 border-t border-white/10 grid gap-8 md:grid-cols-2">
          <div>
            <ColumnTitle>Medios de pago</ColumnTitle>
            <ul className="flex flex-col gap-2 text-sm text-on-primary/70">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">credit_card</span>
                MercadoPago — tarjeta de crédito, débito y en cuotas
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">account_balance</span>
                Transferencia bancaria
                <span className="bg-accent-red text-on-primary text-xs font-black px-2 py-0.5 uppercase tracking-wide">
                  10% off
                </span>
              </li>
            </ul>
          </div>
          <div>
            <ColumnTitle>Envíos</ColumnTitle>
            <ul className="flex flex-col gap-2 text-sm text-on-primary/70">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">local_shipping</span>
                Andreani y Correo Argentino a todo el país
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">calculate</span>
                Costo calculado por código postal en el checkout
              </li>
            </ul>
          </div>
        </div>

        {/*
          Botón de arrepentimiento — obligatorio y destacado por Res. 424/2020.
          La norma pide que sea fácil de encontrar, así que no va mezclado con
          el resto de los links.
        */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <Link
              href="/arrepentimiento"
              className="inline-flex items-center gap-2 border-2 border-white/30 text-on-primary font-black uppercase tracking-widest text-xs py-3 px-5 hover:border-accent-red hover:bg-accent-red transition-colors"
            >
              <span className="material-symbols-outlined text-lg">undo</span>
              Botón de arrepentimiento
            </Link>
            <p className="text-xs text-on-primary/50 mt-2 max-w-md">
              Podés cancelar tu compra dentro de los 10 días corridos de recibida, sin costo y
              sin dar explicaciones (Ley 24.240, art. 34).
            </p>
          </div>

          {dataFiscal && (
            <a
              href={dataFiscal}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
              aria-label="Data Fiscal — ARCA"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://www.afip.gob.ar/images/f960/DATAWEB.jpg"
                alt="Data Fiscal"
                width={50}
                height={69}
                className="bg-white p-1"
              />
            </a>
          )}
        </div>

        {/* Datos del titular */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-1.5">
          <p className="text-xs text-on-primary/60">
            © {new Date().getFullYear()} Moreno Herramientas. Todos los derechos reservados.
          </p>
          {legalName && <p className="text-xs text-on-primary/50">{legalName}</p>}
          {cuit && <p className="text-xs text-on-primary/50">CUIT {cuit}</p>}
          {address && <p className="text-xs text-on-primary/50">{address}</p>}
          <p className="text-xs text-on-primary/50">
            Los precios publicados son finales, en pesos argentinos e incluyen IVA.
          </p>
        </div>
      </div>
    </footer>
  )
}
