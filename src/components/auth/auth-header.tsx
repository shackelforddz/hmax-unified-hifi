import Image from "next/image";

/** The horizontal HMAX wordmark. Drawn at 64x14, scaled up on its own ratio. */
export default function AuthHeader() {
  return (
    <Image
      src="/hmax-logo.svg"
      alt="HMAX"
      width={160}
      height={35}
      priority
      className="block h-[35px] w-[160px]"
    />
  );
}
