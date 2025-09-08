interface LoadingSpinnerProps {
  extraClasses?: string;
}
export const LoadingSpinner = ({extraClasses}: LoadingSpinnerProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`inline size-5 animate-spin ${extraClasses || ""}`}
      viewBox="0 0 24 24"
      width="24" height="24"
      fill="none" stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
  )
};