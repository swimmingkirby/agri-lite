export type Plot = {
  id: string;
  name: string;
  created_at: string;
};

export type Reading = {
  id: string;
  plot_id: string;
  moisture: number;
  temperature: number;
  light: number;
  recorded_at: string;
};

export type Parameter = 'moisture' | 'temperature' | 'light';

export type Threshold = {
  id: string;
  plot_id: string;
  parameter: Parameter;
  min_value: number | null;
  max_value: number | null;
  updated_at: string;
};

export type Note = {
  id: string;
  plot_id: string;
  body: string;
  recorded_at: string;
};
