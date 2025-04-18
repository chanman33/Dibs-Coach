"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Building, Home, Plus, MapPin, Users, DollarSign, Calendar, Briefcase, Edit, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface PropertyManagerListingsProps {
  isSubmitting?: boolean;
}

// Types for property listings
interface PropertyListing {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  units: number;
  managementStartDate: string;
  description: string;
  achievements: string[];
  imageUrl?: string;
}

// Types for success stories
interface SuccessStory {
  id: string;
  title: string;
  clientName: string;
  propertyType: string;
  location: string;
  challenge: string;
  solution: string;
  results: string;
  date: string;
  testimonial?: string;
}

// Mock data for property listings
const mockProperties: PropertyListing[] = [
  {
    id: "prop1",
    name: "Oakwood Apartments",
    address: "123 Main Street",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    type: "Multi-family",
    units: 48,
    managementStartDate: "2020-03-15",
    description: "Luxury apartment complex with modern amenities including pool, fitness center, and community spaces.",
    achievements: [
      "Increased occupancy from 78% to 96% within 6 months",
      "Reduced maintenance costs by 15% through preventative maintenance program",
      "Implemented new tenant portal increasing rent collection efficiency by 25%"
    ],
    imageUrl: "https://placehold.co/600x400/png"
  },
  {
    id: "prop2",
    name: "Riverside Condos",
    address: "456 River Road",
    city: "Austin",
    state: "TX",
    zipCode: "78702",
    type: "Condominium",
    units: 24,
    managementStartDate: "2019-07-22",
    description: "Upscale condominium complex with waterfront views and premium finishes.",
    achievements: [
      "Managed complete renovation of common areas under budget",
      "Established reserve fund that increased by 40% in two years",
      "Negotiated new service contracts saving HOA $35,000 annually"
    ],
    imageUrl: "https://placehold.co/600x400/png"
  }
];

// Mock data for success stories
const mockSuccessStories: SuccessStory[] = [
  {
    id: "story1",
    title: "Turning Around a Troubled Property",
    clientName: "Westside Investments",
    propertyType: "Multi-family",
    location: "Dallas, TX",
    challenge: "Property was operating at 65% occupancy with significant deferred maintenance and poor tenant relations.",
    solution: "Implemented comprehensive property improvement plan, staff training, and community engagement initiatives.",
    results: "Within 12 months, occupancy increased to 92%, tenant satisfaction scores improved by 45%, and property value increased by $1.2M.",
    date: "2021-05-15",
    testimonial: "The transformation of our property under this management has been remarkable. Our investment has not only been protected but has grown substantially."
  },
  {
    id: "story2",
    title: "Optimizing Operations for Maximum ROI",
    clientName: "Horizon Properties",
    propertyType: "Commercial Office",
    location: "Houston, TX",
    challenge: "High operating costs and inefficient management processes were reducing investor returns.",
    solution: "Restructured vendor contracts, implemented energy efficiency upgrades, and digitized management processes.",
    results: "Reduced operating expenses by 22%, increased NOI by 18%, and improved tenant retention rate to 85%.",
    date: "2022-02-10",
    testimonial: "The operational improvements implemented have transformed our property from a cash drain to a top performer in our portfolio."
  }
];

export function PropertyManagerListings({ isSubmitting = false }: PropertyManagerListingsProps) {
  const [activeTab, setActiveTab] = useState("properties");
  const [properties, setProperties] = useState<PropertyListing[]>(mockProperties);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>(mockSuccessStories);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  
  // Placeholder functions for adding new items
  const handleAddProperty = () => {
    setIsAddPropertyOpen(false);
    // Implementation would go here
  };
  
  const handleAddSuccessStory = () => {
    setIsAddStoryOpen(false);
    // Implementation would go here
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Property Management Portfolio</CardTitle>
        <CardDescription>
          Showcase your property management experience and success stories to establish credibility with potential mentees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Managed Properties</span>
            </TabsTrigger>
            <TabsTrigger value="success-stories" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Success Stories</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Managed Properties</h3>
              <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Property</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Property</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Property form would go here */}
                    <p className="text-muted-foreground">Property form coming soon...</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddPropertyOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddProperty} disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Property"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {properties.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You haven't added any properties yet. Add properties to showcase your management experience.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <Card key={property.id} className="overflow-hidden">
                    {property.imageUrl && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={property.imageUrl} 
                          alt={property.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xl font-semibold">{property.name}</h4>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{property.address}, {property.city}, {property.state} {property.zipCode}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm">{property.type}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm">{property.units} units</span>
                        </div>
                        <div className="flex items-center col-span-2">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm">Managing since {new Date(property.managementStartDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{property.description}</p>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Key Achievements:</h5>
                        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                          {property.achievements.map((achievement, index) => (
                            <li key={index}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Success Stories Tab */}
          <TabsContent value="success-stories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Success Stories</h3>
              <Dialog open={isAddStoryOpen} onOpenChange={setIsAddStoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Success Story</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Success Story</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Success story form would go here */}
                    <p className="text-muted-foreground">Success story form coming soon...</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddStoryOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddSuccessStory} disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Success Story"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {successStories.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You haven't added any success stories yet. Share your achievements to demonstrate your expertise.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {successStories.map((story) => (
                  <Card key={story.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-semibold mb-1">{story.title}</h4>
                          <div className="flex items-center text-muted-foreground">
                            <Briefcase className="h-4 w-4 mr-1" />
                            <span className="text-sm mr-2">{story.clientName}</span>
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm">{story.location}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-6 mb-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium flex items-center">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs mr-2">Challenge</span>
                          </h5>
                          <p className="text-sm text-muted-foreground">{story.challenge}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium flex items-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">Solution</span>
                          </h5>
                          <p className="text-sm text-muted-foreground">{story.solution}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium flex items-center">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">Results</span>
                          </h5>
                          <p className="text-sm text-muted-foreground">{story.results}</p>
                        </div>
                      </div>
                      
                      {story.testimonial && (
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mt-4">
                          <p className="text-sm italic text-slate-600">"{story.testimonial}"</p>
                          <p className="text-sm font-medium mt-2">— {story.clientName}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <Badge variant="outline" className="flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          {story.propertyType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(story.date).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
      </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 