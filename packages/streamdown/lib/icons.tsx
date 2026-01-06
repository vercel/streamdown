/** biome-ignore-all lint/a11y/noSvgWithoutTitle: "Streamdown icons" */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const CheckIcon = (props: IconProps) => (
  <svg
    color="currentColor"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M15.5607 3.99999L15.0303 4.53032L6.23744 13.3232C5.55403 14.0066 4.44599 14.0066 3.76257 13.3232L4.2929 12.7929L3.76257 13.3232L0.969676 10.5303L0.439346 9.99999L1.50001 8.93933L2.03034 9.46966L4.82323 12.2626C4.92086 12.3602 5.07915 12.3602 5.17678 12.2626L13.9697 3.46966L14.5 2.93933L15.5607 3.99999Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const CopyIcon = (props: IconProps) => (
  <svg
    color="currentColor"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M2.75 0.5C1.7835 0.5 1 1.2835 1 2.25V9.75C1 10.7165 1.7835 11.5 2.75 11.5H3.75H4.5V10H3.75H2.75C2.61193 10 2.5 9.88807 2.5 9.75V2.25C2.5 2.11193 2.61193 2 2.75 2H8.25C8.38807 2 8.5 2.11193 8.5 2.25V3H10V2.25C10 1.2835 9.2165 0.5 8.25 0.5H2.75ZM7.75 4.5C6.7835 4.5 6 5.2835 6 6.25V13.75C6 14.7165 6.7835 15.5 7.75 15.5H13.25C14.2165 15.5 15 14.7165 15 13.75V6.25C15 5.2835 14.2165 4.5 13.25 4.5H7.75ZM7.5 6.25C7.5 6.11193 7.61193 6 7.75 6H13.25C13.3881 6 13.5 6.11193 13.5 6.25V13.75C13.5 13.8881 13.3881 14 13.25 14H7.75C7.61193 14 7.5 13.8881 7.5 13.75V6.25Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const DownloadIcon = (props: IconProps) => (
  <svg
    color="currentColor"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M8.75 1V1.75V8.68934L10.7197 6.71967L11.25 6.18934L12.3107 7.25L11.7803 7.78033L8.70711 10.8536C8.31658 11.2441 7.68342 11.2441 7.29289 10.8536L4.21967 7.78033L3.68934 7.25L4.75 6.18934L5.28033 6.71967L7.25 8.68934V1.75V1H8.75ZM13.5 9.25V13.5H2.5V9.25V8.5H1V9.25V14C1 14.5523 1.44771 15 2 15H14C14.5523 15 15 14.5523 15 14V9.25V8.5H13.5V9.25Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const Loader2Icon = (props: IconProps) => (
  <svg
    color="currentColor"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    {...props}
  >
    <path d="M8 0V4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 16V12" opacity="0.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M3.29773 1.52783L5.64887 4.7639"
      opacity="0.9"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M12.7023 1.52783L10.3511 4.7639"
      opacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M12.7023 14.472L10.3511 11.236"
      opacity="0.4"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M3.29773 14.472L5.64887 11.236"
      opacity="0.6"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M15.6085 5.52783L11.8043 6.7639"
      opacity="0.2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M0.391602 10.472L4.19583 9.23598"
      opacity="0.7"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M15.6085 10.4722L11.8043 9.2361"
      opacity="0.3"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M0.391602 5.52783L4.19583 6.7639"
      opacity="0.8"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export const Maximize2Icon = (props: IconProps) => (
  <svg
    color="currentColor"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M1 5.25V6H2.5V5.25V2.5H5.25H6V1H5.25H2C1.44772 1 1 1.44772 1 2V5.25ZM5.25 14.9994H6V13.4994H5.25H2.5V10.7494V9.99939H1V10.7494V13.9994C1 14.5517 1.44772 14.9994 2 14.9994H5.25ZM15 10V10.75V14C15 14.5523 14.5523 15 14 15H10.75H10V13.5H10.75H13.5V10.75V10H15ZM10.75 1H10V2.5H10.75H13.5V5.25V6H15V5.25V2C15 1.44772 14.5523 1 14 1H10.75Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const RotateCcwIcon = (props: IconProps) => (
  <svg
    color="currentColor"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M13.5 8C13.5 4.96643 11.0257 2.5 7.96452 2.5C5.42843 2.5 3.29365 4.19393 2.63724 6.5H5.25H6V8H5.25H0.75C0.335787 8 0 7.66421 0 7.25V2.75V2H1.5V2.75V5.23347C2.57851 2.74164 5.06835 1 7.96452 1C11.8461 1 15 4.13001 15 8C15 11.87 11.8461 15 7.96452 15C5.62368 15 3.54872 13.8617 2.27046 12.1122L1.828 11.5066L3.03915 10.6217L3.48161 11.2273C4.48831 12.6051 6.12055 13.5 7.96452 13.5C11.0257 13.5 13.5 11.0336 13.5 8Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const XIcon = (props: IconProps) => (
  <svg
    color="currentColor"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const ZoomInIcon = (props: IconProps) => (
  <svg
    color="currentColor"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M1.5 6.5C1.5 3.73858 3.73858 1.5 6.5 1.5C9.26142 1.5 11.5 3.73858 11.5 6.5C11.5 9.26142 9.26142 11.5 6.5 11.5C3.73858 11.5 1.5 9.26142 1.5 6.5ZM6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C8.02469 13 9.42677 12.475 10.5353 11.596L13.9697 15.0303L14.5 15.5607L15.5607 14.5L15.0303 13.9697L11.596 10.5353C12.475 9.42677 13 8.02469 13 6.5C13 2.91015 10.0899 0 6.5 0ZM4.125 5.875H4.75H5.875V4.75V4.125H7.125V4.75V5.875H8.25H8.875V7.125H8.25H7.125V8.25V8.875H5.875V8.25V7.125H4.75H4.125V5.875Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const ZoomOutIcon = (props: IconProps) => (
  <svg
    color="currentColor"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M15.5607 3.99999L15.0303 4.53032L6.23744 13.3232C5.55403 14.0066 4.44599 14.0066 3.76257 13.3232L4.2929 12.7929L3.76257 13.3232L0.969676 10.5303L0.439346 9.99999L1.50001 8.93933L2.03034 9.46966L4.82323 12.2626C4.92086 12.3602 5.07915 12.3602 5.17678 12.2626L13.9697 3.46966L14.5 2.93933L15.5607 3.99999Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);
