import { FC } from 'react'

interface LogoIconProps {
  size?: number
  className?: string
}

export const LogoIcon: FC<LogoIconProps> = ({ size = 32, className = '' }) => {
  const uniqueId = `luckino-logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 128 128" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M0 32C0 14.3269 14.3269 0 32 0H96C113.673 0 128 14.3269 128 32V96C128 113.673 113.673 128 96 128H32C14.3269 128 0 113.673 0 96V32Z" fill={`url(#paint0_linear_${uniqueId})`}/>
      
      {/* Left side shapes */}
      <path d="M50.5815 97.1973C48.2088 97.1973 45.8361 96.2924 44.0258 94.4822L19.7156 70.1714C17.9011 68.357 16.9957 65.9771 17 63.5992C17.0043 65.9662 17.9092 68.3323 19.7156 70.1383C21.5258 71.9485 23.8985 72.8534 26.2712 72.8534C28.6434 72.8534 31.0161 71.9485 32.8268 70.1383L39.3658 63.5992L57.1371 81.3705C60.758 84.9914 60.758 90.8612 57.1371 94.4822C55.3268 96.2924 52.9541 97.1973 50.5815 97.1973Z" fill={`url(#paint1_linear_${uniqueId})`}/>
      
      <path d="M26.2712 72.853C23.8985 72.853 21.5258 71.9482 19.7156 70.1379C17.9092 68.332 17.0043 65.9659 17 63.5989C16.9957 61.2205 17.9011 58.8412 19.7156 57.0267L44.0258 32.716C45.8361 30.9058 48.2088 30.0004 50.5815 30.0004C52.9541 30.0004 55.3268 30.9058 57.1371 32.716C60.758 36.3364 60.758 42.2067 57.1371 45.8272L39.3658 63.5989L32.8268 70.1379C31.0161 71.9482 28.6434 72.853 26.2712 72.853Z" fill={`url(#paint2_linear_${uniqueId})`}/>
      
      {/* Right side shapes */}
      <path d="M88.6331 63.5986L70.8618 45.8269C67.2414 42.2065 67.2414 36.3362 70.8618 32.7157C72.6721 30.9055 75.0447 30.0001 77.4174 30.0001C79.7901 30.0001 82.1628 30.9055 83.973 32.7157L108.284 57.0264C110.098 58.8409 111.003 61.2203 110.999 63.5986C110.995 61.2312 110.09 58.8656 108.284 57.0596H108.283C106.473 55.2494 104.1 54.344 101.728 54.344C99.355 54.344 96.9823 55.2494 95.1721 57.0596L88.6331 63.5986Z" fill={`url(#paint3_linear_${uniqueId})`}/>
      
      <path d="M77.4174 97.1968C75.0447 97.1968 72.6721 96.2919 70.8618 94.4817C67.2414 90.8607 67.2414 84.9909 70.8618 81.37L88.6331 63.5987L95.1721 57.0597C96.9823 55.2495 99.355 54.3442 101.728 54.3442C104.1 54.3442 106.473 55.2495 108.283 57.0597H108.284C110.09 58.8657 110.995 61.2313 110.999 63.5987C111.003 65.9767 110.098 68.3565 108.284 70.171L83.973 94.4817C82.1628 96.2919 79.7901 97.1968 77.4174 97.1968Z" fill={`url(#paint4_linear_${uniqueId})`}/>

      {/* Center circles */}
      <circle cx="26.253" cy="63.6" r="9.12" fill={`url(#paint5_linear_${uniqueId})`}/>
      <circle cx="101.747" cy="63.6005" r="9.12" fill={`url(#paint6_linear_${uniqueId})`}/>
      
      <defs>
        <linearGradient id={`paint0_linear_${uniqueId}`} x1="64" y1="0" x2="122" y2="133.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0D006F"/>
          <stop offset="1" stopColor="#45008A"/>
        </linearGradient>
        <linearGradient id={`paint1_linear_${uniqueId}`} x1="17" y1="75.771" x2="59.8527" y2="75.771" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4A47A5"/>
          <stop offset="1" stopColor="#EF2EA1"/>
        </linearGradient>
        <linearGradient id={`paint2_linear_${uniqueId}`} x1="17" y1="51.4267" x2="59.8527" y2="51.4267" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F46F94"/>
          <stop offset="0.00859768" stopColor="#F46F94"/>
          <stop offset="1" stopColor="#EF2EA1"/>
        </linearGradient>
        <linearGradient id={`paint3_linear_${uniqueId}`} x1="68.1462" y1="51.4264" x2="110.999" y2="51.4264" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4A47A5"/>
          <stop offset="1" stopColor="#EF2EA1"/>
        </linearGradient>
        <linearGradient id={`paint4_linear_${uniqueId}`} x1="68.1462" y1="75.7705" x2="110.999" y2="75.7705" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F46F94"/>
          <stop offset="0.00859768" stopColor="#F46F94"/>
          <stop offset="1" stopColor="#EF2EA1"/>
        </linearGradient>
        <linearGradient id={`paint5_linear_${uniqueId}`} x1="16.9998" y1="51.4264" x2="59.8525" y2="51.4264" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F25790"/>
          <stop offset="0.00859768" stopColor="#F25790"/>
          <stop offset="1" stopColor="#EF289E"/>
        </linearGradient>
        <linearGradient id={`paint6_linear_${uniqueId}`} x1="68.1472" y1="75.7708" x2="111" y2="75.7708" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F25790"/>
          <stop offset="0.00859768" stopColor="#F25790"/>
          <stop offset="1" stopColor="#EF289E"/>
        </linearGradient>
      </defs>
    </svg>
  )
}