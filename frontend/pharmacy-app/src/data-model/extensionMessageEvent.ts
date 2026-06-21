export interface ExtensionMessageEvent {
  action: string;
  data: {
    key: string;
    value?: any;
  };
}
