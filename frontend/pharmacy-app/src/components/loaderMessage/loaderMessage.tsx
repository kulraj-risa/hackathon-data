import { SpinningLoader } from "risa-oasis-ui_v2";

interface LoaderMessageProps {
  message: string;
}

export const LoaderMessage = (props: LoaderMessageProps) => {
  return (
    <div className="loader-message-layout h-full w-full bg-transparent">
      <SpinningLoader />
      <div className="message">{props.message}</div>
    </div>
  );
};
