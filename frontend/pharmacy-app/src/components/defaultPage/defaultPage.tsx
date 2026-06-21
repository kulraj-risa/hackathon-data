import { LoaderMessage } from "../loaderMessage/loaderMessage";

const DefaultPage = () => {
  return (
    <div className="default-page flex h-full w-full items-center justify-center">
      <LoaderMessage message="Setting up workspace..." />
    </div>
  );
};

export default DefaultPage;
