import { useDispatch } from "react-redux";
import { getViewerDocumentTitleByDocType } from "../../../../constants/statusToDocMap/statusToDocMap";
import { ModalId } from "../../../../enums/modalId";
import { setOpenedModalId } from "../../../../redux/slice/modalSliceNew";
import { AppDispatch } from "../../../../redux/store/store";
import FileIcon from "../../../../svg/fileIcon";

interface DocNameWithIconProps {
  docDetails?: {
    docName?: string;
    docPath: string;
    docTitle?: string;
    identifier: string;
    docType?: string;
  }[];
}
const DocNameWithIcon = (props: DocNameWithIconProps) => {
  const dispatch = useDispatch<AppDispatch>();
  return (
    <div className="all-docs-container flex justify-end gap-2">
      {props?.docDetails &&
        props?.docDetails?.map((doc) => (
          <>
            <div
              className="doc-name-with-icon--container flex items-center gap-2 rounded-md bg-[#F7F9FA] p-2"
              onClick={() => {
                dispatch(
                  setOpenedModalId({
                    id: ModalId.DOC_VIEWER_MODAL,
                    metaData: {
                      filePath: doc.docPath,
                      title: getViewerDocumentTitleByDocType(
                        doc?.docType ?? "",
                      ),
                      hideFooter: true,
                    },
                  }),
                );
              }}
            >
              <div className="doc-icon">
                <FileIcon />
              </div>
              <div className="doc-name flex-1 truncate text-tiny font-normal text-primaryGray-3">
                {doc?.docType
                  ? getViewerDocumentTitleByDocType(doc?.docType)
                  : doc?.docTitle}
                .pdf
              </div>
            </div>
          </>
        ))}
    </div>
  );
};

export default DocNameWithIcon;
