"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, DollarSign, MapPin, Star } from "lucide-react";
import { PortfolioItem, PORTFOLIO_ITEM_TYPE_LABELS, PORTFOLIO_ITEM_TYPE_COLORS } from "@/utils/types/portfolio";
import { cn } from "@/lib/utils";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getTypeColor(type: keyof typeof PORTFOLIO_ITEM_TYPE_COLORS) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    violet: "bg-violet-100 text-violet-800 border-violet-200",
    cyan: "bg-cyan-100 text-cyan-800 border-cyan-200",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
    red: "bg-red-100 text-red-800 border-red-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colorMap[PORTFOLIO_ITEM_TYPE_COLORS[type]] || colorMap.gray;
}

export function PublicPortfolioGrid({ portfolioItems }: { portfolioItems: PortfolioItem[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Portfolio</CardTitle>
        <CardDescription>Showcase of professional achievements and success stories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {portfolioItems.length === 0 ? (
            <div className="text-center py-16 rounded-lg bg-muted/10">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-medium">No portfolio items found</p>
              <p className="text-sm text-muted-foreground mt-2">
                This coach has not added any portfolio items yet.
              </p>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
              {portfolioItems.map((item) => (
                <div
                  key={item.ulid}
                  className="relative rounded-xl bg-white shadow-md hover:shadow-lg transition-all overflow-hidden group border min-w-[315px] md:min-w-[405px] max-w-[405px] h-[340px] flex flex-col snap-start"
                  tabIndex={0}
                  aria-label={`Portfolio item: ${item.title}`}
                >
                  {/* Image with reduced height */}
                  <div className="relative w-full h-[160px] bg-muted overflow-hidden">
                    {Array.isArray(item.imageUrls) && item.imageUrls[0] ? (
                      <img
                        src={item.imageUrls[0]}
                        alt={item.title || 'Portfolio image'}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Building2 className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Featured badge */}
                    {item.featured && (
                      <Badge className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-500 text-white shadow">
                        <Star className="h-4 w-4 mr-1" /> Featured
                      </Badge>
                    )}
                    {/* Type badge */}
                    <Badge className={cn("absolute top-2 right-2", getTypeColor(item.type))}>
                      {PORTFOLIO_ITEM_TYPE_LABELS[item.type]}
                    </Badge>
                  </div>
                  <CardContent className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex flex-wrap gap-1 mb-0.5">
                        {Array.isArray(item.tags) && item.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags && item.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            +{item.tags.length - 2} more
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold truncate mt-0.5" title={item.title}>{item.title}</h3>
                      
                      {/* Description with Read More */}
                      <div className="mt-0.5">
                        <p
                          className="text-muted-foreground text-sm line-clamp-3"
                          title={item.description || ''}
                        >
                          {item.description}
                        </p>
                        
                        {item.description && item.description.length > 150 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="link" 
                                className="text-xs p-0 h-auto text-primary mt-0 -mb-1"
                              >
                                Read more
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>{item.title}</DialogTitle>
                              </DialogHeader>
                              <div className="max-h-[60vh] overflow-y-auto mt-2">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {item.description}
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                    <div className="mt-1">
                      {item.financialDetails?.amount && (
                        <div className="flex items-center gap-1 text-green-700 font-semibold text-base">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(item.financialDetails.amount)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                        {item.location?.city && item.location?.state && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {item.location.city}, {item.location.state}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 