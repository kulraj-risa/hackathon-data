import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();
  return (
    <section className="flex h-full w-full items-center justify-center bg-primaryGray-16">
      <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
        <div className="mx-auto max-w-screen-sm text-center">
          <h1 className="text-primary-600 mb-4 text-7xl font-extrabold tracking-tight text-tertiaryRed-5 lg:text-9xl">
            404
          </h1>
          <p className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Something's missing.
          </p>
          <p className="mb-4 text-lg font-light text-gray-500">
            Sorry, we can't find that page.
          </p>
          <div
            className="bg-primary-600 hover:bg-primary-800 focus:ring-primary-300 my-4 inline-flex rounded-lg px-5 py-2.5 text-center text-sm font-medium text-black hover:cursor-pointer focus:outline-none focus:ring-4"
            onClick={() => {
              navigate("/", {
                replace: true,
              });
              window.location.reload();
            }}
          >
            Back to Homepage
          </div>
        </div>
      </div>
    </section>
  );
};

export default ErrorPage;
