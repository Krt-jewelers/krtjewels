// In-memory stand-in for supabase-js, used only by order.test.ts (run with
// `npm test`; vitest.config.ts points the functions' supabase-js import here).
// It is never imported by a function, so it is not deployed.

/* eslint-disable @typescript-eslint/no-explicit-any */

export const db: Record<string, any[]> = {
  products: [],
  product_variations: [],
  metal_types: [],
  gold_rates: [],
  site_settings: [],
  orders: [],
  order_items: [],
};
export const calls: { rpc: any[] } = { rpc: [] };

let rpcResult: any = null;
let simulateOrderFunction = false;

// A fixed answer from create_order_with_items (for tests about what is sent).
export function setRpcResult(result: any) {
  rpcResult = result;
  simulateOrderFunction = false;
}

// Behave like create_order_with_items in
// supabase/migrations/20261118170000_server_priced_orders.sql: repeat checkouts,
// stock checks, stock decrease, and the saved order and items.
export function useOrderFunction() {
  simulateOrderFunction = true;
}

function createOrderWithItems({ p_order, p_items }: { p_order: any; p_items: any[] }) {
  if (p_order.checkout_ref) {
    const hit = db.orders.find((o) => o.checkout_ref === p_order.checkout_ref);
    if (hit) {
      return { data: { id: hit.id, order_number: hit.order_number, created_at: hit.created_at, existing: true, short: [] }, error: null };
    }
  }
  const wanted = new Map<string, number>();
  for (const item of p_items) wanted.set(item.product_id, (wanted.get(item.product_id) || 0) + item.quantity);
  const short: string[] = [];
  for (const [id, qty] of wanted) {
    const product = db.products.find((p) => p.id === id);
    if (!product) return { data: null, error: { message: `PRODUCT_UNAVAILABLE:${id}` } };
    if (!product.is_active || (product.stock_quantity !== null && product.stock_quantity < qty)) {
      if (p_order.allow_backorder) short.push(product.name);
      else return { data: null, error: { message: `${product.is_active ? 'OUT_OF_STOCK' : 'PRODUCT_UNAVAILABLE'}:${id}` } };
    }
  }
  for (const [id, qty] of wanted) {
    const product = db.products.find((p) => p.id === id);
    if (product.stock_quantity !== null) product.stock_quantity = Math.max(0, product.stock_quantity - qty);
  }
  const { allow_backorder: _allow, requested_order_number: _requested, ...columns } = p_order;
  void _allow;
  void _requested;
  const order = {
    ...columns,
    id: `order-${db.orders.length + 1}`,
    order_number: `KRT2611${String(10000001 + db.orders.length)}`,
    status: 'pending',
    payment_verified: false,
    staff_alert: short.length
      ? [p_order.staff_alert, `Not available when the customer paid: ${short.join(', ')}. Contact the customer before confirming.`].filter(Boolean).join(' ')
      : p_order.staff_alert || null,
    created_at: new Date().toISOString(),
  };
  db.orders.push(order);
  for (const item of p_items) db.order_items.push({ ...item, order_id: order.id });
  return { data: { id: order.id, order_number: order.order_number, created_at: order.created_at, existing: false, short }, error: null };
}

function query(table: string) {
  let rows = [...(db[table] || [])];
  let head = false;
  let single = false;
  let pendingUpdate: Record<string, unknown> | null = null;
  const builder: any = {
    select(_columns?: string, options?: { count?: string; head?: boolean }) {
      head = !!options?.head;
      return builder;
    },
    // Applied to the rows left after the filters that follow.
    update(values: Record<string, unknown>) {
      pendingUpdate = values;
      return builder;
    },
    in(column: string, values: unknown[]) {
      rows = rows.filter((row) => values.includes(row[column]));
      return builder;
    },
    eq(column: string, value: unknown) {
      rows = rows.filter((row) => {
        if (column.includes('->>')) {
          const [json, key] = column.split('->>');
          return row[json]?.[key] === value;
        }
        return row[column] === value;
      });
      return builder;
    },
    gte(column: string, value: string) {
      rows = rows.filter((row) => row[column] >= value);
      return builder;
    },
    order() {
      return builder;
    },
    limit(count: number) {
      rows = rows.slice(0, count);
      return builder;
    },
    maybeSingle() {
      single = true;
      return builder;
    },
    then(resolve: (value: unknown) => void) {
      if (pendingUpdate) {
        for (const row of rows) Object.assign(row, pendingUpdate);
        return resolve({ data: null, error: null });
      }
      if (head) return resolve({ count: rows.length, error: null });
      resolve({ data: single ? rows[0] ?? null : rows, error: null });
    },
  };
  return builder;
}

export function createClient(_url?: string, _key?: string, _options?: unknown) {
  return {
    from: (table: string) => query(table),
    rpc: async (name: string, args: any) => {
      calls.rpc.push({ name, args });
      if (name === 'create_order_with_items' && simulateOrderFunction) return createOrderWithItems(args);
      return rpcResult;
    },
    auth: {
      getUser: async (token: string) =>
        token === 'user-token'
          ? { data: { user: { id: 'user-1' } }, error: null }
          : { data: { user: null }, error: { message: 'no user' } },
    },
  };
}
