import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function resetDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Obtener todas las tablas
    const tables = await queryRunner.getTables();
    console.log(`📋 Encontradas ${tables.length} tablas`);

    // Desactivar FK constraints temporalmente
    await queryRunner.query('SET session_replication_role = replica');

    // Eliminar todas las tablas
    for (const table of tables) {
      await queryRunner.dropTable(table);
      console.log(`🗑️  Eliminada tabla: ${table.name}`);
    }

    // Reactivar FK constraints
    await queryRunner.query('SET session_replication_role = default');

    console.log('✅ Base de datos vaciada correctamente');
    console.log('⚠️  Ejecuta: npm run start:dev para recrear las tablas');

    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error al vaciar la base de datos:', error.message);
    process.exit(1);
  }
}

resetDatabase();
