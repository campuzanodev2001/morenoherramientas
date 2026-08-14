import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
async function main() {
  console.log(await db.execute(sql`select count(*)::int imgs, count(distinct product_id)::int prods from product_images`))
  process.exit(0)
}
main()
