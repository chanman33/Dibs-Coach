"use client";

import { ResoMemberForm } from "@/components/profile/ResoMemberForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="reso">RESO Member Info</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
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

        <TabsContent value="reso">
          <Card>
            <CardHeader>
              <CardTitle>RESO Member Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ResoMemberForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Preferences form component */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 