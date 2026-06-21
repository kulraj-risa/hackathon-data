export const generateValidUrl = () => {
  const { protocol, hostname, port } = window.location;
  const base = port
    ? `${protocol}//${hostname}:${port}`
    : `${protocol}//${hostname}`;
  return `${base}/finishSignIn`;
};
