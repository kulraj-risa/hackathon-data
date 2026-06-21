export interface DocumentsForOrder {
  id?: string;
  title?: string;
  type?: string;
  path?: string;
  showPrevious?: boolean;
  showNext?: boolean;
}

export interface Item {
  id?: string;
  description?: string;
  documents?: DocumentsForOrder[];
}

export interface DocumentsViewerPropsWithSideNavigation {
  items?: Item[];
  shouldLogEvent?: boolean;
  screenName?: string;
  modalName?: string;
  showLoader?: boolean;
}
