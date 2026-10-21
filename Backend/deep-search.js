const { Client } = require("pg");

async function deepSearch() {
  const root = new Client({
    connectionString: "postgresql://postgres:password@localhost:5432/postgres",
  });
  await root.connect();
  const dbList = (await root.query("SELECT datname FROM pg_database WHERE datistemplate = false;")).rows.map(r => r.datname);
  await root.end();

  console.log("Searching all databases:", dbList);

  for (const db of dbList) {
    const c = new Client({
      connectionString: `postgresql://postgres:password@localhost:5432/${db}`,
    });
    try {
      await c.connect();
      const tables = (await c.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
      `)).rows.map(r => r.table_name);

      for (const t of tables) {
        try {
          const res = await c.query(`SELECT * FROM "${t}";`);
          if (res.rows.length === 2) {
            console.log(`\n🎯 FOUND TABLE WITH EXACTLY 2 ROWS in DB [${db}] Table [${t}]:`);
            console.log(JSON.stringify(res.rows, null, 2));
          } else if (res.rows.length > 0 && res.rows.length <= 10) {
            console.log(`\nTable in DB [${db}] Table [${t}] has ${res.rows.length} rows:`);
            console.log(JSON.stringify(res.rows, null, 2));
          }
        } catch (e) {}
      }
    } catch (e) {
    } finally {
      await c.end();
    }
  }
}

deepSearch();
