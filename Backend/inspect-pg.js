const { Client } = require("pg");

async function checkDatabases() {
  const client = new Client({
    connectionString: "postgresql://postgres:password@localhost:5432/postgres",
  });
  try {
    await client.connect();
    const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
    console.log("Databases on server:", res.rows.map(r => r.datname));

    for (const db of res.rows) {
      if (db.datname === "postgres") continue;
      const dbClient = new Client({
        connectionString: `postgresql://postgres:password@localhost:5432/${db.datname}`,
      });
      try {
        await dbClient.connect();
        const tablesRes = await dbClient.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public';
        `);
        console.log(`\n--- DB: ${db.datname} ---`);
        for (const t of tablesRes.rows) {
          const countRes = await dbClient.query(`SELECT COUNT(*) FROM "${t.table_name}";`);
          console.log(`Table ${t.table_name}: ${countRes.rows[0].count} rows`);
          if (parseInt(countRes.rows[0].count) > 0) {
            const dataRes = await dbClient.query(`SELECT * FROM "${t.table_name}" LIMIT 5;`);
            console.log(`Sample from ${t.table_name}:`, dataRes.rows);
          }
        }
      } catch (err) {
        console.log(`Error checking db ${db.datname}:`, err.message);
      } finally {
        await dbClient.end();
      }
    }
  } catch (e) {
    console.error("Connection error:", e.message);
  } finally {
    await client.end();
  }
}

checkDatabases();
