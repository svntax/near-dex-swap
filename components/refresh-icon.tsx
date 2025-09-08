interface RefreshIconProps {
  className?: string;
}
export const RefreshIcon = ({className}: RefreshIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24"
      viewBox="0 -960 960 960"
      className={className}
    >
      <path d="M480-160q-134 0-227-93t-93-227 93-227 227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170 70 170 170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67"/>
    </svg>
  )
};