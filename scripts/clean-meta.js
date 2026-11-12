const { Client } = require('pg');

async function clean() {
  const client = new Client({
    connectionString: "postgresql://lian:4SSn4pUx4ZRD3tvs9Pb1FH3Z@ep-small-fog-aul39lpp-pooler.c-10.us-east-1.aws.neon.tech/ads_dashboard?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res1 = await client.query("DELETE FROM metrics WHERE platform = 'meta'");
  console.log("Removido da tabela metrics (meta):", res1.rowCount);
  const res2 = await client.query("DELETE FROM sync_logs WHERE platform = 'meta'");
  console.log("Removido da tabela sync_logs (meta):", res2.rowCount);

  const status = await client.query("SELECT platform, COUNT(*) FROM metrics GROUP BY platform");
  console.log("Linhas restantes por plataforma:", status.rows);

  await client.end();
}

clean().catch(console.error);

