import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, BookOpen, Building, Calendar, ExternalLink, Check } from "lucide-react";
import { ProfessionalRecognition, RecognitionType } from "@/utils/types/recognition";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function getBadgeVariant(type: string) {
  switch(type) {
    case RecognitionType.AWARD:
      return "default";
    case RecognitionType.CERTIFICATION:
      return "secondary";
    case RecognitionType.LICENSE:
      return "destructive";
    default:
      return "outline";
  }
}

function getBadgeClassName(type: string) {
  switch(type) {
    case RecognitionType.EDUCATION:
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case RecognitionType.MEMBERSHIP:
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case RecognitionType.DESIGNATION:
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default:
      return "";
  }
}

function getBadgeLabel(type: string) {
  switch(type) {
    case RecognitionType.AWARD:
      return "Award";
    case RecognitionType.ACHIEVEMENT:
      return "Achievement";
    case RecognitionType.CERTIFICATION:
      return "Certification";
    case RecognitionType.DESIGNATION:
      return "Designation";
    case RecognitionType.LICENSE:
      return "License";
    case RecognitionType.EDUCATION:
      return "Education";
    case RecognitionType.MEMBERSHIP:
      return "Membership";
    default:
      return "Recognition";
  }
}

function formatYear(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.getFullYear().toString();
}

export function PublicRecognitionsGrid({ recognitions }: { recognitions: ProfessionalRecognition[] }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Professional Recognitions</CardTitle>
        <CardDescription>Certifications, awards, and other professional achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recognitions.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
              {recognitions.map((recognition, index) => {
                let icon;
                switch(recognition.type) {
                  case RecognitionType.AWARD:
                    icon = <Trophy className="h-6 w-6 text-amber-500" />;
                    break;
                  case RecognitionType.CERTIFICATION:
                    icon = <Award className="h-6 w-6 text-blue-500" />;
                    break;
                  case RecognitionType.DESIGNATION:
                    icon = <Award className="h-6 w-6 text-purple-500" />;
                    break;
                  case RecognitionType.LICENSE:
                    icon = <Check className="h-6 w-6 text-green-500" />;
                    break;
                  case RecognitionType.EDUCATION:
                    icon = <BookOpen className="h-6 w-6 text-indigo-500" />;
                    break;
                  case RecognitionType.MEMBERSHIP:
                    icon = <Building className="h-6 w-6 text-cyan-500" />;
                    break;
                  case RecognitionType.ACHIEVEMENT:
                  default:
                    icon = <Trophy className="h-6 w-6 text-orange-500" />;
                }
                const industryType = recognition.industryType;
                
                return (
                  <Card 
                    key={recognition.ulid || index} 
                    className={cn(
                      "transition-all duration-200 hover:shadow-md border-l-4 group",
                      "min-w-[320px] max-w-[380px] snap-start",
                      recognition.type === RecognitionType.AWARD ? "border-l-amber-400" :
                      recognition.type === RecognitionType.CERTIFICATION ? "border-l-blue-400" :
                      recognition.type === RecognitionType.DESIGNATION ? "border-l-purple-400" :
                      recognition.type === RecognitionType.LICENSE ? "border-l-green-400" :
                      recognition.type === RecognitionType.EDUCATION ? "border-l-indigo-400" :
                      recognition.type === RecognitionType.MEMBERSHIP ? "border-l-cyan-400" :
                      "border-l-orange-400"
                    )}
                  > 
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 max-w-[85%]">
                          <div className="p-2 rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
                            {icon}
                          </div>
                          <CardTitle className="text-lg truncate">{recognition.title}</CardTitle>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {recognition.issuer && (
                            <>
                              <Building className="h-4 w-4" />
                              <span className="font-medium">{recognition.issuer}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatYear(recognition.issueDate)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-2 mt-4">
                        <Badge 
                          variant={getBadgeVariant(recognition.type)}
                          className={cn(getBadgeClassName(recognition.type), "px-3 py-1")}
                        >
                          {getBadgeLabel(recognition.type)}
                        </Badge>
                        {industryType && (
                          <Badge variant="secondary" className="text-xs px-3 py-1">
                            {industryType}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    {recognition.description && (
                      <CardContent className="pt-0 pb-4">
                        <div className={cn("relative", 
                          recognition.description.length > 120 
                            ? "line-clamp-3 max-h-[4.5rem] overflow-hidden" 
                            : ""
                        )}> 
                          <p className="text-sm text-muted-foreground">{recognition.description}</p>
                          
                          {recognition.description.length > 120 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="link" 
                                  className="text-xs p-0 h-auto text-primary mt-1"
                                >
                                  Read more
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>{recognition.title}</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-[60vh] overflow-y-auto mt-2">
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {recognition.description}
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                        
                        {recognition.verificationUrl && typeof recognition.verificationUrl === 'string' && (
                          <a 
                            href={recognition.verificationUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View credential
                          </a>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-lg bg-muted/10">
              <Award className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-medium">No professional recognitions found</p>
              <p className="text-sm text-muted-foreground mt-2">
                This coach has not added any recognitions yet.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 