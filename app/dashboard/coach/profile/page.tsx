"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CoachProfilePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Coach Profile Settings</h1>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="coaching">Coaching Info</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="payments">Payment Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent>
              {/* General profile form component */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coaching">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Information</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Coaching profile form - specialties, experience, etc */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Availability settings - calendar, hours, etc */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Payment settings - rates, stripe connection, etc */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 