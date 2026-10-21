const { Client } = require("pg");

async function scanAll() {
  const root = new Client({
    connectionString: "postgresql://postgres:password@localhost:5432/postgres",
  });
  await root.connect();
  const dbList = (await root.query("SELECT datname FROM pg_database WHERE datistemplate = false;")).rows.map(r => r.datname);
  await root.end();

  for (const db of dbList) {
    const c = new Client({
      connectionString: `postgresql://postgres:password@localhost:5432/${db}`,
    });
    try {
      await c.connect();
      const tables = (await c.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `)).rows.map(r => r.table_name);

      for (const t of tables) {
        if (t.startsWith("_prisma")) continue;
        const count = parseInt((await c.query(`SELECT COUNT(*) FROM "${t}";`)).rows[0].count);
        if (count > 0 && count < 20) {
          const rows = (await c.query(`SELECT * FROM "${t}";`)).rows;
          console.log(`[DB: ${db}] [Table: ${t}] (${count} rows):`);
          console.log(rows);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      await c.end();
    }
  }
}

scanAll();
