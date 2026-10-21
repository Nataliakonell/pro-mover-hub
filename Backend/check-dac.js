const { Client } = require("pg");

async function checkSpecificDBs() {
  for (const dbName of ["DAC", "pro_mover_db"]) {
    const dbClient = new Client({
      connectionString: `postgresql://postgres:password@localhost:5432/${dbName}`,
    });
    try {
      await dbClient.connect();
      console.log(`\n=================== DB: ${dbName} ===================`);
      const tablesRes = await dbClient.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `);
      for (const t of tablesRes.rows) {
        const countRes = await dbClient.query(`SELECT COUNT(*) FROM "${t.table_name}";`);
        console.log(`Table ${t.table_name}: ${countRes.rows[0].count} rows`);
        if (parseInt(countRes.rows[0].count) > 0) {
          const dataRes = await dbClient.query(`SELECT * FROM "${t.table_name}";`);
          console.log(`Data in ${t.table_name}:`, JSON.stringify(dataRes.rows, null, 2));
        }
      }
    } catch (err) {
      console.log(`Error checking db ${dbName}:`, err.message);
    } finally {
      await dbClient.end();
    }
  }
}

checkSpecificDBs();
