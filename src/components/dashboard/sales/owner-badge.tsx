/* Small avatar + name for the person/function that owns an offer input.
   Owners are formatted "Team - I. Lastname"; each maps to a photo, with an
   initials badge as a fallback. */

const OWNER_AVATARS: Record<string, string> = {
  "Sales ops - T. Wu": "/avatars/33.jpg",
  "Reliability - F. Dubois": "/avatars/13.jpg",
  "Engineering - J. Park": "/avatars/68.jpg",
  "Commercial - A. Rossi": "/avatars/11.jpg",
  "Legal - R. Bianchi": "/avatars/9.jpg",
};

/** The photo for an owner, when one is on file. */
export function ownerAvatar(owner: string): string | undefined {
  return OWNER_AVATARS[owner];
}

/** Owners read "Team - I. Lastname"; split them for compact display. */
export function splitOwner(owner: string): { team: string; person: string } {
  const [team, person] = owner.split(" - ");
  return person ? { team, person } : { team: "", person: owner };
}

export function ownerInitials(owner: string): string {
  const person = owner.includes("-") ? owner.split("-")[1].trim() : owner;
  return person
    .split(/\s+/)
    .map((t) => t[0])
    .join("")
    .replace(/\./g, "")
    .slice(0, 2)
    .toUpperCase();
}

export default function OwnerBadge({ owner, className = "" }: { owner: string; className?: string }) {
  const avatar = OWNER_AVATARS[owner];
  return (
    <span className={`flex items-center gap-1.5 shrink-0 ${className}`}>
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={owner} className="w-5 h-5 rounded-full object-cover bg-gray-200 shrink-0" />
      ) : (
        <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[9px] flex items-center justify-center shrink-0">
          {ownerInitials(owner)}
        </span>
      )}
      <span className="text-xs text-gray-500 whitespace-nowrap">{owner}</span>
    </span>
  );
}
