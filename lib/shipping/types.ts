/** Una opción de envío cotizada por un carrier. */
export type ShippingQuoteResult = {
  carrier: 'andreani' | 'correo-argentino'
  service: string
  price: number // centavos
  estimatedDays: number
}

/** Insumo de cotización: peso total y cantidad de bultos. */
export type ShipmentInfo = {
  postalCode: string
  totalUnits: number
  /** Peso estimado en gramos. */
  weightGrams: number
}
