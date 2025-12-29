
export type LifeArea = 'Casamento' | 'Trabalho' | 'Espiritual' | 'Saúde' | 'Financeiro' | 'Casa';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  deadline?: string;
  area: LifeArea;
  completed: boolean;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  task: string;
  completed?: boolean;
}

export interface DailyPlanning {
  id: string;
  userId: string;
  date: string;
  dayName: string;
  items: ScheduleItem[];
}

export interface WeeklyPlanning {
  id: string;
  userId: string;
  weekStart: string;
  priorities: string[];
  mainFocus: string;
}

export interface MonthlyPlanning {
  id: string;
  userId: string;
  month: string;
  objectives: string[];
  appointments: string[];
  habits: string[];
}

export interface YearlyPlanning {
  id: string;
  userId: string;
  year: string;
  objectives: string[];
  areasOfFocus: Record<LifeArea, string>;
  wordOfYear?: string;
}

export interface RoutineEntry {
  id: string;
  user_id: string;
  date: string;
  activities: {
    prayer: boolean;
    reading: boolean;
    workout: boolean;
    spouseTime: boolean;
    planning: boolean;
  };
  created_at?: string;
}

export type Mood = 'bom' | 'normal' | 'difícil';

export interface DailyCheckIn {
  id: string;
  userId: string;
  date: string;
  mood: Mood;
  lesson?: string;
}
