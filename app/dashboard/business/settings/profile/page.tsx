"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Users, 
  Upload,
  Pencil,
  Save,
  CalendarDays
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function BusinessProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  
  // Mock business data
  const [businessData, setBusinessData] = useState({
    name: "Skyline Properties",
    logo: "/placeholder-logo.png",
    description: "Providing premium real estate services with a focus on client satisfaction and professional development of our team.",
    yearFounded: "2012",
    address: "1234 Market Street, Suite 500",
    city: "San Francisco",
    state: "CA",
    zipCode: "94103",
    phone: "(415) 555-7890",
    email: "info@skylineproperties.example",
    website: "www.skylineproperties.example",
    businessHours: "Mon-Fri: 9:00 AM - 6:00 PM",
    teamSize: "24",
    industry: "Real Estate",
    specializations: ["Residential", "Commercial", "Property Management"]
  })
  
  const handleEdit = () => {
    setIsEditing(true)
  }
  
  const handleSave = () => {
    // Here you would typically save to the backend
    setIsEditing(false)
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBusinessData({
      ...businessData,
      [name]: value
    })
  }
  
  const handleSelectChange = (value: string, field: string) => {
    setBusinessData({
      ...businessData,
      [field]: value
    })
  }
  
  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Profile</h1>
          <p className="text-muted-foreground">Manage your business information and settings</p>
        </div>
        {isEditing ? (
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        ) : (
          <Button onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Basic details about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={businessData.name} 
                    onChange={handleChange} 
                    disabled={!isEditing} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select 
                    disabled={!isEditing} 
                    value={businessData.industry}
                    onValueChange={(value) => handleSelectChange(value, "industry")}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select an industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Mortgage">Mortgage</SelectItem>
                      <SelectItem value="Property Management">Property Management</SelectItem>
                      <SelectItem value="Real Estate Investment">Real Estate Investment</SelectItem>
                      <SelectItem value="Commercial Real Estate">Commercial Real Estate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearFounded">Year Founded</Label>
                  <Input 
                    id="yearFounded" 
                    name="yearFounded" 
                    value={businessData.yearFounded} 
                    onChange={handleChange} 
                    disabled={!isEditing} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Input 
                    id="teamSize" 
                    name="teamSize" 
                    value={businessData.teamSize} 
                    onChange={handleChange} 
                    disabled={!isEditing} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={businessData.description} 
                  onChange={handleChange} 
                  disabled={!isEditing} 
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Specializations</CardTitle>
              <CardDescription>Areas your business focuses on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {businessData.specializations.map((specialization, index) => (
                  <div key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                    {specialization}
                  </div>
                ))}
                {isEditing && (
                  <Button variant="outline" size="sm" className="rounded-full">
                    + Add
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location & Contact</CardTitle>
              <CardDescription>Your business contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <div className="flex">
                    <MapPin className="mr-2 h-4 w-4 mt-2.5 text-muted-foreground" />
                    <Input 
                      id="address" 
                      name="address" 
                      value={businessData.address} 
                      onChange={handleChange} 
                      disabled={!isEditing} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      value={businessData.city} 
                      onChange={handleChange} 
                      disabled={!isEditing} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input 
                        id="state" 
                        name="state" 
                        value={businessData.state} 
                        onChange={handleChange} 
                        disabled={!isEditing} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP</Label>
                      <Input 
                        id="zipCode" 
                        name="zipCode" 
                        value={businessData.zipCode} 
                        onChange={handleChange} 
                        disabled={!isEditing} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <Phone className="mr-2 h-4 w-4 mt-2.5 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      name="phone" 
                      value={businessData.phone} 
                      onChange={handleChange} 
                      disabled={!isEditing} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex">
                    <Mail className="mr-2 h-4 w-4 mt-2.5 text-muted-foreground" />
                    <Input 
                      id="email" 
                      name="email" 
                      value={businessData.email} 
                      onChange={handleChange} 
                      disabled={!isEditing} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="flex">
                    <Globe className="mr-2 h-4 w-4 mt-2.5 text-muted-foreground" />
                    <Input 
                      id="website" 
                      name="website" 
                      value={businessData.website} 
                      onChange={handleChange} 
                      disabled={!isEditing} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessHours">Business Hours</Label>
                  <div className="flex">
                    <Clock className="mr-2 h-4 w-4 mt-2.5 text-muted-foreground" />
                    <Input 
                      id="businessHours" 
                      name="businessHours" 
                      value={businessData.businessHours} 
                      onChange={handleChange} 
                      disabled={!isEditing} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="branding" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding Elements</CardTitle>
              <CardDescription>Customize your business appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="text-sm font-medium mb-3">Company Logo</h3>
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 rounded">
                    <AvatarImage src={businessData.logo} alt="Company Logo" />
                    <AvatarFallback className="text-xl">{businessData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Business Profile Preview</h3>
                <div className="border rounded-md p-6 max-w-md">
                  <div className="flex gap-4 items-start">
                    <Avatar className="h-14 w-14 rounded">
                      <AvatarImage src={businessData.logo} alt="Company Logo" />
                      <AvatarFallback className="text-xl">{businessData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-lg">{businessData.name}</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        <span>{businessData.city}, {businessData.state}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Users className="h-3.5 w-3.5 mr-1" />
                        <span>{businessData.teamSize} team members</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        <span>Est. {businessData.yearFounded}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{businessData.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
