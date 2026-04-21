import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

config();

type CsvRecord = {
  course_code: string;
  course_name: string;
  faculty: string;
  is_active: string;
};

const appDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseCsv(content: string): CsvRecord[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const records: CsvRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    records.push({
      course_code: row.course_code,
      course_name: row.course_name,
      faculty: row.faculty,
      is_active: row.is_active,
    });
  }

  return records;
}

async function seedCourses() {
  const inputPathArg = process.argv[2];
  const csvPath = inputPathArg
    ? path.resolve(process.cwd(), inputPathArg)
    : path.resolve(process.cwd(), 'catalogo_uniandes_marketplace_seed_2026.csv');

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at: ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parseCsv(csvContent);

  if (records.length === 0) {
    console.log('No course records found in CSV.');
    return;
  }

  const activeRows = records.filter(
    (record) => (record.is_active || '').toLowerCase() === 'true',
  );

  const normalizedCourses = activeRows
    .map((record) => ({
      code: (record.course_code || '').trim(),
      name: (record.course_name || '').trim(),
      faculty: (record.faculty || '').trim(),
    }))
    .filter(
      (course) =>
        course.code.length > 0 &&
        course.name.length > 0 &&
        course.faculty.length > 0,
    );

  const uniqueByCode = new Map<string, { code: string; name: string; faculty: string }>();
  normalizedCourses.forEach((course) => {
    uniqueByCode.set(course.code, course);
  });

  const payload = Array.from(uniqueByCode.values());

  await appDataSource.initialize();

  try {
    await appDataSource
      .createQueryBuilder()
      .insert()
      .into('courses')
      .values(payload)
      .orUpdate(['name', 'faculty'], ['code'])
      .execute();

    console.log(
      `Seed completed. Upserted ${payload.length} courses from ${path.basename(csvPath)}.`,
    );
  } finally {
    await appDataSource.destroy();
  }
}

seedCourses().catch((error) => {
  console.error('Error seeding courses:', error.message);
  process.exit(1);
});
