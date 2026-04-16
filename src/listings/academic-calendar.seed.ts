export type CalendarPhaseSeed = {
  university_code: string;
  semester_code: string;
  phase_name: string;
  start_date: string;
  end_date: string;
};

export const ACADEMIC_CALENDAR_PHASES_SEED: CalendarPhaseSeed[] = [
  {
    university_code: 'UNIANDES',
    semester_code: '2026-I',
    phase_name: 'pre_enrollment',
    start_date: '2026-01-01',
    end_date: '2026-01-19',
  },
  {
    university_code: 'UNIANDES',
    semester_code: '2026-I',
    phase_name: 'early_semester',
    start_date: '2026-01-20',
    end_date: '2026-03-15',
  },
  {
    university_code: 'UNIANDES',
    semester_code: '2026-I',
    phase_name: 'recess',
    start_date: '2026-03-16',
    end_date: '2026-03-21',
  },
  {
    university_code: 'UNIANDES',
    semester_code: '2026-I',
    phase_name: 'mid_semester',
    start_date: '2026-03-22',
    end_date: '2026-05-23',
  },
  {
    university_code: 'UNIANDES',
    semester_code: '2026-I',
    phase_name: 'finals',
    start_date: '2026-05-25',
    end_date: '2026-05-30',
  },
  {
    university_code: 'UNIANDES',
    semester_code: '2026-I',
    phase_name: 'break',
    start_date: '2026-05-24',
    end_date: '2026-08-02',
  },
  {
    university_code: 'UNIANDES',
    semester_code: '2026-II',
    phase_name: 'early_semester',
    start_date: '2026-08-03',
    end_date: '2026-09-27',
  },
  {
    university_code: 'UNIANDES',
    semester_code: '2026-II',
    phase_name: 'recess',
    start_date: '2026-09-28',
    end_date: '2026-10-03',
  },
  {
    university_code: 'UNIANDES',
    semester_code: '2026-II',
    phase_name: 'mid_semester',
    start_date: '2026-10-04',
    end_date: '2026-11-28',
  },
  {
    university_code: 'UNIANDES',
    semester_code: '2026-II',
    phase_name: 'finals',
    start_date: '2026-11-30',
    end_date: '2026-12-05',
  },
  {
    university_code: 'UNIANDES',
    semester_code: '2026-II',
    phase_name: 'break',
    start_date: '2026-11-29',
    end_date: '2026-12-31',
  },
];
