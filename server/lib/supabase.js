const { createClient } = require('@supabase/supabase-js');
const { env } = require('./env');

const CONTEXT_TABLES = [
  'orders',
  'fishers',
  'lois',
  'shipments',
  'product_catalog',
  'experiments',
];

let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    return null;
  }

  supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  return supabaseClient;
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toNumber(value) {
  if (value == null) return 0;
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return n;
}

async function fetchAllRows(tableName, maxRows = env.MAX_TABLE_ROWS, pageSize = 1000) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Missing SUPABASE_URL/SUPABASE_KEY.');
  }

  const rows = [];
  let from = 0;

  while (rows.length < maxRows) {
    const to = from + pageSize - 1;
    const { data, error } = await client.from(tableName).select('*').range(from, to);

    if (error) {
      throw new Error(error.message || `Failed to read table ${tableName}.`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  if (rows.length > maxRows) {
    return rows.slice(0, maxRows);
  }

  return rows;
}

async function readSupabaseSnapshot() {
  const snapshot = {
    available: false,
    fetchedAt: new Date().toISOString(),
    tables: {},
    errors: [],
  };

  const client = getSupabaseClient();
  if (!client) {
    snapshot.errors.push('Supabase client unavailable. Set SUPABASE_URL and SUPABASE_KEY.');
    return snapshot;
  }

  snapshot.available = true;

  for (const tableName of CONTEXT_TABLES) {
    try {
      const rows = await fetchAllRows(tableName);
      snapshot.tables[tableName] = {
        ok: true,
        rowCount: rows.length,
        rows,
      };
    } catch (error) {
      snapshot.tables[tableName] = {
        ok: false,
        rowCount: 0,
        rows: [],
        error: error instanceof Error ? error.message : String(error),
      };
      snapshot.errors.push(`${tableName}: ${snapshot.tables[tableName].error}`);
    }
  }

  return snapshot;
}

function buildContextFromSnapshot(snapshot) {
  const orders = snapshot.tables.orders?.rows || [];
  const fishers = snapshot.tables.fishers?.rows || [];
  const lois = snapshot.tables.lois?.rows || [];
  const shipments = snapshot.tables.shipments?.rows || [];
  const products = snapshot.tables.product_catalog?.rows || [];
  const experiments = snapshot.tables.experiments?.rows || [];

  const sortedOrders = [...orders].sort((a, b) => {
    const aTime = parseDate(a.created_at)?.getTime() || 0;
    const bTime = parseDate(b.created_at)?.getTime() || 0;
    return bTime - aTime;
  });

  const recentOrders = sortedOrders.slice(0, 12).map((row) => ({
    id: row.id,
    customer_name: row.customer_name,
    locality: row.locality,
    product_name: row.product_name,
    quantity_kg: toNumber(row.quantity_kg),
    total_amount: toNumber(row.total_amount),
    freshness_score: toNumber(row.freshness_score),
    created_at: row.created_at,
  }));

  const totalRevenue = orders.reduce((sum, row) => sum + toNumber(row.total_amount), 0);
  const totalKg = orders.reduce((sum, row) => sum + toNumber(row.quantity_kg), 0);
  const averageFreshness = orders.length
    ? orders.reduce((sum, row) => sum + toNumber(row.freshness_score), 0) / orders.length
    : 0;

  const localityCounter = new Map();
  const productCounter = new Map();
  for (const row of orders) {
    const locality = row.locality || 'Unknown';
    localityCounter.set(locality, (localityCounter.get(locality) || 0) + 1);

    const product = row.product_name || 'Unknown';
    productCounter.set(product, (productCounter.get(product) || 0) + 1);
  }

  const topLocalities = [...localityCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topProducts = [...productCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const loiStatusCounter = new Map();
  for (const row of lois) {
    const status = row.status || 'Unknown';
    loiStatusCounter.set(status, (loiStatusCounter.get(status) || 0) + 1);
  }

  const loiStatus = [...loiStatusCounter.entries()].map(([status, count]) => ({ status, count }));

  const tableMeta = {};
  for (const [tableName, tableData] of Object.entries(snapshot.tables)) {
    tableMeta[tableName] = {
      ok: Boolean(tableData?.ok),
      rowCount: tableData?.rowCount || 0,
      error: tableData?.error || null,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    supabaseAvailable: snapshot.available,
    supabaseErrors: snapshot.errors,
    tables: tableMeta,
    stats: {
      orders: orders.length,
      fishers: fishers.length,
      lois: lois.length,
      shipments: shipments.length,
      products: products.length,
      experiments: experiments.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalKg: Math.round(totalKg * 100) / 100,
      averageFreshness: Math.round(averageFreshness * 10) / 10,
    },
    topLocalities,
    topProducts,
    loiStatus,
    recentOrders,
    products: products.slice(0, 30),
    fishers: fishers.slice(0, 30),
    shipments: shipments.slice(0, 30),
  };
}

module.exports = {
  CONTEXT_TABLES,
  getSupabaseClient,
  readSupabaseSnapshot,
  buildContextFromSnapshot,
};
