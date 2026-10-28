const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://lian:4SSn4pUx4ZRD3tvs9Pb1FH3Z@ep-small-fog-aul39lpp-pooler.c-10.us-east-1.aws.neon.tech/ads_dashboard?sslmode=require";

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log("Connecting to Neon PostgreSQL...");
  await client.connect();

  console.log("Creating tables...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS metrics (
      id SERIAL PRIMARY KEY,
      platform VARCHAR(20) NOT NULL, -- 'google' or 'meta'
      client_name VARCHAR(100) DEFAULT 'Cliente Principal',
      campaign_name VARCHAR(255) NOT NULL,
      campaign_id VARCHAR(100),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      date DATE NOT NULL,
      impressions INT DEFAULT 0,
      clicks INT DEFAULT 0,
      spend NUMERIC(12, 2) DEFAULT 0.00,
      conversions NUMERIC(10, 2) DEFAULT 0.00,
      conversion_value NUMERIC(12, 2) DEFAULT 0.00,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT metric_unique_entry UNIQUE (platform, campaign_id, date)
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id SERIAL PRIMARY KEY,
      platform VARCHAR(20) NOT NULL,
      status VARCHAR(50) NOT NULL,
      records_count INT DEFAULT 0,
      message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics(date);
    CREATE INDEX IF NOT EXISTS idx_metrics_platform ON metrics(platform);
  `);

  // Check if we have any metrics, if not insert sample data for today
  const res = await client.query('SELECT COUNT(*) FROM metrics');
  if (parseInt(res.rows[0].count, 10) === 0) {
    console.log("Inserting initial sample data so dashboard isn't empty...");
    const today = new Date().toISOString().split('T')[0];
    await client.query(`
      INSERT INTO metrics (platform, client_name, campaign_name, campaign_id, status, date, impressions, clicks, spend, conversions, conversion_value)
      VALUES 
        ('meta', 'Cliente Principal', '[Meta] Conversão - Feed & Stories', 'meta_camp_01', 'ACTIVE', $1, 14500, 320, 245.50, 18, 1420.00),
        ('meta', 'Cliente Principal', '[Meta] Remarketing - Visitantes 30D', 'meta_camp_02', 'ACTIVE', $1, 4200, 115, 89.20, 12, 980.00),
        ('google', 'Cliente Principal', '[Google] Rede de Pesquisa - Fundo de Funil', 'goog_camp_01', 'ACTIVE', $1, 2800, 410, 312.80, 25, 2350.00),
        ('google', 'Cliente Principal', '[Google] Performance Max - Institucional', 'goog_camp_02', 'ACTIVE', $1, 8900, 210, 150.00, 8, 640.00)
      ON CONFLICT DO NOTHING;
    `, [today]);
  }

  console.log("Database initialized successfully!");
  await client.end();
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});

