import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  console.log(`Connecting to database at: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    const sqlPath = path.resolve(__dirname, '../../../supabase/seed-case-studies.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found at: ${sqlPath}`);
    }

    console.log(`Reading seed SQL from: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Executing seed SQL transaction (102 case studies)...');
    await client.query(sql);

    console.log('Seed executed successfully!');

    // Quick verification
    const problemCount = await client.query(
      `select count(*)::int as count from public.problems where origin = 'imported'`,
    );
    const ideaCount = await client.query(
      `select count(*)::int as count from public.ideas where origin = 'imported'`,
    );
    const projectCount = await client.query(
      `select count(*)::int as count from public.projects where origin_type = 'historical_import'`,
    );

    console.log('Verification:');
    console.log(`- Imported Problems: ${problemCount.rows[0].count}`);
    console.log(`- Imported Ideas:    ${ideaCount.rows[0].count}`);
    console.log(`- Historical Projects: ${projectCount.rows[0].count}`);
  } catch (err: any) {
    console.error('Error executing seed-case-studies:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
