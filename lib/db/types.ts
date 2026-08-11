import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import * as schema from './schemas'

export type User = InferSelectModel<typeof schema.users>
export type NewUser = InferInsertModel<typeof schema.users>

export type Category = InferSelectModel<typeof schema.categories>
export type NewCategory = InferInsertModel<typeof schema.categories>

export type Product = InferSelectModel<typeof schema.products>
export type NewProduct = InferInsertModel<typeof schema.products>

export type ProductImage = InferSelectModel<typeof schema.productImages>
export type NewProductImage = InferInsertModel<typeof schema.productImages>

export type Order = InferSelectModel<typeof schema.orders>
export type NewOrder = InferInsertModel<typeof schema.orders>

export type OrderItem = InferSelectModel<typeof schema.orderItems>
export type NewOrderItem = InferInsertModel<typeof schema.orderItems>

export type PaymentEvent = InferSelectModel<typeof schema.paymentEvents>
export type NewPaymentEvent = InferInsertModel<typeof schema.paymentEvents>

export type ShippingQuote = InferSelectModel<typeof schema.shippingQuotes>
export type NewShippingQuote = InferInsertModel<typeof schema.shippingQuotes>

export type Cart = InferSelectModel<typeof schema.carts>
export type NewCart = InferInsertModel<typeof schema.carts>

export type CartItem = InferSelectModel<typeof schema.cartItems>
export type NewCartItem = InferInsertModel<typeof schema.cartItems>

export type Page = InferSelectModel<typeof schema.pages>
export type NewPage = InferInsertModel<typeof schema.pages>

export type Banner = InferSelectModel<typeof schema.banners>
export type NewBanner = InferInsertModel<typeof schema.banners>

export type MailLog = InferSelectModel<typeof schema.mailLogs>
export type NewMailLog = InferInsertModel<typeof schema.mailLogs>

export type CancellationRequest = InferSelectModel<typeof schema.cancellationRequests>
export type NewCancellationRequest = InferInsertModel<typeof schema.cancellationRequests>

// Tipos auxiliares reexportados desde los schemas
export type { ShippingAddress } from './schemas/orders'
export type { ProductSpec } from './schemas/products'
export type OrderStatus = Order['status']
export type CancellationStatus = CancellationRequest['status']
export type Role = User['role']
export type BannerDevice = Banner['device']
