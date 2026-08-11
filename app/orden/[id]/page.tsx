import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from '@/lib/auth/helpers'
import { getOrderWithItemsById } from '@/lib/db/queries/orders'
import { formatPrice } from '@/lib/catalog/format'
import { getMpErrorMessage } from '@/lib/errors/mp-error-messages'
import type { OrderStatus } from '@/lib/db/types'
import OrderCleanup from './OrderCleanup'
import StoreHeader from '@/app/components/StoreHeader'
import StoreFooter from '@/app/components/StoreFooter'
import TransferInstructions from '@/app/components/checkout/TransferInstructions'
import { getTransferAccount } from '@/lib/payments/transfer'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

const STATUS_VIEW: Record<
  OrderStatus,
  { icon: string; title: string; tone: string; message: string }
> = {
  pending: {
    icon: 'schedule',
    title: 'Tu pago está siendo procesado',
    tone: 'text-on-surface',
    message: 'Te avisamos por mail apenas se confirme. Puede tardar unos minutos.',
  },
  confirmed: {
    icon: 'check_circle',
    title: '¡Pago confirmado!',
    tone: 'text-primary-container',
    message: 'Recibimos tu pago. Estamos preparando tu pedido.',
  },
  processing: {
    icon: 'inventory_2',
    title: 'Preparando tu pedido',
    tone: 'text-primary-container',
    message: 'Tu pedido está siendo preparado para el envío.',
  },
  shipped: {
    icon: 'local_shipping',
    title: 'Pedido enviado',
    tone: 'text-primary-container',
    message: 'Tu pedido está en camino.',
  },
  delivered: {
    icon: 'task_alt',
    title: 'Pedido entregado',
    tone: 'text-primary-container',
    message: '¡Gracias por tu compra!',
  },
  cancelled: {
    icon: 'cancel',
    title: 'El pago no se completó',
    tone: 'text-accent-red',
    message: 'No te preocupes, no se realizó ningún cargo. Podés intentar de nuevo.',
  },
  refunded: {
    icon: 'undo',
    title: 'Pago reembolsado',
    tone: 'text-on-surface',
    message: 'El pago de esta orden fue reembolsado.',
  },
}

/** Órdenes por transferencia todavía sin pagar: no hay nada "procesándose". */
const TRANSFER_PENDING_VIEW = {
  icon: 'account_balance',
  title: 'Reservamos tu pedido',
  tone: 'text-on-surface',
  message: 'Transferí el importe con los datos de abajo y confirmamos el pedido al verificarlo.',
} as const

export default async function OrderResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderWithItemsById(id)
  if (!order) notFound()

  const session = await getServerSession()
  const isOwner = Boolean(session?.user?.id) && order.userId === session?.user?.id
  const isGuestOrder = !order.userId
  // El uuid de la orden actúa como capability para invitados; nunca se muestra
  // la orden de OTRO usuario logueado.
  if (!isOwner && !isGuestOrder) notFound()

  const isTransfer = order.paymentMethod === 'transfer'
  const account = isTransfer ? getTransferAccount() : null
  // Con transferencia "pending" no significa "el pago se está procesando":
  // significa que todavía no transfirió. El copy tiene que decir eso.
  const view =
    isTransfer && order.status === 'pending' ? TRANSFER_PENDING_VIEW : STATUS_VIEW[order.status]

  return (
    <>
      <OrderCleanup settled={order.status !== 'cancelled'} />
      <StoreHeader />

      <main className="mt-16 max-w-[760px] mx-auto w-full px-4 md:px-8 py-10 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className={`material-symbols-outlined text-[72px] ${view.tone}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {view.icon}
          </span>
          <h1 className="text-3xl font-black uppercase text-on-surface">{view.title}</h1>
          <p className="text-base text-on-surface-variant font-medium max-w-md">{view.message}</p>
          {order.status === 'cancelled' && order.mpDetail && (
            <p className="text-sm font-bold text-accent-red">
              Motivo: {getMpErrorMessage(order.mpDetail)}
            </p>
          )}
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
            Orden {order.orderNumber}
          </p>
        </div>

        {account && order.status === 'pending' && (
          <TransferInstructions
            account={account}
            orderNumber={order.orderNumber}
            total={order.total}
            contactEmail={env.RESEND_FROM_EMAIL}
          />
        )}

        <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-4">
          <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-3">
            Detalle
          </h2>
          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start gap-2 text-sm">
                <span className="text-on-surface-variant font-medium leading-tight flex-1 min-w-0">
                  <span className="font-black text-on-surface">{item.quantity}×</span> {item.productName}
                </span>
                <span className="font-black text-on-surface flex-shrink-0">
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-charcoal pt-3 flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Subtotal</span>
              <span className="font-black text-on-surface">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-emerald-700 font-medium">Descuento por transferencia</span>
                <span className="font-black text-emerald-700">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Envío</span>
              <span className="font-black text-on-surface">{formatPrice(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-outline">
              <span className="font-black uppercase tracking-wide text-on-surface">Total</span>
              <span className="text-xl font-black text-accent-red">{formatPrice(order.total)}</span>
            </div>
          </div>
          {order.trackingNumber && (
            <p className="text-sm font-medium text-on-surface-variant">
              Seguimiento: <span className="font-black text-on-surface">{order.trackingNumber}</span>
              {order.shippingCarrier ? ` (${order.shippingCarrier})` : ''}
            </p>
          )}
        </section>

        <div className="flex flex-wrap gap-3 justify-center">
          {order.status === 'cancelled' && (
            <Link
              href="/checkout"
              className="bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-8 text-sm hover:opacity-90 transition-opacity"
            >
              Reintentar el pago
            </Link>
          )}
          {isOwner && (
            <Link
              href="/cuenta/ordenes"
              className="border-2 border-primary-container text-primary-container font-black uppercase tracking-widest py-3 px-8 text-sm hover:bg-primary-container hover:text-on-primary transition-colors"
            >
              Ver mis compras
            </Link>
          )}
          <Link
            href="/"
            className="border-2 border-charcoal text-on-surface font-black uppercase tracking-widest py-3 px-8 text-sm hover:bg-charcoal hover:text-on-primary transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
      <StoreFooter />
    </>
  )
}
