const { Client } = require("pg");

async function checkAllSchemas() {
  const c = new Client({
    connectionString: "postgresql://postgres:password@localhost:5432/pro_mover_db",
  });
  await c.connect();
  const res = await c.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
  `);
  console.log("All tables in pro_mover_db:", res.rows);
  for (const row of res.rows) {
    const data = await c.query(`SELECT * FROM "${row.table_schema}"."${row.table_name}";`);
    console.log(`Data in ${row.table_schema}.${row.table_name} (${data.rows.length} rows):`, data.rows);
  }
  await c.end();
}

checkAllSchemas();
