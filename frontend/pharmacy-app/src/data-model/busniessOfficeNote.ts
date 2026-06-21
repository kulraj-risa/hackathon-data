export interface BusniessOfficeNote {
  post_text?: string;
  post_text_date?: string;
  pre_text?: string;
  pre_text_date?: string;
  report_identifier?: string;
  template_text?: string;
  report_status?: string;
  visit_date?: string;
  visit_date_text?: string;
}

export interface AllCommentsProps {
  comments: {
    id: string;
    originalComment: string;
    boStatus?: string;
    writeBackComment?: string;
    showWriteBackNote?: boolean;
  }[];
  commentDate: string;
  onBoStatusChange?: (data: { id: string; status: string }) => void;
  onWriteBackCommentChange?: (data: { id: string; comment: string }) => void;
  type: string;
}
