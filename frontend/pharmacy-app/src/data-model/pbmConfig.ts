export interface Step {
  config?: Record<string, any>;
  type?: string;
  priority?: number;
}

export interface Workflow {
  steps?: Step[];
}

export interface StepType {
  title: string;
  icon: string;
  description: string;
  config_schema?: any;
}

export interface SchemaField {
  type: string;
  title: string;
  required: boolean;
  ui_component: string;
  placeholder?: string;
  description?: string;
  options?: Array<{ label: string; value: string }>;
  default?: string;
  items?: {
    [key: string]: {
      type: string;
      title: string;
      required: boolean;
      ui_component: string;
      placeholder?: string;
      description?: string;
      options?: Array<{ label: string; value: string }>;
      default?: string;
    };
  };
}
