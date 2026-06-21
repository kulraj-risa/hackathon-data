interface DocWithUploadIconProps {
  color?: string;
  width?: string;
  height?: string;
}

const DocWithUploadIcon = ({
  color = "#0056D6",
  width = "14",
  height = "18",
}: DocWithUploadIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M11.5276 2.47933V5.6346C11.5276 6.06242 11.5276 6.27633 11.6108 6.43973C11.6841 6.58347 11.8009 6.70033 11.9447 6.77357C12.1081 6.85683 12.322 6.85683 12.7498 6.85683H15.9051M11.5276 2.27344H7.55534C6.27188 2.27344 5.63016 2.27344 5.13994 2.52321C4.70874 2.74292 4.35816 3.0935 4.13845 3.52471C3.88867 4.01492 3.88867 4.65665 3.88867 5.9401V13.8845C3.88867 15.168 3.88867 15.8097 4.13845 16.2999C4.35816 16.7311 4.70874 17.0817 5.13994 17.3014C5.63016 17.5512 6.27188 17.5512 7.55534 17.5512H12.4442C13.7277 17.5512 14.3694 17.5512 14.8596 17.3014C15.2908 17.0817 15.6414 16.7311 15.8611 16.2999C16.1109 15.8097 16.1109 15.168 16.1109 13.8845V6.85677L11.5276 2.27344Z"
        stroke={color}
        stroke-width="1.1"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M7.70898 12.2044L10.0007 9.91276M10.0007 9.91276L12.2923 12.2044M10.0007 9.91276L10.0007 14.4961"
        stroke={color}
        stroke-width="1.1"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export default DocWithUploadIcon;
