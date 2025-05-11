import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CoachProfileSectionProps {
  coachName: string;
  profileImageUrl?: string | null;
  specialty?: string | null;
  domains?: string[] | null;
  slogan?: string | null;
}

export function CoachProfileSection({
  coachName,
  profileImageUrl,
  specialty,
  domains,
  slogan
}: CoachProfileSectionProps) {
  // Extract first initials for avatar fallback
  const initials = coachName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase();

  // Filter out the primary domain from the domains list to avoid duplication
  const filteredDomains = domains && specialty 
    ? domains.filter(domain => domain !== specialty)
    : domains;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={profileImageUrl || undefined} alt={coachName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{coachName}</h2>
            
            {slogan && (
              <p className="text-sm text-muted-foreground">{slogan}</p>
            )}
            
            <div className="flex flex-wrap gap-2">
              {/* Primary domain displayed first with a different variant */}
              {specialty && (
                <Badge variant="secondary">{specialty}</Badge>
              )}
              
              {/* Other domains displayed with outline variant, excluding primary domain */}
              {filteredDomains && filteredDomains.length > 0 && filteredDomains.map((domain, index) => (
                <Badge key={index} variant="outline">{domain}</Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 